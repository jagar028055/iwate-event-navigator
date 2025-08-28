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
} from '../index';

/**
 * Example usage of the Hybrid ETL System
 * This demonstrates how to:
 * 1. Set up sources
 * 2. Configure the ETL service
 * 3. Run collection
 * 4. Handle results
 */

export class HybridETLExample {
  private etlService: HybridETLService;
  private sourceRegistry: SourceRegistry;
  private deduplicationService: DeduplicationService;

  constructor() {
    this.etlService = new HybridETLService();
    this.sourceRegistry = new SourceRegistry();
    this.deduplicationService = new DeduplicationService();
  }

  /**
   * Initialize the system with example sources
   */
  public async initialize(): Promise<void> {
    console.log('🚀 Initializing Hybrid ETL System...');

    // Register example sources
    await this.registerExampleSources();

    console.log('✅ System initialized successfully');
  }

  /**
   * Register example sources from the redesign documentation
   */
  private async registerExampleSources(): Promise<void> {
    const exampleSources: Partial<HybridSource>[] = [
      // RSS Sources
      {
        name: '岩手県観光協会RSS',
        url: 'https://iwate-kanko.jp/feed/',
        type: SourceType.RSS_FEED,
        category: SourceCategory.CULTURAL,
        region: IwateRegion.ALL,
        reliability: 0.9,
        updateFrequency: UpdateFrequency.DAILY,
        enabled: true
      },
      {
        name: '盛岡市イベント情報',
        url: 'https://city.morioka.iwate.jp/rss/events.xml',
        type: SourceType.RSS_FEED,
        category: SourceCategory.COMMUNITY,
        region: IwateRegion.KENOU,
        reliability: 0.95,
        updateFrequency: UpdateFrequency.DAILY,
        enabled: true
      },
      
      // ICS Calendar Sources
      {
        name: '花巻市文化会館',
        url: 'https://hanamaki-bunka.jp/calendar.ics',
        type: SourceType.ICS_CALENDAR,
        category: SourceCategory.CULTURAL,
        region: IwateRegion.KENOU,
        reliability: 0.85,
        updateFrequency: UpdateFrequency.WEEKLY,
        enabled: true
      },
      {
        name: '岩手県民会館',
        url: 'https://iwate-kenmin.jp/events.ics',
        type: SourceType.ICS_CALENDAR,
        category: SourceCategory.CULTURAL,
        region: IwateRegion.KENOU,
        reliability: 0.9,
        updateFrequency: UpdateFrequency.WEEKLY,
        enabled: true
      },

      // Festival and Food Event Sources
      {
        name: '岩手まつり情報',
        url: 'https://iwate-matsuri.jp/feed/',
        type: SourceType.RSS_FEED,
        category: SourceCategory.FESTIVALS,
        region: IwateRegion.ALL,
        reliability: 0.85,
        updateFrequency: UpdateFrequency.WEEKLY,
        enabled: true
      },
      {
        name: '三陸グルメ情報',
        url: 'https://sanriku-gourmet.jp/events.rss',
        type: SourceType.RSS_FEED,
        category: SourceCategory.FOOD_EVENTS,
        region: IwateRegion.ENGAN,
        reliability: 0.75,
        updateFrequency: UpdateFrequency.WEEKLY,
        enabled: true
      }
    ];

    for (const sourceData of exampleSources) {
      try {
        const sourceId = await this.sourceRegistry.addSource(sourceData);
        const source = this.sourceRegistry.getSource(sourceId);
        if (source) {
          this.etlService.registerSource(source);
        }
        console.log(`📝 Registered source: ${sourceData.name}`);
      } catch (error) {
        console.error(`❌ Failed to register ${sourceData.name}:`, error.message);
      }
    }
  }

  /**
   * Run a complete collection cycle
   */
  public async runCollection(): Promise<void> {
    console.log('\n🔄 Starting event collection...');

    try {
      const collectionRequest: CollectionRequest = {
        stages: [CollectionStage.MAJOR_EVENTS, CollectionStage.MUNICIPAL, CollectionStage.CATEGORY_SPECIFIC],
        targetEventCount: 100,
        timeLimit: 60000, // 60 seconds
        regions: [IwateRegion.ALL, IwateRegion.KENOU, IwateRegion.ENGAN],
        categories: [
          SourceCategory.CULTURAL,
          SourceCategory.FESTIVALS,
          SourceCategory.FOOD_EVENTS,
          SourceCategory.COMMUNITY
        ],
        forceRefresh: false
      };

      const results = await this.etlService.collect(collectionRequest);
      
      console.log('\n📊 Collection Results:');
      this.displayCollectionResults(results);

      // Demonstrate deduplication
      await this.demonstrateDeduplication(results);

    } catch (error) {
      console.error('❌ Collection failed:', error);
    }
  }

  /**
   * Display collection results
   */
  private displayCollectionResults(results: any[]): void {
    let totalEvents = 0;
    let totalErrors = 0;
    let totalApiCalls = 0;
    let totalExecutionTime = 0;

    results.forEach((result, index) => {
      totalEvents += result.events.length;
      totalErrors += result.errors.length;
      totalApiCalls += result.apiCallsUsed;
      totalExecutionTime += result.executionTime;

      console.log(`\n📄 Result ${index + 1}:`);
      console.log(`  Events: ${result.events.length}`);
      console.log(`  Sources: ${result.sources.length}`);
      console.log(`  Execution time: ${result.executionTime}ms`);
      console.log(`  API calls: ${result.apiCallsUsed}`);
      
      if (result.errors.length > 0) {
        console.log(`  ⚠️ Errors: ${result.errors.length}`);
        result.errors.forEach((error: any) => {
          console.log(`    - ${error.source}: ${error.message}`);
        });
      }

      if (result.events.length > 0) {
        console.log('  📅 Sample events:');
        result.events.slice(0, 3).forEach((event: any) => {
          console.log(`    - ${event.title} (${event.date})`);
        });
      }
    });

    console.log(`\n📈 Summary:`);
    console.log(`  Total events collected: ${totalEvents}`);
    console.log(`  Total execution time: ${totalExecutionTime}ms`);
    console.log(`  Total API calls used: ${totalApiCalls}`);
    console.log(`  Error count: ${totalErrors}`);
    console.log(`  Average events per source: ${(totalEvents / results.length).toFixed(1)}`);
  }

  /**
   * Demonstrate deduplication functionality
   */
  private async demonstrateDeduplication(results: any[]): Promise<void> {
    console.log('\n🔍 Running deduplication...');

    const allEvents = results.flatMap(r => r.events);
    
    if (allEvents.length === 0) {
      console.log('No events to deduplicate');
      return;
    }

    const deduplicationResult = await this.deduplicationService.deduplicate(allEvents);

    console.log('📊 Deduplication Results:');
    console.log(`  Input events: ${deduplicationResult.statistics.totalInput}`);
    console.log(`  Output events: ${deduplicationResult.statistics.totalOutput}`);
    console.log(`  Duplicates removed: ${deduplicationResult.statistics.duplicatesRemoved}`);
    console.log(`  Duplicate groups: ${deduplicationResult.statistics.groupsFound}`);
    console.log(`  Average group size: ${deduplicationResult.statistics.averageGroupSize.toFixed(1)}`);

    if (deduplicationResult.duplicateGroups.length > 0) {
      console.log('\n🔗 Sample duplicate groups:');
      deduplicationResult.duplicateGroups.slice(0, 3).forEach((group, index) => {
        console.log(`  Group ${index + 1}: "${group.primaryEvent.title}"`);
        console.log(`    Duplicates: ${group.duplicates.length}`);
        console.log(`    Reason: ${group.mergeReason}`);
        console.log(`    Confidence: ${(group.confidence * 100).toFixed(1)}%`);
      });
    }
  }

  /**
   * Validate all registered sources
   */
  public async validateSources(): Promise<void> {
    console.log('\n🔍 Validating all sources...');

    const validationResults = await this.sourceRegistry.validateAllSources();
    
    let validCount = 0;
    let invalidCount = 0;
    
    for (const [sourceId, result] of validationResults) {
      const source = this.sourceRegistry.getSource(sourceId);
      if (result.isValid) {
        validCount++;
        console.log(`✅ ${source?.name}: Valid (${(result.confidence * 100).toFixed(1)}% confidence)`);
      } else {
        invalidCount++;
        console.log(`❌ ${source?.name}: Invalid`);
        if (result.errors.length > 0) {
          result.errors.forEach(error => console.log(`    Error: ${error}`));
        }
        if (result.warnings.length > 0) {
          result.warnings.forEach(warning => console.log(`    Warning: ${warning}`));
        }
      }
    }

    console.log(`\n📊 Validation Summary:`);
    console.log(`  Valid sources: ${validCount}`);
    console.log(`  Invalid sources: ${invalidCount}`);
    console.log(`  Total sources: ${validCount + invalidCount}`);
  }

  /**
   * Display source registry statistics
   */
  public displaySourceStatistics(): void {
    const stats = this.sourceRegistry.getStatistics();
    
    console.log('\n📈 Source Registry Statistics:');
    console.log(`  Total sources: ${stats.total}`);
    console.log(`  Enabled sources: ${stats.enabled}`);
    console.log(`  Average reliability: ${(stats.averageReliability * 100).toFixed(1)}%`);
    console.log(`  Recently failed: ${stats.recentlyFailed}`);
    
    console.log('  By type:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`    ${type}: ${count}`);
    });
    
    console.log('  By region:');
    Object.entries(stats.byRegion).forEach(([region, count]) => {
      console.log(`    ${region}: ${count}`);
    });
    
    console.log('  By category:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`    ${category}: ${count}`);
    });
  }

  /**
   * Run the complete example
   */
  public async run(): Promise<void> {
    try {
      await this.initialize();
      await this.validateSources();
      this.displaySourceStatistics();
      await this.runCollection();
      
      console.log('\n🎉 Hybrid ETL Example completed successfully!');
    } catch (error) {
      console.error('❌ Example failed:', error);
    }
  }
}

// Export for direct execution
export const runHybridETLExample = async (): Promise<void> => {
  const example = new HybridETLExample();
  await example.run();
};

// Run if this file is executed directly
if (import.meta.main) {
  runHybridETLExample().catch(console.error);
}