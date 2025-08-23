import { CollectorManager } from './CollectorManager';
import { MajorEventCollector } from './stageCollectors/MajorEventCollector';
import { MunicipalityCollector } from './stageCollectors/MunicipalityCollector';
import { CategoryCollector } from './stageCollectors/CategoryCollector';
import { initializeIwateMunicipalitySources } from './sources/iwateMunicipalities';
import { eventCache } from './cache/EventCache';
import { 
  CollectionStage, 
  CollectionRequest, 
  CollectionContext,
  CollectionPriority,
  IwateRegion,
  SourceCategory 
} from './types';
import { EventInfo, Source } from '../../types';

// 既存のgeminiServiceとの統合を維持しながら、新しい多段階収集システムを提供
export class EnhancedEventService {
  private collectorManager: CollectorManager;
  private initialized = false;

  constructor() {
    this.collectorManager = new CollectorManager();
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('Initializing Enhanced Event Service...');
    
    // Initialize municipality sources
    initializeIwateMunicipalitySources();
    
    // Register collectors
    const majorEventCollector = new MajorEventCollector();
    const municipalityCollector = new MunicipalityCollector();
    const categoryCollector = new CategoryCollector();
    
    this.collectorManager.registerCollector(majorEventCollector);
    this.collectorManager.registerCollector(municipalityCollector);
    this.collectorManager.registerCollector(categoryCollector);
    
    this.initialized = true;
    console.log('Enhanced Event Service initialized successfully');
  }

  // 既存のfetchIwateEventsとの互換性を保つメソッド
  public async fetchIwateEvents(): Promise<{ events: EventInfo[], sources: Source[] }> {
    await this.initialize();
    
    const cacheKey = 'iwate-events-legacy';
    
    // Check cache first
    const cachedEvents = await eventCache.get(cacheKey);
    if (cachedEvents && cachedEvents.length > 0) {
      console.log(`Returning ${cachedEvents.length} cached events`);
      return {
        events: cachedEvents.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description,
          date: e.date,
          locationName: e.locationName,
          latitude: e.latitude,
          longitude: e.longitude,
          category: e.category,
          officialUrl: e.officialUrl || ''
        })),
        sources: [] // Sources can be retrieved separately if needed
      };
    }

    // Fallback to major events collection only for now
    const request: CollectionRequest = {
      stages: [CollectionStage.MAJOR_EVENTS],
      targetEventCount: 50,
      priority: CollectionPriority.HIGH
    };

    const context: CollectionContext = {
      requestId: crypto.randomUUID(),
      startTime: new Date(),
      rateLimits: {
        geminiApiCalls: 100,
        maxConcurrentRequests: 1
      },
      cacheStrategy: {
        useCache: true,
        ttl: 3600000, // 1 hour
        invalidatePattern: ['iwate-events-*']
      }
    };

    try {
      const result = await this.collectorManager.executeCollection(request, context);
      
      // Cache the results
      await eventCache.set(cacheKey, result.totalEvents, {
        memoryTTL: 3600000,    // 1 hour
        localStorageTTL: 86400000, // 24 hours
        indexedDBTTL: 604800000    // 7 days
      });

      console.log(`Enhanced service collected ${result.totalEvents.length} events`);

      return {
        events: result.totalEvents.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description,
          date: e.date,
          locationName: e.locationName,
          latitude: e.latitude,
          longitude: e.longitude,
          category: e.category,
          officialUrl: e.officialUrl || ''
        })),
        sources: result.allSources
      };

    } catch (error) {
      console.error('Enhanced event collection failed:', error);
      
      // Fallback to empty result for now
      // TODO: Implement fallback to original geminiService
      return { events: [], sources: [] };
    }
  }

  // 新しい拡張機能メソッド群

  public async collectEventsByRegion(region: IwateRegion): Promise<{ events: EventInfo[], sources: Source[] }> {
    await this.initialize();

    const request: CollectionRequest = {
      stages: [CollectionStage.MAJOR_EVENTS],
      regions: [region],
      targetEventCount: 30
    };

    const result = await this.collectorManager.executeCollection(request);
    
    return {
      events: result.totalEvents.map(this.convertToEventInfo),
      sources: result.allSources
    };
  }

  public async collectEventsByCategory(category: SourceCategory): Promise<{ events: EventInfo[], sources: Source[] }> {
    await this.initialize();

    const request: CollectionRequest = {
      stages: [CollectionStage.MAJOR_EVENTS],
      categories: [category],
      targetEventCount: 25
    };

    const result = await this.collectorManager.executeCollection(request);
    
    return {
      events: result.totalEvents.map(this.convertToEventInfo),
      sources: result.allSources
    };
  }

  public async getCollectionStatistics(): Promise<{
    cacheStatistics: any;
    collectorInfo: any[];
    lastUpdate: Date | null;
  }> {
    await this.initialize();

    return {
      cacheStatistics: eventCache.getStatistics(),
      collectorInfo: this.collectorManager.getCollectorInfo(),
      lastUpdate: new Date() // TODO: Track actual last update time
    };
  }

  public async clearCache(): Promise<void> {
    await eventCache.clear();
    console.log('Enhanced Event Service cache cleared');
  }

  // 将来の拡張用メソッド（Phase 2, 3で実装予定）

  public async collectAllEvents(): Promise<{ events: EventInfo[], sources: Source[] }> {
    await this.initialize();

    const request: CollectionRequest = {
      stages: [
        CollectionStage.MAJOR_EVENTS,
        CollectionStage.MUNICIPAL,
        CollectionStage.CATEGORY_SPECIFIC
      ],
      targetEventCount: 300,
      priority: CollectionPriority.MEDIUM
    };

    const result = await this.collectorManager.executeCollection(request);
    
    return {
      events: result.totalEvents.map(this.convertToEventInfo),
      sources: result.allSources
    };
  }

  public async scheduleRegularUpdate(): Promise<void> {
    // TODO: Phase 4で実装 - UpdateSchedulerとの統合
    console.log('Scheduled updates will be implemented in Phase 4');
  }

  // Private helper methods
  private convertToEventInfo(enhancedEvent: any): EventInfo {
    return {
      id: enhancedEvent.id,
      title: enhancedEvent.title,
      description: enhancedEvent.description,
      date: enhancedEvent.date,
      locationName: enhancedEvent.locationName,
      latitude: enhancedEvent.latitude,
      longitude: enhancedEvent.longitude,
      category: enhancedEvent.category,
      officialUrl: enhancedEvent.officialUrl
    };
  }
}

// Singleton instance for backward compatibility
export const enhancedEventService = new EnhancedEventService();