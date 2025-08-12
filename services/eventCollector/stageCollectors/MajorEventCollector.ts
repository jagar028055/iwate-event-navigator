import { BaseCollector } from '../BaseCollector';
import { 
  CollectionStage, 
  CollectionResult, 
  InformationSource, 
  SourceType, 
  SourceCategory, 
  IwateRegion 
} from '../types';
import { SourceDefinition } from '../sources/SourceDefinition';
import { EventInfo, Source } from '../../../types';

export class MajorEventCollector extends BaseCollector {
  public readonly stage = CollectionStage.MAJOR_EVENTS;
  public readonly name = "MajorEventCollector";
  public readonly description = "岩手県の大規模イベント収集（県・主要市公式サイト、観光協会）";

  public async collect(sources?: InformationSource[]): Promise<CollectionResult> {
    const startTime = Date.now();
    const errors: any[] = [];
    let totalApiCalls = 0;

    console.log(`${this.name}: Starting major event collection`);

    try {
      const targetSources = sources || this.getRequiredSources();
      const prompt = this.buildCollectionPrompt(targetSources);
      
      // Execute Gemini search with official sources focus
      const responseText = await this.makeGeminiRequest(prompt, true);
      totalApiCalls = 1;
      
      // Parse the response
      const { events, sources: responseSources } = this.parseCollectionResponse(responseText);
      
      // Validate and enhance events
      const validEvents: EventInfo[] = [];
      for (const event of events) {
        if (await this.validateEvent(event)) {
          validEvents.push(event);
        }
      }

      // Enhance with collection metadata
      const enhancedEvents = this.enhanceEvents(
        validEvents,
        responseSources || [],
        'gemini_major_search'
      );

      const executionTime = Date.now() - startTime;
      
      console.log(`${this.name}: Found ${enhancedEvents.length} major events in ${executionTime}ms`);
      
      return this.createCollectionResult(
        enhancedEvents,
        responseSources || [],
        executionTime,
        totalApiCalls,
        errors
      );

    } catch (error) {
      console.error(`${this.name}: Collection failed:`, error);
      errors.push(this.handleCollectionError(error as Error));
      
      return this.createCollectionResult(
        [],
        [],
        Date.now() - startTime,
        totalApiCalls,
        errors
      );
    }
  }

  public getRequiredSources(): InformationSource[] {
    // Get high-reliability official sources
    const officialSources = SourceDefinition.getSourcesByType(SourceType.OFFICIAL_GOVERNMENT);
    const tourismSources = SourceDefinition.getSourcesByType(SourceType.TOURISM_ASSOCIATION);
    
    // Focus on prefecture-level and major city sources
    const majorSources = [...officialSources, ...tourismSources].filter(source => 
      source.reliability >= 0.8 && 
      source.isActive &&
      (source.name.includes('岩手県') || 
       source.name.includes('盛岡市') || 
       source.name.includes('花巻市') ||
       source.name.includes('北上市') ||
       source.name.includes('一関市'))
    );

    return majorSources;
  }

  protected buildCollectionPrompt(sources: InformationSource[]): string {
    const sourcesList = sources.map(s => `- ${s.name}: ${s.url}`).join('\n');
    
    return `日本の岩手県で開催される大規模・重要イベント情報を収集してください。

【重点収集対象】
以下の信頼できる公式情報源から、特に規模が大きく重要なイベントを優先的に検索してください：
${sourcesList}

【収集基準】
1. 県レベル・市レベルの公式イベント
2. 観光協会主催の大型イベント
3. 歴史的・文化的に重要な祭り・行事
4. 県外からの参加者も多い著名イベント
5. メディアで取り上げられるような話題性のあるイベント

【具体的な対象例】
- 盛岡さんさ踊り（8月）
- 花巻まつり（9月）  
- 北上みちのく芸能まつり（8月）
- 一関夏まつり（8月）
- 平泉文化遺産関連イベント
- 中尊寺・毛越寺の重要行事
- 県庁・市役所主催の大型イベント
- 観光協会の季節イベント

【除外対象】
- 内部限定・関係者のみのイベント
- 小規模な地域コミュニティイベント
- 商店街の日常的なセール
- 個人主催の小さな教室・講座

【収集期間】
今日から1年以内に開催予定のイベント

【必須項目】
各イベントに以下の情報を必ず含めてください：
- title: イベント名
- description: 詳細な説明（100文字以上）
- date: 開催日（YYYY-MM-DD形式）
- locationName: 開催場所名
- latitude: 緯度（岩手県内：38.9-40.3）
- longitude: 経度（岩手県内：140.7-142.1）
- category: カテゴリ（「祭り」「文化」「グルメ」「自然」「スポーツ」等）
- officialUrl: 公式サイトURL（可能な限り）

【出力形式】
以下のJSON形式でのみ回答してください：
{
  "events": [
    {
      "title": "イベント名",
      "description": "詳細説明",
      "date": "2024-MM-DD",
      "locationName": "開催場所名",
      "latitude": 39.xxxx,
      "longitude": 141.xxxx,
      "category": "カテゴリ",
      "officialUrl": "URL（あれば）"
    }
  ]
}

目標収集数：30-50件の大規模・重要イベント`;
  }

  public estimateExecutionTime(): number {
    return 45000; // 45秒（大規模検索のため長めに設定）
  }
}