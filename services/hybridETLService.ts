import {
  HybridETLService,
  SourceRegistry,
  DeduplicationService,
  SourceType,
  SourceCategory,
  IwateRegion,
  UpdateFrequency,
  CollectionRequest,
  CollectionStage,
  HybridSource
} from './eventCollector';
import type { EventInfo, Source } from '../types';

/**
 * Integrated Hybrid ETL Service for Iwate Event Navigator
 * Replaces the original geminiService with a more reliable, multi-source approach
 */
class IntegratedHybridETLService {
  private etlService: HybridETLService;
  private sourceRegistry: SourceRegistry;
  private deduplicationService: DeduplicationService;
  private initialized: boolean = false;

  constructor() {
    this.etlService = new HybridETLService();
    this.sourceRegistry = new SourceRegistry({
      maxSources: 100,
      defaultUpdateFrequency: UpdateFrequency.DAILY,
      enableValidationOnAdd: false // Skip validation for faster startup
    });
    this.deduplicationService = new DeduplicationService({
      titleSimilarityThreshold: 0.8,
      dateSimilarityThresholdMs: 4 * 60 * 60 * 1000, // 4 hours
      enableFuzzyMatching: true
    });
  }

  /**
   * Initialize the service with predefined sources
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🚀 Initializing Hybrid ETL Service...');

    // Register sources from configuration
    await this.registerPredefinedSources();
    
    this.initialized = true;
    console.log('✅ Hybrid ETL Service initialized');
  }

  /**
   * Main interface compatible with original fetchIwateEvents
   */
  public async fetchIwateEvents(): Promise<{ events: EventInfo[], sources: Source[] }> {
    await this.initialize();

    try {
      console.log('🔄 Starting hybrid event collection...');
      
      const collectionRequest: CollectionRequest = {
        stages: [CollectionStage.MAJOR_EVENTS, CollectionStage.MUNICIPAL],
        targetEventCount: 150,
        timeLimit: 60000, // 60 seconds timeout
        regions: [IwateRegion.ALL, IwateRegion.KENOU, IwateRegion.KENNAN, IwateRegion.ENGAN, IwateRegion.KENPOKU],
        categories: [
          SourceCategory.FESTIVALS,
          SourceCategory.CULTURAL,
          SourceCategory.FOOD_EVENTS,
          SourceCategory.COMMUNITY,
          SourceCategory.SPORTS,
          SourceCategory.NATURE,
          SourceCategory.GENERAL
        ],
        forceRefresh: false
      };

      const results = await this.etlService.collect(collectionRequest);
      
      // Extract all events and apply final deduplication
      const allEvents = results.flatMap(r => r.events);
      const deduplicationResult = await this.deduplicationService.deduplicate(allEvents);
      
      // Convert to legacy format
      const events = deduplicationResult.deduplicatedEvents.map(this.convertToEventInfo);
      const sources = this.extractUniqueSources(results);

      console.log(`✅ Collection completed: ${events.length} events from ${sources.length} sources`);
      console.log(`📊 Deduplication: ${deduplicationResult.statistics.duplicatesRemoved} duplicates removed`);

      return { events, sources };

    } catch (error) {
      console.error('❌ Hybrid ETL collection failed:', error);
      
      // Return fallback data instead of throwing
      return this.getFallbackData();
    }
  }

  /**
   * Register predefined sources based on Iwate region configuration
   */
  private async registerPredefinedSources(): Promise<void> {
    const sources: Partial<HybridSource>[] = [
      // Government sources (highest priority) - UPDATED WITH REAL URLs
      {
        name: '岩手県公式ニュースRSS',
        url: 'https://www.pref.iwate.jp/news.rss',
        type: SourceType.RSS_FEED,
        category: SourceCategory.GENERAL,
        region: IwateRegion.ALL,
        reliability: 1.0,
        updateFrequency: UpdateFrequency.DAILY,
        enabled: true
      },
      {
        name: '岩手県イベントカレンダー',
        url: 'https://www.pref.iwate.jp/event_calendar.html',
        type: SourceType.HTML_SCRAPING,
        category: SourceCategory.GENERAL,
        region: IwateRegion.ALL,
        reliability: 1.0,
        updateFrequency: UpdateFrequency.DAILY,
        enabled: true
      },
      {
        name: '盛岡市イベントカレンダー',
        url: 'https://www.city.morioka.iwate.jp/event_calendar.html',
        type: SourceType.HTML_SCRAPING,
        category: SourceCategory.COMMUNITY,
        region: IwateRegion.KENOU,
        reliability: 0.95,
        updateFrequency: UpdateFrequency.DAILY,
        enabled: true
      },

      // Tourism and cultural sources - UPDATED WITH REAL URLs
      {
        name: 'いわての旅イベント情報',
        url: 'https://iwatetabi.jp/events/',
        type: SourceType.HTML_SCRAPING,
        category: SourceCategory.CULTURAL,
        region: IwateRegion.ALL,
        reliability: 0.9,
        updateFrequency: UpdateFrequency.DAILY,
        enabled: true
      },
      {
        name: '花巻市観光協会イベント',
        url: 'https://www.kanko-hanamaki.ne.jp/event/',
        type: SourceType.HTML_SCRAPING,
        category: SourceCategory.CULTURAL,
        region: IwateRegion.KENOU,
        reliability: 0.85,
        updateFrequency: UpdateFrequency.WEEKLY,
        enabled: true
      },
      {
        name: '岩手県民会館イベント',
        url: 'https://www.iwate-kenmin.jp/events/',
        type: SourceType.HTML_SCRAPING,
        category: SourceCategory.CULTURAL,
        region: IwateRegion.KENOU,
        reliability: 0.9,
        updateFrequency: UpdateFrequency.WEEKLY,
        enabled: true
      },

      // Regional event information
      {
        name: '盛岡観光情報イベント',
        url: 'https://www.odette.or.jp/?page_id=264',
        type: SourceType.HTML_SCRAPING,
        category: SourceCategory.FESTIVALS,
        region: IwateRegion.KENOU,
        reliability: 0.8,
        updateFrequency: UpdateFrequency.WEEKLY,
        enabled: true
      },
      {
        name: '岩手日報イベント情報',
        url: 'https://www.iwate-np.co.jp/content/event/',
        type: SourceType.HTML_SCRAPING,
        category: SourceCategory.GENERAL,
        region: IwateRegion.ALL,
        reliability: 0.85,
        updateFrequency: UpdateFrequency.DAILY,
        enabled: true
      },

      // Additional comprehensive sources
      {
        name: 'エンジョイいわてイベント情報',
        url: 'https://enjoyiwate.com/',
        type: SourceType.HTML_SCRAPING,
        category: SourceCategory.COMMUNITY,
        region: IwateRegion.ALL,
        reliability: 0.75,
        updateFrequency: UpdateFrequency.WEEKLY,
        enabled: true
      }
    ];

    let registeredCount = 0;
    for (const sourceData of sources) {
      try {
        const sourceId = await this.sourceRegistry.addSource(sourceData);
        const source = this.sourceRegistry.getSource(sourceId);
        if (source) {
          this.etlService.registerSource(source);
          registeredCount++;
        }
      } catch (error) {
        console.warn(`Failed to register source ${sourceData.name}:`, error.message);
      }
    }

    console.log(`📝 Registered ${registeredCount}/${sources.length} sources`);
  }

  /**
   * Convert enhanced event info to legacy EventInfo format
   */
  private convertToEventInfo(enhancedEvent: any): EventInfo {
    return {
      id: enhancedEvent.id,
      title: enhancedEvent.title,
      description: enhancedEvent.description || '',
      date: enhancedEvent.date,
      endDate: enhancedEvent.endDate,
      locationName: enhancedEvent.locationName || '',
      latitude: enhancedEvent.latitude || 0,
      longitude: enhancedEvent.longitude || 0,
      category: enhancedEvent.category || 'general',
      price: enhancedEvent.price,
      officialUrl: enhancedEvent.officialUrl || ''
    };
  }

  /**
   * Extract unique sources from collection results
   */
  private extractUniqueSources(results: any[]): Source[] {
    const sourceMap = new Map<string, Source>();
    
    for (const result of results) {
      for (const source of result.sources) {
        if (!sourceMap.has(source.uri)) {
          sourceMap.set(source.uri, {
            uri: source.uri,
            type: source.type || 'hybrid_etl',
            name: source.name,
            description: source.description || `Hybrid ETL source: ${source.name}`
          });
        }
      }
    }

    return Array.from(sourceMap.values());
  }

  /**
   * Provide fallback data when collection fails
   */
  private getFallbackData(): { events: EventInfo[], sources: Source[] } {
    const fallbackEvents: EventInfo[] = [
      {
        id: 'fallback-sansa',
        title: '盛岡さんさ踊り',
        description: 'ハイブリッドETLシステム：リアルタイム情報は岩手県内のイベント情報源から収集中です',
        date: '2024-08-01',
        locationName: '盛岡市中央通',
        latitude: 39.7036,
        longitude: 141.1526,
        category: 'festivals',
        officialUrl: 'https://www.sansaodori.jp/'
      },
      {
        id: 'fallback-cultural',
        title: '岩手県文化イベント',
        description: 'システム初期化中。実際のイベント情報は設定完了後に表示されます',
        date: '2024-08-15',
        locationName: '岩手県内各所',
        latitude: 39.7036,
        longitude: 141.1526,
        category: 'cultural',
        officialUrl: 'https://iwate-kanko.jp/'
      }
    ];

    const fallbackSources: Source[] = [
      {
        uri: 'hybrid-etl-system',
        type: 'hybrid_etl',
        name: 'ハイブリッドETLシステム',
        description: '多源泉イベント情報収集システム（初期化中）'
      }
    ];

    return { events: fallbackEvents, sources: fallbackSources };
  }

  /**
   * Get service statistics
   */
  public getStatistics(): {
    sources: any;
    deduplication: any;
  } {
    return {
      sources: this.sourceRegistry.getStatistics(),
      deduplication: this.deduplicationService.getConfig()
    };
  }

  /**
   * Validate all registered sources
   */
  public async validateSources(): Promise<Map<string, any>> {
    return await this.sourceRegistry.validateAllSources();
  }
}

// Create singleton instance
export const hybridETLService = new IntegratedHybridETLService();

// Export for backwards compatibility with existing imports
export const fetchIwateEvents = () => hybridETLService.fetchIwateEvents();