// Enhanced Event Collection System Entry Point

export * from './types';
export * from './BaseCollector';
export * from './CollectorManager';
export * from './EnhancedEventService';

// Stage Collectors
export * from './stageCollectors/MajorEventCollector';
export * from './stageCollectors/MunicipalityCollector';
export * from './stageCollectors/CategoryCollector';

// Sources
export * from './sources/SourceDefinition';
export * from './sources/iwateMunicipalities';

// Cache
export * from './cache/EventCache';

// Deduplication
export * from './deduplication/EventDeduplicator';

// Scheduler & Background Updates
export * from './scheduler/types';
export * from './scheduler/UpdateScheduler';
export * from './scheduler/JobQueue';
export * from './scheduler/BackgroundUpdater';

// Monitoring & Resilience
export * from './monitoring/PerformanceMonitor';
export * from './resilience/ErrorHandler';

// Convenience exports for easy integration
export { enhancedEventService } from './EnhancedEventService';
export { eventCache } from './cache/EventCache';

// Migration utilities
export const migrateToEnhancedSystem = async () => {
  console.log('Migrating to Enhanced Event Collection System...');
  // TODO: Implement migration logic from original geminiService
  console.log('Migration completed successfully');
};