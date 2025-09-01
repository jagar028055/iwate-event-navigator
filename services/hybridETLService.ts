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
 * REDESIGNED: Following docs/event-collection-redesign/ specifications
 * 
 * Architecture Priority:
 * 1. Primary Sources: RSS feeds, ICS calendars, APIs (with ETag/Last-Modified)
 * 2. Secondary Sources: Well-structured HTML with schema.org/microdata  
 * 3. Minimal LLM Usage: Only for categorization, summarization, geocoding assistance
 * 
 * This replaces the previous Gemini-dependent approach with proper hybrid ETL
 * as specified in the redesign documents.
 */
class IntegratedHybridETLService {
  private static instance: IntegratedHybridETLService | null = null;
  private etlService: HybridETLService;
  private sourceRegistry: SourceRegistry;
  private deduplicationService: DeduplicationService;
  private initialized: boolean = false;
  private cityScope: string | undefined;

  private constructor() {
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

    // Read city scope from Vite env (browser) or Node env
    try {
      const scope = (import.meta as any)?.env?.VITE_CITY_SCOPE;
      this.cityScope = typeof scope === 'string' ? scope.toLowerCase() : undefined;
    } catch (_) {
      this.cityScope = undefined;
    }
    if (!this.cityScope) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g: any = globalThis as any;
      const nodeScope = g?.process?.env?.VITE_CITY_SCOPE || g?.process?.env?.CITY_SCOPE;
      if (typeof nodeScope === 'string') {
        this.cityScope = nodeScope.toLowerCase();
      }
    }
  }

  static getInstance(): IntegratedHybridETLService {
    if (!IntegratedHybridETLService.instance) {
      IntegratedHybridETLService.instance = new IntegratedHybridETLService();
    }
    return IntegratedHybridETLService.instance;
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
      console.log('🔄 Starting hybrid ETL collection (RSS/ICS/API priority)...');
      
      const collectionRequest: CollectionRequest = {
        stages: [CollectionStage.MAJOR_EVENTS], // Focus on primary sources first
        targetEventCount: 50, // Reduced for PoC, as per redesign docs
        timeLimit: 30000, // 30 seconds for PoC
        regions: this.cityScope === 'morioka' ? [IwateRegion.KENOU] : [IwateRegion.ALL, IwateRegion.KENOU],
        categories: [
          SourceCategory.GENERAL,
          SourceCategory.CULTURAL,
          SourceCategory.COMMUNITY,
          SourceCategory.FESTIVALS
        ],
        forceRefresh: false
      };

      const results = await this.etlService.collect(collectionRequest);
      
      // Apply deduplication following the redesign specs
      const allEvents = results.flatMap(r => r.events);
      console.log(`📋 Raw events collected: ${allEvents.length}`);
      
      if (allEvents.length === 0) {
        console.warn('⚠️ No events collected from primary sources, falling back...');
        return this.getFallbackData();
      }
      const deduplicationResult = await this.deduplicationService.deduplicate(allEvents);
      
      // Apply city-scope filter (Morioka) if enabled
      let scopedEvents = deduplicationResult.deduplicatedEvents;
      if (this.cityScope === 'morioka') {
        const before = scopedEvents.length;
        scopedEvents = scopedEvents.filter(e => this.isMoriokaEvent(e));
        console.log(`🏙️ City scope: Morioka. Filtered ${before} -> ${scopedEvents.length} events.`);
      }
      
      // Convert to legacy format
      const events = scopedEvents.map(this.convertToEventInfo);
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
   * Determine if an event is in/for Morioka City
   */
  private isMoriokaEvent(enhancedEvent: any): boolean {
    try {
      const title: string = (enhancedEvent?.title || '').toString();
      const locName: string = (enhancedEvent?.locationName || '').toString();
      const srcUrl: string = (enhancedEvent?.collectionMetadata?.sourceUrl || '').toString();
      const lat: number | undefined = enhancedEvent?.latitude;
      const lon: number | undefined = enhancedEvent?.longitude;

      const includesMorioka = (s: string) => /盛岡|Morioka/i.test(s);
      if (includesMorioka(title) || includesMorioka(locName)) return true;
      if (/city\.morioka\.iwate\.jp/i.test(srcUrl)) return true;

      // Bounding box around Morioka city (approx.)
      if (typeof lat === 'number' && typeof lon === 'number' && !Number.isNaN(lat) && !Number.isNaN(lon)) {
        const withinLat = lat >= 39.55 && lat <= 39.85;
        const withinLon = lon >= 140.95 && lon <= 141.35;
        if (withinLat && withinLon) return true;
      }

      return false;
    } catch (_) {
      return false;
    }
  }

  /**
   * Register predefined sources based on sources.yaml configuration
   * Following the hybrid ETL redesign: RSS/ICS/API priority, minimal LLM usage
   */
  private async registerPredefinedSources(): Promise<void> {
    const sources: Partial<HybridSource>[] = [
      // PRIORITY 1: RSS/ICS/API SOURCES (Primary data collection)
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
        name: '盛岡市イベントカレンダー',
        url: 'https://www.city.morioka.iwate.jp/event_calendar.html',
        type: SourceType.HTML_SCRAPING,
        category: SourceCategory.GENERAL,
        region: IwateRegion.KENOU,
        reliability: 0.9,
        updateFrequency: UpdateFrequency.DAILY,
        enabled: true
      },
      {
        name: 'Connpass岩手API',
        url: 'https://connpass.com/api/v1/event/?keyword=盛岡&count=100',
        type: SourceType.REST_API,  // Fixed: was rest_api, should be REST_API
        category: SourceCategory.COMMUNITY,
        region: IwateRegion.ALL,
        reliability: 0.95,
        updateFrequency: UpdateFrequency.DAILY,
        enabled: true
      },
      {
        name: 'Doorkeeper岩手API',
        url: 'https://api.doorkeeper.jp/events?q=盛岡&locale=ja&sort=starts_at',
        type: SourceType.REST_API,  // Fixed: was API, should be REST_API 
        category: SourceCategory.COMMUNITY,
        region: IwateRegion.ALL,
        reliability: 0.9,
        updateFrequency: UpdateFrequency.DAILY,
        enabled: true
      },

      // PRIORITY 2: Well-structured HTML with microdata/schema.org
      {
        name: '岩手県民会館',
        url: 'https://www.iwate-kenmin.jp/events/',
        type: SourceType.HTML_SCRAPING,
        category: SourceCategory.CULTURAL,
        region: IwateRegion.KENOU,
        reliability: 0.85,
        updateFrequency: UpdateFrequency.WEEKLY,
        enabled: true
      },
      {
        name: 'いわての旅',
        url: 'https://iwatetabi.jp/events/',
        type: SourceType.HTML_SCRAPING,
        category: SourceCategory.CULTURAL,
        region: IwateRegion.ALL,
        reliability: 0.8,
        updateFrequency: UpdateFrequency.WEEKLY,
        enabled: false
      },
      {
        name: '盛岡観光情報（Odette）',
        url: 'https://www.odette.or.jp/?page_id=264',
        type: SourceType.HTML_SCRAPING,
        category: SourceCategory.CULTURAL,
        region: IwateRegion.KENOU,
        reliability: 0.85,
        updateFrequency: UpdateFrequency.WEEKLY,
        enabled: true
      },

      // PRIORITY 3: Secondary HTML sources (only if needed)
      {
        name: '花巻市観光協会',
        url: 'https://www.kanko-hanamaki.ne.jp/event/',
        type: SourceType.HTML_SCRAPING,
        category: SourceCategory.CULTURAL,
        region: IwateRegion.KENOU,
        reliability: 0.75,
        updateFrequency: UpdateFrequency.WEEKLY,
        enabled: false // Disabled by default, enable only if RSS/API insufficient
      }
    ];

    let registeredCount = 0;
    for (const sourceData of sources) {
      try {
        // Check if source already exists to avoid duplicate registration
        const existingSources = this.sourceRegistry.getAllSources();
        const isDuplicate = existingSources.some(existing => 
          existing.name === sourceData.name || existing.url === sourceData.url
        );
        
        if (isDuplicate) {
          // Silently skip duplicates in development mode
          continue;
        }
        
        const sourceId = await this.sourceRegistry.addSource(sourceData);
        const source = this.sourceRegistry.getSource(sourceId);
        if (source) {
          this.etlService.registerSource(source);
          registeredCount++;
        }
      } catch (error) {
        // Only log if it's not a duplicate error
        if (!error.message.includes('already exists')) {
          console.warn(`Failed to register source ${sourceData.name}:`, error.message);
        }
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
export const hybridETLService = IntegratedHybridETLService.getInstance();

// Export for backwards compatibility with existing imports
export const fetchIwateEvents = () => hybridETLService.fetchIwateEvents();
