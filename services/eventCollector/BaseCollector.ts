// REST API直接呼び出しに変更（Google GenAIライブラリのブラウザ制限を回避）
import { 
  IEventCollector, 
  CollectionStage, 
  CollectionResult, 
  EnhancedEventInfo,
  InformationSource,
  CollectionError,
  CollectionStatistics,
  DataFreshness
} from './types';
import { EventInfo, Source } from '../../types';

export abstract class BaseCollector implements IEventCollector {
  protected apiKey: string;
  protected model: string = "gemini-1.5-pro";
  
  public abstract readonly stage: CollectionStage;
  public abstract readonly name: string;
  public abstract readonly description: string;

  constructor() {
    // Viteビルド時に置換される特別な変数を使用
    declare const __GEMINI_API_KEY__: string | undefined;
    
    const apiKey = __GEMINI_API_KEY__ || 
                   import.meta.env.GEMINI_API_KEY || 
                   import.meta.env.VITE_GEMINI_API_KEY ||
                   process.env.GEMINI_API_KEY ||
                   process.env.VITE_GEMINI_API_KEY;
                   
    if (!apiKey) {
      console.error("BaseCollector: API key not found in any source");
      throw new Error("Gemini API key is not configured for BaseCollector");
    }
    
    console.log("BaseCollector: API key configured successfully");
    this.apiKey = apiKey;
  }

  // Abstract methods to be implemented by concrete collectors
  public abstract collect(sources?: InformationSource[]): Promise<CollectionResult>;
  public abstract getRequiredSources(): InformationSource[];
  protected abstract buildCollectionPrompt(sources: InformationSource[]): string;

  // Common functionality for all collectors
  public async validateEvent(event: Partial<EventInfo>): Promise<boolean> {
    // 必須フィールドの検証
    if (!event.title || !event.locationName || !event.date) {
      return false;
    }

    // 緯度経度の検証（岩手県の範囲内）
    if (!event.latitude || !event.longitude) {
      return false;
    }

    if (!this.isWithinIwateBounds(event.latitude, event.longitude)) {
      return false;
    }

    // 日付の妥当性検証
    try {
      const eventDate = new Date(event.date);
      const now = new Date();
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      return eventDate >= now && eventDate <= oneYearFromNow;
    } catch {
      return false;
    }
  }

  public estimateExecutionTime(): number {
    // Stage別の基本実行時間見積もり（ミリ秒）
    const baseTime = {
      [CollectionStage.MAJOR_EVENTS]: 30000,      // 30秒
      [CollectionStage.MUNICIPAL]: 45000,         // 45秒
      [CollectionStage.CATEGORY_SPECIFIC]: 60000  // 60秒
    };
    
    return baseTime[this.stage] || 30000;
  }

  protected async makeGeminiRequest(prompt: string, useSearch: boolean = true): Promise<string> {
    try {
      // 共通のGemini API呼び出し関数を使用
      const { callGeminiAPI } = await import('../geminiApiClient');
      
      const response = await callGeminiAPI(prompt, {
        model: this.model,
        useSearch
      });
      
      return response;
    } catch (error) {
      console.error(`Gemini API request failed in ${this.name}:`, error);
      throw new Error(`AI service temporarily unavailable: ${error.message}`);
    }
  }

  protected async cleanJsonString(str: string): Promise<string> {
    const { cleanJsonString } = await import('../geminiApiClient');
    return cleanJsonString(str);
  }

  protected async parseCollectionResponse(responseText: string): Promise<{ events: EventInfo[], sources?: Source[] }> {
    try {
      const cleanedText = await this.cleanJsonString(responseText);
      const parsed = JSON.parse(cleanedText);
      
      if (!parsed.events || !Array.isArray(parsed.events)) {
        throw new Error("Invalid response format: missing events array");
      }

      return {
        events: parsed.events,
        sources: parsed.sources || []
      };
    } catch (error) {
      console.error(`JSON parsing failed in ${this.name}:`, error);
      throw new Error(`Failed to parse collection response: ${error.message}`);
    }
  }

  protected enhanceEvents(
    events: EventInfo[], 
    sources: Source[], 
    extractionMethod: string
  ): EnhancedEventInfo[] {
    const now = new Date();
    
    return events.map(event => ({
      ...event,
      id: event.id || crypto.randomUUID(),
      collectionStage: this.stage,
      sourceReliability: this.calculateSourceReliability(sources),
      lastUpdated: now,
      dataFreshness: DataFreshness.FRESH,
      verificationStatus: 'pending' as const,
      collectionMetadata: {
        sourceUrl: sources[0]?.uri,
        extractionMethod,
        confidence: this.calculateEventConfidence(event),
        duplicateScore: 0
      }
    }));
  }

  protected createCollectionResult(
    events: EnhancedEventInfo[],
    sources: Source[],
    executionTime: number,
    apiCalls: number,
    errors: CollectionError[]
  ): CollectionResult {
    const statistics: CollectionStatistics = {
      totalFound: events.length,
      duplicatesRemoved: 0, // Will be calculated later by deduplication
      validationPassed: events.length, // All events passed validation to get here
      averageConfidence: events.reduce((sum, e) => sum + e.collectionMetadata.confidence, 0) / events.length || 0,
      sourcesCovered: sources.length,
      geolocationSuccess: events.filter(e => e.latitude && e.longitude).length
    };

    return {
      stage: this.stage,
      events,
      sources,
      executionTime,
      apiCallsUsed: apiCalls,
      errors,
      statistics
    };
  }

  private isWithinIwateBounds(lat: number, lng: number): boolean {
    // 岩手県の大まかな境界
    const IWATE_BOUNDS = {
      lat: { min: 38.9, max: 40.3 },
      lng: { min: 140.7, max: 142.1 }
    };

    return lat >= IWATE_BOUNDS.lat.min && 
           lat <= IWATE_BOUNDS.lat.max &&
           lng >= IWATE_BOUNDS.lng.min && 
           lng <= IWATE_BOUNDS.lng.max;
  }

  private calculateSourceReliability(sources: Source[]): number {
    if (!sources.length) return 0.5;
    
    // ドメインベースの信頼度計算
    let totalReliability = 0;
    for (const source of sources) {
      const domain = this.extractDomain(source.uri);
      totalReliability += this.getDomainReliability(domain);
    }
    
    return Math.min(totalReliability / sources.length, 1.0);
  }

  private calculateEventConfidence(event: EventInfo): number {
    let confidence = 0.5; // Base confidence
    
    // タイトルの具体性
    if (event.title && event.title.length > 10) confidence += 0.1;
    
    // 説明の詳細度
    if (event.description && event.description.length > 50) confidence += 0.1;
    
    // 日付の具体性
    if (event.date && event.date.match(/\d{4}-\d{2}-\d{2}/)) confidence += 0.1;
    
    // 場所情報の完全性
    if (event.locationName && event.latitude && event.longitude) confidence += 0.15;
    
    // 公式URLの存在
    if (event.officialUrl) confidence += 0.1;
    
    // カテゴリの指定
    if (event.category) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  private getDomainReliability(domain: string): number {
    // 岩手県関連ドメインの信頼度マップ
    const reliabilityMap: { [key: string]: number } = {
      'pref.iwate.jp': 1.0,           // 岩手県公式
      'iwate-kanko.jp': 0.9,          // 岩手観光協会
      'city.morioka.iwate.jp': 0.95,  // 盛岡市公式
      'city.hanamaki.iwate.jp': 0.95, // 花巻市公式
      'lg.jp': 0.85,                  // 自治体一般
      'or.jp': 0.7,                   // 組織・団体
      'co.jp': 0.6,                   // 企業
      'com': 0.4,                     // 一般商用
      'jp': 0.5                       // その他日本サイト
    };

    // 最も具体的なマッチを探す
    for (const [pattern, reliability] of Object.entries(reliabilityMap)) {
      if (domain.includes(pattern)) {
        return reliability;
      }
    }

    return 0.3; // デフォルト低信頼度
  }

  protected handleCollectionError(
    error: Error, 
    source?: string, 
    severity: CollectionError['severity'] = 'moderate'
  ): CollectionError {
    return {
      severity,
      source: source || this.name,
      message: error.message,
      timestamp: new Date(),
      retryable: severity === 'minor' || severity === 'moderate'
    };
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}