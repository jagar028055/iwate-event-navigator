import { EnhancedEventInfo, NormalizedEvent } from './types';

export interface DeduplicationConfig {
  titleSimilarityThreshold: number;
  dateSimilarityThresholdMs: number;
  locationSimilarityThreshold: number;
  enableFuzzyMatching: boolean;
  maxDuplicatesPerGroup: number;
}

export interface DeduplicationResult {
  deduplicatedEvents: EnhancedEventInfo[];
  duplicateGroups: DuplicateGroup[];
  statistics: {
    totalInput: number;
    totalOutput: number;
    duplicatesRemoved: number;
    groupsFound: number;
    averageGroupSize: number;
  };
}

export interface DuplicateGroup {
  id: string;
  primaryEvent: EnhancedEventInfo;
  duplicates: EnhancedEventInfo[];
  mergeReason: string;
  confidence: number;
}

export class DeduplicationService {
  private config: DeduplicationConfig;

  constructor(config: Partial<DeduplicationConfig> = {}) {
    this.config = {
      titleSimilarityThreshold: 0.8,
      dateSimilarityThresholdMs: 4 * 60 * 60 * 1000, // 4 hours
      locationSimilarityThreshold: 0.7,
      enableFuzzyMatching: true,
      maxDuplicatesPerGroup: 10,
      ...config
    };
  }

  /**
   * Deduplicate a collection of events
   */
  public async deduplicate(events: EnhancedEventInfo[]): Promise<DeduplicationResult> {
    console.log(`Starting deduplication of ${events.length} events`);
    const startTime = Date.now();

    // Step 1: Create exact match groups first
    const exactGroups = this.createExactMatchGroups(events);
    
    // Step 2: Create fuzzy match groups from remaining events
    const remainingEvents = events.filter(event => 
      !exactGroups.some(group => 
        group.primaryEvent.id === event.id || 
        group.duplicates.some(d => d.id === event.id)
      )
    );
    
    const fuzzyGroups = this.config.enableFuzzyMatching 
      ? await this.createFuzzyMatchGroups(remainingEvents)
      : [];

    // Step 3: Merge groups and create final deduplicated list
    const allGroups = [...exactGroups, ...fuzzyGroups];
    const deduplicatedEvents: EnhancedEventInfo[] = [];

    // Add events that weren't grouped (no duplicates found)
    const groupedEventIds = new Set(
      allGroups.flatMap(group => [group.primaryEvent.id, ...group.duplicates.map(d => d.id)])
    );
    
    const ungroupedEvents = events.filter(event => !groupedEventIds.has(event.id));
    deduplicatedEvents.push(...ungroupedEvents);

    // Add primary events from groups (these are the merged results)
    deduplicatedEvents.push(...allGroups.map(group => group.primaryEvent));

    const statistics = {
      totalInput: events.length,
      totalOutput: deduplicatedEvents.length,
      duplicatesRemoved: events.length - deduplicatedEvents.length,
      groupsFound: allGroups.length,
      averageGroupSize: allGroups.length > 0 
        ? allGroups.reduce((sum, group) => sum + group.duplicates.length + 1, 0) / allGroups.length
        : 0
    };

    const processingTime = Date.now() - startTime;
    console.log(`Deduplication completed in ${processingTime}ms. Removed ${statistics.duplicatesRemoved} duplicates.`);

    return {
      deduplicatedEvents,
      duplicateGroups: allGroups,
      statistics
    };
  }

  /**
   * Create exact match groups based on deduplication keys
   */
  private createExactMatchGroups(events: EnhancedEventInfo[]): DuplicateGroup[] {
    const groups = new Map<string, EnhancedEventInfo[]>();
    
    // Group events by deduplication key
    for (const event of events) {
      const key = this.generateDedupeKey(event);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(event);
    }

    const duplicateGroups: DuplicateGroup[] = [];
    
    // Process each group
    for (const [key, groupEvents] of groups) {
      if (groupEvents.length > 1) {
        // Sort by confidence and reliability
        const sortedEvents = groupEvents.sort((a, b) => {
          const scoreA = a.collectionMetadata.confidence * a.sourceReliability;
          const scoreB = b.collectionMetadata.confidence * b.sourceReliability;
          return scoreB - scoreA;
        });

        const primary = sortedEvents[0];
        const duplicates = sortedEvents.slice(1);
        
        // Merge information from duplicates into primary
        const mergedPrimary = this.mergeEvents([primary, ...duplicates]);
        mergedPrimary.collectionMetadata.duplicateScore = duplicates.length;

        duplicateGroups.push({
          id: crypto.randomUUID(),
          primaryEvent: mergedPrimary,
          duplicates,
          mergeReason: `Exact match on key: ${key}`,
          confidence: 1.0
        });
      }
    }

    console.log(`Created ${duplicateGroups.length} exact match groups`);
    return duplicateGroups;
  }

  /**
   * Create fuzzy match groups using similarity algorithms
   */
  private async createFuzzyMatchGroups(events: EnhancedEventInfo[]): Promise<DuplicateGroup[]> {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < events.length; i++) {
      const eventA = events[i];
      if (processed.has(eventA.id)) continue;

      const similarEvents: EnhancedEventInfo[] = [];
      
      for (let j = i + 1; j < events.length; j++) {
        const eventB = events[j];
        if (processed.has(eventB.id)) continue;

        const similarity = await this.calculateEventSimilarity(eventA, eventB);
        if (similarity.overall >= 0.8) { // High similarity threshold
          similarEvents.push(eventB);
          processed.add(eventB.id);
        }
      }

      if (similarEvents.length > 0) {
        const allEvents = [eventA, ...similarEvents];
        
        // Sort by quality score
        allEvents.sort((a, b) => {
          const scoreA = this.calculateQualityScore(a);
          const scoreB = this.calculateQualityScore(b);
          return scoreB - scoreA;
        });

        const primary = allEvents[0];
        const duplicates = allEvents.slice(1);
        
        const mergedPrimary = this.mergeEvents(allEvents);
        mergedPrimary.collectionMetadata.duplicateScore = duplicates.length;

        groups.push({
          id: crypto.randomUUID(),
          primaryEvent: mergedPrimary,
          duplicates,
          mergeReason: `Fuzzy match (similarity > 0.8)`,
          confidence: 0.85
        });

        processed.add(eventA.id);
      }
    }

    console.log(`Created ${groups.length} fuzzy match groups`);
    return groups;
  }

  /**
   * Calculate similarity between two events
   */
  private async calculateEventSimilarity(eventA: EnhancedEventInfo, eventB: EnhancedEventInfo): Promise<{
    title: number;
    date: number;
    location: number;
    overall: number;
  }> {
    // Title similarity
    const titleSimilarity = this.calculateStringSimilarity(
      this.normalizeTitle(eventA.title),
      this.normalizeTitle(eventB.title)
    );

    // Date similarity (closer dates = higher similarity)
    const dateA = new Date(eventA.date);
    const dateB = new Date(eventB.date);
    const timeDiff = Math.abs(dateA.getTime() - dateB.getTime());
    const dateSimilarity = Math.max(0, 1 - (timeDiff / this.config.dateSimilarityThresholdMs));

    // Location similarity
    const locationA = this.normalizeLocation(eventA.locationName || '');
    const locationB = this.normalizeLocation(eventB.locationName || '');
    const locationSimilarity = locationA && locationB 
      ? this.calculateStringSimilarity(locationA, locationB)
      : 0.5; // Neutral if location missing

    // Calculate weighted overall similarity
    const overall = (titleSimilarity * 0.5) + (dateSimilarity * 0.3) + (locationSimilarity * 0.2);

    return {
      title: titleSimilarity,
      date: dateSimilarity,
      location: locationSimilarity,
      overall
    };
  }

  /**
   * Calculate string similarity using Jaccard similarity
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    // Convert to sets of words
    const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 1));
    const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 1));

    // Calculate Jaccard similarity
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Normalize title for comparison
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[【】「」（）()]/g, '') // Remove brackets
      .replace(/第\d+回/g, '') // Remove "第N回" patterns
      .replace(/\d{4}年?/g, '') // Remove years
      .replace(/[！!？?]/g, '') // Remove exclamation/question marks
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize location for comparison
   */
  private normalizeLocation(location: string): string {
    return location
      .toLowerCase()
      .replace(/市|町|村|区/g, '') // Remove administrative suffixes
      .replace(/ホール|会館|センター|公園|館/g, '') // Normalize venue types
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate quality score for event selection
   */
  private calculateQualityScore(event: EnhancedEventInfo): number {
    let score = 0;

    // Base confidence and reliability
    score += event.collectionMetadata.confidence * 0.3;
    score += event.sourceReliability * 0.2;

    // Content completeness
    if (event.description && event.description.length > 50) score += 0.15;
    if (event.latitude && event.longitude) score += 0.1;
    if (event.price) score += 0.05;
    if (event.officialUrl) score += 0.1;
    if (event.endDate) score += 0.05;

    // Source type reliability
    if (event.collectionMetadata.sourceUrl?.includes('gov') || 
        event.collectionMetadata.sourceUrl?.includes('pref.iwate.jp')) {
      score += 0.05;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Merge multiple events into a single enhanced event
   */
  private mergeEvents(events: EnhancedEventInfo[]): EnhancedEventInfo {
    if (events.length === 0) {
      throw new Error('Cannot merge empty event list');
    }

    if (events.length === 1) {
      return { ...events[0] };
    }

    // Start with the highest quality event
    const sorted = events.sort((a, b) => this.calculateQualityScore(b) - this.calculateQualityScore(a));
    const primary = { ...sorted[0] };

    // Merge information from other events
    for (let i = 1; i < sorted.length; i++) {
      const secondary = sorted[i];
      
      // Use more detailed description if available
      if (!primary.description && secondary.description) {
        primary.description = secondary.description;
      } else if (primary.description && secondary.description && 
                 secondary.description.length > primary.description.length) {
        primary.description = secondary.description;
      }
      
      // Use more precise location if available
      if (!primary.latitude && secondary.latitude) {
        primary.latitude = secondary.latitude;
        primary.longitude = secondary.longitude;
      }
      
      // Use official URL if available
      if (!primary.officialUrl && secondary.officialUrl) {
        primary.officialUrl = secondary.officialUrl;
      } else if (primary.officialUrl && secondary.officialUrl && 
                 (secondary.officialUrl.includes('official') || secondary.officialUrl.includes('gov'))) {
        primary.officialUrl = secondary.officialUrl;
      }
      
      // Use price if available
      if (!primary.price && secondary.price) {
        primary.price = secondary.price;
      }

      // Use end date if available
      if (!primary.endDate && secondary.endDate) {
        primary.endDate = secondary.endDate;
      }

      // Use more specific location name if available
      if (!primary.locationName && secondary.locationName) {
        primary.locationName = secondary.locationName;
      } else if (primary.locationName && secondary.locationName && 
                 secondary.locationName.length > primary.locationName.length) {
        primary.locationName = secondary.locationName;
      }
    }

    // Update metadata
    primary.collectionMetadata.confidence = Math.max(
      ...events.map(e => e.collectionMetadata.confidence)
    );
    
    primary.sourceReliability = Math.max(...events.map(e => e.sourceReliability));
    primary.lastUpdated = new Date();

    return primary;
  }

  /**
   * Generate deduplication key for exact matching
   */
  private generateDedupeKey(event: EnhancedEventInfo): string {
    const cleanTitle = this.normalizeTitle(event.title);
    const dateStr = event.date.split('T')[0]; // YYYY-MM-DD
    const cleanLocation = this.normalizeLocation(event.locationName || '');
    
    return `${cleanTitle}_${dateStr}_${cleanLocation}`.replace(/\s+/g, '_');
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<DeduplicationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Deduplication config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  public getConfig(): DeduplicationConfig {
    return { ...this.config };
  }

  /**
   * Analyze duplicate groups for insights
   */
  public analyzeDuplicateGroups(groups: DuplicateGroup[]): {
    totalDuplicatesRemoved: number;
    averageGroupSize: number;
    mergeReasonCounts: Record<string, number>;
    sourceReliabilityImpact: {
      highReliabilityKept: number;
      lowReliabilityRemoved: number;
    };
  } {
    const totalDuplicatesRemoved = groups.reduce((sum, group) => sum + group.duplicates.length, 0);
    const averageGroupSize = groups.length > 0 
      ? groups.reduce((sum, group) => sum + group.duplicates.length + 1, 0) / groups.length
      : 0;

    const mergeReasonCounts: Record<string, number> = {};
    for (const group of groups) {
      const reason = group.mergeReason.split(':')[0]; // Get base reason
      mergeReasonCounts[reason] = (mergeReasonCounts[reason] || 0) + 1;
    }

    let highReliabilityKept = 0;
    let lowReliabilityRemoved = 0;

    for (const group of groups) {
      if (group.primaryEvent.sourceReliability >= 0.7) {
        highReliabilityKept++;
      }
      
      for (const duplicate of group.duplicates) {
        if (duplicate.sourceReliability < 0.5) {
          lowReliabilityRemoved++;
        }
      }
    }

    return {
      totalDuplicatesRemoved,
      averageGroupSize,
      mergeReasonCounts,
      sourceReliabilityImpact: {
        highReliabilityKept,
        lowReliabilityRemoved
      }
    };
  }
}