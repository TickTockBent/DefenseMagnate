// Production Scheduler System - Manages job queues and equipment allocation

import { 
  ProductionJob, 
  ProductionQueue, 
  StepProgress,
  JobState, 
  StepState,
  compareJobPriority,
  calculateStepDuration,
  Equipment, 
  TagCategory,
  aggregateEquipmentTags,
  meetsTagRequirements,
  getEfficiencyPenalty,
  ManufacturingStep,
  Facility
} from '../types';

export class ProductionScheduler {
  private equipmentDefinitions: Map<string, Equipment>;
  
  constructor(equipmentDatabase: Map<string, Equipment>) {
    this.equipmentDefinitions = equipmentDatabase;
  }
  
  // Initialize production queue for a facility
  initializeQueue(facility: Facility): ProductionQueue {
    return {
      facilityId: facility.id,
      jobs: [],
      schedulingMode: 'priority',
      allowParallelMethods: true,
      equipmentAllocations: new Map(),
      workerAllocations: new Map(),
      completedJobsToday: 0,
      failedJobsToday: 0,
      averageCompletionTime: 0,
      bottleneckTracking: new Map()
    };
  }
  
  // Add a new job to the queue
  addJob(
    queue: ProductionQueue,
    job: Omit<ProductionJob, 'id' | 'state' | 'stepProgress' | 'reservedMaterials' | 'consumedMaterials' | 'laborCost' | 'materialCost' | 'equipmentCost'>
  ): ProductionJob {
    const newJob: ProductionJob = {
      ...job,
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      state: JobState.QUEUED,
      stepProgress: job.steps.map((step, index) => ({
        stepId: step.id,
        state: index === 0 ? StepState.WAITING : StepState.BLOCKED,
        progress: 0,
        qualityModifier: 1,
        failureRiskModifier: 0,
        failureCount: 0
      })),
      reservedMaterials: new Map(),
      consumedMaterials: new Map(),
      laborCost: 0,
      materialCost: 0,
      equipmentCost: 0
    };
    
    queue.jobs.push(newJob);
    this.sortQueue(queue);
    return newJob;
  }
  
  // Sort queue based on scheduling mode
  private sortQueue(queue: ProductionQueue): void {
    if (queue.schedulingMode === 'priority') {
      queue.jobs.sort(compareJobPriority);
    } else if (queue.schedulingMode === 'fifo') {
      queue.jobs.sort((a, b) => a.createdAt - b.createdAt);
    }
    // 'optimal' mode would use more complex logic
  }
  
  // Main scheduling tick - called each game update
  updateProductionQueue(
    queue: ProductionQueue,
    facility: Facility,
    currentTime: number,
    deltaTime: number
  ): void {
    // Update equipment capacity from facility
    facility.equipment_capacity = aggregateEquipmentTags(
      facility.equipment,
      this.equipmentDefinitions
    );
    
    // Process active jobs
    for (const job of queue.jobs) {
      if (job.state === JobState.IN_PROGRESS) {
        this.updateJobProgress(job, queue, facility, deltaTime);
      }
    }
    
    // Try to start waiting jobs/steps
    this.scheduleWaitingWork(queue, facility, currentTime);
    
    // Update bottleneck tracking
    this.updateBottleneckTracking(queue, facility);
  }
  
  // Update progress for active jobs
  private updateJobProgress(
    job: ProductionJob,
    queue: ProductionQueue,
    facility: Facility,
    deltaTime: number
  ): void {
    const currentStep = job.steps[job.currentStepIndex];
    const stepProgress = job.stepProgress[job.currentStepIndex];
    
    if (stepProgress.state !== StepState.IN_PROGRESS) return;
    
    // Calculate progress based on time and penalties
    const baseDuration = calculateStepDuration(currentStep, job.method.total_duration_hours);
    const timeMultiplier = this.calculateTimeMultiplier(stepProgress, currentStep, facility);
    const actualDuration = baseDuration * timeMultiplier;
    
    // Update progress
    const progressIncrement = (deltaTime / actualDuration) * 100;
    stepProgress.progress = Math.min(100, stepProgress.progress + progressIncrement);
    
    // Check if step is complete
    if (stepProgress.progress >= 100) {
      this.completeStep(job, queue, facility);
    }
  }
  
  // Calculate time multiplier based on equipment efficiency
  private calculateTimeMultiplier(
    stepProgress: StepProgress,
    step: ManufacturingStep,
    facility: Facility
  ): number {
    let worstMultiplier = 1.0;
    
    // Check each required tag
    for (const req of step.required_tags) {
      if (typeof req.minimum === 'number') {
        const available = facility.equipment_capacity.get(req.category) || 0;
        const ratio = available / (req.optimal || req.minimum);
        const penalty = getEfficiencyPenalty(ratio);
        worstMultiplier = Math.max(worstMultiplier, penalty.timeMultiplier);
        
        // Update quality and failure risk
        stepProgress.qualityModifier *= penalty.qualityMultiplier;
        stepProgress.failureRiskModifier += penalty.failureRiskIncrease;
      }
    }
    
    return worstMultiplier;
  }
  
  // Complete a step and move to next
  private completeStep(
    job: ProductionJob,
    queue: ProductionQueue,
    facility: Facility
  ): void {
    const stepProgress = job.stepProgress[job.currentStepIndex];
    const step = job.steps[job.currentStepIndex];
    
    // Check for failure
    const failureChance = (step.failure_chance + stepProgress.failureRiskModifier / 100);
    if (Math.random() < failureChance) {
      this.handleStepFailure(job, queue, facility);
      return;
    }
    
    // Mark step complete
    stepProgress.state = StepState.COMPLETED;
    
    // Release equipment
    this.releaseStepEquipment(job, queue, stepProgress);
    
    // Move to next step
    job.currentStepIndex++;
    
    if (job.currentStepIndex >= job.steps.length) {
      // Job complete!
      this.completeJob(job, queue, facility);
    } else {
      // Set next step to waiting
      job.stepProgress[job.currentStepIndex].state = StepState.WAITING;
    }
  }
  
  // Handle step failure
  private handleStepFailure(
    job: ProductionJob,
    queue: ProductionQueue,
    facility: Facility
  ): void {
    const stepProgress = job.stepProgress[job.currentStepIndex];
    const step = job.steps[job.currentStepIndex];
    
    stepProgress.failureCount++;
    stepProgress.lastFailureReason = `Failed at ${step.name}`;
    
    if (step.failure_result === 'scrap') {
      // Complete failure - job is cancelled
      job.state = JobState.FAILED;
      this.releaseAllJobResources(job, queue);
      queue.failedJobsToday++;
    } else if (step.failure_result === 'downgrade') {
      // Downgrade quality but continue
      job.finalQuality = (job.finalQuality || 100) * 0.7;
      stepProgress.state = StepState.COMPLETED;
      job.currentStepIndex++;
    } else {
      // Retry the step
      stepProgress.progress = 0;
      stepProgress.state = StepState.WAITING;
    }
  }
  
  // Complete a job
  private completeJob(
    job: ProductionJob,
    queue: ProductionQueue,
    facility: Facility
  ): void {
    job.state = JobState.COMPLETED;
    job.completedAt = Date.now(); // Would use game time
    
    // Calculate final quality
    let qualityModifier = 1.0;
    for (const progress of job.stepProgress) {
      qualityModifier *= progress.qualityModifier;
    }
    
    const baseQuality = (job.method.output_quality_range[0] + job.method.output_quality_range[1]) / 2;
    job.finalQuality = Math.max(
      job.method.output_quality_range[0],
      Math.min(job.method.output_quality_range[1], baseQuality * qualityModifier)
    );
    
    // Update facility storage with completed product
    const productKey = `${job.productId}_${job.method.output_state}`;
    facility.current_storage[productKey] = (facility.current_storage[productKey] || 0) + job.quantity;
    
    // Update queue stats
    queue.completedJobsToday++;
    const completionTime = (job.completedAt - job.createdAt) / 3600000; // Convert to hours
    queue.averageCompletionTime = 
      (queue.averageCompletionTime * (queue.completedJobsToday - 1) + completionTime) / 
      queue.completedJobsToday;
  }
  
  // Try to start waiting work
  private scheduleWaitingWork(
    queue: ProductionQueue,
    facility: Facility,
    currentTime: number
  ): void {
    // Get available resources
    const availableEquipment = this.getAvailableEquipment(facility, queue);
    const availableMaterials = new Map(Object.entries(facility.current_storage));
    const availableWorkers: string[] = []; // Simplified for now
    
    // Check each job for work that can start
    for (const job of queue.jobs) {
      if (job.state === JobState.CANCELLED || job.state === JobState.FAILED) continue;
      
      // Check if job can start
      if (job.state === JobState.QUEUED) {
        const canStart = this.tryStartJob(job, queue, facility, availableEquipment, availableMaterials);
        if (canStart) {
          job.state = JobState.IN_PROGRESS;
          job.startedAt = currentTime;
        }
      }
      
      // Check if current step can start
      if (job.state === JobState.IN_PROGRESS && job.currentStepIndex < job.steps.length) {
        const stepProgress = job.stepProgress[job.currentStepIndex];
        if (stepProgress.state === StepState.WAITING) {
          const canStart = this.tryStartStep(
            job, 
            job.currentStepIndex, 
            queue, 
            facility, 
            availableEquipment, 
            availableMaterials
          );
          
          if (canStart) {
            stepProgress.state = StepState.IN_PROGRESS;
            stepProgress.startTime = currentTime;
          }
        }
      }
    }
  }
  
  // Try to start a job
  private tryStartJob(
    job: ProductionJob,
    queue: ProductionQueue,
    facility: Facility,
    availableEquipment: Map<TagCategory, number>,
    availableMaterials: Map<string, number>
  ): boolean {
    // Check if first step can start
    return this.tryStartStep(job, 0, queue, facility, availableEquipment, availableMaterials);
  }
  
  // Try to start a specific step
  private tryStartStep(
    job: ProductionJob,
    stepIndex: number,
    queue: ProductionQueue,
    facility: Facility,
    availableEquipment: Map<TagCategory, number>,
    availableMaterials: Map<string, number>
  ): boolean {
    const step = job.steps[stepIndex];
    const stepProgress = job.stepProgress[stepIndex];
    
    // Check equipment requirements
    const equipmentCheck = meetsTagRequirements(availableEquipment, step.required_tags);
    if (!equipmentCheck.meets) return false;
    
    // Check material requirements
    for (const mat of step.material_requirements) {
      if (mat.consumed_at_start) {
        const available = availableMaterials.get(mat.material_id) || 0;
        if (available < mat.quantity * job.quantity) return false;
      }
    }
    
    // Allocate resources
    this.allocateStepResources(job, step, stepProgress, queue, facility, availableEquipment);
    
    // Consume materials
    for (const mat of step.material_requirements) {
      if (mat.consumed_at_start) {
        const newAmount = (availableMaterials.get(mat.material_id) || 0) - (mat.quantity * job.quantity);
        availableMaterials.set(mat.material_id, newAmount);
        facility.current_storage[mat.material_id] = newAmount;
        
        // Track consumed materials
        const consumed = job.consumedMaterials.get(mat.material_id) || 0;
        job.consumedMaterials.set(mat.material_id, consumed + (mat.quantity * job.quantity));
      }
    }
    
    return true;
  }
  
  // Allocate equipment for a step
  private allocateStepResources(
    job: ProductionJob,
    step: ManufacturingStep,
    stepProgress: StepProgress,
    queue: ProductionQueue,
    facility: Facility,
    availableEquipment: Map<TagCategory, number>
  ): void {
    stepProgress.allocatedEquipment = [];
    stepProgress.consumedCapacity = new Map();
    
    // For each required tag, find and allocate equipment
    for (const req of step.required_tags) {
      if (typeof req.minimum === 'number' && req.consumes) {
        // Find equipment that provides this tag
        for (const equipment of facility.equipment) {
          const def = this.equipmentDefinitions.get(equipment.equipmentId);
          if (!def) continue;
          
          for (const tag of def.tags) {
            if (tag.category === req.category && tag.consumable) {
              // Allocate this equipment
              if (!stepProgress.allocatedEquipment!.includes(equipment.id)) {
                stepProgress.allocatedEquipment!.push(equipment.id);
              }
              
              // Track capacity consumption
              const consumed = stepProgress.consumedCapacity!.get(req.category) || 0;
              stepProgress.consumedCapacity!.set(req.category, consumed + req.consumes);
              
              // Update available capacity
              const available = availableEquipment.get(req.category) || 0;
              availableEquipment.set(req.category, available - req.consumes);
              
              break;
            }
          }
        }
      }
    }
    
    // Update equipment allocations in queue
    for (const equipmentId of stepProgress.allocatedEquipment!) {
      const jobs = queue.equipmentAllocations.get(equipmentId) || [];
      jobs.push(job.id);
      queue.equipmentAllocations.set(equipmentId, jobs);
    }
  }
  
  // Release equipment when step completes
  private releaseStepEquipment(
    job: ProductionJob,
    queue: ProductionQueue,
    stepProgress: StepProgress
  ): void {
    if (!stepProgress.allocatedEquipment) return;
    
    for (const equipmentId of stepProgress.allocatedEquipment) {
      const jobs = queue.equipmentAllocations.get(equipmentId) || [];
      const index = jobs.indexOf(job.id);
      if (index > -1) {
        jobs.splice(index, 1);
      }
      if (jobs.length === 0) {
        queue.equipmentAllocations.delete(equipmentId);
      } else {
        queue.equipmentAllocations.set(equipmentId, jobs);
      }
    }
    
    stepProgress.allocatedEquipment = [];
    stepProgress.consumedCapacity = new Map();
  }
  
  // Release all resources for a job
  private releaseAllJobResources(job: ProductionJob, queue: ProductionQueue): void {
    for (const stepProgress of job.stepProgress) {
      if (stepProgress.allocatedEquipment) {
        this.releaseStepEquipment(job, queue, stepProgress);
      }
    }
  }
  
  // Get currently available equipment capacity
  private getAvailableEquipment(
    facility: Facility,
    queue: ProductionQueue
  ): Map<TagCategory, number> {
    const available = new Map(facility.equipment_capacity);
    
    // Subtract allocated capacity
    for (const job of queue.jobs) {
      if (job.state === JobState.IN_PROGRESS) {
        const stepProgress = job.stepProgress[job.currentStepIndex];
        if (stepProgress.state === StepState.IN_PROGRESS && stepProgress.consumedCapacity) {
          for (const [category, consumed] of stepProgress.consumedCapacity) {
            const current = available.get(category) || 0;
            available.set(category, current - consumed);
          }
        }
      }
    }
    
    return available;
  }
  
  // Update bottleneck tracking
  private updateBottleneckTracking(
    queue: ProductionQueue,
    facility: Facility
  ): void {
    // Track which tags are causing delays
    for (const job of queue.jobs) {
      if (job.state === JobState.IN_PROGRESS) {
        const stepProgress = job.stepProgress[job.currentStepIndex];
        if (stepProgress.state === StepState.WAITING) {
          const step = job.steps[job.currentStepIndex];
          
          // Check which requirements are blocking
          for (const req of step.required_tags) {
            const available = facility.equipment_capacity.get(req.category) || 0;
            if (typeof req.minimum === 'number' && available < req.minimum) {
              const waitTime = queue.bottleneckTracking.get(req.category) || 0;
              queue.bottleneckTracking.set(req.category, waitTime + 1);
            }
          }
        }
      }
    }
  }
  
  // Get bottleneck report
  getBottleneckReport(queue: ProductionQueue): Array<{ category: TagCategory; waitTime: number; severity: string }> {
    const report: Array<{ category: TagCategory; waitTime: number; severity: string }> = [];
    
    for (const [category, waitTime] of queue.bottleneckTracking) {
      let severity = 'low';
      if (waitTime > 100) severity = 'critical';
      else if (waitTime > 50) severity = 'high';
      else if (waitTime > 20) severity = 'medium';
      
      report.push({ category, waitTime, severity });
    }
    
    return report.sort((a, b) => b.waitTime - a.waitTime);
  }
}