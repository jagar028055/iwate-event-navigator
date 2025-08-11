// 定期更新システムの型定義

export enum ScheduleFrequency {
  DAILY = 'daily',
  ALTERNATE_DAYS = 'alternate_days',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying'
}

export enum JobPriority {
  URGENT = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4
}

export interface ScheduledJob {
  id: string;
  name: string;
  type: 'collection' | 'maintenance' | 'cleanup';
  schedule: CronSchedule;
  collectionRequest?: any; // CollectionRequest from main types
  priority: JobPriority;
  status: JobStatus;
  createdAt: Date;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  lastRunAt?: Date;
  nextRunAt?: Date;
  retryCount: number;
  maxRetries: number;
  timeout: number; // milliseconds
  config: JobConfig;
  results?: JobResult[];
}

export interface CronSchedule {
  pattern: string; // cron pattern (e.g., "0 6 * * *")
  timezone?: string;
  enabled: boolean;
}

export interface JobConfig {
  enableRetry: boolean;
  retryDelay: number; // milliseconds
  enableNotification: boolean;
  enableLogging: boolean;
  resourceLimits: {
    maxMemory: number; // MB
    maxDuration: number; // milliseconds
    maxApiCalls: number;
  };
}

export interface JobResult {
  jobId: string;
  executionId: string;
  status: JobStatus;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  eventsCollected?: number;
  apiCallsUsed?: number;
  cacheHitRate?: number;
  errorCount: number;
  errors?: string[];
  memoryUsage?: number; // MB
  successMetrics?: {
    newEvents: number;
    updatedEvents: number;
    duplicatesRemoved: number;
  };
}

export interface SchedulerConfig {
  maxConcurrentJobs: number;
  defaultJobTimeout: number;
  retryDelayBase: number;
  healthCheckInterval: number;
  cleanupInterval: number;
  maxJobHistory: number;
  enablePersistence: boolean;
  persistenceKey: string;
}

export interface SchedulerStatistics {
  totalJobsScheduled: number;
  totalJobsCompleted: number;
  totalJobsFailed: number;
  successRate: number;
  averageExecutionTime: number;
  lastSuccessfulRun: Date | null;
  currentlyRunning: number;
  queueLength: number;
  uptime: number; // milliseconds
  resourceUsage: {
    memoryUsage: number;
    cpuUsage?: number;
    apiCallsToday: number;
  };
}

export interface UpdatePattern {
  name: string;
  description: string;
  schedule: CronSchedule;
  stages: number[]; // CollectionStage values
  priority: JobPriority;
  config: JobConfig;
}

// 定期更新パターンの定義
export const UPDATE_PATTERNS: { [key: string]: UpdatePattern } = {
  'daily-fresh': {
    name: '毎日新着イベント取得',
    description: '毎朝6時に新規イベント情報を取得',
    schedule: {
      pattern: '0 6 * * *', // 毎日6:00
      timezone: 'Asia/Tokyo',
      enabled: true
    },
    stages: [1], // Stage 1のみ
    priority: JobPriority.HIGH,
    config: {
      enableRetry: true,
      retryDelay: 300000, // 5分
      enableNotification: true,
      enableLogging: true,
      resourceLimits: {
        maxMemory: 256,
        maxDuration: 600000, // 10分
        maxApiCalls: 10
      }
    }
  },
  
  'municipal-rotation': {
    name: '市町村ローテーション収集',
    description: '隔日2時に市町村別イベント収集',
    schedule: {
      pattern: '0 2 */2 * *', // 隔日2:00
      timezone: 'Asia/Tokyo',
      enabled: true
    },
    stages: [2], // Stage 2のみ
    priority: JobPriority.MEDIUM,
    config: {
      enableRetry: true,
      retryDelay: 600000, // 10分
      enableNotification: false,
      enableLogging: true,
      resourceLimits: {
        maxMemory: 512,
        maxDuration: 1800000, // 30分
        maxApiCalls: 15
      }
    }
  },

  'category-deep-dive': {
    name: 'カテゴリ特化収集',
    description: '週2回（水・土）夜間にカテゴリ特化収集',
    schedule: {
      pattern: '0 1 * * 3,6', // 水曜・土曜1:00
      timezone: 'Asia/Tokyo',
      enabled: true
    },
    stages: [3], // Stage 3のみ
    priority: JobPriority.MEDIUM,
    config: {
      enableRetry: true,
      retryDelay: 900000, // 15分
      enableNotification: false,
      enableLogging: true,
      resourceLimits: {
        maxMemory: 384,
        maxDuration: 2400000, // 40分
        maxApiCalls: 8
      }
    }
  },

  'weekly-full-update': {
    name: '週次全件更新',
    description: '日曜深夜に全Stage統合実行',
    schedule: {
      pattern: '0 1 * * 0', // 日曜1:00
      timezone: 'Asia/Tokyo',
      enabled: true
    },
    stages: [1, 2, 3], // 全Stage
    priority: JobPriority.LOW,
    config: {
      enableRetry: true,
      retryDelay: 1800000, // 30分
      enableNotification: true,
      enableLogging: true,
      resourceLimits: {
        maxMemory: 1024,
        maxDuration: 7200000, // 2時間
        maxApiCalls: 50
      }
    }
  },

  'maintenance': {
    name: 'システムメンテナンス',
    description: '月1回システム最適化実行',
    schedule: {
      pattern: '0 0 1 * *', // 毎月1日0:00
      timezone: 'Asia/Tokyo',
      enabled: true
    },
    stages: [], // 収集なし
    priority: JobPriority.LOW,
    config: {
      enableRetry: false,
      retryDelay: 0,
      enableNotification: true,
      enableLogging: true,
      resourceLimits: {
        maxMemory: 256,
        maxDuration: 3600000, // 1時間
        maxApiCalls: 0
      }
    }
  }
};

export interface MaintenanceTask {
  name: string;
  description: string;
  action: 'cache_cleanup' | 'log_rotation' | 'statistics_archive' | 'health_check';
  schedule: CronSchedule;
}

export const MAINTENANCE_TASKS: MaintenanceTask[] = [
  {
    name: 'キャッシュクリーンアップ',
    description: '期限切れキャッシュデータの削除',
    action: 'cache_cleanup',
    schedule: {
      pattern: '0 3 * * *', // 毎日3:00
      timezone: 'Asia/Tokyo',
      enabled: true
    }
  },
  {
    name: 'ログローテーション',
    description: '古いログファイルのアーカイブ',
    action: 'log_rotation',
    schedule: {
      pattern: '0 4 * * 0', // 日曜4:00
      timezone: 'Asia/Tokyo',
      enabled: true
    }
  },
  {
    name: '統計データアーカイブ',
    description: '統計データの月次アーカイブ',
    action: 'statistics_archive',
    schedule: {
      pattern: '0 5 1 * *', // 毎月1日5:00
      timezone: 'Asia/Tokyo',
      enabled: true
    }
  },
  {
    name: 'ヘルスチェック',
    description: 'システムヘルスチェック実行',
    action: 'health_check',
    schedule: {
      pattern: '*/30 * * * *', // 30分毎
      timezone: 'Asia/Tokyo',
      enabled: true
    }
  }
];

// エラー処理関連
export interface SchedulerError {
  id: string;
  jobId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  timestamp: Date;
  retryable: boolean;
  metadata?: Record<string, any>;
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitterEnabled: boolean;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  baseDelay: 60000, // 1分
  maxDelay: 1800000, // 30分
  backoffMultiplier: 2,
  jitterEnabled: true
};