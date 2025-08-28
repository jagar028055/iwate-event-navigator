import {
  HybridSource,
  SourceType,
  SourceCategory,
  IwateRegion,
  UpdateFrequency,
  SearchStrategy,
  FetchAttempt,
  ValidationResult
} from './types';

export interface SourceRegistryConfig {
  maxSources?: number;
  defaultUpdateFrequency?: UpdateFrequency;
  enableValidationOnAdd?: boolean;
}

export class SourceRegistry {
  private sources: Map<string, HybridSource>;
  private config: SourceRegistryConfig;

  constructor(config: SourceRegistryConfig = {}) {
    this.sources = new Map();
    this.config = {
      maxSources: 1000,
      defaultUpdateFrequency: UpdateFrequency.DAILY,
      enableValidationOnAdd: true,
      ...config
    };
  }

  /**
   * Add a new source to the registry
   */
  public async addSource(sourceData: Partial<HybridSource>): Promise<string> {
    // Validate required fields
    if (!sourceData.name || !sourceData.url) {
      throw new Error('Source must have name and url');
    }

    // Check source limit
    if (this.sources.size >= this.config.maxSources!) {
      throw new Error(`Cannot exceed maximum sources limit: ${this.config.maxSources}`);
    }

    // Generate ID if not provided
    const sourceId = sourceData.sourceId || this.generateSourceId(sourceData.name, sourceData.url);
    
    // Check for duplicate
    if (this.sources.has(sourceId)) {
      throw new Error(`Source with ID ${sourceId} already exists`);
    }

    // Create source with defaults
    const source: HybridSource = {
      // Required fields
      id: sourceId,
      sourceId,
      name: sourceData.name,
      url: sourceData.url,
      
      // Default values
      type: sourceData.type || this.inferSourceType(sourceData.url),
      category: sourceData.category || SourceCategory.GENERAL,
      region: sourceData.region || IwateRegion.ALL,
      reliability: sourceData.reliability || 0.5,
      updateFrequency: sourceData.updateFrequency || this.config.defaultUpdateFrequency!,
      isActive: sourceData.isActive ?? true,
      enabled: sourceData.enabled ?? true,
      
      // Search strategy
      searchStrategy: sourceData.searchStrategy || this.createDefaultSearchStrategy(
        sourceData.type || this.inferSourceType(sourceData.url)
      ),
      
      // Metadata
      robotsCompliant: sourceData.robotsCompliant ?? true,
      crawlDelay: sourceData.crawlDelay || 1000,
      fetchHistory: sourceData.fetchHistory || [],
      sourceValidation: sourceData.sourceValidation || {
        contentType: 'unknown',
        encoding: 'utf-8',
        structure: 'unknown',
        lastValidated: new Date()
      },
      
      // Optional fields
      lastChecked: sourceData.lastChecked,
      successRate: sourceData.successRate,
      etag: sourceData.etag,
      lastModified: sourceData.lastModified
    };

    // Validate source if enabled
    if (this.config.enableValidationOnAdd) {
      const validation = await this.validateSource(source);
      if (!validation.isValid && validation.errors.length > 0) {
        console.warn(`Source validation failed for ${source.name}:`, validation.errors);
        // Still add the source but mark it as problematic
        source.enabled = false;
        source.sourceValidation.structure = 'invalid';
      }
    }

    this.sources.set(sourceId, source);
    console.log(`Added source: ${source.name} (${sourceId})`);
    
    return sourceId;
  }

  /**
   * Update an existing source
   */
  public async updateSource(sourceId: string, updates: Partial<HybridSource>): Promise<void> {
    const existing = this.sources.get(sourceId);
    if (!existing) {
      throw new Error(`Source ${sourceId} not found`);
    }

    // Merge updates
    const updated: HybridSource = {
      ...existing,
      ...updates,
      // Preserve certain fields that shouldn't be overwritten
      id: existing.id,
      sourceId: existing.sourceId,
      fetchHistory: updates.fetchHistory || existing.fetchHistory
    };

    // Re-validate if URL changed
    if (updates.url && updates.url !== existing.url) {
      const validation = await this.validateSource(updated);
      if (!validation.isValid) {
        throw new Error(`Updated source failed validation: ${validation.errors.join(', ')}`);
      }
    }

    this.sources.set(sourceId, updated);
    console.log(`Updated source: ${updated.name} (${sourceId})`);
  }

  /**
   * Remove a source from the registry
   */
  public removeSource(sourceId: string): boolean {
    const removed = this.sources.delete(sourceId);
    if (removed) {
      console.log(`Removed source: ${sourceId}`);
    }
    return removed;
  }

  /**
   * Get a source by ID
   */
  public getSource(sourceId: string): HybridSource | undefined {
    return this.sources.get(sourceId);
  }

  /**
   * Get all sources
   */
  public getAllSources(): HybridSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get sources by filter criteria
   */
  public getSources(filter?: {
    enabled?: boolean;
    type?: SourceType;
    category?: SourceCategory;
    region?: IwateRegion;
    minReliability?: number;
  }): HybridSource[] {
    let sources = Array.from(this.sources.values());

    if (filter) {
      if (filter.enabled !== undefined) {
        sources = sources.filter(s => s.enabled === filter.enabled);
      }
      if (filter.type) {
        sources = sources.filter(s => s.type === filter.type);
      }
      if (filter.category) {
        sources = sources.filter(s => s.category === filter.category);
      }
      if (filter.region) {
        sources = sources.filter(s => s.region === filter.region || s.region === IwateRegion.ALL);
      }
      if (filter.minReliability) {
        sources = sources.filter(s => s.reliability >= filter.minReliability!);
      }
    }

    return sources;
  }

  /**
   * Get sources that need updating based on their frequency
   */
  public getSourcesForUpdate(): HybridSource[] {
    const now = new Date();
    
    return this.getAllSources()
      .filter(source => {
        if (!source.enabled) return false;
        
        if (!source.lastChecked) return true; // Never checked
        
        const timeSinceCheck = now.getTime() - source.lastChecked.getTime();
        const frequencyMs = this.getUpdateFrequencyMs(source.updateFrequency);
        
        return timeSinceCheck >= frequencyMs;
      });
  }

  /**
   * Update source statistics after fetch attempt
   */
  public recordFetchAttempt(sourceId: string, attempt: FetchAttempt): void {
    const source = this.sources.get(sourceId);
    if (!source) {
      console.warn(`Cannot record fetch attempt: source ${sourceId} not found`);
      return;
    }

    source.fetchHistory.push(attempt);
    
    // Keep only last 100 attempts
    if (source.fetchHistory.length > 100) {
      source.fetchHistory = source.fetchHistory.slice(-100);
    }

    // Update success rate
    source.successRate = this.calculateSuccessRate(source.fetchHistory);
    source.lastChecked = attempt.timestamp;

    // Adjust reliability based on recent performance
    const recentAttempts = source.fetchHistory.slice(-10);
    const recentSuccessRate = this.calculateSuccessRate(recentAttempts);
    
    if (recentSuccessRate < 0.3 && source.reliability > 0.2) {
      source.reliability = Math.max(0.1, source.reliability - 0.1);
      console.warn(`Reduced reliability for ${source.name}: ${source.reliability}`);
    } else if (recentSuccessRate > 0.8 && source.reliability < 0.9) {
      source.reliability = Math.min(1.0, source.reliability + 0.05);
    }
  }

  /**
   * Validate source accessibility and format
   */
  public async validateSource(source: HybridSource): Promise<ValidationResult> {
    try {
      const response = await fetch(source.url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Iwate-Event-Navigator/1.0'
        }
      });

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!response.ok) {
        errors.push(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      
      // Validate content type based on source type
      switch (source.type) {
        case SourceType.RSS_FEED:
          if (!contentType.includes('xml') && !contentType.includes('rss')) {
            warnings.push(`Expected XML/RSS content, got: ${contentType}`);
          }
          break;
        case SourceType.ICS_CALENDAR:
          if (!contentType.includes('calendar') && !contentType.includes('text/plain')) {
            warnings.push(`Expected calendar content, got: ${contentType}`);
          }
          break;
        case SourceType.REST_API:
          if (!contentType.includes('json')) {
            warnings.push(`Expected JSON content, got: ${contentType}`);
          }
          break;
      }

      // Update source validation metadata
      source.sourceValidation = {
        contentType,
        encoding: 'utf-8', // Assume UTF-8
        structure: response.ok ? 'valid' : 'invalid',
        lastValidated: new Date()
      };

      const confidence = response.ok ? (warnings.length === 0 ? 0.9 : 0.7) : 0.2;

      return {
        isValid: response.ok,
        errors,
        warnings,
        confidence
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        warnings: [],
        confidence: 0.1
      };
    }
  }

  /**
   * Bulk validate all sources
   */
  public async validateAllSources(): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();
    
    const sources = this.getAllSources();
    console.log(`Validating ${sources.length} sources...`);

    // Process in batches to avoid overwhelming servers
    const batchSize = 5;
    for (let i = 0; i < sources.length; i += batchSize) {
      const batch = sources.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async source => {
        try {
          const result = await this.validateSource(source);
          results.set(source.sourceId, result);
          
          if (!result.isValid) {
            console.warn(`Source ${source.name} failed validation:`, result.errors);
          }
        } catch (error) {
          console.error(`Validation error for ${source.name}:`, error);
          results.set(source.sourceId, {
            isValid: false,
            errors: [error.message],
            warnings: [],
            confidence: 0
          });
        }
      });

      await Promise.allSettled(batchPromises);
      
      // Brief pause between batches
      if (i + batchSize < sources.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Validation completed. ${Array.from(results.values()).filter(r => r.isValid).length}/${sources.length} sources valid`);
    
    return results;
  }

  /**
   * Export sources to JSON
   */
  public exportSources(): string {
    const sources = this.getAllSources();
    return JSON.stringify(sources, null, 2);
  }

  /**
   * Import sources from JSON
   */
  public async importSources(json: string, options: { replace?: boolean } = {}): Promise<number> {
    let sourcesData: Partial<HybridSource>[];
    
    try {
      sourcesData = JSON.parse(json);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }

    if (!Array.isArray(sourcesData)) {
      throw new Error('JSON must contain an array of sources');
    }

    if (options.replace) {
      this.sources.clear();
    }

    let importedCount = 0;
    
    for (const sourceData of sourcesData) {
      try {
        await this.addSource(sourceData);
        importedCount++;
      } catch (error) {
        console.warn(`Failed to import source ${sourceData.name}:`, error.message);
      }
    }

    console.log(`Imported ${importedCount}/${sourcesData.length} sources`);
    return importedCount;
  }

  /**
   * Get source statistics
   */
  public getStatistics(): {
    total: number;
    enabled: number;
    byType: Record<string, number>;
    byRegion: Record<string, number>;
    byCategory: Record<string, number>;
    averageReliability: number;
    recentlyFailed: number;
  } {
    const sources = this.getAllSources();
    
    const stats = {
      total: sources.length,
      enabled: sources.filter(s => s.enabled).length,
      byType: {} as Record<string, number>,
      byRegion: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      averageReliability: 0,
      recentlyFailed: 0
    };

    // Count by type
    for (const source of sources) {
      stats.byType[source.type] = (stats.byType[source.type] || 0) + 1;
      stats.byRegion[source.region] = (stats.byRegion[source.region] || 0) + 1;
      stats.byCategory[source.category] = (stats.byCategory[source.category] || 0) + 1;
    }

    // Calculate average reliability
    if (sources.length > 0) {
      stats.averageReliability = sources.reduce((sum, s) => sum + s.reliability, 0) / sources.length;
    }

    // Count recently failed sources (success rate < 0.5 in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    stats.recentlyFailed = sources.filter(source => {
      if (!source.lastChecked || source.lastChecked < oneDayAgo) return false;
      return (source.successRate || 0) < 0.5;
    }).length;

    return stats;
  }

  // Private helper methods

  private generateSourceId(name: string, url: string): string {
    const cleanName = name.replace(/[^\w]/g, '').toLowerCase();
    const hash = this.simpleHash(url);
    return `${cleanName}_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private inferSourceType(url: string): SourceType {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('.ics') || urlLower.includes('/calendar')) {
      return SourceType.ICS_CALENDAR;
    }
    if (urlLower.includes('rss') || urlLower.includes('feed') || urlLower.includes('.xml')) {
      return SourceType.RSS_FEED;
    }
    if (urlLower.includes('/api/') || urlLower.includes('.json')) {
      return SourceType.REST_API;
    }
    
    return SourceType.HTML_SCRAPING;
  }

  private createDefaultSearchStrategy(type: SourceType): SearchStrategy {
    const base: SearchStrategy = {
      method: 'rss_fetch',
      keywords: ['イベント', 'まつり', '祭り', 'フェスティバル'],
      exclusionTerms: ['中止', '延期', '終了'],
      dateRange: {
        from: new Date(),
        to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      }
    };

    switch (type) {
      case SourceType.ICS_CALENDAR:
        return { ...base, method: 'ics_fetch' };
      case SourceType.RSS_FEED:
        return { ...base, method: 'rss_fetch' };
      case SourceType.REST_API:
        return { ...base, method: 'api_fetch' };
      case SourceType.HTML_SCRAPING:
        return { ...base, method: 'html_scraping' };
      default:
        return base;
    }
  }

  private getUpdateFrequencyMs(frequency: UpdateFrequency): number {
    const intervals = {
      [UpdateFrequency.DAILY]: 24 * 60 * 60 * 1000,
      [UpdateFrequency.ALTERNATE_DAYS]: 48 * 60 * 60 * 1000,
      [UpdateFrequency.WEEKLY]: 7 * 24 * 60 * 60 * 1000,
      [UpdateFrequency.MONTHLY]: 30 * 24 * 60 * 60 * 1000,
      [UpdateFrequency.SEASONAL]: 90 * 24 * 60 * 60 * 1000
    };

    return intervals[frequency] || intervals[UpdateFrequency.DAILY];
  }

  private calculateSuccessRate(history: FetchAttempt[]): number {
    if (history.length === 0) return 0;
    
    const successful = history.filter(h => h.success).length;
    return successful / history.length;
  }
}