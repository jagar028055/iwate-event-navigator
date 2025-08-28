import { EventInfo, Source } from '../../types';

// Collection Stage Definitions
export enum CollectionStage {
  MAJOR_EVENTS = 1,     // Stage 1: 大規模イベント収集
  MUNICIPAL = 2,        // Stage 2: 市町村別収集  
  CATEGORY_SPECIFIC = 3 // Stage 3: カテゴリ特化収集
}

export enum CollectionPriority {
  URGENT = 'urgent',           // 緊急・当日情報
  HIGH = 'high',              // 重要な地域イベント
  MEDIUM = 'medium',          // 一般的なイベント
  LOW = 'low'                 // 補完的な情報
}

export enum DataFreshness {
  FRESH = 'fresh',           // 24時間以内
  STALE = 'stale',          // 24-72時間
  EXPIRED = 'expired'        // 72時間以上
}

// Enhanced Event Info with Collection Metadata
export interface EnhancedEventInfo extends EventInfo {
  collectionStage: CollectionStage;
  sourceReliability: number;        // 0-1 score
  lastUpdated: Date;
  dataFreshness: DataFreshness;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  collectionMetadata: {
    sourceUrl?: string;
    extractionMethod: string;
    confidence: number;
    duplicateScore?: number;
  };
}

// Collection Results
export interface CollectionResult {
  stage: CollectionStage;
  events: EnhancedEventInfo[];
  sources: Source[];
  executionTime: number;        // ms
  apiCallsUsed: number;
  errors: CollectionError[];
  statistics: CollectionStatistics;
}

export interface CollectionError {
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  source: string;
  message: string;
  timestamp: Date;
  retryable: boolean;
}

export interface CollectionStatistics {
  totalFound: number;
  duplicatesRemoved: number;
  validationPassed: number;
  averageConfidence: number;
  sourcesCovered: number;
  geolocationSuccess: number;
}

// Information Source Definitions
export interface InformationSource {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  category: SourceCategory;
  region: IwateRegion;
  reliability: number;         // 0-1 score
  updateFrequency: UpdateFrequency;
  searchStrategy: SearchStrategy;
  isActive: boolean;
  lastChecked?: Date;
  successRate?: number;
}

export enum SourceType {
  OFFICIAL_GOVERNMENT = 'official_government',
  TOURISM_ASSOCIATION = 'tourism_association', 
  CULTURAL_ORGANIZATION = 'cultural_organization',
  COMMERCIAL = 'commercial',
  COMMUNITY = 'community',
  MEDIA = 'media',
  RELIGIOUS = 'religious',
  RSS_FEED = 'rss_feed',
  ICS_CALENDAR = 'ics_calendar',
  REST_API = 'rest_api',
  HTML_SCRAPING = 'html_scraping'
}

export enum SourceCategory {
  FESTIVALS = 'festivals',
  FOOD_EVENTS = 'food_events',
  CULTURAL = 'cultural',
  SPORTS = 'sports',
  NATURE = 'nature',
  COMMUNITY = 'community',
  BUSINESS = 'business',
  GENERAL = 'general'
}

export enum IwateRegion {
  ALL = 'all',
  KENOU = 'kenou',     // 県央
  KENNAN = 'kennan',   // 県南
  ENGAN = 'engan',     // 沿岸
  KENPOKU = 'kenpoku'  // 県北
}

export enum UpdateFrequency {
  DAILY = 'daily',
  ALTERNATE_DAYS = 'alternate_days',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SEASONAL = 'seasonal'
}

export interface SearchStrategy {
  method: 'rss_fetch' | 'ics_fetch' | 'api_fetch' | 'html_scraping' | 'gemini_search' | 'targeted_crawl' | 'api_integration';
  keywords: string[];
  exclusionTerms?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  geoBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  // New fields for hybrid ETL
  fetchConfig?: {
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    authConfig?: {
      type: 'bearer' | 'api_key' | 'basic';
      credentials: string;
    };
    parseRules?: {
      titleSelector?: string;
      dateSelector?: string;
      locationSelector?: string;
      descriptionSelector?: string;
    };
  };
}

// Collector Interface
export interface IEventCollector {
  readonly stage: CollectionStage;
  readonly name: string;
  readonly description: string;
  
  collect(sources?: InformationSource[]): Promise<CollectionResult>;
  validateEvent(event: Partial<EventInfo>): Promise<boolean>;
  estimateExecutionTime(): number; // ms
  getRequiredSources(): InformationSource[];
}

// Collection Request/Context
export interface CollectionRequest {
  stages: CollectionStage[];
  targetEventCount?: number;
  timeLimit?: number;          // ms
  regions?: IwateRegion[];
  categories?: SourceCategory[];
  forceRefresh?: boolean;
  priority?: CollectionPriority;
}

export interface CollectionContext {
  requestId: string;
  startTime: Date;
  userAgent?: string;
  rateLimits: {
    geminiApiCalls: number;
    maxConcurrentRequests: number;
  };
  cacheStrategy: {
    useCache: boolean;
    ttl: number;
    invalidatePattern?: string[];
  };
}

// Cache-related Types
export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: Date;
  ttl: number;
  accessCount: number;
  lastAccessed: Date;
}

export interface CacheStatistics {
  hitRate: number;
  missCount: number;
  evictionCount: number;
  currentSize: number;
  maxSize: number;
  averageAccessTime: number;
}

// Hybrid ETL Source Schema
export interface HybridSource extends InformationSource {
  sourceId: string;
  enabled: boolean;
  etag?: string;
  lastModified?: string;
  robotsCompliant: boolean;
  crawlDelay?: number;
  fetchHistory: FetchAttempt[];
  sourceValidation: {
    contentType: string;
    encoding: string;
    structure: 'valid' | 'invalid' | 'unknown';
    lastValidated: Date;
  };
}

export interface FetchAttempt {
  timestamp: Date;
  success: boolean;
  statusCode?: number;
  error?: string;
  itemsFound: number;
  processingTime: number;
}

// Source Adapters
export interface ISourceAdapter {
  readonly sourceType: SourceType;
  readonly name: string;
  
  canHandle(source: HybridSource): boolean;
  fetch(source: HybridSource): Promise<RawEventData[]>;
  validate(source: HybridSource): Promise<ValidationResult>;
  normalize(rawData: RawEventData[], source: HybridSource): Promise<NormalizedEvent[]>;
}

export interface RawEventData {
  sourceId: string;
  rawContent: any;
  extractedAt: Date;
  contentHash: string;
  sourceUrl: string;
}

export interface NormalizedEvent {
  // Common event schema from redesign spec
  id: string;
  title: string;
  description?: string;
  starts_at: Date;
  ends_at?: Date;
  venue?: string;
  city: string;
  lat?: number;
  lon?: number;
  category: string;
  price?: string;
  organizer?: string;
  source_url: string;
  source_id: string;
  last_seen: Date;
  created_at: Date;
  updated_at: Date;
  
  // Deduplication key
  dedupe_key: string;
  
  // Quality metrics
  confidence: number;
  validation_status: 'verified' | 'pending' | 'quarantine';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number;
}