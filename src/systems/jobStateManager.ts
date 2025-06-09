// Job State Management System  
// Segregates jobs by state for efficient processing

import { globalEventBus, EventType, EventUtils } from './eventBus';
import type { MachineSlotJob } from '../types';

// Job readiness states for efficient queue management
export enum JobReadinessState {
  READY_TO_START = 'READY_TO_START',           // Can be assigned to machine immediately
  BLOCKED_BY_DEPENDENCIES = 'BLOCKED_BY_DEPENDENCIES', // Waiting for previous operations
  BLOCKED_BY_MATERIALS = 'BLOCKED_BY_MATERIALS',       // Missing required materials
  BLOCKED_BY_EQUIPMENT = 'BLOCKED_BY_EQUIPMENT',       // No suitable machines available
  IN_PROGRESS = 'IN_PROGRESS',                         // Currently running on machine
  COMPLETED = 'COMPLETED',                             // Finished successfully
  FAILED = 'FAILED',                                   // Failed and cannot continue
  CANCELLED = 'CANCELLED'                              // Cancelled by user
}

// Enhanced job tracking with blocking reasons
export interface JobStateInfo {
  job: MachineSlotJob;
  state: JobReadinessState;
  blockedReason?: string;
  lastEvaluated: number;
  dependsOn: Set<string>; // Job IDs this job depends on
  blocksJobs: Set<string>; // Job IDs that depend on this job
}

// Blocking reason categories for efficient filtering
export enum BlockingReason {
  DEPENDENCY = 'DEPENDENCY',     // Waiting for another job/operation
  MATERIAL = 'MATERIAL',         // Missing specific materials
  EQUIPMENT = 'EQUIPMENT',       // No suitable equipment available
  CAPACITY = 'CAPACITY'          // No available machine capacity
}

// Priority queue implementation for ready jobs
class PriorityQueue<T> {
  private items: Array<{item: T; priority: number}> = [];

  enqueue(item: T, priority: number): void {
    this.items.push({item, priority});
    this.items.sort((a, b) => b.priority - a.priority); // Higher priority first
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  peek(): T | undefined {
    return this.items[0]?.item;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }

  toArray(): T[] {
    return this.items.map(item => item.item);
  }
}

// Main job state manager
export class JobStateManager {
  // Segregated job queues for efficient processing
  private readyJobs: PriorityQueue<MachineSlotJob> = new PriorityQueue();
  private blockedJobs: Map<BlockingReason, Map<string, Set<string>>> = new Map();
  private activeJobs: Map<string, MachineSlotJob> = new Map();
  private completedJobs: Map<string, MachineSlotJob> = new Map();
  private jobStates: Map<string, JobStateInfo> = new Map();
  
  // Dependency tracking
  private dependencyGraph: Map<string, Set<string>> = new Map(); // jobId -> dependent jobIds
  private reverseDependencyGraph: Map<string, Set<string>> = new Map(); // jobId -> dependency jobIds

  constructor() {
    this.initializeEventHandlers();
    this.initializeBlockingReasonMaps();
  }

  private initializeEventHandlers(): void {
    // Listen for events that might unblock jobs
    globalEventBus.subscribe(EventType.OPERATION_COMPLETED, this.onOperationCompleted.bind(this));
    globalEventBus.subscribe(EventType.MATERIAL_ADDED, this.onMaterialAdded.bind(this));
    globalEventBus.subscribe(EventType.MACHINE_AVAILABLE, this.onMachineAvailable.bind(this));
    globalEventBus.subscribe(EventType.JOB_COMPLETED, this.onJobCompleted.bind(this));
    globalEventBus.subscribe(EventType.JOB_FAILED, this.onJobFailed.bind(this));
  }

  private initializeBlockingReasonMaps(): void {
    this.blockedJobs.set(BlockingReason.DEPENDENCY, new Map());
    this.blockedJobs.set(BlockingReason.MATERIAL, new Map());
    this.blockedJobs.set(BlockingReason.EQUIPMENT, new Map());
    this.blockedJobs.set(BlockingReason.CAPACITY, new Map());
  }

  /**
   * Add a new job to the management system
   */
  addJob(job: MachineSlotJob, dependencies: string[] = []): void {
    console.log(`JobStateManager: Adding job ${job.id} to management system`);
    
    const jobState: JobStateInfo = {
      job,
      state: JobReadinessState.BLOCKED_BY_DEPENDENCIES, // Start as blocked, will be evaluated
      lastEvaluated: Date.now(),
      dependsOn: new Set(dependencies),
      blocksJobs: new Set()
    };

    this.jobStates.set(job.id, jobState);
    
    // Set up dependency tracking
    for (const depId of dependencies) {
      if (!this.dependencyGraph.has(depId)) {
        this.dependencyGraph.set(depId, new Set());
      }
      this.dependencyGraph.get(depId)!.add(job.id);
      
      if (!this.reverseDependencyGraph.has(job.id)) {
        this.reverseDependencyGraph.set(job.id, new Set());
      }
      this.reverseDependencyGraph.get(job.id)!.add(depId);
    }

    // Emit job created event
    const eventEmitter = EventUtils.createJobEventEmitter(job.id, job.facilityId);
    eventEmitter.created({
      productId: job.productId,
      method: job.method,
      quantity: job.quantity
    });

    // Evaluate initial state
    this.evaluateJobState(job.id);
  }

  /**
   * Evaluate a job's current state and move it to appropriate queue
   */
  evaluateJobState(jobId: string): void {
    const jobState = this.jobStates.get(jobId);
    if (!jobState) {
      console.warn(`JobStateManager: Job ${jobId} not found for evaluation`);
      return;
    }

    const oldState = jobState.state;
    const newState = this.calculateJobState(jobState);
    
    if (oldState !== newState) {
      console.log(`JobStateManager: Job ${jobId} state changed: ${oldState} → ${newState}`);
      
      // Remove from old queue
      this.removeFromQueue(jobId, oldState);
      
      // Update state
      jobState.state = newState;
      jobState.lastEvaluated = Date.now();
      
      // Add to new queue
      this.addToQueue(jobState);
      
      // Emit state change event
      this.emitJobStateChange(jobId, oldState, newState);
    }
  }

  private calculateJobState(jobState: JobStateInfo): JobReadinessState {
    const { job, dependsOn } = jobState;
    
    // Check if already in terminal state
    if ([JobReadinessState.COMPLETED, JobReadinessState.FAILED, JobReadinessState.CANCELLED, JobReadinessState.IN_PROGRESS].includes(jobState.state)) {
      return jobState.state;
    }

    // Check dependencies first
    for (const depId of dependsOn) {
      const depState = this.jobStates.get(depId);
      if (!depState || depState.state !== JobReadinessState.COMPLETED) {
        jobState.blockedReason = `Waiting for job ${depId}`;
        return JobReadinessState.BLOCKED_BY_DEPENDENCIES;
      }
    }

    // Check sub-operation dependencies for Manufacturing v2 jobs
    if (job.subOperations && job.subOperations.size > 0) {
      const readySubOps = Array.from(job.subOperations.values()).filter(subOp => {
        // Check if previous operations are complete
        if (subOp.operationIndex > 0) {
          for (let i = 0; i < subOp.operationIndex; i++) {
            const prevSubOp = job.subOperations?.get(i);
            if (!prevSubOp || prevSubOp.state !== 'completed') {
              return false;
            }
          }
        }
        
        // Check if materials are available (simplified check)
        return subOp.state === 'pending' || subOp.state === 'queued';
      });

      if (readySubOps.length === 0) {
        jobState.blockedReason = 'No sub-operations ready to start';
        return JobReadinessState.BLOCKED_BY_DEPENDENCIES;
      }
    }

    // If we get here, job is ready to start
    jobState.blockedReason = undefined;
    return JobReadinessState.READY_TO_START;
  }

  private removeFromQueue(jobId: string, state: JobReadinessState): void {
    switch (state) {
      case JobReadinessState.READY_TO_START:
        // Remove from ready queue (need to implement removal by ID)
        const readyJobs = this.readyJobs.toArray();
        this.readyJobs.clear();
        readyJobs.filter(job => job.id !== jobId).forEach(job => {
          this.readyJobs.enqueue(job, this.getJobPriority(job));
        });
        break;
        
      case JobReadinessState.IN_PROGRESS:
        this.activeJobs.delete(jobId);
        break;
        
      case JobReadinessState.COMPLETED:
        this.completedJobs.delete(jobId);
        break;
        
      // For blocked states, we'd remove from the appropriate blocked queue
      // Implementation details depend on how we track blocking reasons
    }
  }

  private addToQueue(jobState: JobStateInfo): void {
    const { job, state } = jobState;
    
    switch (state) {
      case JobReadinessState.READY_TO_START:
        this.readyJobs.enqueue(job, this.getJobPriority(job));
        console.log(`JobStateManager: Job ${job.id} added to ready queue`);
        break;
        
      case JobReadinessState.IN_PROGRESS:
        this.activeJobs.set(job.id, job);
        break;
        
      case JobReadinessState.COMPLETED:
        this.completedJobs.set(job.id, job);
        break;
        
      case JobReadinessState.BLOCKED_BY_DEPENDENCIES:
      case JobReadinessState.BLOCKED_BY_MATERIALS:
      case JobReadinessState.BLOCKED_BY_EQUIPMENT:
        // Add to appropriate blocked queue
        // For now, just log the blocking
        console.log(`JobStateManager: Job ${job.id} blocked: ${jobState.blockedReason}`);
        break;
    }
  }

  private getJobPriority(job: MachineSlotJob): number {
    // Higher number = higher priority
    const priorityMap = {
      'high': 100,
      'normal': 50,
      'low': 10
    };
    
    const basePriority = priorityMap[job.priority] || 50;
    
    // Add rush order bonus
    const rushBonus = job.rushOrder ? 50 : 0;
    
    // Older jobs get slight priority boost
    const ageBonus = Math.max(0, (Date.now() - job.createdAt) / (1000 * 60 * 60)); // 1 point per hour
    
    return basePriority + rushBonus + ageBonus;
  }

  private emitJobStateChange(jobId: string, oldState: JobReadinessState, newState: JobReadinessState): void {
    globalEventBus.emit(EventType.FACILITY_STATE_CHANGED, {
      jobId,
      stateChange: {
        from: oldState,
        to: newState,
        timestamp: Date.now()
      }
    });
  }

  // Event handlers
  private onOperationCompleted(event: any): void {
    console.log(`JobStateManager: Operation completed for job ${event.data.jobId}`);
    
    // Re-evaluate the job that completed
    this.evaluateJobState(event.data.jobId);
    
    // Re-evaluate dependent jobs
    const dependentJobs = this.dependencyGraph.get(event.data.jobId);
    if (dependentJobs) {
      for (const depJobId of dependentJobs) {
        this.evaluateJobState(depJobId);
      }
    }
  }

  private onMaterialAdded(event: any): void {
    console.log(`JobStateManager: Material added - ${event.data.itemId}`);
    
    // Re-evaluate all jobs blocked by materials
    // In a full implementation, we'd track which jobs need which materials
    for (const [jobId, jobState] of this.jobStates) {
      if (jobState.state === JobReadinessState.BLOCKED_BY_MATERIALS) {
        this.evaluateJobState(jobId);
      }
    }
  }

  private onMachineAvailable(event: any): void {
    console.log(`JobStateManager: Machine available - ${event.data.machineId}`);
    
    // Re-evaluate jobs blocked by equipment
    for (const [jobId, jobState] of this.jobStates) {
      if (jobState.state === JobReadinessState.BLOCKED_BY_EQUIPMENT) {
        this.evaluateJobState(jobId);
      }
    }
  }

  private onJobCompleted(event: any): void {
    const jobId = event.data.jobId;
    console.log(`JobStateManager: Job completed - ${jobId}`);
    
    const jobState = this.jobStates.get(jobId);
    if (jobState) {
      jobState.state = JobReadinessState.COMPLETED;
      this.addToQueue(jobState);
      
      // Re-evaluate dependent jobs
      const dependentJobs = this.dependencyGraph.get(jobId);
      if (dependentJobs) {
        for (const depJobId of dependentJobs) {
          this.evaluateJobState(depJobId);
        }
      }
    }
  }

  private onJobFailed(event: any): void {
    const jobId = event.data.jobId;
    console.log(`JobStateManager: Job failed - ${jobId}`);
    
    const jobState = this.jobStates.get(jobId);
    if (jobState) {
      jobState.state = JobReadinessState.FAILED;
    }
  }

  // Public query methods
  
  /**
   * Get next ready job for assignment
   */
  getNextReadyJob(): MachineSlotJob | undefined {
    return this.readyJobs.dequeue();
  }

  /**
   * Get all ready jobs without removing them
   */
  getReadyJobs(): MachineSlotJob[] {
    return this.readyJobs.toArray();
  }

  /**
   * Get job state info
   */
  getJobState(jobId: string): JobStateInfo | undefined {
    return this.jobStates.get(jobId);
  }

  /**
   * Mark job as started (moved to active)
   */
  markJobStarted(jobId: string): void {
    const jobState = this.jobStates.get(jobId);
    if (jobState && jobState.state === JobReadinessState.READY_TO_START) {
      jobState.state = JobReadinessState.IN_PROGRESS;
      this.activeJobs.set(jobId, jobState.job);
      
      const eventEmitter = EventUtils.createJobEventEmitter(jobId, jobState.job.facilityId);
      eventEmitter.started();
    }
  }

  /**
   * Get all jobs in a specific state
   */
  getJobsByState(state: JobReadinessState): MachineSlotJob[] {
    return Array.from(this.jobStates.values())
      .filter(jobState => jobState.state === state)
      .map(jobState => jobState.job);
  }

  /**
   * Get all blocked jobs (any blocking reason)
   */
  getBlockedJobs(): MachineSlotJob[] {
    return Array.from(this.jobStates.values())
      .filter(jobState => jobState.state.startsWith('BLOCKED_'))
      .map(jobState => jobState.job);
  }

  /**
   * Get all job states for UI display
   */
  getAllJobStates(): JobStateInfo[] {
    return Array.from(this.jobStates.values());
  }

  /**
   * Get statistics for debugging
   */
  getStats(): {
    ready: number;
    active: number;
    completed: number;
    blocked: number;
    total: number;
  } {
    const blocked = Array.from(this.jobStates.values()).filter(
      js => js.state.startsWith('BLOCKED_')
    ).length;
    
    return {
      ready: this.readyJobs.size(),
      active: this.activeJobs.size,
      completed: this.completedJobs.size,
      blocked,
      total: this.jobStates.size
    };
  }
}

// Export singleton instance
export const globalJobStateManager = new JobStateManager();