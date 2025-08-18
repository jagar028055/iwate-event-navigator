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
以下のマークダウン表形式でのみ回答してください。JSON形式は使用しないでください：

| タイトル | 説明 | 開催日 | 開催場所 | 緯度 | 経度 | カテゴリ | 公式URL |
|----------|------|--------|----------|------|------|----------|---------|
| 盛岡さんさ踊り | 岩手県を代表する夏祭り。太鼓とさんさ踊りで盛大に開催される伝統的な祭り | 2024-08-01 | 盛岡市中央通 | 39.7036 | 141.1526 | 祭り | https://www.sansaodori.jp |

**重要事項:**
- 必ずパイプ（|）区切りの表形式で出力
- ヘッダー行の後、すぐにデータ行を開始
- 各項目に改行文字を含めない
- 緯度経度は必ず数値のみ（度分秒ではなく小数点形式）
- 日付は必ずYYYY-MM-DD形式
- 説明は100文字以内に簡潔にまとめる

目標収集数：20-30件の大規模・重要イベント`;
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