import {
  CollectionResult,
  CollectionRequest,
  CollectionContext,
  CollectionStage,
  HybridSource,
  ISourceAdapter,
  NormalizedEvent,
  ValidationResult,
  EnhancedEventInfo,
  CollectionError,
  CollectionStatistics,
  DataFreshness,
  UpdateFrequency,
  IwateRegion,
  SourceType
} from './types';
import { ICSAdapter } from './adapters/ICSAdapter';
import { RSSAdapter } from './adapters/RSSAdapter';
import { HTMLAdapter } from './adapters/HTMLAdapter';
import { saveSnapshot, writeRunLog } from './utils/persistence';

export class HybridETLService {
  private adapters: Map<SourceType, ISourceAdapter>;
  private sources: Map<string, HybridSource>;
  private deduplicationCache: Map<string, string[]>;

  constructor() {
    this.adapters = new Map();
    this.sources = new Map();
    this.deduplicationCache = new Map();
    
    // Register available adapters
    this.registerAdapter(new ICSAdapter());
    this.registerAdapter(new RSSAdapter());
    this.registerAdapter(new HTMLAdapter());
  }

  /**
   * Register a source adapter
   */
  public registerAdapter(adapter: ISourceAdapter): void {
    this.adapters.set(adapter.sourceType, adapter);
  }

  /**
   * Register a source for collection
   */
  public registerSource(source: HybridSource): void {
    // Validate source configuration
    if (!source.id || !source.name || !source.url) {
      throw new Error('Source must have id, name, and url');
    }
    
    // Initialize source history if not present
    if (!source.fetchHistory) {
      source.fetchHistory = [];
    }
    
    this.sources.set(source.id, source);
  }

  /**
   * Get all registered sources
   */
  public getSources(): HybridSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get sources by region
   */
  public getSourcesByRegion(region: IwateRegion): HybridSource[] {
    return Array.from(this.sources.values())
      .filter(source => source.region === region || source.region === IwateRegion.ALL);
  }

  /**
   * Get sources by type
   */
  public getSourcesByType(type: SourceType): HybridSource[] {
    return Array.from(this.sources.values())
      .filter(source => source.type === type);
  }

  /**
   * Validate a source
   */
  public async validateSource(sourceId: string): Promise<ValidationResult> {
    const source = this.sources.get(sourceId);
    if (!source) {
      return {
        isValid: false,
        errors: ['Source not found'],
        warnings: [],
        confidence: 0
      };
    }

    const adapter = this.adapters.get(source.type);
    if (!adapter) {
      return {
        isValid: false,
        errors: [`No adapter available for source type: ${source.type}`],
        warnings: [],
        confidence: 0
      };
    }

    try {
      return await adapter.validate(source);
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        warnings: [],
        confidence: 0
      };
    }
  }

  /**
   * Execute a full ETL collection request
   */
  public async collect(request: CollectionRequest): Promise<CollectionResult[]> {
    const context = this.createCollectionContext(request);
    const results: CollectionResult[] = [];
    const startTime = Date.now();

    try {
      console.log(`Starting hybrid ETL collection: ${context.requestId}`);

      // Filter sources based on request criteria
      const targetSources = this.filterSources(request);
      
      if (targetSources.length === 0) {
        console.warn('No sources match the collection criteria');
        return results;
      }

      console.log(`Found ${targetSources.length} sources to process`);

      // Process sources in parallel with rate limiting
      const concurrency = Math.min(context.rateLimits.maxConcurrentRequests, targetSources.length);
      const batches = this.createBatches(targetSources, concurrency);

      for (const batch of batches) {
        const batchResults = await Promise.allSettled(
          batch.map(source => this.processSingleSource(source, context))
        );

        for (let i = 0; i < batchResults.length; i++) {
          const result = batchResults[i];
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error(`Source ${batch[i].id} failed:`, result.reason);
            // Create error result
            results.push(this.createErrorResult(batch[i], result.reason, context));
          }
        }
      }

      // Post-processing: deduplication across all results
      const allEvents = results.flatMap(r => r.events);
      const deduplicatedEvents = await this.deduplicateEvents(allEvents);
      
      // Update results with deduplicated events
      this.redistributeDeduplicatedEvents(results, deduplicatedEvents);

      const totalTime = Date.now() - startTime;
      console.log(`Collection completed in ${totalTime}ms. Total events: ${deduplicatedEvents.length}`);

      return results;

    } catch (error) {
      console.error('Collection failed:', error);
      throw error;
    }
  }

  /**
   * Process a single source through the ETL pipeline
   */
  private async processSingleSource(source: HybridSource, context: CollectionContext): Promise<CollectionResult> {
    const startTime = Date.now();
    const errors: CollectionError[] = [];
    let events: EnhancedEventInfo[] = [];
    let apiCalls = 0;
    const runId = `${context.requestId}-${source.id}-${startTime}`;
    const snapshotPaths: string[] = [];

    try {
      console.log(`Processing source: ${source.name} (${source.type})`);

      // Skip if source is not enabled
      if (!source.enabled) {
        console.log(`Skipping disabled source: ${source.name}`);
        return this.createEmptyResult(source, startTime, 'Source disabled');
      }

      // Get appropriate adapter
      const adapter = this.adapters.get(source.type);
      if (!adapter) {
        throw new Error(`No adapter available for source type: ${source.type}`);
      }

      if (!adapter.canHandle(source)) {
        throw new Error(`Adapter cannot handle source: ${source.name}`);
      }

      // Check if source needs updating based on frequency and cache
      if (context.cacheStrategy.useCache && !this.shouldRefreshSource(source, context)) {
        console.log(`Using cached data for source: ${source.name}`);
        return this.createEmptyResult(source, startTime, 'Cache hit');
      }

      // Step 1: Fetch raw data
      const rawData = await adapter.fetch(source);
      apiCalls++;

      if (rawData.length === 0) {
        console.log(`No new data from source: ${source.name}`);
        // RunLog: no new data
        await writeRunLog({
          run_id: runId,
          source_id: source.id,
          started_at: new Date(startTime).toISOString(),
          finished_at: new Date().toISOString(),
          status: 'no_new_data',
          fetched_count: 0,
          parsed_count: 0,
          upserted_count: 0,
          snapshot_paths: []
        });
        return this.createEmptyResult(source, startTime, 'No new data');
      }

      // Save snapshots (best-effort, Node環境のみ)
      const ext = source.type === SourceType.RSS_FEED ? 'xml'
                : source.type === SourceType.ICS_CALENDAR ? 'ics'
                : source.type === SourceType.REST_API ? 'json'
                : 'html';
      for (const raw of rawData) {
        const saved = await saveSnapshot(raw as any, source.id, ext as any);
        if (saved) snapshotPaths.push(saved);
      }

      // Step 2: Normalize data
      const normalizedEvents = await adapter.normalize(rawData, source);
      console.log(`Normalized ${normalizedEvents.length} events from ${source.name}`);

      // Step 3: Validate and enhance events
      const validEvents = [];
      for (const event of normalizedEvents) {
        if (await this.validateEvent(event)) {
          const enhanced = this.enhanceEvent(event, source);
          validEvents.push(enhanced);
        }
      }

      events = validEvents;

      // Update source metadata
      source.lastChecked = new Date();
      if (source.fetchHistory.length > 0) {
        const lastFetch = source.fetchHistory[source.fetchHistory.length - 1];
        source.successRate = this.calculateSuccessRate(source.fetchHistory);
      }

      // RunLog: success
      await writeRunLog({
        run_id: runId,
        source_id: source.id,
        started_at: new Date(startTime).toISOString(),
        finished_at: new Date().toISOString(),
        status: 'success',
        fetched_count: rawData.length,
        parsed_count: normalizedEvents.length,
        upserted_count: events.length,
        snapshot_paths: snapshotPaths
      });

    } catch (error) {
      errors.push({
        severity: 'major',
        source: source.name,
        message: error.message,
        timestamp: new Date(),
        retryable: true
      });
      console.error(`Source ${source.name} failed:`, error);

      // RunLog: fail (best-effort)
      await writeRunLog({
        run_id: runId,
        source_id: source.id,
        started_at: new Date(startTime).toISOString(),
        finished_at: new Date().toISOString(),
        status: 'fail',
        fetched_count: 0,
        parsed_count: 0,
        upserted_count: 0,
        error_summary: error?.message || String(error),
        snapshot_paths: snapshotPaths
      });
    }

    const executionTime = Date.now() - startTime;
    
    const statistics: CollectionStatistics = {
      totalFound: events.length,
      duplicatesRemoved: 0, // Will be updated after deduplication
      validationPassed: events.length,
      averageConfidence: events.length > 0 
        ? events.reduce((sum, e) => sum + e.collectionMetadata.confidence, 0) / events.length 
        : 0,
      sourcesCovered: 1,
      geolocationSuccess: events.filter(e => e.latitude && e.longitude).length
    };

    return {
      stage: CollectionStage.MAJOR_EVENTS, // Default stage
      events,
      sources: [this.convertToLegacySource(source)],
      executionTime,
      apiCallsUsed: apiCalls,
      errors,
      statistics
    };
  }

  /**
   * Create collection context
   */
  private createCollectionContext(request: CollectionRequest): CollectionContext {
    return {
      requestId: crypto.randomUUID(),
      startTime: new Date(),
      rateLimits: {
        geminiApiCalls: 50, // Conservative limit
        maxConcurrentRequests: request.timeLimit ? 3 : 5
      },
      cacheStrategy: {
        useCache: !request.forceRefresh,
        ttl: 3600000, // 1 hour
        invalidatePattern: request.forceRefresh ? ['*'] : []
      }
    };
  }

  /**
   * Filter sources based on collection criteria
   */
  private filterSources(request: CollectionRequest): HybridSource[] {
    let sources = Array.from(this.sources.values());

    // Filter by enabled status
    sources = sources.filter(s => s.enabled);

    // Filter by regions
    if (request.regions && request.regions.length > 0) {
      sources = sources.filter(s => 
        request.regions!.includes(s.region) || s.region === IwateRegion.ALL
      );
    }

    // Filter by categories
    if (request.categories && request.categories.length > 0) {
      sources = sources.filter(s => 
        request.categories!.includes(s.category)
      );
    }

    // TODO: Add more filtering logic based on stages, priority, etc.

    return sources;
  }

  /**
   * Check if source should be refreshed
   */
  private shouldRefreshSource(source: HybridSource, context: CollectionContext): boolean {
    if (!source.lastChecked) {
      return true; // Never checked
    }

    const now = context.startTime;
    const timeSinceCheck = now.getTime() - source.lastChecked.getTime();

    // Convert frequency to milliseconds
    const frequencyMs = this.getFrequencyMs(source.updateFrequency);
    
    return timeSinceCheck >= frequencyMs;
  }

  /**
   * Convert update frequency to milliseconds
   */
  private getFrequencyMs(frequency: UpdateFrequency): number {
    const intervals = {
      [UpdateFrequency.DAILY]: 24 * 60 * 60 * 1000,
      [UpdateFrequency.ALTERNATE_DAYS]: 48 * 60 * 60 * 1000,
      [UpdateFrequency.WEEKLY]: 7 * 24 * 60 * 60 * 1000,
      [UpdateFrequency.MONTHLY]: 30 * 24 * 60 * 60 * 1000,
      [UpdateFrequency.SEASONAL]: 90 * 24 * 60 * 60 * 1000
    };

    return intervals[frequency] || intervals[UpdateFrequency.DAILY];
  }

  /**
   * Validate an event
   */
  private async validateEvent(event: NormalizedEvent): Promise<boolean> {
    // Required fields check
    if (!event.title || !event.starts_at || !event.city) {
      return false;
    }

    // Date validation
    const now = new Date();
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    if (event.starts_at < now || event.starts_at > oneYearFromNow) {
      return false;
    }

    // End date validation
    if (event.ends_at && event.ends_at < event.starts_at) {
      return false;
    }

    return true;
  }

  /**
   * Enhance normalized event with additional metadata
   */
  private enhanceEvent(event: NormalizedEvent, source: HybridSource): EnhancedEventInfo {
    const now = new Date();
    
    return {
      // Convert normalized event to EventInfo format
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.starts_at.toISOString(),
      endDate: event.ends_at?.toISOString(),
      locationName: event.venue || event.city,
      latitude: event.lat,
      longitude: event.lon,
      category: event.category,
      price: event.price,
      officialUrl: event.source_url,
      
      // Enhanced metadata
      collectionStage: CollectionStage.MAJOR_EVENTS,
      sourceReliability: source.reliability,
      lastUpdated: now,
      dataFreshness: DataFreshness.FRESH,
      verificationStatus: event.validation_status,
      collectionMetadata: {
        sourceUrl: event.source_url,
        extractionMethod: `${source.type}_adapter`,
        confidence: event.confidence,
        duplicateScore: 0
      }
    };
  }

  /**
   * Deduplicate events across all sources
   */
  private async deduplicateEvents(events: EnhancedEventInfo[]): Promise<EnhancedEventInfo[]> {
    const dedupeMap = new Map<string, EnhancedEventInfo[]>();
    
    // Group events by dedupe key
    for (const event of events) {
      const key = this.generateDedupeKey(event);
      if (!dedupeMap.has(key)) {
        dedupeMap.set(key, []);
      }
      dedupeMap.get(key)!.push(event);
    }

    const deduplicatedEvents: EnhancedEventInfo[] = [];
    
    // Process each group
    for (const [key, groupEvents] of dedupeMap) {
      if (groupEvents.length === 1) {
        // No duplicates
        deduplicatedEvents.push(groupEvents[0]);
      } else {
        // Merge duplicates
        const mergedEvent = this.mergeEvents(groupEvents);
        mergedEvent.collectionMetadata.duplicateScore = groupEvents.length - 1;
        deduplicatedEvents.push(mergedEvent);
      }
    }

    return deduplicatedEvents;
  }

  /**
   * Generate deduplication key for event
   */
  private generateDedupeKey(event: EnhancedEventInfo): string {
    const cleanTitle = event.title.replace(/[^\w\s]/g, '').trim().toLowerCase();
    const dateStr = event.date.split('T')[0];
    const cleanLocation = (event.locationName || '').replace(/[^\w\s]/g, '').trim().toLowerCase();
    
    return `${cleanTitle}_${dateStr}_${cleanLocation}`;
  }

  /**
   * Merge duplicate events into single event
   */
  private mergeEvents(events: EnhancedEventInfo[]): EnhancedEventInfo {
    // Sort by confidence and reliability
    events.sort((a, b) => {
      const scoreA = a.collectionMetadata.confidence * a.sourceReliability;
      const scoreB = b.collectionMetadata.confidence * b.sourceReliability;
      return scoreB - scoreA;
    });

    const primary = events[0];
    const merged = { ...primary };

    // Merge information from other events
    for (let i = 1; i < events.length; i++) {
      const secondary = events[i];
      
      // Use more detailed description if available
      if (!merged.description && secondary.description) {
        merged.description = secondary.description;
      }
      
      // Use more precise location if available
      if (!merged.latitude && secondary.latitude) {
        merged.latitude = secondary.latitude;
        merged.longitude = secondary.longitude;
      }
      
      // Use official URL if available
      if (!merged.officialUrl?.includes('official') && secondary.officialUrl?.includes('official')) {
        merged.officialUrl = secondary.officialUrl;
      }
      
      // Use price if available
      if (!merged.price && secondary.price) {
        merged.price = secondary.price;
      }
    }

    return merged;
  }

  /**
   * Create batches for parallel processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Calculate success rate from fetch history
   */
  private calculateSuccessRate(history: any[]): number {
    if (history.length === 0) return 0;
    
    const successful = history.filter(h => h.success).length;
    return successful / history.length;
  }

  /**
   * Create empty result for skipped sources
   */
  private createEmptyResult(source: HybridSource, startTime: number, reason: string): CollectionResult {
    return {
      stage: CollectionStage.MAJOR_EVENTS,
      events: [],
      sources: [this.convertToLegacySource(source)],
      executionTime: Date.now() - startTime,
      apiCallsUsed: 0,
      errors: [],
      statistics: {
        totalFound: 0,
        duplicatesRemoved: 0,
        validationPassed: 0,
        averageConfidence: 0,
        sourcesCovered: 1,
        geolocationSuccess: 0
      }
    };
  }

  /**
   * Create error result for failed sources
   */
  private createErrorResult(source: HybridSource, error: Error, context: CollectionContext): CollectionResult {
    return {
      stage: CollectionStage.MAJOR_EVENTS,
      events: [],
      sources: [this.convertToLegacySource(source)],
      executionTime: Date.now() - context.startTime.getTime(),
      apiCallsUsed: 0,
      errors: [{
        severity: 'major',
        source: source.name,
        message: error.message,
        timestamp: new Date(),
        retryable: true
      }],
      statistics: {
        totalFound: 0,
        duplicatesRemoved: 0,
        validationPassed: 0,
        averageConfidence: 0,
        sourcesCovered: 1,
        geolocationSuccess: 0
      }
    };
  }

  /**
   * Convert HybridSource to legacy Source format
   */
  private convertToLegacySource(source: HybridSource): any {
    return {
      uri: source.url,
      type: source.type,
      name: source.name,
      description: `${source.type} source for ${source.region}`
    };
  }

  /**
   * Redistribute deduplicated events back to results
   */
  private redistributeDeduplicatedEvents(results: CollectionResult[], events: EnhancedEventInfo[]): void {
    // Clear existing events
    results.forEach(result => {
      result.events = [];
      result.statistics.duplicatesRemoved = 0;
    });

    // Redistribute events to their original sources
    for (const event of events) {
      const sourceResult = results.find(r => 
        r.sources.some(s => s.uri === event.collectionMetadata.sourceUrl)
      );
      
      if (sourceResult) {
        sourceResult.events.push(event);
        sourceResult.statistics.duplicatesRemoved += event.collectionMetadata.duplicateScore || 0;
      }
    }

    // Update statistics
    results.forEach(result => {
      result.statistics.totalFound = result.events.length;
      result.statistics.validationPassed = result.events.length;
      result.statistics.averageConfidence = result.events.length > 0
        ? result.events.reduce((sum, e) => sum + e.collectionMetadata.confidence, 0) / result.events.length
        : 0;
      result.statistics.geolocationSuccess = result.events.filter(e => e.latitude && e.longitude).length;
    });
  }
}
