import { EnhancedEventInfo } from '../types';
import { EventInfo } from '../../../types';

export interface DuplicationAnalysis {
  originalCount: number;
  duplicatesFound: number;
  uniqueEventsCount: number;
  duplicateGroups: DuplicateGroup[];
  confidenceScores: {
    high: number;    // 0.9以上の確信度
    medium: number;  // 0.7-0.9の確信度
    low: number;     // 0.5-0.7の確信度
  };
}

export interface DuplicateGroup {
  signature: string;
  events: EnhancedEventInfo[];
  confidence: number;
  recommendedEvent: EnhancedEventInfo;
  duplicateReasons: string[];
}

export class EventDeduplicator {
  private readonly SIMILARITY_THRESHOLDS = {
    HIGH: 0.9,
    MEDIUM: 0.7,
    LOW: 0.5
  };

  public async removeDuplicates(events: EnhancedEventInfo[]): Promise<EnhancedEventInfo[]> {
    if (events.length <= 1) return events;

    console.log(`🔍 Starting deduplication for ${events.length} events`);
    const startTime = Date.now();

    const analysis = await this.analyzeDuplicates(events);
    const deduplicatedEvents = this.selectBestEvents(analysis);

    const executionTime = Date.now() - startTime;
    console.log(`✅ Deduplication completed in ${executionTime}ms:`);
    console.log(`   📊 Original: ${analysis.originalCount} events`);
    console.log(`   🔄 Duplicates removed: ${analysis.duplicatesFound}`);
    console.log(`   ✨ Final unique events: ${analysis.uniqueEventsCount}`);

    return deduplicatedEvents;
  }

  public async analyzeDuplicates(events: EnhancedEventInfo[]): Promise<DuplicationAnalysis> {
    const duplicateGroups: DuplicateGroup[] = [];
    const processed = new Set<string>();
    const confidenceScores = { high: 0, medium: 0, low: 0 };

    for (let i = 0; i < events.length; i++) {
      const eventA = events[i];
      const eventIdA = eventA.id;

      if (processed.has(eventIdA)) continue;

      const similarEvents: EnhancedEventInfo[] = [eventA];
      
      for (let j = i + 1; j < events.length; j++) {
        const eventB = events[j];
        const eventIdB = eventB.id;

        if (processed.has(eventIdB)) continue;

        const similarity = await this.calculateSimilarity(eventA, eventB);
        
        if (similarity.score >= this.SIMILARITY_THRESHOLDS.LOW) {
          similarEvents.push(eventB);
          processed.add(eventIdB);

          // 確信度別カウント
          if (similarity.score >= this.SIMILARITY_THRESHOLDS.HIGH) {
            confidenceScores.high++;
          } else if (similarity.score >= this.SIMILARITY_THRESHOLDS.MEDIUM) {
            confidenceScores.medium++;
          } else {
            confidenceScores.low++;
          }
        }
      }

      if (similarEvents.length > 1) {
        const group: DuplicateGroup = {
          signature: this.createGroupSignature(similarEvents),
          events: similarEvents,
          confidence: this.calculateGroupConfidence(similarEvents),
          recommendedEvent: this.selectBestEventFromGroup(similarEvents),
          duplicateReasons: this.generateDuplicateReasons(similarEvents)
        };
        duplicateGroups.push(group);
      }

      processed.add(eventIdA);
    }

    return {
      originalCount: events.length,
      duplicatesFound: duplicateGroups.reduce((sum, group) => sum + (group.events.length - 1), 0),
      uniqueEventsCount: events.length - duplicateGroups.reduce((sum, group) => sum + (group.events.length - 1), 0),
      duplicateGroups,
      confidenceScores
    };
  }

  private async calculateSimilarity(
    eventA: EnhancedEventInfo, 
    eventB: EnhancedEventInfo
  ): Promise<{ score: number; reasons: string[] }> {
    const reasons: string[] = [];
    let totalScore = 0;
    let maxPossibleScore = 0;

    // 1. タイトル類似度 (weight: 0.4)
    const titleSimilarity = this.calculateStringSimilarity(eventA.title, eventB.title);
    totalScore += titleSimilarity * 0.4;
    maxPossibleScore += 0.4;
    if (titleSimilarity > 0.7) reasons.push(`タイトル類似度: ${(titleSimilarity * 100).toFixed(1)}%`);

    // 2. 開催日の完全一致 (weight: 0.25)
    if (eventA.date === eventB.date) {
      totalScore += 0.25;
      reasons.push('開催日が同一');
    }
    maxPossibleScore += 0.25;

    // 3. 場所の類似度 (weight: 0.2)
    const locationSimilarity = this.calculateStringSimilarity(eventA.locationName, eventB.locationName);
    totalScore += locationSimilarity * 0.2;
    maxPossibleScore += 0.2;
    if (locationSimilarity > 0.8) reasons.push(`開催場所類似度: ${(locationSimilarity * 100).toFixed(1)}%`);

    // 4. 地理的距離 (weight: 0.1)
    const geoDistance = this.calculateGeoDistance(
      eventA.latitude, eventA.longitude,
      eventB.latitude, eventB.longitude
    );
    if (geoDistance < 0.5) { // 500m以内
      totalScore += 0.1;
      reasons.push(`地理的に近接: ${(geoDistance * 1000).toFixed(0)}m`);
    }
    maxPossibleScore += 0.1;

    // 5. カテゴリの一致 (weight: 0.05)
    if (eventA.category === eventB.category) {
      totalScore += 0.05;
      reasons.push('同一カテゴリ');
    }
    maxPossibleScore += 0.05;

    // 正規化
    const normalizedScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;

    return {
      score: normalizedScore,
      reasons
    };
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Levenshtein距離ベースの類似度計算
    const normalizedStr1 = this.normalizeString(str1);
    const normalizedStr2 = this.normalizeString(str2);

    if (normalizedStr1 === normalizedStr2) return 1.0;

    const maxLen = Math.max(normalizedStr1.length, normalizedStr2.length);
    if (maxLen === 0) return 1.0;

    const levenshteinDistance = this.calculateLevenshteinDistance(normalizedStr1, normalizedStr2);
    return 1 - (levenshteinDistance / maxLen);
  }

  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[\s\-_（）()]/g, '')
      .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/[Ａ-Ｚａ-ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .trim();
  }

  private calculateGeoDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // 地球の半径（km）
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private selectBestEventFromGroup(events: EnhancedEventInfo[]): EnhancedEventInfo {
    // 最も信頼度の高いイベントを選択
    let bestEvent = events[0];
    let bestScore = this.calculateEventQualityScore(bestEvent);

    for (let i = 1; i < events.length; i++) {
      const event = events[i];
      const score = this.calculateEventQualityScore(event);
      
      if (score > bestScore) {
        bestEvent = event;
        bestScore = score;
      }
    }

    return bestEvent;
  }

  private calculateEventQualityScore(event: EnhancedEventInfo): number {
    let score = 0;

    // 情報源の信頼度 (weight: 0.3)
    score += event.sourceReliability * 0.3;

    // 説明の詳細度 (weight: 0.2)
    const descriptionLength = event.description?.length || 0;
    score += Math.min(descriptionLength / 200, 1) * 0.2;

    // 公式URLの有無 (weight: 0.15)
    if (event.officialUrl) score += 0.15;

    // データの新鮮さ (weight: 0.15)
    const hoursOld = (Date.now() - event.lastUpdated.getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 1 - (hoursOld / 24)) * 0.15; // 24時間で0になる

    // 収集ステージの重み (weight: 0.1)
    const stageWeights = { 1: 1.0, 2: 0.8, 3: 0.6 };
    score += (stageWeights[event.collectionStage] || 0.5) * 0.1;

    // 検証状態 (weight: 0.1)
    if (event.verificationStatus === 'verified') score += 0.1;
    else if (event.verificationStatus === 'pending') score += 0.05;

    return score;
  }

  private createGroupSignature(events: EnhancedEventInfo[]): string {
    const firstEvent = events[0];
    return `${this.normalizeString(firstEvent.title)}_${firstEvent.date}_${this.normalizeString(firstEvent.locationName)}`;
  }

  private calculateGroupConfidence(events: EnhancedEventInfo[]): number {
    if (events.length <= 1) return 1.0;

    let totalConfidence = 0;
    let comparisons = 0;

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const similarity = this.calculateStringSimilarity(events[i].title, events[j].title);
        totalConfidence += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalConfidence / comparisons : 0;
  }

  private generateDuplicateReasons(events: EnhancedEventInfo[]): string[] {
    if (events.length <= 1) return [];

    const reasons: Set<string> = new Set();

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const eventA = events[i];
        const eventB = events[j];

        if (eventA.title === eventB.title) {
          reasons.add('同一タイトル');
        }

        if (eventA.date === eventB.date && eventA.locationName === eventB.locationName) {
          reasons.add('同一日時・場所');
        }

        const titleSim = this.calculateStringSimilarity(eventA.title, eventB.title);
        if (titleSim > 0.8) {
          reasons.add('タイトル高類似');
        }

        if (eventA.collectionStage !== eventB.collectionStage) {
          reasons.add('異なる収集ステージで発見');
        }
      }
    }

    return Array.from(reasons);
  }

  private selectBestEvents(analysis: DuplicationAnalysis): EnhancedEventInfo[] {
    const selectedEvents: EnhancedEventInfo[] = [];
    const processedEventIds = new Set<string>();

    // 重複グループから最良のイベントを選択
    for (const group of analysis.duplicateGroups) {
      selectedEvents.push(group.recommendedEvent);
      
      // このグループの全イベントを処理済みとしてマーク
      for (const event of group.events) {
        processedEventIds.add(event.id);
      }
    }

    // 重複していないイベントを追加
    // この処理は別途必要（analysisに含まれていない単独イベント）

    console.log(`📋 Selected ${selectedEvents.length} best events from ${analysis.duplicateGroups.length} duplicate groups`);

    return selectedEvents;
  }

  public async getDuplicationReport(events: EnhancedEventInfo[]): Promise<DuplicationAnalysis> {
    return await this.analyzeDuplicates(events);
  }

  // 高度な重複検出メソッド（将来の拡張用）
  public async detectSemanticDuplicates(events: EnhancedEventInfo[]): Promise<DuplicateGroup[]> {
    // TODO: AI/NLPを使った意味的重複検出を実装
    // 例：「花火大会」と「花火フェスティバル」の意味的類似性
    console.log('Semantic duplicate detection is not yet implemented');
    return [];
  }
}