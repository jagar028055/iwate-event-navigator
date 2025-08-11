import { CollectionError } from '../types';

export enum ErrorSeverity {
  LOW = 'minor',
  MEDIUM = 'moderate', 
  HIGH = 'major',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  API = 'api',
  DATA = 'data',
  SYSTEM = 'system',
  CACHE = 'cache',
  VALIDATION = 'validation'
}

export interface ErrorContext {
  component: string;
  operation: string;
  stage?: number;
  source?: string;
  attemptNumber?: number;
  metadata?: Record<string, any>;
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'skip' | 'fail';
  delay?: number;
  maxAttempts?: number;
  fallbackData?: any;
  reason: string;
}

export interface ErrorPattern {
  pattern: RegExp;
  severity: ErrorSeverity;
  category: ErrorCategory;
  isRetryable: boolean;
  recoveryAction: RecoveryAction;
  description: string;
}

export class ErrorHandler {
  private errorPatterns: ErrorPattern[] = [];
  private errorHistory: CollectionError[] = [];
  private recoveryStrategies: Map<string, RecoveryAction> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor() {
    this.initializeErrorPatterns();
    this.initializeRecoveryStrategies();
    console.log('ErrorHandler initialized with comprehensive error patterns');
  }

  private initializeErrorPatterns(): void {
    this.errorPatterns = [
      // ネットワーク関連エラー
      {
        pattern: /network.*error|fetch.*failed|connection.*refused/i,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.NETWORK,
        isRetryable: true,
        recoveryAction: {
          type: 'retry',
          delay: 5000,
          maxAttempts: 3,
          reason: 'Network connectivity issue - retryable'
        },
        description: 'Network connectivity or fetch operation failed'
      },

      // API制限・レート制限
      {
        pattern: /rate.*limit|too.*many.*requests|quota.*exceeded/i,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.API,
        isRetryable: true,
        recoveryAction: {
          type: 'retry',
          delay: 60000, // 1分待機
          maxAttempts: 2,
          reason: 'Rate limit exceeded - wait and retry'
        },
        description: 'API rate limit or quota exceeded'
      },

      // API認証エラー
      {
        pattern: /unauthorized|authentication.*failed|invalid.*key|forbidden/i,
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.API,
        isRetryable: false,
        recoveryAction: {
          type: 'fail',
          reason: 'Authentication failure - requires manual intervention'
        },
        description: 'API authentication or authorization failed'
      },

      // タイムアウト
      {
        pattern: /timeout|timed.*out/i,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.NETWORK,
        isRetryable: true,
        recoveryAction: {
          type: 'retry',
          delay: 10000,
          maxAttempts: 2,
          reason: 'Request timeout - retry with longer timeout'
        },
        description: 'Request timeout occurred'
      },

      // JSONパースエラー
      {
        pattern: /json.*parse|invalid.*json|unexpected.*token/i,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.DATA,
        isRetryable: false,
        recoveryAction: {
          type: 'skip',
          reason: 'Invalid JSON response - skip this data source'
        },
        description: 'JSON parsing failed due to invalid response format'
      },

      // データ検証エラー
      {
        pattern: /validation.*failed|invalid.*event|missing.*required/i,
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.VALIDATION,
        isRetryable: false,
        recoveryAction: {
          type: 'skip',
          reason: 'Data validation failed - skip invalid entries'
        },
        description: 'Event data validation failed'
      },

      // キャッシュエラー
      {
        pattern: /cache.*error|storage.*full|quota.*exceeded.*storage/i,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.CACHE,
        isRetryable: false,
        recoveryAction: {
          type: 'fallback',
          reason: 'Cache operation failed - proceed without caching'
        },
        description: 'Cache operation failed'
      },

      // システムリソースエラー
      {
        pattern: /out.*of.*memory|memory.*limit|resource.*exhausted/i,
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.SYSTEM,
        isRetryable: false,
        recoveryAction: {
          type: 'fail',
          reason: 'System resource exhaustion - requires intervention'
        },
        description: 'System resource exhaustion'
      }
    ];
  }

  private initializeRecoveryStrategies(): void {
    // Stage別のフォールバック戦略
    this.recoveryStrategies.set('stage-1-fallback', {
      type: 'fallback',
      fallbackData: [], // 空の配列でも処理は継続
      reason: 'Stage 1 fallback - use cached data or skip'
    });

    this.recoveryStrategies.set('stage-2-fallback', {
      type: 'retry',
      delay: 30000,
      maxAttempts: 1,
      reason: 'Stage 2 fallback - retry once with reduced scope'
    });

    this.recoveryStrategies.set('stage-3-fallback', {
      type: 'skip',
      reason: 'Stage 3 fallback - skip category collection'
    });
  }

  public async handleError(
    error: Error,
    context: ErrorContext
  ): Promise<RecoveryAction> {
    // エラーを履歴に記録
    const collectionError = this.createCollectionError(error, context);
    this.errorHistory.push(collectionError);
    this.pruneErrorHistory();

    // エラーパターンマッチング
    const matchedPattern = this.matchErrorPattern(error.message);
    
    // サーキットブレーカーのチェック
    const circuitBreakerAction = this.checkCircuitBreaker(context.component, error);
    if (circuitBreakerAction) {
      console.log(`🔒 Circuit breaker activated for ${context.component}`);
      return circuitBreakerAction;
    }

    // 適切なリカバリアクションを決定
    let recoveryAction: RecoveryAction;

    if (matchedPattern) {
      recoveryAction = { ...matchedPattern.recoveryAction };
      console.log(`🔍 Error pattern matched: ${matchedPattern.description}`);
    } else {
      recoveryAction = this.getDefaultRecoveryAction(error, context);
      console.log(`❓ Unknown error pattern, using default recovery`);
    }

    // コンテキストに基づいた調整
    recoveryAction = this.adjustRecoveryForContext(recoveryAction, context);

    // サーキットブレーカーの状態更新
    this.updateCircuitBreaker(context.component, error, recoveryAction.type === 'retry');

    console.log(`🚨 Error handled: ${error.message}`);
    console.log(`💡 Recovery action: ${recoveryAction.type} - ${recoveryAction.reason}`);

    return recoveryAction;
  }

  private createCollectionError(error: Error, context: ErrorContext): CollectionError {
    const matchedPattern = this.matchErrorPattern(error.message);
    
    return {
      severity: matchedPattern?.severity || ErrorSeverity.MEDIUM,
      source: context.source || context.component,
      message: error.message,
      timestamp: new Date(),
      retryable: matchedPattern?.isRetryable ?? false
    };
  }

  private matchErrorPattern(errorMessage: string): ErrorPattern | null {
    return this.errorPatterns.find(pattern => 
      pattern.pattern.test(errorMessage)
    ) || null;
  }

  private getDefaultRecoveryAction(error: Error, context: ErrorContext): RecoveryAction {
    // デフォルトのリカバリ戦略
    if (context.stage === 1) {
      return {
        type: 'retry',
        delay: 10000,
        maxAttempts: 2,
        reason: 'Default retry for critical Stage 1'
      };
    }

    if (context.stage === 2) {
      return {
        type: 'skip',
        reason: 'Default skip for Stage 2 - not critical'
      };
    }

    return {
      type: 'skip',
      reason: 'Default skip for unknown error'
    };
  }

  private adjustRecoveryForContext(
    action: RecoveryAction, 
    context: ErrorContext
  ): RecoveryAction {
    const adjustedAction = { ...action };

    // 試行回数による調整
    if (context.attemptNumber && context.attemptNumber > 2) {
      // 3回以上失敗している場合は諦める
      adjustedAction.type = 'skip';
      adjustedAction.reason = `Too many attempts (${context.attemptNumber}) - giving up`;
    }

    // Stage別の重要度による調整
    if (context.stage === 1 && action.type === 'skip') {
      // Stage 1は重要なのでスキップをリトライに変更
      adjustedAction.type = 'retry';
      adjustedAction.delay = 15000;
      adjustedAction.maxAttempts = 1;
      adjustedAction.reason = 'Stage 1 is critical - retry once more';
    }

    // 時間帯による調整
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 6 && adjustedAction.delay) {
      // 深夜時間帯はリトライ間隔を短縮
      adjustedAction.delay = Math.max(adjustedAction.delay * 0.5, 1000);
      adjustedAction.reason += ' (reduced delay for off-peak hours)';
    }

    return adjustedAction;
  }

  // サーキットブレーカーパターン実装
  private checkCircuitBreaker(component: string, error: Error): RecoveryAction | null {
    const circuitBreaker = this.circuitBreakers.get(component);
    
    if (!circuitBreaker) {
      // 新しいサーキットブレーカーを作成
      this.circuitBreakers.set(component, new CircuitBreaker(component));
      return null;
    }

    if (circuitBreaker.isOpen()) {
      return {
        type: 'skip',
        reason: `Circuit breaker open for ${component} - too many recent failures`
      };
    }

    return null;
  }

  private updateCircuitBreaker(component: string, error: Error, willRetry: boolean): void {
    let circuitBreaker = this.circuitBreakers.get(component);
    
    if (!circuitBreaker) {
      circuitBreaker = new CircuitBreaker(component);
      this.circuitBreakers.set(component, circuitBreaker);
    }

    if (willRetry) {
      circuitBreaker.recordFailure();
    } else {
      circuitBreaker.recordSuccess(); // スキップも一種の「成功」として扱う
    }
  }

  // フォールバックデータ取得
  public async getFallbackData(context: ErrorContext): Promise<any> {
    console.log(`🔄 Getting fallback data for ${context.component}`);
    
    try {
      // キャッシュされたデータを試行
      const cachedData = await this.getCachedFallbackData(context);
      if (cachedData) {
        console.log('✅ Using cached fallback data');
        return cachedData;
      }

      // 静的フォールバックデータ
      const staticData = await this.getStaticFallbackData(context);
      if (staticData) {
        console.log('✅ Using static fallback data');
        return staticData;
      }

      console.log('⚠️ No fallback data available');
      return null;

    } catch (error) {
      console.error('❌ Fallback data retrieval failed:', error);
      return null;
    }
  }

  private async getCachedFallbackData(context: ErrorContext): Promise<any> {
    // キャッシュから過去のデータを取得
    try {
      // 実装時にはeventCacheから過去のデータを取得
      return null; // プレースホルダー
    } catch {
      return null;
    }
  }

  private async getStaticFallbackData(context: ErrorContext): Promise<any> {
    // 静的なフォールバックデータ（重要な年中行事など）
    if (context.stage === 1) {
      return [
        {
          id: 'fallback-001',
          title: '盛岡さんさ踊り',
          description: '盛岡の夏を彩る伝統的な祭り（フォールバックデータ）',
          date: '2024-08-01',
          locationName: '盛岡市中央通',
          latitude: 39.7036,
          longitude: 141.1527,
          category: '祭り'
        }
      ];
    }

    return [];
  }

  // エラー統計・分析機能
  public getErrorStatistics(): {
    totalErrors: number;
    errorsBySeverity: { [key in ErrorSeverity]: number };
    errorsByCategory: { [key in ErrorCategory]: number };
    topErrors: { message: string; count: number }[];
    recentTrends: {
      hourly: number[];
      daily: number[];
    };
  } {
    const now = new Date();
    const last24Hours = this.errorHistory.filter(
      error => now.getTime() - error.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    const errorsBySeverity = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };

    const errorsByCategory = {
      [ErrorCategory.NETWORK]: 0,
      [ErrorCategory.API]: 0,
      [ErrorCategory.DATA]: 0,
      [ErrorCategory.SYSTEM]: 0,
      [ErrorCategory.CACHE]: 0,
      [ErrorCategory.VALIDATION]: 0
    };

    // エラーメッセージの集計
    const errorMessages = new Map<string, number>();
    
    for (const error of last24Hours) {
      errorsBySeverity[error.severity as ErrorSeverity]++;
      
      // カテゴリは推定
      const pattern = this.matchErrorPattern(error.message);
      if (pattern) {
        errorsByCategory[pattern.category]++;
      }

      // メッセージのカウント
      const shortMessage = error.message.substring(0, 100);
      errorMessages.set(shortMessage, (errorMessages.get(shortMessage) || 0) + 1);
    }

    // トップエラーの計算
    const topErrors = Array.from(errorMessages.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));

    return {
      totalErrors: last24Hours.length,
      errorsBySeverity,
      errorsByCategory,
      topErrors,
      recentTrends: {
        hourly: this.calculateHourlyTrends(last24Hours),
        daily: this.calculateDailyTrends()
      }
    };
  }

  private calculateHourlyTrends(errors: CollectionError[]): number[] {
    const hourlyCount = new Array(24).fill(0);
    const now = new Date();

    for (const error of errors) {
      const hoursAgo = Math.floor((now.getTime() - error.timestamp.getTime()) / (60 * 60 * 1000));
      if (hoursAgo < 24) {
        hourlyCount[23 - hoursAgo]++;
      }
    }

    return hourlyCount;
  }

  private calculateDailyTrends(): number[] {
    // 過去7日間のエラー数
    const dailyCount = new Array(7).fill(0);
    const now = new Date();

    for (const error of this.errorHistory) {
      const daysAgo = Math.floor((now.getTime() - error.timestamp.getTime()) / (24 * 60 * 60 * 1000));
      if (daysAgo < 7) {
        dailyCount[6 - daysAgo]++;
      }
    }

    return dailyCount;
  }

  private pruneErrorHistory(): void {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7日間
    const cutoff = Date.now() - maxAge;
    
    this.errorHistory = this.errorHistory.filter(
      error => error.timestamp.getTime() > cutoff
    );
  }

  // ヘルスチェック
  public getHealthStatus(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
    circuitBreakerStatus: { component: string; isOpen: boolean; failureRate: number }[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 最近のエラー率をチェック
    const recentErrors = this.errorHistory.filter(
      error => Date.now() - error.timestamp.getTime() < 60 * 60 * 1000 // 1時間以内
    );

    const criticalErrors = recentErrors.filter(
      error => error.severity === ErrorSeverity.CRITICAL
    ).length;

    if (criticalErrors > 0) {
      issues.push(`${criticalErrors} critical errors in the last hour`);
      recommendations.push('Review critical errors and consider manual intervention');
    }

    const highErrors = recentErrors.filter(
      error => error.severity === ErrorSeverity.HIGH
    ).length;

    if (highErrors > 5) {
      issues.push(`${highErrors} high-severity errors in the last hour`);
      recommendations.push('Monitor error patterns and consider adjusting retry strategies');
    }

    // サーキットブレーカー状態
    const circuitBreakerStatus = Array.from(this.circuitBreakers.entries()).map(
      ([component, breaker]) => ({
        component,
        isOpen: breaker.isOpen(),
        failureRate: breaker.getFailureRate()
      })
    );

    const openBreakers = circuitBreakerStatus.filter(status => status.isOpen);
    if (openBreakers.length > 0) {
      issues.push(`${openBreakers.length} circuit breakers are open`);
      recommendations.push('Wait for circuit breakers to reset or investigate underlying issues');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations,
      circuitBreakerStatus
    };
  }
}

// サーキットブレーカー実装
class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  private readonly failureThreshold = 5;
  private readonly timeout = 60000; // 1分
  private readonly successThreshold = 2;

  constructor(private component: string) {}

  public recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      console.log(`🔒 Circuit breaker opened for ${this.component}`);
    }
  }

  public recordSuccess(): void {
    this.successCount++;
    
    if (this.state === 'half-open' && this.successCount >= this.successThreshold) {
      this.state = 'closed';
      this.failureCount = 0;
      this.successCount = 0;
      console.log(`✅ Circuit breaker closed for ${this.component}`);
    }
  }

  public isOpen(): boolean {
    if (this.state === 'open' && this.lastFailureTime) {
      const now = Date.now();
      if (now - this.lastFailureTime.getTime() > this.timeout) {
        this.state = 'half-open';
        console.log(`🔓 Circuit breaker half-open for ${this.component}`);
        return false;
      }
    }
    
    return this.state === 'open';
  }

  public getFailureRate(): number {
    const total = this.failureCount + this.successCount;
    return total > 0 ? this.failureCount / total : 0;
  }
}