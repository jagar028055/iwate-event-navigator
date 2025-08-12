import { SchedulerStatistics } from '../scheduler/types';
import { CacheStatistics } from '../types';
import { eventCache } from '../cache/EventCache';

export interface SystemMetrics {
  timestamp: Date;
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    successRate: number;
  };
  resources: {
    memoryUsage: number;
    cacheHitRate: number;
    apiCallsUsed: number;
    storageUsage: number;
  };
  scheduler: SchedulerStatistics | null;
  health: {
    score: number; // 0-100
    status: 'excellent' | 'good' | 'warning' | 'critical';
    issues: HealthIssue[];
  };
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'reliability' | 'resource' | 'data';
  message: string;
  recommendation: string;
  timestamp: Date;
}

export interface PerformanceAlert {
  id: string;
  type: 'threshold_exceeded' | 'anomaly_detected' | 'service_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export class PerformanceMonitor {
  private metrics: SystemMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private isRunning = false;
  private monitoringInterval?: NodeJS.Timeout | undefined;
  private alertHandlers: ((alert: PerformanceAlert) => void)[] = [];
  
  // パフォーマンス閾値設定
  private thresholds = {
    responseTime: 5000, // 5秒
    errorRate: 0.1, // 10%
    memoryUsage: 512, // 512MB
    cacheHitRate: 0.6, // 60%
    healthScore: 70 // 70点以下で警告
  };

  private performanceHistory: {
    responseTimes: number[];
    errorRates: number[];
    memoryUsages: number[];
  } = {
    responseTimes: [],
    errorRates: [],
    memoryUsages: []
  };

  constructor() {
    console.log('PerformanceMonitor initialized');
  }

  public start(intervalMs: number = 60000): void { // デフォルト1分間隔
    if (this.isRunning) {
      console.warn('PerformanceMonitor is already running');
      return;
    }

    console.log('📊 Starting performance monitoring...');
    this.isRunning = true;

    // 定期監視の開始
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    // 初回データ収集
    this.collectMetrics();

    console.log(`✅ Performance monitoring started (interval: ${intervalMs}ms)`);
  }

  public stop(): void {
    if (!this.isRunning) return;

    console.log('🛑 Stopping performance monitoring...');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined as NodeJS.Timeout | undefined;
    }

    this.isRunning = false;
    console.log('✅ Performance monitoring stopped');
  }

  private async collectMetrics(): Promise<void> {
    try {
      const timestamp = new Date();

      // パフォーマンス測定
      const performanceMetrics = await this.measurePerformance();
      
      // リソース使用量測定
      const resourceMetrics = await this.measureResources();
      
      // スケジューラー統計取得（利用可能な場合）
      const schedulerStats = this.getSchedulerStatistics();
      
      // ヘルススコア計算
      const healthAssessment = this.assessSystemHealth(
        performanceMetrics, 
        resourceMetrics, 
        schedulerStats
      );

      const metrics: SystemMetrics = {
        timestamp,
        performance: performanceMetrics,
        resources: resourceMetrics,
        scheduler: schedulerStats,
        health: healthAssessment
      };

      // メトリクスの保存
      this.metrics.push(metrics);
      this.pruneOldMetrics();

      // 履歴データの更新
      this.updatePerformanceHistory(metrics);

      // 閾値チェックとアラート生成
      this.checkThresholds(metrics);

      console.log(`📈 Metrics collected - Health: ${healthAssessment.score}/100 (${healthAssessment.status})`);

    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
  }

  private async measurePerformance(): Promise<SystemMetrics['performance']> {
    // 簡易的なパフォーマンス測定
    const startTime = performance.now();
    
    try {
      // キャッシュアクセス時間を測定
      await eventCache.get('test-key');
      const responseTime = performance.now() - startTime;

      // エラー率の計算（過去の実行結果から）
      const recentMetrics = this.metrics.slice(-10);
      const totalRequests = recentMetrics.length;
      const errors = recentMetrics.filter(m => m.health.score < 50).length;
      const errorRate = totalRequests > 0 ? errors / totalRequests : 0;
      const successRate = 1 - errorRate;

      // スループット計算（簡易）
      const throughput = totalRequests > 0 ? 1000 / (responseTime || 1) : 0;

      return {
        responseTime,
        throughput,
        errorRate,
        successRate
      };

    } catch (error) {
      return {
        responseTime: 9999,
        throughput: 0,
        errorRate: 1,
        successRate: 0
      };
    }
  }

  private async measureResources(): Promise<SystemMetrics['resources']> {
    // キャッシュ統計取得
    const cacheStats = eventCache.getStatistics();
    
    // メモリ使用量推定
    const memoryUsage = this.estimateMemoryUsage();
    
    // ストレージ使用量計算
    const storageUsage = this.calculateStorageUsage();

    // API呼び出し数（仮）
    const apiCallsUsed = this.getRecentApiCalls();

    return {
      memoryUsage,
      cacheHitRate: cacheStats.hitRate,
      apiCallsUsed,
      storageUsage
    };
  }

  private getSchedulerStatistics(): SchedulerStatistics | null {
    // スケジューラーが利用可能な場合は統計を取得
    // 現在は null を返すが、実装時にはスケジューラーインスタンスから取得
    return null;
  }

  private assessSystemHealth(
    performance: SystemMetrics['performance'],
    resources: SystemMetrics['resources'],
    scheduler: SchedulerStatistics | null
  ): SystemMetrics['health'] {
    const issues: HealthIssue[] = [];
    let score = 100;

    // パフォーマンス評価
    if (performance.responseTime > this.thresholds.responseTime) {
      score -= 20;
      issues.push({
        severity: 'high',
        category: 'performance',
        message: `Response time is high: ${performance.responseTime}ms`,
        recommendation: 'Consider optimizing cache strategies or reducing API calls',
        timestamp: new Date()
      });
    }

    if (performance.errorRate > this.thresholds.errorRate) {
      score -= 25;
      issues.push({
        severity: 'critical',
        category: 'reliability',
        message: `Error rate is high: ${(performance.errorRate * 100).toFixed(1)}%`,
        recommendation: 'Review error logs and implement better error handling',
        timestamp: new Date()
      });
    }

    // リソース評価
    if (resources.memoryUsage > this.thresholds.memoryUsage) {
      score -= 15;
      issues.push({
        severity: 'medium',
        category: 'resource',
        message: `Memory usage is high: ${resources.memoryUsage}MB`,
        recommendation: 'Clear caches or optimize memory usage',
        timestamp: new Date()
      });
    }

    if (resources.cacheHitRate < this.thresholds.cacheHitRate) {
      score -= 10;
      issues.push({
        severity: 'medium',
        category: 'performance',
        message: `Cache hit rate is low: ${(resources.cacheHitRate * 100).toFixed(1)}%`,
        recommendation: 'Review caching strategies and TTL settings',
        timestamp: new Date()
      });
    }

    // データ品質評価
    if (resources.apiCallsUsed > 100) { // 1日100回を超える場合
      score -= 5;
      issues.push({
        severity: 'low',
        category: 'resource',
        message: `API usage is high: ${resources.apiCallsUsed} calls`,
        recommendation: 'Monitor API usage and optimize call frequency',
        timestamp: new Date()
      });
    }

    // ヘルスステータス決定
    let status: SystemMetrics['health']['status'];
    if (score >= 90) status = 'excellent';
    else if (score >= 75) status = 'good';
    else if (score >= 60) status = 'warning';
    else status = 'critical';

    return { score: Math.max(0, score), status, issues };
  }

  private checkThresholds(metrics: SystemMetrics): void {
    const { performance, resources, health } = metrics;

    // レスポンス時間チェック
    if (performance.responseTime > this.thresholds.responseTime) {
      this.generateAlert('threshold_exceeded', 'high', 'responseTime', 
        performance.responseTime, this.thresholds.responseTime,
        `Response time exceeded threshold: ${performance.responseTime}ms > ${this.thresholds.responseTime}ms`
      );
    }

    // エラー率チェック
    if (performance.errorRate > this.thresholds.errorRate) {
      this.generateAlert('threshold_exceeded', 'critical', 'errorRate',
        performance.errorRate, this.thresholds.errorRate,
        `Error rate exceeded threshold: ${(performance.errorRate * 100).toFixed(1)}% > ${(this.thresholds.errorRate * 100)}%`
      );
    }

    // ヘルススコアチェック
    if (health.score < this.thresholds.healthScore) {
      this.generateAlert('service_degradation', 'medium', 'healthScore',
        health.score, this.thresholds.healthScore,
        `System health score below threshold: ${health.score} < ${this.thresholds.healthScore}`
      );
    }

    // 異常検知（統計的な変動）
    this.detectAnomalies(metrics);
  }

  private detectAnomalies(metrics: SystemMetrics): void {
    // 簡易的な異常検知（移動平均からの逸脱）
    const recentResponseTimes = this.performanceHistory.responseTimes.slice(-10);
    
    if (recentResponseTimes.length >= 5) {
      const average = recentResponseTimes.reduce((sum, time) => sum + time, 0) / recentResponseTimes.length;
      const variance = recentResponseTimes.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / recentResponseTimes.length;
      const standardDeviation = Math.sqrt(variance);

      // 現在値が平均から2標準偏差以上離れている場合は異常
      if (Math.abs(metrics.performance.responseTime - average) > 2 * standardDeviation) {
        this.generateAlert('anomaly_detected', 'medium', 'responseTime',
          metrics.performance.responseTime, average,
          `Response time anomaly detected: ${metrics.performance.responseTime}ms (avg: ${average.toFixed(1)}ms)`
        );
      }
    }
  }

  private generateAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    metric: string,
    value: number,
    threshold: number,
    message: string
  ): void {
    const alert: PerformanceAlert = {
      id: crypto.randomUUID(),
      type,
      severity,
      metric,
      value,
      threshold,
      message,
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.push(alert);
    this.pruneOldAlerts();

    console.warn(`🚨 Performance Alert (${severity}): ${message}`);

    // アラートハンドラーに通知
    this.alertHandlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        console.error('Error in alert handler:', error);
      }
    });
  }

  private updatePerformanceHistory(metrics: SystemMetrics): void {
    const maxHistoryLength = 100;

    // 履歴データを更新
    this.performanceHistory.responseTimes.push(metrics.performance.responseTime);
    this.performanceHistory.errorRates.push(metrics.performance.errorRate);
    this.performanceHistory.memoryUsages.push(metrics.resources.memoryUsage);

    // 履歴データの長さ制限
    if (this.performanceHistory.responseTimes.length > maxHistoryLength) {
      this.performanceHistory.responseTimes = this.performanceHistory.responseTimes.slice(-maxHistoryLength);
      this.performanceHistory.errorRates = this.performanceHistory.errorRates.slice(-maxHistoryLength);
      this.performanceHistory.memoryUsages = this.performanceHistory.memoryUsages.slice(-maxHistoryLength);
    }
  }

  private estimateMemoryUsage(): number {
    // メモリ使用量の推定（実際の実装では performance.memory API等を使用）
    const metricsSize = this.metrics.length * 1024; // 1KB per metric (rough estimate)
    const alertsSize = this.alerts.length * 512; // 0.5KB per alert
    const baseUsage = 50; // Base usage in MB
    
    return baseUsage + (metricsSize + alertsSize) / (1024 * 1024);
  }

  private calculateStorageUsage(): number {
    // ストレージ使用量の計算（LocalStorage + IndexedDB）
    let totalSize = 0;

    try {
      // LocalStorage使用量
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
    } catch (error) {
      // エラーは無視
    }

    return totalSize / (1024 * 1024); // MB単位で返す
  }

  private getRecentApiCalls(): number {
    // 直近のAPI呼び出し数を推定
    const recentMetrics = this.metrics.slice(-24); // 過去24時間分
    return recentMetrics.reduce((sum, metric) => {
      return sum + (metric.scheduler?.resourceUsage?.apiCallsToday || 0);
    }, 0);
  }

  private pruneOldMetrics(): void {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7日間
    const cutoff = Date.now() - maxAge;
    
    this.metrics = this.metrics.filter(metric => metric.timestamp.getTime() > cutoff);
  }

  private pruneOldAlerts(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24時間
    const cutoff = Date.now() - maxAge;
    
    this.alerts = this.alerts.filter(alert => alert.timestamp.getTime() > cutoff);
  }

  // Public API methods
  public getCurrentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  public getMetricsHistory(hours: number = 24): SystemMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp.getTime() > cutoff);
  }

  public getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  public getAllAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      console.log(`✅ Alert acknowledged: ${alertId}`);
      return true;
    }
    return false;
  }

  public addAlertHandler(handler: (alert: PerformanceAlert) => void): void {
    this.alertHandlers.push(handler);
  }

  public removeAlertHandler(handler: (alert: PerformanceAlert) => void): void {
    const index = this.alertHandlers.indexOf(handler);
    if (index > -1) {
      this.alertHandlers.splice(index, 1);
    }
  }

  public getPerformanceReport(): {
    summary: {
      averageResponseTime: number;
      averageHealthScore: number;
      totalAlerts: number;
      uptime: number;
    };
    trends: {
      responseTimesTrend: 'improving' | 'stable' | 'degrading';
      healthScoreTrend: 'improving' | 'stable' | 'degrading';
    };
    recommendations: string[];
  } {
    const recentMetrics = this.getMetricsHistory(24);
    
    if (recentMetrics.length === 0) {
      return {
        summary: { averageResponseTime: 0, averageHealthScore: 0, totalAlerts: 0, uptime: 0 },
        trends: { responseTimesTrend: 'stable', healthScoreTrend: 'stable' },
        recommendations: ['No data available for analysis']
      };
    }

    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.performance.responseTime, 0) / recentMetrics.length;
    const averageHealthScore = recentMetrics.reduce((sum, m) => sum + m.health.score, 0) / recentMetrics.length;
    const totalAlerts = this.alerts.length;
    const uptime = recentMetrics.length > 0 ? Date.now() - recentMetrics[0].timestamp.getTime() : 0;

    // トレンド分析
    const trends = this.analyzeTrends(recentMetrics);
    
    // 推奨事項生成
    const recommendations = this.generateRecommendations(recentMetrics);

    return {
      summary: {
        averageResponseTime,
        averageHealthScore,
        totalAlerts,
        uptime
      },
      trends,
      recommendations
    };
  }

  private analyzeTrends(metrics: SystemMetrics[]): {
    responseTimesTrend: 'improving' | 'stable' | 'degrading';
    healthScoreTrend: 'improving' | 'stable' | 'degrading';
  } {
    if (metrics.length < 2) {
      return { responseTimesTrend: 'stable', healthScoreTrend: 'stable' };
    }

    // 単純な線形回帰でトレンドを判定
    const responseTimes = metrics.map(m => m.performance.responseTime);
    const healthScores = metrics.map(m => m.health.score);

    const responseTimesTrend = this.calculateTrend(responseTimes);
    const healthScoreTrend = this.calculateTrend(healthScores);

    return {
      responseTimesTrend: responseTimesTrend > 0.1 ? 'degrading' : responseTimesTrend < -0.1 ? 'improving' : 'stable',
      healthScoreTrend: healthScoreTrend > 0.1 ? 'improving' : healthScoreTrend < -0.1 ? 'degrading' : 'stable'
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // 0² + 1² + 2² + ... + (n-1)²

    // 線形回帰の傾き
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private generateRecommendations(metrics: SystemMetrics[]): string[] {
    const recommendations: string[] = [];
    const currentMetric = metrics[metrics.length - 1];

    if (currentMetric.performance.responseTime > 3000) {
      recommendations.push('Response time is high. Consider optimizing API calls or implementing better caching.');
    }

    if (currentMetric.resources.cacheHitRate < 0.7) {
      recommendations.push('Cache hit rate is low. Review cache strategies and TTL settings.');
    }

    if (currentMetric.performance.errorRate > 0.05) {
      recommendations.push('Error rate is elevated. Review error logs and improve error handling.');
    }

    if (currentMetric.resources.memoryUsage > 300) {
      recommendations.push('Memory usage is high. Consider implementing memory optimization strategies.');
    }

    if (recommendations.length === 0) {
      recommendations.push('System performance is within acceptable ranges. Continue monitoring.');
    }

    return recommendations;
  }

  public setThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    console.log('Performance thresholds updated:', this.thresholds);
  }

  public isMonitoringActive(): boolean {
    return this.isRunning;
  }
}