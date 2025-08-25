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
      
      // Execute Gemini search with Google Search grounding enabled
      const responseText = await this.makeGeminiRequest(prompt, true);
      totalApiCalls = 1;
      
      // Parse the table format response
      const { events, sources: responseSources } = await this.parseTableResponse(responseText);
      
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`${this.name}: Collection failed:`, {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        apiCallsUsed: totalApiCalls
      });
      
      // より具体的なエラー情報を提供
      const detailedError = this.handleCollectionError(
        new Error(`Collection failed: ${errorMessage}. This indicates a systematic issue that requires investigation.`),
        'MajorEventCollector',
        'critical'
      );
      
      errors.push(detailedError);
      
      // 空の結果を返すが、エラーは隠さない
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
    // Google Searchグラウンディング用に最適化されたプロンプト
    return `岩手県で開催される最新のイベント情報を検索して収集してください。

【検索対象】
岩手県内で開催される以下のようなイベントを検索してください：

**主要なイベント例：**
- 盛岡さんさ踊り
- 花巻まつり
- 北上みちのく芸能まつり
- 一関夏まつり
- 平泉文化遺産関連イベント
- 中尊寺・毛越寺の行事
- 岩手県庁や市役所主催イベント
- 観光協会のイベント
- 地域の祭り・文化行事
- 季節イベント・フェスティバル

**検索条件：**
- 開催地：岩手県内
- 開催期間：今日から1年以内
- 規模：一般参加可能なイベント
- 種類：祭り、文化、グルメ、自然、スポーツ、観光など

**収集情報：**
各イベントについて以下の情報を調べてください：
1. イベント名
2. 開催日時
3. 開催場所（具体的な住所・施設名）
4. イベントの詳細説明
5. 緯度・経度（可能な場合）
6. カテゴリ分類
7. 公式ウェブサイト（あれば）

【出力形式】
必ず以下のマークダウン表形式で出力してください：

| タイトル | 説明 | 開催日 | 開催場所 | 緯度 | 経度 | カテゴリ | 公式URL |
|----------|------|--------|----------|------|------|----------|---------|

**重要な指示：**
- 実際にウェブ検索を行い、最新の情報を取得してください
- 緯度・経度は岩手県内の正確な座標（緯度38.9-40.3、経度140.7-142.1）
- 開催日はYYYY-MM-DD形式
- 実在しない架空のイベントは含めないでください
- 最低10件、最大30件のイベントを収集してください
- 各行はパイプ（|）で区切り、改行文字は含めない

検索して実際に見つかったイベント情報のみを表形式で出力してください。`;
  }

  public estimateExecutionTime(): number {
    return 45000; // 45秒（大規模検索のため長めに設定）
  }

  protected async parseTableResponse(responseText: string): Promise<{ events: EventInfo[], sources?: Source[] }> {
    try {
      console.log(`${this.name}: Starting table parsing, response length: ${responseText.length}`);
      
      // マークダウン表形式の解析
      const events: EventInfo[] = [];
      const lines = responseText.split('\n');
      
      let tableStarted = false;
      let headerProcessed = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 空行をスキップ
        if (!line) continue;
        
        // 表の開始を検出（|で始まる行）
        if (line.startsWith('|') && line.endsWith('|')) {
          if (!tableStarted) {
            tableStarted = true;
            console.log(`${this.name}: Found table start at line ${i + 1}`);
            continue; // ヘッダー行をスキップ
          }
          
          // 区切り線をスキップ（|---|---|のような行）
          if (line.includes('---')) {
            headerProcessed = true;
            continue;
          }
          
          if (!headerProcessed) continue;
          
          // データ行を解析
          const columns = line.split('|').map(col => col.trim()).filter(col => col !== '');
          
          if (columns.length >= 7) { // 最低限必要なカラム数
            try {
              const event: EventInfo = {
                id: crypto.randomUUID(),
                title: columns[0] || '',
                description: columns[1] || '',
                date: columns[2] || '',
                locationName: columns[3] || '',
                latitude: parseFloat(columns[4]) || 0,
                longitude: parseFloat(columns[5]) || 0,
                category: columns[6] || '',
                officialUrl: columns[7] || undefined
              };
              
              // 基本的な検証
              if (event.title && event.date && event.locationName && 
                  event.latitude > 0 && event.longitude > 0) {
                events.push(event);
                console.log(`${this.name}: Successfully parsed event: ${event.title}`);
              } else {
                console.warn(`${this.name}: Skipped invalid event data on line ${i + 1}:`, columns);
              }
            } catch (error) {
              console.warn(`${this.name}: Failed to parse line ${i + 1}:`, error, columns);
            }
          } else {
            console.warn(`${this.name}: Insufficient columns on line ${i + 1}:`, columns);
          }
        }
      }
      
      console.log(`${this.name}: Successfully parsed ${events.length} events from table format`);
      
      if (events.length === 0) {
        // より詳細な診断情報を提供
        const diagnostics = {
          totalLines: lines.length,
          linesWithPipes: lines.filter(line => line.includes('|')).length,
          tableStartDetected: tableStarted,
          headerProcessed: headerProcessed,
          responsePreview: responseText.substring(0, 500)
        };
        
        console.error(`${this.name}: No events parsed - diagnostic info:`, diagnostics);
        throw new Error(`No valid events found in table format response. Diagnostic: ${JSON.stringify(diagnostics, null, 2)}`);
      }
      
      return {
        events,
        sources: [] // 表形式では別途ソース情報を含めない
      };
      
    } catch (error) {
      console.error(`${this.name}: Table parsing failed:`, {
        error: error.message,
        responsePreview: responseText.substring(0, 300) + '...',
        responseLength: responseText.length
      });
      throw new Error(`Failed to parse table response: ${error.message}`);
    }
  }
}