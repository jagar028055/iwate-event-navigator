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
import { IWATE_MUNICIPALITIES, getMunicipalitiesByRegion } from '../sources/iwateMunicipalities';
import { EventInfo, Source } from '../../../types';

export class MunicipalityCollector extends BaseCollector {
  public readonly stage = CollectionStage.MUNICIPAL;
  public readonly name = "MunicipalityCollector";
  public readonly description = "岩手県33市町村別の地域密着イベント収集";

  private currentRotation = 0; // ローテーション管理用

  public async collect(sources?: InformationSource[]): Promise<CollectionResult> {
    const startTime = Date.now();
    const errors: any[] = [];
    let totalApiCalls = 0;

    console.log(`${this.name}: Starting municipal event collection`);

    try {
      const targetSources = sources || this.getRequiredSources();
      
      // 市町村をローテーション方式で選択（一度に11自治体）
      const selectedMunicipalities = this.selectMunicipalitiesForRotation();
      console.log(`Processing municipalities: ${selectedMunicipalities.map(m => m.name).join(', ')}`);

      const allEvents: EventInfo[] = [];
      const allSources: Source[] = [];

      // 各市町村を順次処理
      for (const municipality of selectedMunicipalities) {
        try {
          const municipalityPrompt = this.buildMunicipalityPrompt(municipality);
          
          // 市町村別検索実行
          const responseText = await this.makeGeminiRequest(municipalityPrompt, true);
          totalApiCalls++;

          const { events, sources: responseSources } = this.parseCollectionResponse(responseText);
          
          // イベントの検証
          const validEvents: EventInfo[] = [];
          for (const event of events) {
            if (await this.validateEvent(event)) {
              validEvents.push({
                ...event,
                // 市町村情報を付加
                description: `${event.description || ''}\n[${municipality.name}の地域イベント]`
              });
            }
          }

          allEvents.push(...validEvents);
          if (responseSources) {
            allSources.push(...responseSources);
          }

          console.log(`${municipality.name}: Found ${validEvents.length} events`);

          // API制限を考慮した遅延
          if (selectedMunicipalities.indexOf(municipality) < selectedMunicipalities.length - 1) {
            await this.delay(1500); // 1.5秒間隔
          }

        } catch (error) {
          console.error(`Error processing ${municipality.name}:`, error);
          errors.push(this.handleCollectionError(
            error as Error, 
            `Municipality: ${municipality.name}`,
            'moderate'
          ));
        }
      }

      // 強化処理
      const enhancedEvents = this.enhanceEvents(
        allEvents,
        allSources,
        'gemini_municipal_search'
      );

      const executionTime = Date.now() - startTime;
      
      // 次回のローテーション準備
      this.updateRotation();

      console.log(`${this.name}: Found ${enhancedEvents.length} municipal events in ${executionTime}ms`);
      
      return this.createCollectionResult(
        enhancedEvents,
        allSources,
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
    // 全市町村の公式サイト情報源を取得
    return SourceDefinition.getSourcesByType(SourceType.OFFICIAL_GOVERNMENT)
      .filter(source => source.isActive);
  }

  protected buildCollectionPrompt(sources: InformationSource[]): string {
    // MunicipalityCollectorでは使用しない（個別市町村プロンプトを使用）
    return '';
  }

  private buildMunicipalityPrompt(municipality: any): string {
    const specialEventsHints = municipality.specialEvents.length > 0 
      ? `\n特に以下の名物イベントを重点的に探してください：\n${municipality.specialEvents.map(e => `- ${e}`).join('\n')}`
      : '';

    const attractionsHints = municipality.majorAttractions.length > 0
      ? `\n主要観光地での関連イベント：\n${municipality.majorAttractions.map(a => `- ${a}関連イベント`).join('\n')}`
      : '';

    return `岩手県${municipality.name}で開催される地域密着型イベント情報を詳細に検索してください。

【対象自治体】
${municipality.name}（人口約${municipality.population.toLocaleString()}人、${municipality.region}地域）
公式サイト: ${municipality.officialUrl}

【重点収集対象】
1. 市町村・地域コミュニティ主催のイベント
2. 地域の神社・お寺の例大祭、季節行事
3. 商店街・商工会のイベント、セール
4. 公民館・文化センターの教室、発表会
5. 道の駅・農産物直売所のフェア
6. 地域NPO・ボランティア団体のイベント
7. 小中学校・保育園の地域開放イベント
8. 住民参加型の清掃活動、防災訓練
${specialEventsHints}
${attractionsHints}

【検索キーワード例】
"${municipality.name} イベント"
"${municipality.name} 祭り"
"${municipality.name} まつり"
"${municipality.name} 催し"
"${municipality.name} 行事"
"${municipality.name} フェア"
"${municipality.name} 体験"
"${municipality.name} 教室"
"${municipality.name} 発表会"
"${municipality.name} 展示"

【地域特性を活かした検索】
${this.getRegionalKeywords(municipality.region)}

【除外対象】
- 既に中止・終了が確定したイベント
- 関係者・会員限定のイベント
- 商業広告のみの情報

【必須項目】
- title: イベント名
- description: 詳細説明（地域性を含めて100文字以上）
- date: 開催日（YYYY-MM-DD形式）
- locationName: 具体的な開催場所名
- latitude: 緯度（${municipality.name}周辺）
- longitude: 経度（${municipality.name}周辺）  
- category: 「地域」「祭り」「グルメ」「文化」「自然」「コミュニティ」から選択
- officialUrl: 情報源URL（あれば）

【出力形式】
{
  "events": [
    {
      "title": "イベント名", 
      "description": "地域特色を含む詳細説明",
      "date": "2024-MM-DD",
      "locationName": "具体的な場所名",
      "latitude": XX.XXXX,
      "longitude": XXX.XXXX,
      "category": "カテゴリ",
      "officialUrl": "URL"
    }
  ]
}

目標：${municipality.name}の地域イベント5-15件を収集してください。`;
  }

  private getRegionalKeywords(region: IwateRegion): string {
    const regionalKeywords: { [key in IwateRegion]: string[] } = {
      [IwateRegion.ALL]: ['岩手県全域'],
      [IwateRegion.KENOU]: [
        '盛岡', 'さんさ踊り', 'チャグチャグ馬コ', '小岩井農場', '雫石',
        '八幡平', '安比高原', '滝沢', '紫波', '矢巾'
      ],
      [IwateRegion.KENNAN]: [
        '花巻', '宮沢賢治', '北上', '展勝地', '奥州', '中尊寺', '毛越寺',
        '平泉', '一関', '猊鼻渓', '厳美渓', '西和賀'
      ],
      [IwateRegion.ENGAN]: [
        '宮古', '浄土ヶ浜', '龍泉洞', '大船渡', '陸前高田', '奇跡の一本松',
        '釜石', 'さんま', '住田', '大槌', '山田', '岩泉', '田野畑', '普代'
      ],
      [IwateRegion.KENPOKU]: [
        '二戸', '久慈', 'あまちゃん', '琥珀', '洋野', '野田塩', '軽米',
        '一戸', '九戸城', '天台寺'
      ]
    };

    const keywords = regionalKeywords[region] || [];
    return keywords.length > 0 
      ? `地域キーワード: ${keywords.join('、')}` 
      : '';
  }

  private selectMunicipalitiesForRotation(): any[] {
    // 33市町村を3グループに分割し、ローテーション実行
    const MUNICIPALITIES_PER_BATCH = 11; // 33 ÷ 3 = 11
    const totalMunicipalities = IWATE_MUNICIPALITIES.length;
    
    const startIndex = (this.currentRotation * MUNICIPALITIES_PER_BATCH) % totalMunicipalities;
    const endIndex = Math.min(startIndex + MUNICIPALITIES_PER_BATCH, totalMunicipalities);
    
    let selectedMunicipalities = IWATE_MUNICIPALITIES.slice(startIndex, endIndex);
    
    // 最後のグループで端数が出る場合、最初から補完
    if (selectedMunicipalities.length < MUNICIPALITIES_PER_BATCH && startIndex > 0) {
      const remaining = MUNICIPALITIES_PER_BATCH - selectedMunicipalities.length;
      selectedMunicipalities = [...selectedMunicipalities, ...IWATE_MUNICIPALITIES.slice(0, remaining)];
    }
    
    return selectedMunicipalities;
  }

  private updateRotation(): void {
    this.currentRotation = (this.currentRotation + 1) % 3; // 0, 1, 2の循環
  }

  public estimateExecutionTime(): number {
    return 90000; // 90秒（11市町村 × 約8秒）
  }

  // 特定地域のみの収集メソッド
  public async collectByRegion(region: IwateRegion): Promise<CollectionResult> {
    const startTime = Date.now();
    const errors: any[] = [];
    let totalApiCalls = 0;

    console.log(`${this.name}: Collecting events for region: ${region}`);

    try {
      const regionalMunicipalities = getMunicipalitiesByRegion(region);
      const allEvents: EventInfo[] = [];
      const allSources: Source[] = [];

      for (const municipality of regionalMunicipalities) {
        try {
          const municipalityPrompt = this.buildMunicipalityPrompt(municipality);
          const responseText = await this.makeGeminiRequest(municipalityPrompt, true);
          totalApiCalls++;

          const { events, sources: responseSources } = this.parseCollectionResponse(responseText);
          
          const validEvents: EventInfo[] = [];
          for (const event of events) {
            if (await this.validateEvent(event)) {
              validEvents.push(event);
            }
          }

          allEvents.push(...validEvents);
          if (responseSources) {
            allSources.push(...responseSources);
          }

          await this.delay(1500);

        } catch (error) {
          errors.push(this.handleCollectionError(error as Error, municipality.name));
        }
      }

      const enhancedEvents = this.enhanceEvents(
        allEvents,
        allSources,
        `gemini_regional_search_${region}`
      );

      return this.createCollectionResult(
        enhancedEvents,
        allSources,
        Date.now() - startTime,
        totalApiCalls,
        errors
      );

    } catch (error) {
      errors.push(this.handleCollectionError(error as Error));
      return this.createCollectionResult([], [], Date.now() - startTime, totalApiCalls, errors);
    }
  }
}