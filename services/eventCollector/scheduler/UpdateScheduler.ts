import { 
  ScheduledJob, 
  JobStatus, 
  JobResult, 
  SchedulerConfig, 
  SchedulerStatistics,
  UPDATE_PATTERNS,
  MAINTENANCE_TASKS,
  SchedulerError,
  RetryPolicy,
  DEFAULT_RETRY_POLICY
} from './types';
import { CollectorManager } from '../CollectorManager';
import { eventCache } from '../cache/EventCache';
import { JobQueue } from './JobQueue';

export class UpdateScheduler {
  private config: SchedulerConfig;
  private isRunning = false;
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private runningJobs: Map<string, ScheduledJob> = new Map();
  private jobQueue: JobQueue;
  private collectorManager: CollectorManager;
  private statistics: SchedulerStatistics;
  private startTime: Date = new Date();
  private intervals: NodeJS.Timeout[] = [];
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(
    collectorManager: CollectorManager,
    config?: Partial<SchedulerConfig>
  ) {
    this.collectorManager = collectorManager;
    this.config = {
      maxConcurrentJobs: 2,
      defaultJobTimeout: 600000, // 10分
      retryDelayBase: 60000, // 1分
      healthCheckInterval: 300000, // 5分
      cleanupInterval: 3600000, // 1時間
      maxJobHistory: 100,
      enablePersistence: true,
      persistenceKey: 'iwate-scheduler-state',
      ...config
    };

    this.jobQueue = new JobQueue(this.config.maxConcurrentJobs);
    this.statistics = this.initializeStatistics();
    
    console.log('UpdateScheduler initialized with config:', this.config);
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('UpdateScheduler is already running');
      return;
    }

    console.log('🚀 Starting UpdateScheduler...');
    this.isRunning = true;
    this.startTime = new Date();

    // Load persisted state
    await this.loadState();

    // Initialize default scheduled jobs
    this.initializeDefaultJobs();

    // Start job scheduling
    this.startJobScheduling();

    // Start maintenance tasks
    this.startMaintenanceTasks();

    // Start health check
    this.startHealthCheck();

    console.log('✅ UpdateScheduler started successfully');
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('🛑 Stopping UpdateScheduler...');
    this.isRunning = false;

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Cancel running jobs
    for (const [jobId, job] of this.runningJobs) {
      await this.cancelJob(jobId, 'Scheduler shutdown');
    }

    // Save current state
    await this.saveState();

    console.log('✅ UpdateScheduler stopped');
  }

  public async scheduleJob(job: Partial<ScheduledJob>): Promise<string> {
    const jobId = crypto.randomUUID();
    const scheduledJob: ScheduledJob = {
      id: jobId,
      name: job.name || `Job-${jobId.substring(0, 8)}`,
      type: job.type || 'collection',
      schedule: job.schedule || { pattern: '0 6 * * *', enabled: true },
      collectionRequest: job.collectionRequest,
      priority: job.priority || 3,
      status: JobStatus.PENDING,
      createdAt: new Date(),
      scheduledAt: job.scheduledAt || new Date(),
      retryCount: 0,
      maxRetries: job.maxRetries || 3,
      timeout: job.timeout || this.config.defaultJobTimeout,
      config: job.config || this.getDefaultJobConfig(),
      results: []
    };

    // Calculate next run time
    scheduledJob.nextRunAt = this.calculateNextRun(scheduledJob.schedule.pattern);

    this.scheduledJobs.set(jobId, scheduledJob);
    this.statistics.totalJobsScheduled++;

    console.log(`📅 Job scheduled: ${scheduledJob.name} (${jobId})`);
    console.log(`   Next run: ${scheduledJob.nextRunAt?.toISOString()}`);

    // Save state
    await this.saveState();

    return jobId;
  }

  public async executeJob(jobId: string): Promise<JobResult> {
    const job = this.scheduledJobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (this.runningJobs.has(jobId)) {
      throw new Error(`Job is already running: ${jobId}`);
    }

    const executionId = crypto.randomUUID();
    const startTime = new Date();

    console.log(`▶️ Executing job: ${job.name} (${jobId})`);

    try {
      // Update job status
      job.status = JobStatus.RUNNING;
      job.startedAt = startTime;
      this.runningJobs.set(jobId, job);

      // Execute based on job type
      let result: JobResult;
      
      if (job.type === 'collection') {
        result = await this.executeCollectionJob(job, executionId);
      } else if (job.type === 'maintenance') {
        result = await this.executeMaintenanceJob(job, executionId);
      } else {
        result = await this.executeCleanupJob(job, executionId);
      }

      // Update statistics
      this.statistics.totalJobsCompleted++;
      this.statistics.lastSuccessfulRun = new Date();
      
      // Update job status
      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date();
      job.lastRunAt = new Date();
      job.nextRunAt = this.calculateNextRun(job.schedule.pattern);
      job.retryCount = 0; // Reset retry count on success

      // Add result to job history
      job.results = job.results || [];
      job.results.push(result);

      // Limit job history
      if (job.results.length > this.config.maxJobHistory) {
        job.results = job.results.slice(-this.config.maxJobHistory);
      }

      console.log(`✅ Job completed: ${job.name} - ${result.eventsCollected} events collected`);

      return result;

    } catch (error) {
      console.error(`❌ Job failed: ${job.name}`, error);

      const failedResult: JobResult = {
        jobId,
        executionId,
        status: JobStatus.FAILED,
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        errorCount: 1,
        errors: [error instanceof Error ? error.message : String(error)]
      };

      // Handle retry logic
      const shouldRetry = job.retryCount < job.maxRetries && 
                         job.config.enableRetry &&
                         this.isRetryableError(error);

      if (shouldRetry) {
        job.status = JobStatus.RETRYING;
        job.retryCount++;
        
        // Schedule retry with exponential backoff
        const retryDelay = this.calculateRetryDelay(job.retryCount);
        job.nextRunAt = new Date(Date.now() + retryDelay);

        console.log(`🔄 Scheduling retry ${job.retryCount}/${job.maxRetries} in ${retryDelay/1000}s`);
      } else {
        job.status = JobStatus.FAILED;
        job.completedAt = new Date();
        job.nextRunAt = this.calculateNextRun(job.schedule.pattern);
        this.statistics.totalJobsFailed++;
      }

      job.results = job.results || [];
      job.results.push(failedResult);

      return failedResult;

    } finally {
      this.runningJobs.delete(jobId);
      this.updateStatistics();
      await this.saveState();
    }
  }

  private async executeCollectionJob(job: ScheduledJob, executionId: string): Promise<JobResult> {
    const startTime = new Date();

    if (!job.collectionRequest) {
      throw new Error('Collection request is required for collection job');
    }

    const result = await this.collectorManager.executeCollection(
      job.collectionRequest,
      {
        requestId: executionId,
        startTime,
        rateLimits: {
          geminiApiCalls: job.config.resourceLimits.maxApiCalls,
          maxConcurrentRequests: 1
        },
        cacheStrategy: {
          useCache: true,
          ttl: 3600000 // 1 hour
        }
      }
    );

    return {
      jobId: job.id,
      executionId,
      status: JobStatus.COMPLETED,
      startTime,
      endTime: new Date(),
      duration: Date.now() - startTime.getTime(),
      eventsCollected: result.totalEvents.length,
      apiCallsUsed: result.executionSummary.totalApiCalls,
      errorCount: result.executionSummary.errorCount,
      errors: result.stageResults.flatMap(stage => stage.errors.map(e => e.message)),
      successMetrics: {
        newEvents: result.totalEvents.length,
        updatedEvents: 0,
        duplicatesRemoved: result.dedupeSummary.duplicatesRemoved
      }
    };
  }

  private async executeMaintenanceJob(job: ScheduledJob, executionId: string): Promise<JobResult> {
    const startTime = new Date();
    let tasksCompleted = 0;

    try {
      // Cache cleanup
      await eventCache.clear();
      tasksCompleted++;

      // Cleanup old job results
      for (const [jobId, scheduledJob] of this.scheduledJobs) {
        if (scheduledJob.results && scheduledJob.results.length > this.config.maxJobHistory) {
          scheduledJob.results = scheduledJob.results.slice(-this.config.maxJobHistory);
        }
      }
      tasksCompleted++;

      // Update statistics
      this.updateStatistics();
      tasksCompleted++;

      return {
        jobId: job.id,
        executionId,
        status: JobStatus.COMPLETED,
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        errorCount: 0,
        successMetrics: {
          newEvents: 0,
          updatedEvents: 0,
          duplicatesRemoved: 0
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Maintenance job failed after ${tasksCompleted} tasks: ${errorMessage}`);
    }
  }

  private async executeCleanupJob(job: ScheduledJob, executionId: string): Promise<JobResult> {
    const startTime = new Date();

    // Implement cleanup logic here
    // This is a placeholder for future cleanup tasks

    return {
      jobId: job.id,
      executionId,
      status: JobStatus.COMPLETED,
      startTime,
      endTime: new Date(),
      duration: Date.now() - startTime.getTime(),
      errorCount: 0
    };
  }

  private initializeDefaultJobs(): void {
    console.log('📋 Initializing default scheduled jobs...');

    for (const [patternKey, pattern] of Object.entries(UPDATE_PATTERNS)) {
      if (!pattern.schedule.enabled) continue;

      const collectionRequest = {
        stages: pattern.stages,
        priority: 'medium',
        targetEventCount: pattern.stages.length > 1 ? 300 : 50
      };

      this.scheduleJob({
        name: pattern.name,
        type: 'collection',
        schedule: pattern.schedule,
        priority: pattern.priority,
        collectionRequest,
        config: pattern.config,
        maxRetries: pattern.config.enableRetry ? 3 : 0
      });
    }

    console.log(`✅ Initialized ${Object.keys(UPDATE_PATTERNS).length} default jobs`);
  }

  private startJobScheduling(): void {
    const checkInterval = setInterval(() => {
      if (!this.isRunning) return;

      const now = new Date();
      
      for (const [jobId, job] of this.scheduledJobs) {
        if (!job.schedule.enabled) continue;
        if (this.runningJobs.has(jobId)) continue;
        if (job.status === JobStatus.RUNNING) continue;

        // Check if job should run
        if (job.nextRunAt && job.nextRunAt <= now) {
          // Add to job queue
          this.jobQueue.enqueue({
            id: jobId,
            priority: job.priority,
            execute: () => this.executeJob(jobId)
          });
        }
      }
    }, 60000); // Check every minute

    this.intervals.push(checkInterval);
    console.log('⏰ Job scheduling started');
  }

  private startMaintenanceTasks(): void {
    // Placeholder for maintenance task scheduling
    // This would implement the MAINTENANCE_TASKS patterns
    console.log('🔧 Maintenance tasks initialized');
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    console.log('💖 Health check started');
  }

  private performHealthCheck(): void {
    // Update runtime statistics
    this.updateStatistics();

    // Check for stuck jobs
    const stuckJobThreshold = this.config.defaultJobTimeout * 2;
    const now = Date.now();

    for (const [jobId, job] of this.runningJobs) {
      if (job.startedAt && now - job.startedAt.getTime() > stuckJobThreshold) {
        console.warn(`⚠️ Detected stuck job: ${job.name} (${jobId})`);
        // Could implement job cancellation here
      }
    }
  }

  private updateStatistics(): void {
    const totalJobs = this.statistics.totalJobsCompleted + this.statistics.totalJobsFailed;
    
    this.statistics.successRate = totalJobs > 0 
      ? this.statistics.totalJobsCompleted / totalJobs 
      : 0;
    
    this.statistics.currentlyRunning = this.runningJobs.size;
    this.statistics.queueLength = this.jobQueue.getQueueLength();
    this.statistics.uptime = Date.now() - this.startTime.getTime();
    
    // Update resource usage (simplified)
    this.statistics.resourceUsage = {
      memoryUsage: this.getMemoryUsage(),
      apiCallsToday: this.calculateTodaysApiCalls()
    };
  }

  private calculateNextRun(cronPattern: string): Date {
    // Simplified cron parsing - in a real implementation, use a proper cron library
    const now = new Date();
    const nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default: 24 hours from now
    
    // TODO: Implement proper cron pattern parsing
    // For now, return a simple next day schedule
    
    return nextRun;
  }

  private calculateRetryDelay(retryCount: number, policy: RetryPolicy = DEFAULT_RETRY_POLICY): number {
    const baseDelay = policy.baseDelay;
    const maxDelay = policy.maxDelay;
    const multiplier = policy.backoffMultiplier;
    
    let delay = baseDelay * Math.pow(multiplier, retryCount - 1);
    
    if (policy.jitterEnabled) {
      // Add random jitter (±25%)
      const jitter = delay * 0.25 * (Math.random() - 0.5) * 2;
      delay += jitter;
    }
    
    return Math.min(delay, maxDelay);
  }

  private isRetryableError(error: any): boolean {
    // Define which errors are retryable
    const retryableErrors = [
      'Network error',
      'Timeout',
      'Rate limit exceeded',
      'Temporary service unavailable'
    ];
    
    return retryableErrors.some(retryableError => 
      error.message?.includes(retryableError)
    );
  }

  private getDefaultJobConfig() {
    return {
      enableRetry: true,
      retryDelay: this.config.retryDelayBase,
      enableNotification: false,
      enableLogging: true,
      resourceLimits: {
        maxMemory: 256,
        maxDuration: this.config.defaultJobTimeout,
        maxApiCalls: 10
      }
    };
  }

  private async saveState(): Promise<void> {
    if (!this.config.enablePersistence) return;

    try {
      const state = {
        scheduledJobs: Array.from(this.scheduledJobs.entries()),
        statistics: this.statistics,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(this.config.persistenceKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save scheduler state:', error);
    }
  }

  private async loadState(): Promise<void> {
    if (!this.config.enablePersistence) return;

    try {
      const savedState = localStorage.getItem(this.config.persistenceKey);
      if (!savedState) return;

      const state = JSON.parse(savedState);
      
      // Restore scheduled jobs
      this.scheduledJobs = new Map(state.scheduledJobs.map(([id, job]: [string, any]) => [
        id,
        {
          ...job,
          createdAt: new Date(job.createdAt),
          scheduledAt: new Date(job.scheduledAt),
          startedAt: job.startedAt ? new Date(job.startedAt) : undefined,
          completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
          lastRunAt: job.lastRunAt ? new Date(job.lastRunAt) : undefined,
          nextRunAt: job.nextRunAt ? new Date(job.nextRunAt) : undefined
        }
      ]));

      // Restore statistics (partially)
      if (state.statistics) {
        this.statistics = {
          ...this.statistics,
          ...state.statistics,
          lastSuccessfulRun: state.statistics.lastSuccessfulRun 
            ? new Date(state.statistics.lastSuccessfulRun) 
            : null
        };
      }

      console.log(`📂 Restored ${this.scheduledJobs.size} scheduled jobs from state`);
    } catch (error) {
      console.warn('Failed to load scheduler state:', error);
    }
  }

  private getMemoryUsage(): number {
    // Simplified memory usage calculation
    return Math.round(Math.random() * 200 + 50); // Mock: 50-250 MB
  }

  private calculateTodaysApiCalls(): number {
    // Calculate API calls from today's job results
    const today = new Date().toDateString();
    let totalApiCalls = 0;

    for (const job of this.scheduledJobs.values()) {
      if (!job.results) continue;
      
      for (const result of job.results) {
        if (result.startTime.toDateString() === today) {
          totalApiCalls += result.apiCallsUsed || 0;
        }
      }
    }

    return totalApiCalls;
  }

  private initializeStatistics(): SchedulerStatistics {
    return {
      totalJobsScheduled: 0,
      totalJobsCompleted: 0,
      totalJobsFailed: 0,
      successRate: 0,
      averageExecutionTime: 0,
      lastSuccessfulRun: null,
      currentlyRunning: 0,
      queueLength: 0,
      uptime: 0,
      resourceUsage: {
        memoryUsage: 0,
        apiCallsToday: 0
      }
    };
  }

  private async cancelJob(jobId: string, reason: string): Promise<void> {
    const job = this.runningJobs.get(jobId);
    if (job) {
      job.status = JobStatus.CANCELLED;
      this.runningJobs.delete(jobId);
      console.log(`🚫 Job cancelled: ${job.name} - ${reason}`);
    }
  }

  // Public API methods
  public getStatistics(): SchedulerStatistics {
    this.updateStatistics();
    return { ...this.statistics };
  }

  public getScheduledJobs(): ScheduledJob[] {
    return Array.from(this.scheduledJobs.values());
  }

  public getRunningJobs(): ScheduledJob[] {
    return Array.from(this.runningJobs.values());
  }

  public async triggerJobNow(jobId: string): Promise<JobResult> {
    return await this.executeJob(jobId);
  }

  public async pauseJob(jobId: string): Promise<void> {
    const job = this.scheduledJobs.get(jobId);
    if (job) {
      job.schedule.enabled = false;
      await this.saveState();
      console.log(`⏸️ Job paused: ${job.name}`);
    }
  }

  public async resumeJob(jobId: string): Promise<void> {
    const job = this.scheduledJobs.get(jobId);
    if (job) {
      job.schedule.enabled = true;
      job.nextRunAt = this.calculateNextRun(job.schedule.pattern);
      await this.saveState();
      console.log(`▶️ Job resumed: ${job.name}`);
    }
  }
}