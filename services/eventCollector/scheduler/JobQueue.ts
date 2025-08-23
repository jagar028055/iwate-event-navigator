import { JobPriority } from './types';

interface QueuedJob {
  id: string;
  priority: JobPriority;
  execute: () => Promise<any>;
  enqueueTime: Date;
  startTime?: Date;
  retries: number;
  maxRetries: number;
}

interface WorkerInfo {
  id: string;
  isIdle: boolean;
  currentJob: QueuedJob | undefined;
  totalJobsProcessed: number;
  startTime: Date;
}

export class JobQueue {
  private queue: QueuedJob[] = [];
  private workers: WorkerInfo[] = [];
  private maxConcurrency: number;
  private isProcessing = false;
  private statistics = {
    totalEnqueued: 0,
    totalProcessed: 0,
    totalFailed: 0,
    averageWaitTime: 0,
    averageProcessingTime: 0
  };

  constructor(maxConcurrency: number = 2) {
    this.maxConcurrency = maxConcurrency;
    this.initializeWorkers();
    console.log(`JobQueue initialized with ${maxConcurrency} workers`);
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.maxConcurrency; i++) {
      const worker: WorkerInfo = {
        id: `worker-${i + 1}`,
        isIdle: true,
        currentJob: undefined,
        totalJobsProcessed: 0,
        startTime: new Date()
      };
      this.workers.push(worker);
    }
  }

  public async enqueue(job: Omit<QueuedJob, 'enqueueTime' | 'retries' | 'maxRetries'>): Promise<void> {
    const queuedJob: QueuedJob = {
      ...job,
      enqueueTime: new Date(),
      retries: 0,
      maxRetries: 3
    };

    // Insert job in priority order (lower number = higher priority)
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority > queuedJob.priority) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, queuedJob);
    this.statistics.totalEnqueued++;

    console.log(`📥 Job enqueued: ${job.id} (Priority: ${job.priority}, Queue length: ${this.queue.length})`);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  private startProcessing(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    console.log('🔄 JobQueue processing started');

    // Start worker loops
    this.workers.forEach(worker => this.workerLoop(worker));
  }

  private async workerLoop(worker: WorkerInfo): Promise<void> {
    while (this.isProcessing) {
      if (this.queue.length === 0) {
        // No jobs to process, wait a bit
        await this.delay(1000);
        continue;
      }

      if (!worker.isIdle) {
        // Worker is busy, wait
        await this.delay(100);
        continue;
      }

      // Get next job from queue
      const job = this.queue.shift();
      if (!job) continue;

      // Assign job to worker
      worker.isIdle = false;
      worker.currentJob = job;
      job.startTime = new Date();

      console.log(`⚡ Worker ${worker.id} processing job: ${job.id}`);

      try {
        // Execute the job
        const result = await job.execute();
        
        // Job completed successfully
        this.onJobSuccess(worker, job, result);

      } catch (error) {
        // Job failed
        this.onJobFailure(worker, job, error);
      }

      // Free up the worker
      worker.isIdle = true;
      worker.currentJob = undefined;
      worker.totalJobsProcessed++;
    }
  }

  private onJobSuccess(worker: WorkerInfo, job: QueuedJob, result: any): void {
    const processingTime = job.startTime 
      ? Date.now() - job.startTime.getTime()
      : 0;
    
    const waitTime = Date.now() - job.enqueueTime.getTime();

    this.statistics.totalProcessed++;
    this.updateAverageWaitTime(waitTime);
    this.updateAverageProcessingTime(processingTime);

    console.log(`✅ Worker ${worker.id} completed job: ${job.id} in ${processingTime}ms`);
  }

  private async onJobFailure(worker: WorkerInfo, job: QueuedJob, error: any): Promise<void> {
    console.error(`❌ Worker ${worker.id} job failed: ${job.id}`, error);

    // Check if job should be retried
    if (job.retries < job.maxRetries) {
      job.retries++;
      
      // Add exponential backoff delay
      const retryDelay = Math.min(1000 * Math.pow(2, job.retries - 1), 30000);
      
      console.log(`🔄 Retrying job ${job.id} (attempt ${job.retries}/${job.maxRetries}) after ${retryDelay}ms`);
      
      // Re-enqueue after delay
      setTimeout(() => {
        this.queue.unshift(job); // Add to front for immediate processing
      }, retryDelay);

    } else {
      // Max retries reached, job failed permanently
      this.statistics.totalFailed++;
      console.error(`🚫 Job ${job.id} failed permanently after ${job.retries} retries`);
    }
  }

  private updateAverageWaitTime(waitTime: number): void {
    const totalProcessed = this.statistics.totalProcessed;
    this.statistics.averageWaitTime = 
      ((this.statistics.averageWaitTime * (totalProcessed - 1)) + waitTime) / totalProcessed;
  }

  private updateAverageProcessingTime(processingTime: number): void {
    const totalProcessed = this.statistics.totalProcessed;
    this.statistics.averageProcessingTime = 
      ((this.statistics.averageProcessingTime * (totalProcessed - 1)) + processingTime) / totalProcessed;
  }

  public stop(): void {
    if (!this.isProcessing) return;

    console.log('🛑 Stopping JobQueue...');
    this.isProcessing = false;

    // Wait for current jobs to complete
    const busyWorkers = this.workers.filter(w => !w.isIdle);
    if (busyWorkers.length > 0) {
      console.log(`⏳ Waiting for ${busyWorkers.length} workers to complete current jobs...`);
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public getQueueStatus() {
    const activeWorkers = this.workers.filter(w => !w.isIdle).length;
    const idleWorkers = this.workers.filter(w => w.isIdle).length;

    return {
      queueLength: this.queue.length,
      activeWorkers,
      idleWorkers,
      statistics: { ...this.statistics },
      workers: this.workers.map(w => ({ ...w }))
    };
  }

  public getQueuedJobs(): Array<{
    id: string;
    priority: JobPriority;
    enqueueTime: Date;
    waitTime: number;
  }> {
    const now = Date.now();
    return this.queue.map(job => ({
      id: job.id,
      priority: job.priority,
      enqueueTime: job.enqueueTime,
      waitTime: now - job.enqueueTime.getTime()
    }));
  }

  public getPriorityStats(): { [key in JobPriority]: number } {
    const stats: { [key in JobPriority]: number } = {
      [JobPriority.URGENT]: 0,
      [JobPriority.HIGH]: 0,
      [JobPriority.MEDIUM]: 0,
      [JobPriority.LOW]: 0
    };

    for (const job of this.queue) {
      stats[job.priority]++;
    }

    return stats;
  }

  public clearQueue(): number {
    const clearedCount = this.queue.length;
    this.queue = [];
    console.log(`🧹 Cleared ${clearedCount} jobs from queue`);
    return clearedCount;
  }

  public removeJob(jobId: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(job => job.id !== jobId);
    const removed = this.queue.length < initialLength;
    
    if (removed) {
      console.log(`🗑️ Removed job ${jobId} from queue`);
    }
    
    return removed;
  }

  public prioritizeJob(jobId: string): boolean {
    const jobIndex = this.queue.findIndex(job => job.id === jobId);
    if (jobIndex === -1) return false;

    // Move job to front of queue
    const job = this.queue.splice(jobIndex, 1)[0];
    job.priority = JobPriority.URGENT;
    this.queue.unshift(job);

    console.log(`⬆️ Prioritized job ${jobId} to front of queue`);
    return true;
  }

  public async waitForCompletion(timeoutMs: number = 60000): Promise<boolean> {
    const startTime = Date.now();

    while (this.queue.length > 0 || this.workers.some(w => !w.isIdle)) {
      if (Date.now() - startTime > timeoutMs) {
        console.warn('⏰ JobQueue wait timeout reached');
        return false;
      }
      
      await this.delay(100);
    }

    console.log('✅ All jobs completed');
    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check methods
  public isHealthy(): boolean {
    // Check if workers are responsive
    const stuckWorkers = this.workers.filter(worker => {
      if (!worker.currentJob || worker.isIdle) return false;
      
      const jobRunTime = worker.currentJob.startTime 
        ? Date.now() - worker.currentJob.startTime.getTime()
        : 0;
      
      // Consider a job stuck if it's been running for more than 30 minutes
      return jobRunTime > 30 * 60 * 1000;
    });

    if (stuckWorkers.length > 0) {
      console.warn(`⚠️ Detected ${stuckWorkers.length} stuck workers`);
      return false;
    }

    return true;
  }

  public getHealthStatus(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check queue length
    if (this.queue.length > 50) {
      issues.push('Queue length is high');
      recommendations.push('Consider increasing worker count or optimizing job execution');
    }

    // Check failure rate
    const totalJobs = this.statistics.totalProcessed + this.statistics.totalFailed;
    if (totalJobs > 0) {
      const failureRate = this.statistics.totalFailed / totalJobs;
      if (failureRate > 0.1) { // More than 10% failure rate
        issues.push('High job failure rate');
        recommendations.push('Review error handling and job retry logic');
      }
    }

    // Check average wait time
    if (this.statistics.averageWaitTime > 300000) { // More than 5 minutes
      issues.push('High average wait time');
      recommendations.push('Consider adding more workers or optimizing job priority');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations
    };
  }
}