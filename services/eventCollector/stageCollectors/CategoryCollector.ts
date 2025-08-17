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

interface CategoryCollectionConfig {
  category: SourceCategory;
  keywords: string[];
  specialSources: string[];
  seasonalBoost?: boolean;
  targetCount: number;
}

export class CategoryCollector extends BaseCollector {
  public readonly stage = CollectionStage.CATEGORY_SPECIFIC;
  public readonly name = "CategoryCollector";
  public readonly description = "カテゴリ特化型イベント収集（祭り、グルメ、文化イベント）";

  private categoryConfigs: Map<SourceCategory, CategoryCollectionConfig> = new Map();

  constructor() {
    super();
    this.initializeCategoryConfigs();
  }

  public async collect(sources?: InformationSource[]): Promise<CollectionResult> {
    const startTime = Date.now();
    const errors: any[] = [];
    let totalApiCalls = 0;

    console.log(`${this.name}: Starting category-specific event collection`);

    try {
      const allEvents: EventInfo[] = [];
      const allSources: Source[] = [];

      // 優先度の高いカテゴリから順次処理
      const priorityCategories = [
        SourceCategory.FESTIVALS,
        SourceCategory.FOOD_EVENTS,
        SourceCategory.CULTURAL,
        SourceCategory.COMMUNITY
      ];

      for (const category of priorityCategories) {
        try {
          console.log(`Processing category: ${category}`);
          
          const categoryResult = await this.collectByCategory(category);
          totalApiCalls += categoryResult.apiCallsUsed;
          
          allEvents.push(...categoryResult.events.map(e => ({
            id: e.id,
            title: e.title,
            description: e.description,
            date: e.date,
            locationName: e.locationName,
            latitude: e.latitude,
            longitude: e.longitude,
            category: e.category,
            officialUrl: e.officialUrl
          })));
          
          allSources.push(...categoryResult.sources);
          errors.push(...categoryResult.errors);

          console.log(`Category ${category}: Found ${categoryResult.events.length} events`);

          // カテゴリ間の遅延
          if (priorityCategories.indexOf(category) < priorityCategories.length - 1) {
            await this.delay(2000);
          }

        } catch (error) {
          console.error(`Error in category ${category}:`, error);
          errors.push(this.handleCollectionError(error as Error, `Category: ${category}`));
        }
      }

      // 重複排除（カテゴリ横断）
      const uniqueEvents = this.removeCategoryCrossDuplicates(allEvents);

      // 強化処理
      const enhancedEvents = this.enhanceEvents(
        uniqueEvents,
        allSources,
        'gemini_category_search'
      );

      const executionTime = Date.now() - startTime;
      
      console.log(`${this.name}: Found ${enhancedEvents.length} category-specific events in ${executionTime}ms`);
      
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

  public async collectByCategory(category: SourceCategory): Promise<CollectionResult> {
    const startTime = Date.now();
    const errors: any[] = [];
    let totalApiCalls = 0;

    const config = this.categoryConfigs.get(category);
    if (!config) {
      throw new Error(`No configuration found for category: ${category}`);
    }

    try {
      const prompt = this.buildCategoryPrompt(config);
      
      const responseText = await this.makeGeminiRequest(prompt, true);
      totalApiCalls = 1;

      const { events, sources: responseSources } = await this.parseCollectionResponse(responseText);
      
      // カテゴリ特有のバリデーション
      const validEvents: EventInfo[] = [];
      for (const event of events) {
        if (await this.validateEvent(event) && await this.validateCategoryRelevance(event, category)) {
          validEvents.push({
            ...event,
            category: event.category || this.mapSourceCategoryToEventCategory(category)
          });
        }
      }

      const enhancedEvents = this.enhanceEvents(
        validEvents,
        responseSources || [],
        `gemini_${category}_search`
      );

      return this.createCollectionResult(
        enhancedEvents,
        responseSources || [],
        Date.now() - startTime,
        totalApiCalls,
        errors
      );

    } catch (error) {
      errors.push(this.handleCollectionError(error as Error, `Category: ${category}`));
      return this.createCollectionResult([], [], Date.now() - startTime, totalApiCalls, errors);
    }
  }

  public getRequiredSources(): InformationSource[] {
    const culturalSources = SourceDefinition.getSourcesByType(SourceType.CULTURAL_ORGANIZATION);
    const commercialSources = SourceDefinition.getSourcesByType(SourceType.COMMERCIAL);
    const communitySources = SourceDefinition.getSourcesByCategory(SourceCategory.COMMUNITY);

    return [...culturalSources, ...commercialSources, ...communitySources]
      .filter(source => source.isActive && source.reliability >= 0.6);
  }

  protected buildCollectionPrompt(sources: InformationSource[]): string {
    // CategoryCollectorでは個別カテゴリプロンプトを使用
    return '';
  }

  private buildCategoryPrompt(config: CategoryCollectionConfig): string {
    const currentMonth = new Date().getMonth() + 1;
    const seasonalNote = config.seasonalBoost ? this.getSeasonalNote(config.category, currentMonth) : '';
    
    return `岩手県で開催される「${config.category}」カテゴリの特化イベント情報を詳細に収集してください。

【収集カテゴリ】
${config.category} - ${this.getCategoryDescription(config.category)}

【重点検索キーワード】
${config.keywords.map(k => `"${k}"`).join(', ')}

【特別重点情報源】
${config.specialSources.map(s => `- ${s}`).join('\n')}

${seasonalNote}

【具体的な収集対象】
${this.getCategorySpecificTargets(config.category)}

【品質基準】
1. カテゴリに明確に該当するイベント
2. 詳細な開催情報が明確なもの
3. 参加者に具体的な価値を提供するもの
4. 地域性・独自性があるもの

【除外対象】
- 他カテゴリに該当する一般的なイベント
- 商業広告のみの情報
- 内部限定・会員限定のイベント
- 既に終了・中止が確定したもの

【必須項目】
- title: カテゴリの特色を表すイベント名
- description: カテゴリの魅力を含む詳細説明（150文字以上）
- date: 開催日（YYYY-MM-DD形式）
- locationName: 具体的な開催場所名
- latitude: 緯度（岩手県内：38.9-40.3）
- longitude: 経度（岩手県内：140.7-142.1）
- category: "${this.mapSourceCategoryToEventCategory(config.category)}"
- officialUrl: 公式サイトURL（可能な限り）

【出力形式】
{
  "events": [
    {
      "title": "カテゴリ特化イベント名",
      "description": "カテゴリの魅力を含む詳細説明",
      "date": "2024-MM-DD", 
      "locationName": "具体的な場所名",
      "latitude": XX.XXXX,
      "longitude": XXX.XXXX,
      "category": "${this.mapSourceCategoryToEventCategory(config.category)}",
      "officialUrl": "URL"
    }
  ]
}

目標収集数：${config.targetCount}件の高品質な${config.category}イベント`;
  }

  private initializeCategoryConfigs(): void {
    // 祭り・伝統行事
    this.categoryConfigs.set(SourceCategory.FESTIVALS, {
      category: SourceCategory.FESTIVALS,
      keywords: [
        '祭り', 'まつり', '例大祭', '神事', '盆踊り', '神楽', '鹿踊り',
        '七夕', '花火大会', '秋祭り', '春祭り', '夏祭り', '冬祭り',
        '奉納', '御輿', 'みこし', '山車', '太鼓', '踊り', 'フェスティバル'
      ],
      specialSources: [
        '岩手県神社庁',
        '各市町村の文化財課',
        '地域祭り保存会',
        '岩手県民俗芸能協会'
      ],
      seasonalBoost: true,
      targetCount: 20
    });

    // グルメ・物産イベント
    this.categoryConfigs.set(SourceCategory.FOOD_EVENTS, {
      category: SourceCategory.FOOD_EVENTS,
      keywords: [
        'グルメ', '特産品', '直売', '収穫祭', '味覚狩り', '食べ歩き',
        'B級グルメ', '郷土料理', '地酒', '海鮮', 'さんま', '牛肉',
        '農産物', '朝市', '市場', 'フードフェスティバル', '物産展',
        'そば', 'うどん', 'ラーメン', '弁当', 'スイーツ'
      ],
      specialSources: [
        'JA岩手各支部',
        '道の駅連絡会',
        '商工会議所各支部',
        '岩手県物産協会',
        '農産物直売所'
      ],
      seasonalBoost: true,
      targetCount: 15
    });

    // 文化・芸術イベント
    this.categoryConfigs.set(SourceCategory.CULTURAL, {
      category: SourceCategory.CULTURAL,
      keywords: [
        '文化祭', 'コンサート', '展示会', '美術展', '写真展', '書道展',
        '演奏会', '演劇', '落語', '講演会', 'ワークショップ', '体験教室',
        '伝統工芸', '手作り', 'アート', 'ギャラリー', '博物館', '美術館',
        '音楽', '舞台', 'ダンス', '詩吟', '俳句', '短歌'
      ],
      specialSources: [
        '岩手県立美術館',
        '各市町村文化会館',
        '公民館・文化センター',
        '地域文化団体',
        'NPO・地域団体'
      ],
      seasonalBoost: false,
      targetCount: 15
    });

    // コミュニティイベント
    this.categoryConfigs.set(SourceCategory.COMMUNITY, {
      category: SourceCategory.COMMUNITY,
      keywords: [
        'コミュニティ', '地域交流', '市民参加', '住民参加', 'ボランティア',
        '清掃活動', '防災訓練', '健康教室', 'サークル', '同好会',
        '子育て', '高齢者', '福祉', '介護', '障害者支援', 'バリアフリー',
        '国際交流', '多文化', '環境', 'リサイクル', 'エコ'
      ],
      specialSources: [
        '各市町村社会福祉協議会',
        '地域コミュニティセンター',
        'NPO・ボランティア団体',
        '公民館',
        '教育委員会'
      ],
      seasonalBoost: false,
      targetCount: 12
    });
  }

  private getCategoryDescription(category: SourceCategory): string {
    const descriptions: { [key in SourceCategory]: string } = {
      [SourceCategory.FESTIVALS]: '伝統的な祭り、神事、地域の年中行事',
      [SourceCategory.FOOD_EVENTS]: 'グルメイベント、特産品フェア、収穫祭',
      [SourceCategory.CULTURAL]: '文化・芸術イベント、展示会、体験教室',
      [SourceCategory.SPORTS]: 'スポーツイベント、大会、体験会',
      [SourceCategory.NATURE]: '自然体験、ハイキング、観察会',
      [SourceCategory.COMMUNITY]: 'コミュニティイベント、住民交流、ボランティア',
      [SourceCategory.BUSINESS]: 'ビジネスイベント、商工会、産業展示',
      [SourceCategory.GENERAL]: '一般的なイベント、お知らせ'
    };
    return descriptions[category] || '一般イベント';
  }

  private getCategorySpecificTargets(category: SourceCategory): string {
    const targets: { [key in SourceCategory]: string } = {
      [SourceCategory.FESTIVALS]: `
- 神社・寺院の例大祭、季節祭
- 地域の伝統芸能（神楽、鹿踊り、太鼓など）
- 盆踊り、七夕祭り、秋祭り
- 花火大会、提灯祭り
- 御輿担ぎ、山車引き回し`,

      [SourceCategory.FOOD_EVENTS]: `
- 農産物収穫祭、味覚狩りイベント
- 地域特産品フェア、直売会
- グルメフェスティバル、B級グルメイベント
- 朝市、農産物市場の特別販売
- 地酒・地ビール試飲会`,

      [SourceCategory.CULTURAL]: `
- 美術展、写真展、書道展
- 音楽コンサート、演劇公演
- 伝統工芸体験教室
- 文化祭、芸術祭
- 講演会、ワークショップ`,

      [SourceCategory.COMMUNITY]: `
- 地域清掃、環境保護活動
- 防災訓練、安全講習会
- 高齢者・子育て支援イベント
- 国際交流、多文化イベント
- ボランティア募集説明会`,

      [SourceCategory.SPORTS]: '各種スポーツ大会、体験教室、健康イベント',
      [SourceCategory.NATURE]: '自然観察会、ハイキング、登山イベント',
      [SourceCategory.BUSINESS]: 'ビジネスセミナー、商工会イベント、産業展示',
      [SourceCategory.GENERAL]: '上記に該当しない一般的なイベント'
    };
    return targets[category] || '一般的なイベント';
  }

  private getSeasonalNote(category: SourceCategory, month: number): string {
    if (category === SourceCategory.FESTIVALS) {
      if (month >= 7 && month <= 10) {
        return '\n【季節重点】夏祭り・秋祭りシーズンです。特に8-9月の祭りを重点的に収集してください。';
      } else if (month >= 12 || month <= 2) {
        return '\n【季節重点】冬の神事・年末年始行事を重点的に収集してください。';
      }
    } else if (category === SourceCategory.FOOD_EVENTS) {
      if (month >= 9 && month <= 11) {
        return '\n【季節重点】収穫の秋です。農産物の収穫祭、新米祭り、きのこ狩りなどを重点収集してください。';
      } else if (month >= 6 && month <= 8) {
        return '\n【季節重点】夏の味覚イベント、海鮮祭り、さんまフェアなどを重点収集してください。';
      }
    }
    return '';
  }

  private mapSourceCategoryToEventCategory(sourceCategory: SourceCategory): string {
    const mapping: { [key in SourceCategory]: string } = {
      [SourceCategory.FESTIVALS]: '祭り',
      [SourceCategory.FOOD_EVENTS]: 'グルメ',
      [SourceCategory.CULTURAL]: '文化',
      [SourceCategory.SPORTS]: 'スポーツ',
      [SourceCategory.NATURE]: '自然',
      [SourceCategory.COMMUNITY]: '地域',
      [SourceCategory.BUSINESS]: 'ビジネス',
      [SourceCategory.GENERAL]: '一般'
    };
    return mapping[sourceCategory] || '一般';
  }

  private async validateCategoryRelevance(event: EventInfo, category: SourceCategory): Promise<boolean> {
    // カテゴリの関連性をタイトルと説明から判定
    const text = `${event.title} ${event.description || ''}`.toLowerCase();
    const config = this.categoryConfigs.get(category);
    
    if (!config) return true;

    // キーワードマッチング
    const keywordMatches = config.keywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );

    return keywordMatches;
  }

  private removeCategoryCrossDuplicates(events: EventInfo[]): EventInfo[] {
    const uniqueEvents: EventInfo[] = [];
    const seenSignatures = new Set<string>();

    for (const event of events) {
      const signature = this.createEventSignature(event);
      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        uniqueEvents.push(event);
      }
    }

    return uniqueEvents;
  }

  private createEventSignature(event: EventInfo): string {
    const normalizedTitle = event.title.toLowerCase().replace(/[\s\-_]/g, '');
    const normalizedLocation = event.locationName.toLowerCase().replace(/[\s\-_]/g, '');
    return `${normalizedTitle}|${normalizedLocation}|${event.date}`;
  }

  public estimateExecutionTime(): number {
    return 120000; // 120秒（4カテゴリ × 30秒）
  }
}