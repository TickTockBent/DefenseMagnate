// LEGACY SYSTEM - Production Scheduler System - TO BE REMOVED AFTER V1 TESTING
// This system is replaced by the new Machine Workspace system (machineWorkspace.ts)
// It uses old ManufacturingStep.required_tags structure and legacy job interfaces
// Kept temporarily to avoid breaking existing imports, but should be removed after migration testing

import { 
  ProductionJob, 
  ProductionQueue, 
  StepProgress,
  JobState, 
  StepState,
  compareJobPriority,
  calculateStepDuration,
  Equipment, 
  EquipmentInstance,
  EquipmentStatus,
  TagCategory,
  aggregateEquipmentTags,
  meetsTagRequirements,
  getEfficiencyPenalty,
  ManufacturingStep,
  Facility
} from '../types';
import { TIME_SCALE } from '../utils/gameClock';

export class ProductionScheduler {
  private equipmentDefinitions: Map<string, Equipment>;
  
  constructor(equipmentDatabase: Map<string, Equipment>) {
    this.equipmentDefinitions = equipmentDatabase;
  }
  
  // Equipment Reservation System
  
  // Try to reserve equipment for a job step using capacity-based reservation
  private tryReserveEquipment(
    facility: Facility,
    step: ManufacturingStep,
    jobId: string
  ): EquipmentInstance[] | null {
    console.log(`\nReserving equipment for job ${jobId}, step: ${step.name}`);
    
    // Calculate currently available capacity considering active reservations
    const availableCapacity = this.calculateAvailableCapacity(facility);
    
    // Check if we can satisfy all requirements with available capacity
    for (const req of step.required_tags || []) {
      const available = availableCapacity.get(req.category) || 0;
      
      if (typeof req.minimum === 'boolean') {
        if (req.minimum && available === 0) {
          console.log(`❌ Cannot satisfy ${req.category} (boolean requirement)`);
          return null;
        }
      } else {
        if (available < req.minimum) {
          console.log(`❌ Cannot satisfy ${req.category}: need ${req.minimum}, have ${available}`);
          return null;
        }
      }
    }
    
    // If we can satisfy all requirements, reserve the specific equipment we need
    const reservedEquipment: EquipmentInstance[] = [];
    const reservedCapacity = new Map<string, number>(); // Equipment ID -> reserved capacity amount
    
    for (const req of step.required_tags || []) {
      // Find the best equipment to provide this requirement
      const suitableEquipment = facility.equipment
        .filter(eq => eq.status === EquipmentStatus.AVAILABLE || (eq.status === EquipmentStatus.RESERVED && eq.reservedBy === jobId))
        .filter(eq => {
          const def = this.equipmentDefinitions.get(eq.equipmentId);
          if (!def) return false;
          
          return def.tags.some(tag => {
            if (tag.category !== req.category) return false;
            
            if (typeof req.minimum === 'boolean') {
              return tag.value === true;
            } else {
              return typeof tag.value === 'number' && tag.value >= req.minimum;
            }
          });
        })
        .sort((a, b) => {
          // Prefer equipment that's already reserved by this job
          if (a.reservedBy === jobId && b.reservedBy !== jobId) return -1;
          if (b.reservedBy === jobId && a.reservedBy !== jobId) return 1;
          
          // Then prefer equipment that provides the exact amount needed (minimize waste)
          const defA = this.equipmentDefinitions.get(a.equipmentId)!;
          const defB = this.equipmentDefinitions.get(b.equipmentId)!;
          
          const tagA = defA.tags.find(t => t.category === req.category)!;
          const tagB = defB.tags.find(t => t.category === req.category)!;
          
          if (typeof req.minimum === 'number' && typeof tagA.value === 'number' && typeof tagB.value === 'number') {
            const wasteA = tagA.value - req.minimum;
            const wasteB = tagB.value - req.minimum;
            return wasteA - wasteB;
          }
          
          return 0;
        });
      
      if (suitableEquipment.length === 0) {
        console.log(`❌ No suitable equipment for ${req.category}`);
        this.releaseReservedEquipment(facility, reservedEquipment);
        return null;
      }
      
      const equipment = suitableEquipment[0];
      
      // Reserve this equipment if not already reserved by this job
      if (!reservedEquipment.includes(equipment)) {
        equipment.status = EquipmentStatus.RESERVED;
        equipment.reservedBy = jobId;
        reservedEquipment.push(equipment);
        console.log(`✓ Reserved ${equipment.equipmentId} for ${req.category}`);
      }
    }
    
    return reservedEquipment;
  }
  
  // Calculate available capacity considering current reservations and usage
  private calculateAvailableCapacity(facility: Facility): Map<TagCategory, number> {
    const capacity = new Map<TagCategory, number>();
    
    // First, get base capacity from ALL equipment (not just available)
    for (const equipment of facility.equipment) {
      const def = this.equipmentDefinitions.get(equipment.equipmentId);
      if (!def) continue;
      
      const conditionModifier = equipment.condition / 100;
      
      for (const tag of def.tags) {
        if (typeof tag.value === 'number') {
          const current = capacity.get(tag.category) || 0;
          const adjustedValue = tag.value * conditionModifier;
          
          // For consumable tags, add to total capacity pool
          // For non-consumable tags, take the maximum from any single piece
          if (tag.consumable) {
            capacity.set(tag.category, current + adjustedValue);
          } else {
            capacity.set(tag.category, Math.max(current, adjustedValue));
          }
        } else if (typeof tag.value === 'boolean' && tag.value) {
          capacity.set(tag.category, 1);
        }
      }
    }
    
    // Now subtract capacity that's being used by reserved/in-use equipment
    for (const equipment of facility.equipment) {
      if (equipment.status === EquipmentStatus.RESERVED || equipment.status === EquipmentStatus.IN_USE) {
        const def = this.equipmentDefinitions.get(equipment.equipmentId);
        if (!def) continue;
        
        const conditionModifier = equipment.condition / 100;
        
        for (const tag of def.tags) {
          if (typeof tag.value === 'number') {
            const adjustedValue = tag.value * conditionModifier;
            
            // For non-consumable tags, subtract the entire capacity when equipment is reserved
            // For consumable tags, we'd need to track actual usage (not implemented yet)
            if (!tag.consumable) {
              const current = capacity.get(tag.category) || 0;
              capacity.set(tag.category, Math.max(0, current - adjustedValue));
            }
          } else if (typeof tag.value === 'boolean' && tag.value) {
            // Boolean capabilities are unavailable when equipment is reserved
            capacity.set(tag.category, 0);
          }
        }
      }
    }
    
    console.log(`Available capacity:`, Object.fromEntries(capacity));
    return capacity;
  }
  
  // Release reserved equipment back to available
  private releaseReservedEquipment(facility: Facility, equipment: EquipmentInstance[]): void {
    for (const eq of equipment) {
      eq.status = EquipmentStatus.AVAILABLE;
      eq.reservedBy = undefined;
      eq.currentlyUsedBy = undefined;
    }
  }
  
  // Start using reserved equipment
  private startUsingEquipment(reservedEquipment: EquipmentInstance[], jobId: string): void {
    for (const eq of reservedEquipment) {
      eq.status = EquipmentStatus.IN_USE;
      eq.currentlyUsedBy = [jobId];
    }
  }
  
  // Complete using equipment and return to available
  private completeUsingEquipment(facility: Facility, jobId: string): void {
    console.log(`\nReleasing equipment for job ${jobId}:`);
    let releasedAny = false;
    
    for (const eq of facility.equipment) {
      if (eq.currentlyUsedBy?.includes(jobId)) {
        console.log(`  ✓ Releasing ${eq.equipmentId} (was ${eq.status})`);
        eq.status = EquipmentStatus.AVAILABLE;
        eq.reservedBy = undefined;
        eq.currentlyUsedBy = undefined;
        releasedAny = true;
      }
    }
    
    if (!releasedAny) {
      console.log(`  ⚠️ No equipment found to release for job ${jobId}`);
      // Show current equipment status for debugging
      for (const eq of facility.equipment) {
        console.log(`    ${eq.equipmentId}: ${eq.status}, usedBy: ${eq.currentlyUsedBy}, reservedBy: ${eq.reservedBy}`);
      }
    }
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
    
    // Update progress (convert deltaTime from ms to game hours)
    const deltaTimeHours = deltaTime / TIME_SCALE.MS_PER_GAME_HOUR; // Convert ms to game hours
    const progressIncrement = (deltaTimeHours / actualDuration) * 100;
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
    for (const req of step.required_tags || []) {
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
    
    // Release equipment using new system
    console.log(`Completing step ${job.currentStepIndex} for job ${job.id} - releasing equipment`);
    this.completeUsingEquipment(facility, job.id);
    
    // Move to next step
    job.currentStepIndex++;
    
    if (job.currentStepIndex >= job.steps.length) {
      // Job complete!
      console.log(`Job ${job.id} completed!`);
      this.completeJob(job, queue, facility);
    } else {
      // Set next step to waiting
      console.log(`Job ${job.id} moving to step ${job.currentStepIndex}`);
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
      
      // Get fresh copy of available equipment for each job check
      const freshAvailableEquipment = this.getAvailableEquipment(facility, queue);
      const freshAvailableMaterials = new Map(Object.entries(facility.current_storage));
      
      // Check if job can start - only mark IN_PROGRESS if first step actually starts
      if (job.state === JobState.QUEUED) {
        const canStart = this.tryStartJob(job, queue, facility, freshAvailableEquipment, freshAvailableMaterials);
        if (canStart) {
          // Job will be marked IN_PROGRESS in tryStartJob when step actually starts
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
            freshAvailableEquipment, 
            freshAvailableMaterials
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
    const canStart = this.tryStartStep(job, 0, queue, facility, availableEquipment, availableMaterials);
    if (canStart) {
      // Job transitions to IN_PROGRESS only when first step actually starts
      job.state = JobState.IN_PROGRESS;
      job.stepProgress[0].state = StepState.IN_PROGRESS;
      job.stepProgress[0].startTime = Date.now();
    }
    return canStart;
  }
  
  // Try to start a specific step using equipment reservation system
  private tryStartStep(
    job: ProductionJob,
    stepIndex: number,
    queue: ProductionQueue,
    facility: Facility,
    availableEquipment: Map<TagCategory, number>, // Not used anymore
    availableMaterials: Map<string, number>
  ): boolean {
    const step = job.steps[stepIndex];
    const stepProgress = job.stepProgress[stepIndex];
    
    // Check material requirements first (cheaper check)
    console.log(`\nChecking materials for job ${job.id} step ${stepIndex}:`);
    for (const mat of step.material_requirements) {
      if (mat.consumed_at_start) {
        const available = facility.current_storage[mat.material_id] || 0;
        const needed = mat.quantity * job.quantity;
        console.log(`  ${mat.material_id}: need ${needed}, have ${available}`);
        if (available < needed) {
          console.log(`  ❌ Insufficient ${mat.material_id}`);
          return false;
        }
      } else {
        const available = facility.current_storage[mat.material_id] || 0;
        const needed = mat.quantity * job.quantity;
        console.log(`  ${mat.material_id}: need ${needed}, have ${available} (not consumed at start)`);
      }
    }
    
    // Try to reserve equipment using new reservation system
    const reservedEquipment = this.tryReserveEquipment(facility, step, job.id);
    if (!reservedEquipment) {
      console.log(`Could not reserve equipment for job ${job.id} step ${stepIndex}`);
      return false;
    }
    
    // Start using the reserved equipment
    this.startUsingEquipment(reservedEquipment, job.id);
    
    // Consume materials
    for (const mat of step.material_requirements) {
      if (mat.consumed_at_start) {
        const needed = mat.quantity * job.quantity;
        const currentAmount = facility.current_storage[mat.material_id] || 0;
        facility.current_storage[mat.material_id] = currentAmount - needed;
        
        // Track consumed materials
        const consumed = job.consumedMaterials.get(mat.material_id) || 0;
        job.consumedMaterials.set(mat.material_id, consumed + needed);
      }
    }
    
    // Store reserved equipment in step progress for later release
    stepProgress.allocatedEquipment = reservedEquipment.map(eq => eq.id);
    
    console.log(`Job ${job.id} step ${stepIndex} started - reserved equipment: ${reservedEquipment.map(eq => eq.equipmentId).join(', ')}`);
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
    for (const req of step.required_tags || []) {
      if (typeof req.minimum === 'number') {
        const consumeAmount = req.consumes || req.minimum;
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
              stepProgress.consumedCapacity!.set(req.category, consumed + consumeAmount);
              
              // Update available capacity
              const available = availableEquipment.get(req.category) || 0;
              availableEquipment.set(req.category, available - consumeAmount);
              
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
            const current = available.get(category as any) || 0;
            available.set(category as any, current - consumed);
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
          for (const req of step.required_tags || []) {
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
      
      report.push({ category: category as any, waitTime, severity });
    }
    
    return report.sort((a, b) => b.waitTime - a.waitTime);
  }
}