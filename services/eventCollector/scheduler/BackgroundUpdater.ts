import { UpdateScheduler } from './UpdateScheduler';
import { CollectorManager } from '../CollectorManager';
import { enhancedEventService } from '../EnhancedEventService';
import { eventCache } from '../cache/EventCache';
import { SchedulerStatistics } from './types';

// Service Worker風のバックグラウンド更新機能（ブラウザ環境用）
export class BackgroundUpdater {
  private scheduler: UpdateScheduler;
  private isActive = false;
  private visibilityChangeHandler?: () => void;
  private pageLoadHandler?: () => void;
  private beforeUnloadHandler?: () => void;

  constructor(collectorManager: CollectorManager) {
    this.scheduler = new UpdateScheduler(collectorManager, {
      maxConcurrentJobs: 1, // バックグラウンドでは控えめに
      defaultJobTimeout: 900000, // 15分（長めに設定）
      enablePersistence: true,
      healthCheckInterval: 600000 // 10分毎ヘルスチェック
    });
    
    console.log('BackgroundUpdater initialized');
  }

  public async start(): Promise<void> {
    if (this.isActive) {
      console.warn('BackgroundUpdater is already active');
      return;
    }

    console.log('🌙 Starting BackgroundUpdater...');
    
    // スケジューラー開始
    await this.scheduler.start();
    
    // イベントリスナーの設定
    this.setupEventListeners();
    
    // 初期バックグラウンド更新の実行
    await this.performInitialUpdate();
    
    this.isActive = true;
    console.log('✅ BackgroundUpdater started');
  }

  public async stop(): Promise<void> {
    if (!this.isActive) return;

    console.log('🛑 Stopping BackgroundUpdater...');
    
    // スケジューラー停止
    await this.scheduler.stop();
    
    // イベントリスナーのクリーンアップ
    this.cleanupEventListeners();
    
    this.isActive = false;
    console.log('✅ BackgroundUpdater stopped');
  }

  private setupEventListeners(): void {
    // ページの可視性変更を監視
    this.visibilityChangeHandler = () => {
      if (document.visibilityState === 'visible') {
        this.onPageVisible();
      } else {
        this.onPageHidden();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    // ページロード時の処理
    this.pageLoadHandler = () => {
      this.onPageLoad();
    };
    window.addEventListener('load', this.pageLoadHandler);

    // ページアンロード前の処理
    this.beforeUnloadHandler = () => {
      this.onBeforeUnload();
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    console.log('📡 Event listeners registered');
  }

  private cleanupEventListeners(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
    
    if (this.pageLoadHandler) {
      window.removeEventListener('load', this.pageLoadHandler);
    }
    
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }

    console.log('🧹 Event listeners cleaned up');
  }

  private async onPageVisible(): Promise<void> {
    console.log('👁️ Page became visible - checking for updates...');
    
    try {
      // キャッシュの鮮度をチェック
      const cacheStats = eventCache.getStatistics();
      
      // 最後の更新から一定時間経過している場合は更新を実行
      const lastUpdateThreshold = 30 * 60 * 1000; // 30分
      const shouldUpdate = await this.shouldPerformUpdate(lastUpdateThreshold);
      
      if (shouldUpdate) {
        console.log('🔄 Triggering background update due to page visibility');
        await this.performSmartUpdate();
      } else {
        console.log('✅ Data is fresh, no update needed');
      }
    } catch (error) {
      console.error('Error during page visibility update:', error);
    }
  }

  private onPageHidden(): void {
    console.log('🙈 Page became hidden - optimizing background operations...');
    
    // ページが非表示になった時の処理
    // 必要に応じてスケジュールを調整
  }

  private async onPageLoad(): Promise<void> {
    console.log('📄 Page loaded - checking data freshness...');
    
    try {
      // ページロード時のスマート更新
      const shouldUpdate = await this.shouldPerformUpdate(5 * 60 * 1000); // 5分
      
      if (shouldUpdate) {
        // 非ブロッキングでバックグラウンド更新を実行
        this.performSmartUpdate().catch(error => {
          console.error('Background update on page load failed:', error);
        });
      }
    } catch (error) {
      console.error('Error during page load update check:', error);
    }
  }

  private onBeforeUnload(): void {
    console.log('👋 Page unloading - saving state...');
    
    // ページアンロード前にスケジューラーの状態を保存
    // この処理は同期的である必要がある
  }

  private async shouldPerformUpdate(thresholdMs: number): Promise<boolean> {
    try {
      // キャッシュから最後の更新時間を確認
      const cachedEvents = await eventCache.get('iwate-events-legacy');
      
      if (!cachedEvents || cachedEvents.length === 0) {
        console.log('📭 No cached events found, update needed');
        return true;
      }

      // 最新イベントの更新時間をチェック
      const latestUpdate = Math.max(
        ...cachedEvents.map(event => event.lastUpdated?.getTime() || 0)
      );
      
      const timeSinceUpdate = Date.now() - latestUpdate;
      const updateNeeded = timeSinceUpdate > thresholdMs;
      
      console.log(`⏰ Time since last update: ${Math.round(timeSinceUpdate / 60000)} minutes`);
      console.log(`🤔 Update needed: ${updateNeeded}`);
      
      return updateNeeded;
      
    } catch (error) {
      console.error('Error checking update necessity:', error);
      return true; // エラー時は更新を実行
    }
  }

  private async performInitialUpdate(): Promise<void> {
    console.log('🚀 Performing initial background update...');
    
    try {
      const shouldUpdate = await this.shouldPerformUpdate(60 * 60 * 1000); // 1時間
      
      if (shouldUpdate) {
        await this.performSmartUpdate();
      } else {
        console.log('✅ Initial update skipped - data is fresh');
      }
    } catch (error) {
      console.error('Initial background update failed:', error);
    }
  }

  private async performSmartUpdate(): Promise<void> {
    console.log('🧠 Starting smart background update...');
    
    try {
      // 現在の時刻に基づいて適切な更新戦略を選択
      const updateStrategy = this.selectUpdateStrategy();
      
      console.log(`📋 Selected update strategy: ${updateStrategy.name}`);
      
      // 選択された戦略でジョブをスケジュール
      const jobId = await this.scheduler.scheduleJob({
        name: `Smart Update - ${updateStrategy.name}`,
        type: 'collection',
        schedule: { pattern: '* * * * *', enabled: false }, // 即座に実行
        priority: updateStrategy.priority,
        collectionRequest: updateStrategy.collectionRequest,
        config: updateStrategy.config,
        scheduledAt: new Date() // 即座に実行
      });

      // ジョブを即座に実行
      const result = await this.scheduler.triggerJobNow(jobId);
      
      console.log(`✅ Smart update completed: ${result.eventsCollected} events collected`);
      
    } catch (error) {
      console.error('Smart background update failed:', error);
    }
  }

  private selectUpdateStrategy(): {
    name: string;
    priority: number;
    collectionRequest: any;
    config: any;
  } {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0=Sunday, 6=Saturday

    // 時間帯と曜日に基づいて戦略を選択
    if (hour >= 6 && hour <= 8) {
      // 朝の時間帯：新着イベント重点
      return {
        name: 'Morning Fresh Events',
        priority: 2,
        collectionRequest: {
          stages: [1], // Stage 1のみ
          priority: 'high',
          targetEventCount: 30
        },
        config: this.getLightweightJobConfig()
      };
    }

    if (hour >= 12 && hour <= 14) {
      // 昼の時間帯：地域イベント収集
      return {
        name: 'Lunch Regional Update',
        priority: 3,
        collectionRequest: {
          stages: [2], // Stage 2のみ
          priority: 'medium',
          targetEventCount: 50,
          regions: this.selectRandomRegions(2) // ランダムに2地域選択
        },
        config: this.getLightweightJobConfig()
      };
    }

    if ((dayOfWeek === 6 || dayOfWeek === 0) && hour >= 19) {
      // 週末の夜：カテゴリ特化収集
      return {
        name: 'Weekend Category Focus',
        priority: 3,
        collectionRequest: {
          stages: [3], // Stage 3のみ
          priority: 'medium',
          targetEventCount: 40,
          categories: ['festivals', 'food_events']
        },
        config: this.getStandardJobConfig()
      };
    }

    // デフォルト：軽量な新着チェック
    return {
      name: 'Default Light Update',
      priority: 4,
      collectionRequest: {
        stages: [1],
        priority: 'low',
        targetEventCount: 20
      },
      config: this.getLightweightJobConfig()
    };
  }

  private selectRandomRegions(count: number): string[] {
    const regions = ['kenou', 'kennan', 'engan', 'kenpoku'];
    const shuffled = [...regions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private getLightweightJobConfig() {
    return {
      enableRetry: true,
      retryDelay: 120000, // 2分
      enableNotification: false,
      enableLogging: true,
      resourceLimits: {
        maxMemory: 128,
        maxDuration: 300000, // 5分
        maxApiCalls: 5
      }
    };
  }

  private getStandardJobConfig() {
    return {
      enableRetry: true,
      retryDelay: 300000, // 5分
      enableNotification: false,
      enableLogging: true,
      resourceLimits: {
        maxMemory: 256,
        maxDuration: 600000, // 10分
        maxApiCalls: 10
      }
    };
  }

  // Public API methods
  public async triggerManualUpdate(): Promise<void> {
    console.log('🔧 Manual background update triggered');
    await this.performSmartUpdate();
  }

  public getSchedulerStatistics(): SchedulerStatistics {
    return this.scheduler.getStatistics();
  }

  public isRunning(): boolean {
    return this.isActive;
  }

  public async pauseUpdates(): Promise<void> {
    console.log('⏸️ Pausing background updates');
    
    // すべてのスケジュールされたジョブを一時停止
    const jobs = this.scheduler.getScheduledJobs();
    for (const job of jobs) {
      if (job.schedule.enabled) {
        await this.scheduler.pauseJob(job.id);
      }
    }
  }

  public async resumeUpdates(): Promise<void> {
    console.log('▶️ Resuming background updates');
    
    // すべてのジョブを再開
    const jobs = this.scheduler.getScheduledJobs();
    for (const job of jobs) {
      if (!job.schedule.enabled) {
        await this.scheduler.resumeJob(job.id);
      }
    }
  }

  public getStatus(): {
    isActive: boolean;
    schedulerStats: SchedulerStatistics;
    lastSmartUpdate: Date | null;
    nextScheduledUpdate: Date | null;
  } {
    const stats = this.scheduler.getStatistics();
    const jobs = this.scheduler.getScheduledJobs();
    const nextUpdate = jobs
      .filter(job => job.nextRunAt && job.schedule.enabled)
      .map(job => job.nextRunAt!)
      .sort((a, b) => a.getTime() - b.getTime())[0] || null;

    return {
      isActive: this.isActive,
      schedulerStats: stats,
      lastSmartUpdate: stats.lastSuccessfulRun,
      nextScheduledUpdate: nextUpdate
    };
  }
}

// グローバルインスタンス
let backgroundUpdaterInstance: BackgroundUpdater | null = null;

export const createBackgroundUpdater = (collectorManager: CollectorManager): BackgroundUpdater => {
  if (backgroundUpdaterInstance) {
    console.warn('BackgroundUpdater instance already exists');
    return backgroundUpdaterInstance;
  }

  backgroundUpdaterInstance = new BackgroundUpdater(collectorManager);
  return backgroundUpdaterInstance;
};

export const getBackgroundUpdater = (): BackgroundUpdater | null => {
  return backgroundUpdaterInstance;
};