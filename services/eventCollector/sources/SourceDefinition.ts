import { 
  InformationSource, 
  SourceType, 
  SourceCategory, 
  IwateRegion, 
  UpdateFrequency,
  SearchStrategy 
} from '../types';

export class SourceDefinition {
  private static sources: InformationSource[] = [];

  public static getAllSources(): InformationSource[] {
    return [...this.sources];
  }

  public static getSourcesByType(type: SourceType): InformationSource[] {
    return this.sources.filter(source => source.type === type);
  }

  public static getSourcesByCategory(category: SourceCategory): InformationSource[] {
    return this.sources.filter(source => source.category === category);
  }

  public static getSourcesByRegion(region: IwateRegion): InformationSource[] {
    if (region === IwateRegion.ALL) return this.getAllSources();
    return this.sources.filter(source => source.region === region || source.region === IwateRegion.ALL);
  }

  public static getActiveSourcesByReliability(minReliability: number = 0.5): InformationSource[] {
    return this.sources.filter(source => 
      source.isActive && source.reliability >= minReliability
    );
  }

  public static registerSource(source: InformationSource): void {
    // Check for duplicates
    const existing = this.sources.find(s => s.id === source.id || s.url === source.url);
    if (existing) {
      console.warn(`Source already exists: ${source.id}`);
      return;
    }

    this.sources.push(source);
    console.log(`Registered source: ${source.name} (${source.type})`);
  }

  public static updateSource(id: string, updates: Partial<InformationSource>): boolean {
    const index = this.sources.findIndex(s => s.id === id);
    if (index === -1) return false;

    this.sources[index] = { ...this.sources[index], ...updates };
    return true;
  }

  public static deactivateSource(id: string): boolean {
    return this.updateSource(id, { isActive: false });
  }

  // Factory methods for creating common source types
  public static createOfficialGovernmentSource(config: {
    id: string;
    name: string;
    url: string;
    region: IwateRegion;
    category?: SourceCategory;
    eventPath?: string;
  }): InformationSource {
    return {
      id: config.id,
      name: config.name,
      url: config.url,
      type: SourceType.OFFICIAL_GOVERNMENT,
      category: config.category || SourceCategory.GENERAL,
      region: config.region,
      reliability: 0.95, // High reliability for official sources
      updateFrequency: UpdateFrequency.DAILY,
      searchStrategy: {
        method: 'gemini_search',
        keywords: ['イベント', '催し', '行事', 'まつり', '祭り'],
        exclusionTerms: ['中止', '延期'],
        dateRange: {
          from: new Date(),
          to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      },
      isActive: true
    };
  }

  public static createTourismSource(config: {
    id: string;
    name: string;
    url: string;
    region: IwateRegion;
  }): InformationSource {
    return {
      id: config.id,
      name: config.name,
      url: config.url,
      type: SourceType.TOURISM_ASSOCIATION,
      category: SourceCategory.FESTIVALS,
      region: config.region,
      reliability: 0.85,
      updateFrequency: UpdateFrequency.DAILY,
      searchStrategy: {
        method: 'gemini_search',
        keywords: ['観光イベント', 'まつり', '祭り', 'フェスティバル', '体験'],
        exclusionTerms: ['募集終了', '満員'],
        dateRange: {
          from: new Date(),
          to: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months
        }
      },
      isActive: true
    };
  }

  public static createCulturalSource(config: {
    id: string;
    name: string;
    url: string;
    region: IwateRegion;
    category: SourceCategory;
  }): InformationSource {
    return {
      id: config.id,
      name: config.name,
      url: config.url,
      type: SourceType.CULTURAL_ORGANIZATION,
      category: config.category,
      region: config.region,
      reliability: 0.75,
      updateFrequency: UpdateFrequency.WEEKLY,
      searchStrategy: {
        method: 'gemini_search',
        keywords: this.getCategoryKeywords(config.category),
        exclusionTerms: ['中止', '延期', '内部限定'],
        dateRange: {
          from: new Date(),
          to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 months
        }
      },
      isActive: true
    };
  }

  public static createCommercialSource(config: {
    id: string;
    name: string;
    url: string;
    region: IwateRegion;
    category: SourceCategory;
  }): InformationSource {
    return {
      id: config.id,
      name: config.name,
      url: config.url,
      type: SourceType.COMMERCIAL,
      category: config.category,
      region: config.region,
      reliability: 0.65,
      updateFrequency: UpdateFrequency.ALTERNATE_DAYS,
      searchStrategy: {
        method: 'gemini_search',
        keywords: ['セール', 'フェア', 'イベント', 'キャンペーン'],
        exclusionTerms: ['完売', '終了'],
        dateRange: {
          from: new Date(),
          to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 2 months
        }
      },
      isActive: true
    };
  }

  private static getCategoryKeywords(category: SourceCategory): string[] {
    const keywordMap: { [key in SourceCategory]: string[] } = {
      [SourceCategory.FESTIVALS]: ['まつり', '祭り', '例大祭', '神事', 'フェスティバル'],
      [SourceCategory.FOOD_EVENTS]: ['グルメ', '特産品', '直売', '収穫祭', '食べ歩き'],
      [SourceCategory.CULTURAL]: ['文化祭', '芸能', '伝統', '展示', 'コンサート'],
      [SourceCategory.SPORTS]: ['スポーツ', '大会', 'マラソン', '競技', '体験'],
      [SourceCategory.NATURE]: ['自然', 'ハイキング', '登山', '観察', '体験'],
      [SourceCategory.COMMUNITY]: ['地域', 'コミュニティ', '市民', '住民', '交流'],
      [SourceCategory.BUSINESS]: ['商工会', 'ビジネス', '経済', '産業', '企業'],
      [SourceCategory.GENERAL]: ['イベント', '催し', '行事', 'お知らせ', '開催']
    };

    return keywordMap[category] || keywordMap[SourceCategory.GENERAL];
  }

  // Utility methods for source management
  public static getSourceStatistics(): {
    totalSources: number;
    activeCount: number;
    byType: { [key in SourceType]: number };
    byRegion: { [key in IwateRegion]: number };
    averageReliability: number;
  } {
    const activeSources = this.sources.filter(s => s.isActive);
    
    const byType = Object.values(SourceType).reduce((acc, type) => {
      acc[type] = activeSources.filter(s => s.type === type).length;
      return acc;
    }, {} as { [key in SourceType]: number });

    const byRegion = Object.values(IwateRegion).reduce((acc, region) => {
      acc[region] = activeSources.filter(s => s.region === region).length;
      return acc;
    }, {} as { [key in IwateRegion]: number });

    const averageReliability = activeSources.length > 0 
      ? activeSources.reduce((sum, s) => sum + s.reliability, 0) / activeSources.length 
      : 0;

    return {
      totalSources: this.sources.length,
      activeCount: activeSources.length,
      byType,
      byRegion,
      averageReliability
    };
  }

  public static exportSources(): string {
    return JSON.stringify(this.sources, null, 2);
  }

  public static importSources(sourcesJson: string): number {
    try {
      const importedSources: InformationSource[] = JSON.parse(sourcesJson);
      let addedCount = 0;

      for (const source of importedSources) {
        const existing = this.sources.find(s => s.id === source.id);
        if (!existing) {
          this.sources.push(source);
          addedCount++;
        }
      }

      return addedCount;
    } catch (error) {
      console.error('Failed to import sources:', error);
      return 0;
    }
  }
}