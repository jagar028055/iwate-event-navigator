import { 
  IEventCollector, 
  CollectionStage, 
  CollectionResult, 
  CollectionRequest,
  CollectionContext,
  EnhancedEventInfo,
  CollectionError,
  InformationSource,
  CollectionPriority
} from './types';
import { Source } from '../../types';
import { EventDeduplicator } from './deduplication/EventDeduplicator';

export interface CollectorManagerResult {
  totalEvents: EnhancedEventInfo[];
  allSources: Source[];
  stageResults: CollectionResult[];
  executionSummary: {
    totalTime: number;
    totalApiCalls: number;
    successRate: number;
    errorCount: number;
  };
  dedupeSummary: {
    originalCount: number;
    duplicatesRemoved: number;
    finalCount: number;
  };
}

export class CollectorManager {
  private collectors: Map<CollectionStage, IEventCollector> = new Map();
  private rateLimiter: RateLimiter;
  private deduplicator: EventDeduplicator;

  constructor() {
    this.rateLimiter = new RateLimiter();
    this.deduplicator = new EventDeduplicator();
  }

  public registerCollector(collector: IEventCollector): void {
    this.collectors.set(collector.stage, collector);
    console.log(`Registered collector: ${collector.name} for stage ${collector.stage}`);
  }

  public async executeCollection(
    request: CollectionRequest,
    context?: CollectionContext
  ): Promise<CollectorManagerResult> {
    const startTime = Date.now();
    const requestId = context?.requestId || crypto.randomUUID();
    
    console.log(`Starting collection request ${requestId} for stages:`, request.stages);

    // Initialize result tracking
    const stageResults: CollectionResult[] = [];
    const allErrors: CollectionError[] = [];
    let totalApiCalls = 0;

    try {
      // Execute collectors in stage order
      const orderedStages = this.orderStagesByPriority(request.stages, request.priority);
      
      for (const stage of orderedStages) {
        const collector = this.collectors.get(stage);
        if (!collector) {
          console.warn(`No collector registered for stage ${stage}`);
          continue;
        }

        try {
          // Rate limiting
          await this.rateLimiter.waitIfNeeded();
          
          // Get sources for this collector
          const sources = this.getSourcesForStage(stage, request);
          
          console.log(`Executing ${collector.name} with ${sources.length} sources`);
          
          // Execute collection
          const result = await this.executeWithTimeout(
            collector.collect(sources),
            request.timeLimit || collector.estimateExecutionTime() * 2
          );

          stageResults.push(result);
          totalApiCalls += result.apiCallsUsed;
          allErrors.push(...result.errors);

          // Update rate limiter
          this.rateLimiter.recordApiCalls(result.apiCallsUsed);

          console.log(`Stage ${stage} completed: ${result.events.length} events found`);

          // Early termination if target reached
          if (request.targetEventCount) {
            const currentTotal = stageResults.reduce((sum, r) => sum + r.events.length, 0);
            if (currentTotal >= request.targetEventCount) {
              console.log(`Target event count ${request.targetEventCount} reached, stopping collection`);
              break;
            }
          }

        } catch (error) {
          console.error(`Error in stage ${stage}:`, error);
          allErrors.push({
            severity: 'major',
            source: collector.name,
            message: error.message,
            timestamp: new Date(),
            retryable: true
          });
        }

        // Inter-stage delay to respect API limits
        if (orderedStages.indexOf(stage) < orderedStages.length - 1) {
          await this.delay(2000); // 2 second delay between stages
        }
      }

      // Merge and deduplicate results
      const mergedEvents = this.mergeStageResults(stageResults);
      const dedupedEvents = await this.deduplicator.removeDuplicates(mergedEvents);
      const allSources = this.mergeSourceResults(stageResults);

      const totalTime = Date.now() - startTime;
      const successfulStages = stageResults.filter(r => r.errors.length === 0).length;
      const successRate = stageResults.length > 0 ? successfulStages / stageResults.length : 0;

      const result: CollectorManagerResult = {
        totalEvents: dedupedEvents,
        allSources,
        stageResults,
        executionSummary: {
          totalTime,
          totalApiCalls,
          successRate,
          errorCount: allErrors.length
        },
        dedupeSummary: {
          originalCount: mergedEvents.length,
          duplicatesRemoved: mergedEvents.length - dedupedEvents.length,
          finalCount: dedupedEvents.length
        }
      };

      console.log(`Collection completed: ${result.totalEvents.length} events (${result.dedupeSummary.duplicatesRemoved} duplicates removed)`);
      
      return result;

    } catch (error) {
      console.error('Collection manager execution failed:', error);
      throw new Error(`Collection failed: ${error.message}`);
    }
  }

  private orderStagesByPriority(
    stages: CollectionStage[], 
    priority?: CollectionPriority
  ): CollectionStage[] {
    const stageOrder = [...stages].sort((a, b) => a - b); // Natural order by default

    if (priority === CollectionPriority.URGENT) {
      // For urgent requests, prioritize major events first
      return stageOrder.sort((a, b) => {
        if (a === CollectionStage.MAJOR_EVENTS) return -1;
        if (b === CollectionStage.MAJOR_EVENTS) return 1;
        return a - b;
      });
    }

    return stageOrder;
  }

  private getSourcesForStage(
    stage: CollectionStage, 
    request: CollectionRequest
  ): InformationSource[] {
    const collector = this.collectors.get(stage);
    if (!collector) return [];

    let sources = collector.getRequiredSources();

    // Filter by regions if specified
    if (request.regions && request.regions.length > 0) {
      sources = sources.filter(source => 
        request.regions!.includes(source.region)
      );
    }

    // Filter by categories if specified
    if (request.categories && request.categories.length > 0) {
      sources = sources.filter(source => 
        request.categories!.includes(source.category)
      );
    }

    return sources;
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>, 
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Collection timeout')), timeoutMs)
      )
    ]);
  }

  private mergeStageResults(results: CollectionResult[]): EnhancedEventInfo[] {
    const allEvents: EnhancedEventInfo[] = [];
    
    for (const result of results) {
      allEvents.push(...result.events);
    }

    return allEvents;
  }

  private mergeSourceResults(results: CollectionResult[]): Source[] {
    const sourceMap = new Map<string, Source>();
    
    for (const result of results) {
      for (const source of result.sources) {
        sourceMap.set(source.uri, source);
      }
    }

    return Array.from(sourceMap.values());
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getCollectorInfo(): Array<{ stage: CollectionStage; name: string; description: string }> {
    return Array.from(this.collectors.values()).map(collector => ({
      stage: collector.stage,
      name: collector.name,
      description: collector.description
    }));
  }
}

// Rate Limiter for API calls
class RateLimiter {
  private apiCalls: number[] = []; // Timestamps of API calls
  private readonly maxCallsPerMinute = 60;
  private readonly maxCallsPerHour = 1000;

  public async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Clean old timestamps
    this.apiCalls = this.apiCalls.filter(timestamp => now - timestamp < 3600000); // 1 hour

    // Check hourly limit
    if (this.apiCalls.length >= this.maxCallsPerHour) {
      const oldestCall = Math.min(...this.apiCalls);
      const waitTime = 3600000 - (now - oldestCall);
      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms`);
        await this.delay(waitTime);
      }
    }

    // Check per-minute limit
    const recentCalls = this.apiCalls.filter(timestamp => now - timestamp < 60000); // 1 minute
    if (recentCalls.length >= this.maxCallsPerMinute) {
      const oldestRecentCall = Math.min(...recentCalls);
      const waitTime = 60000 - (now - oldestRecentCall);
      if (waitTime > 0) {
        console.log(`Per-minute rate limit reached, waiting ${waitTime}ms`);
        await this.delay(waitTime);
      }
    }
  }

  public recordApiCalls(count: number): void {
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      this.apiCalls.push(now);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Import the enhanced deduplicator