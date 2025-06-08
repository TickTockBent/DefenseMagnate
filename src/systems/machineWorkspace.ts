// Machine Workspace System - Manages job flow through machine slots

import { 
  MachineSlot, 
  MachineWorkspace, 
  MachineSlotJob,
  MachineBasedMethod,
  MachineOperation,
  Facility, 
  Equipment, 
  EquipmentInstance,
  EquipmentStatus,
  TagCategory,
  JobPriority,
  ItemInstance,
  ItemTag
} from '../types'; // Using barrel exports
import { TIME_SCALE, type GameTime } from '../utils/gameClock';
import { inventoryManager } from '../utils/inventoryManager';
import { createItemInstance } from '../utils/itemSystem';

export class MachineWorkspaceManager {
  private workspaces: Map<string, MachineWorkspace> = new Map();
  private equipmentDefinitions: Map<string, Equipment>;
  private currentGameTime: GameTime = { totalGameHours: 0, days: 0, hours: 0, isPaused: false, gameSpeed: 1.0 };
  private onJobComplete: ((job: MachineSlotJob) => void) | null = null;
  
  constructor(equipmentDatabase: Map<string, Equipment>) {
    this.equipmentDefinitions = equipmentDatabase;
  }
  
  // Update game time reference
  setGameTime(gameTime: GameTime): void {
    this.currentGameTime = gameTime;
  }
  
  // Set callback for job completion
  setJobCompleteCallback(callback: (job: MachineSlotJob) => void): void {
    this.onJobComplete = callback;
  }
  
  // Convert game minutes to game hours
  private gameMinutesToHours(minutes: number): number {
    return minutes / 60;
  }
  
  // Initialize workspace for a facility
  initializeWorkspace(facility: Facility): MachineWorkspace {
    const workspace: MachineWorkspace = {
      facilityId: facility.id,
      machines: new Map(),
      jobQueue: [],
      completedJobs: []
    };
    
    // Create machine slots for each equipment
    for (const equipment of facility.equipment) {
      const def = this.equipmentDefinitions.get(equipment.equipmentId);
      if (!def) continue;
      
      // Determine if this equipment should have a work slot
      let shouldCreateSlot = false;
      
      // Check each tag to see if this equipment can process work
      for (const tag of def.tags) {
        // These tags indicate work-processing capability
        if (tag.category === TagCategory.SURFACE ||
            tag.category === TagCategory.TURNING ||
            tag.category === TagCategory.MILLING ||
            tag.category === TagCategory.DRILLING ||
            tag.category === TagCategory.BASIC_MANIPULATION ||
            tag.category === TagCategory.PRECISION_MANIPULATION ||
            tag.category === TagCategory.MEASURING ||
            tag.category === TagCategory.QUALITY_CONTROL) {
          shouldCreateSlot = true;
          break;
        }
      }
      
      // Skip pure storage equipment
      if (equipment.equipmentId === 'shelving_basic' || 
          equipment.equipmentId === 'storage_industrial') {
        shouldCreateSlot = false;
      }
      
      if (shouldCreateSlot) {
        const slot: MachineSlot = {
          id: `slot-${equipment.id}`,
          machineId: equipment.id,
          maxCapacity: 1 // Basic machines have 1 slot
        };
        workspace.machines.set(equipment.id, slot);
        console.log(`Created machine slot for ${def.name} (${equipment.id})`);
      }
    }
    
    this.workspaces.set(facility.id, workspace);
    return workspace;
  }
  
  // Add new equipment to existing workspace (preserves jobs and progress)
  addEquipmentToWorkspace(facility: Facility, newEquipment: EquipmentInstance): void {
    const workspace = this.workspaces.get(facility.id);
    if (!workspace) {
      // If no workspace exists, initialize normally
      this.initializeWorkspace(facility);
      return;
    }
    
    const def = this.equipmentDefinitions.get(newEquipment.equipmentId);
    if (!def) return;
    
    // Check if this equipment should have a work slot (same logic as initializeWorkspace)
    let shouldCreateSlot = false;
    
    for (const tag of def.tags) {
      if (tag.category === TagCategory.SURFACE ||
          tag.category === TagCategory.TURNING ||
          tag.category === TagCategory.MILLING ||
          tag.category === TagCategory.DRILLING ||
          tag.category === TagCategory.BASIC_MANIPULATION ||
          tag.category === TagCategory.PRECISION_MANIPULATION) {
        shouldCreateSlot = true;
        break;
      }
    }
    
    // Don't create slots for storage equipment
    if (newEquipment.equipmentId === 'storage_basic' || 
        newEquipment.equipmentId === 'storage_industrial') {
      shouldCreateSlot = false;
    }
    
    if (shouldCreateSlot) {
      const slot: MachineSlot = {
        id: `slot-${newEquipment.id}`,
        machineId: newEquipment.id,
        maxCapacity: 1
      };
      workspace.machines.set(newEquipment.id, slot);
      console.log(`Added machine slot for new ${def.name} (${newEquipment.id})`);
    }
  }
  
  // Remove equipment from existing workspace (preserves other jobs and progress)
  removeEquipmentFromWorkspace(facilityId: string, equipmentInstanceId: string): void {
    const workspace = this.workspaces.get(facilityId);
    if (!workspace) return;
    
    // Check if this equipment has a machine slot
    const slot = workspace.machines.get(equipmentInstanceId);
    if (!slot) return;
    
    // If the machine has a current job, we need to handle it
    if (slot.currentJob) {
      console.log(`Moving job ${slot.currentJob.id} back to queue as equipment ${equipmentInstanceId} is being removed`);
      // Reset job state and return to queue
      slot.currentJob.state = 'queued';
      slot.currentJob.currentMachineId = undefined;
      workspace.jobQueue.unshift(slot.currentJob); // Add to front of queue
    }
    
    // Remove the machine slot
    workspace.machines.delete(equipmentInstanceId);
    console.log(`Removed machine slot for equipment ${equipmentInstanceId}`);
  }
  
  // Add a new job to the facility queue
  addJob(
    facilityId: string,
    productId: string,
    method: MachineBasedMethod,
    quantity: number = 1,
    priority: JobPriority = JobPriority.NORMAL,
    rushOrder: boolean = false
  ): MachineSlotJob {
    const workspace = this.workspaces.get(facilityId);
    if (!workspace) throw new Error('Workspace not initialized');
    
    const facility = this.facilities.get(facilityId);
    if (!facility) throw new Error('Facility not found');
    
    // Create job inventory
    const jobInventory = inventoryManager.createEmptyInventory(100); // Small capacity for job
    
    const job: MachineSlotJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      facilityId,
      productId,
      method,
      quantity,
      priority,
      rushOrder,
      state: 'queued',
      createdAt: Date.now(),
      currentOperationIndex: 0,
      completedOperations: [],
      
      // NEW: Job sub-inventory system
      jobInventory,
      operationProducts: new Map(),
      
      // Initialize material tracking (legacy)
      consumedMaterials: new Map()
    };
    
    // Move required materials from facility to job inventory
    this.moveJobMaterials(job, facility);
    
    // Add to facility queue and sort by priority
    this.addJobToQueue(workspace, job);
    
    console.log(`Job ${job.id} added to facility queue for ${job.method.operations[0]?.name}`);
    
    return job;
  }
  
  // Move materials from facility to job inventory
  private moveJobMaterials(job: MachineSlotJob, facility: Facility): void {
    if (!facility.inventory) {
      console.warn('Facility has no inventory system');
      return;
    }
    
    // Collect all materials needed for all operations
    const materialsNeeded = new Map<string, { count: number; tags?: ItemTag[]; maxQuality?: number }>();
    
    for (const operation of job.method.operations) {
      if (operation.materialConsumption) {
        // NEW: Use materialConsumption for component-based methods
        for (const consumption of operation.materialConsumption) {
          const key = `${consumption.itemId}-${consumption.tags?.join(',') || 'any'}`;
          const existing = materialsNeeded.get(key);
          materialsNeeded.set(key, {
            count: (existing?.count || 0) + consumption.count * job.quantity,
            tags: consumption.tags,
            maxQuality: consumption.maxQuality
          });
        }
      } else if (operation.material_requirements) {
        // LEGACY: Support old material_requirements format
        for (const req of operation.material_requirements) {
          const key = `${req.material_id}-${req.required_tags?.join(',') || 'any'}`;
          const existing = materialsNeeded.get(key);
          materialsNeeded.set(key, {
            count: (existing?.count || 0) + req.quantity * job.quantity,
            tags: req.required_tags,
            maxQuality: req.max_quality
          });
        }
      }
    }
    
    // Move materials from facility to job
    for (const [key, requirement] of materialsNeeded) {
      const itemId = key.split('-')[0];
      let itemsToMove: ItemInstance[];
      
      if (requirement.tags && requirement.tags.length > 0) {
        itemsToMove = inventoryManager.getBestQualityItemsWithTags(
          facility.inventory,
          itemId,
          requirement.count,
          requirement.tags,
          requirement.maxQuality
        );
      } else {
        itemsToMove = inventoryManager.getBestQualityItems(
          facility.inventory,
          itemId,
          requirement.count
        );
      }
      
      // Move items to job inventory
      for (const item of itemsToMove) {
        inventoryManager.removeItem(facility.inventory, item.id, item.quantity);
        inventoryManager.addItem(job.jobInventory, item);
      }
      
      console.log(`Moved ${itemsToMove.length} ${itemId} items to job ${job.id}`);
    }
  }
  
  // Add job to facility queue with proper priority sorting
  private addJobToQueue(workspace: MachineWorkspace, job: MachineSlotJob): void {
    if (job.rushOrder) {
      // Rush orders go to front
      workspace.jobQueue.unshift(job);
    } else {
      // Find insertion point based on priority
      const insertIndex = workspace.jobQueue.findIndex(queuedJob => 
        !queuedJob.rushOrder && queuedJob.priority < job.priority
      );
      if (insertIndex === -1) {
        workspace.jobQueue.push(job);
      } else {
        workspace.jobQueue.splice(insertIndex, 0, job);
      }
    }
  }
  
  
  // Check if operation can start (materials available in job inventory)
  private canStartOperation(job: MachineSlotJob, facility: Facility): boolean {
    const operation = job.method.operations[job.currentOperationIndex];
    
    // NEW: Check materialConsumption first
    if (operation.materialConsumption) {
      for (const consumption of operation.materialConsumption) {
        const needed = consumption.count * job.quantity;
        let available: number;
        
        if (consumption.tags && consumption.tags.length > 0) {
          available = inventoryManager.getAvailableQuantityWithTags(
            job.jobInventory, 
            consumption.itemId, 
            consumption.tags, 
            consumption.maxQuality
          );
        } else {
          available = inventoryManager.getAvailableQuantity(job.jobInventory, consumption.itemId);
        }
        
        if (available < needed) {
          console.log(`Job ${job.id} lacks materials: need ${needed} ${consumption.itemId}, have ${available}`);
          return false;
        }
      }
      return true;
    }
    
    // LEGACY: Check old material_requirements format
    if (operation.material_requirements) {
      for (const mat of operation.material_requirements) {
        // For legacy operations, we no longer check consumed_at_start
        // All materials should now be in the job inventory
        const needed = mat.quantity * job.quantity;
        let available: number;
        
        if (mat.required_tags && mat.required_tags.length > 0) {
          available = inventoryManager.getAvailableQuantityWithTags(
            job.jobInventory, 
            mat.material_id, 
            mat.required_tags, 
            mat.max_quality
          );
        } else {
          available = inventoryManager.getAvailableQuantity(job.jobInventory, mat.material_id);
        }
        
        if (available < needed) {
          console.log(`Job ${job.id} lacks materials: need ${needed} ${mat.material_id}, have ${available}`);
          return false;
        }
      }
    }
    
    return true;
  }
  
  // Consume materials for current operation (from job inventory)
  private consumeOperationMaterials(job: MachineSlotJob, facility: Facility): void {
    const operation = job.method.operations[job.currentOperationIndex];
    
    // This function now only handles consumption at operation START
    // Material consumption is now handled in completeOperation when materials are transformed
    
    // For backwards compatibility with old operations that still use consumed_at_start: true
    if (operation.material_requirements) {
      for (const mat of operation.material_requirements) {
        if (mat.consumed_at_start) {
          const needed = mat.quantity * job.quantity;
          
          let itemsToConsume: ItemInstance[];
          if (mat.required_tags && mat.required_tags.length > 0) {
            itemsToConsume = inventoryManager.getBestQualityItemsWithTags(
              job.jobInventory, 
              mat.material_id, 
              needed,
              mat.required_tags,
              mat.max_quality
            );
          } else {
            itemsToConsume = inventoryManager.getBestQualityItems(
              job.jobInventory, 
              mat.material_id, 
              needed
            );
          }
          
          // Remove items from job inventory
          for (const item of itemsToConsume) {
            inventoryManager.removeItem(job.jobInventory, item.id, item.quantity);
          }
          
          // Track consumed materials
          if (!job.consumedMaterials) job.consumedMaterials = new Map();
          const consumed = job.consumedMaterials.get(mat.material_id) || 0;
          job.consumedMaterials.set(mat.material_id, consumed + needed);
          
          console.log(`Job ${job.id} consumed ${needed} ${mat.material_id} at operation start`);
        }
      }
    }
  }
  
  // Calculate operation duration considering machine efficiency
  private calculateOperationDuration(
    job: MachineSlotJob, 
    machine: MachineSlot,
    facility: Facility
  ): number {
    const operation = job.method.operations[job.currentOperationIndex];
    const equipment = facility.equipment.find(e => e.id === machine.machineId);
    if (!equipment) return 0;
    
    const def = this.equipmentDefinitions.get(equipment.equipmentId);
    if (!def) return 0;
    
    // Find the tag that matches the operation requirement
    const relevantTag = def.tags.find(t => t.category === operation.requiredTag.category);
    
    // Calculate efficiency ratio
    let efficiency = 1;
    if (relevantTag && typeof relevantTag.value === 'number') {
      const optimal = operation.requiredTag.optimal || operation.requiredTag.minimum;
      efficiency = typeof optimal === 'number' ? relevantTag.value / optimal : 1;
    }
    
    // Better equipment = faster operation
    const timeMultiplier = efficiency > 1 ? 1 / efficiency : 2 - efficiency;
    
    // Return duration in game minutes (will be converted by caller)
    return operation.baseDurationMinutes * timeMultiplier;
  }
  
  // Main update loop - process all workspaces
  updateAllWorkspaces(deltaTime: number): void {
    for (const [facilityId, workspace] of this.workspaces) {
      this.updateWorkspace(workspace, deltaTime);
    }
  }
  
  // Update a single workspace
  private updateWorkspace(workspace: MachineWorkspace, deltaTime: number): void {
    const facility = this.getFacility(workspace.facilityId);
    if (!facility) return;
    
    // Step 1: Process machines that are currently working
    for (const [equipmentId, machine] of workspace.machines) {
      if (machine.currentJob && machine.currentProgress) {
        // Update lastUpdateTime for real-time interpolation
        machine.currentProgress.lastUpdateTime = Date.now();
        
        // Update job progress using game time
        const elapsed = this.currentGameTime.totalGameHours - machine.currentProgress.startTime;
        const duration = machine.currentProgress.estimatedCompletion - machine.currentProgress.startTime;
        
        if (elapsed >= duration) {
          // Operation complete!
          this.completeOperation(workspace, machine, facility);
        }
      }
    }
    
    // Step 2: Try to assign jobs from facility queue to idle machines
    this.assignJobsFromQueue(workspace, facility);
  }
  
  // Assign jobs from facility queue to available machines
  private assignJobsFromQueue(workspace: MachineWorkspace, facility: Facility): void {
    // Find idle machines
    const idleMachines = Array.from(workspace.machines.values()).filter(machine => !machine.currentJob);
    
    if (idleMachines.length === 0) return; // No idle machines
    
    // Try to assign jobs from the queue
    for (let i = workspace.jobQueue.length - 1; i >= 0; i--) {
      const job = workspace.jobQueue[i];
      
      // Find a suitable machine for this job's current operation
      const suitableMachine = this.findAvailableMachineForJob(job, idleMachines, facility);
      
      if (suitableMachine && this.canStartOperation(job, facility)) {
        // Remove job from queue
        workspace.jobQueue.splice(i, 1);
        
        // Assign to machine
        this.startJobOnMachine(job, suitableMachine, facility);
        
        // Remove this machine from idle list
        const machineIndex = idleMachines.indexOf(suitableMachine);
        if (machineIndex > -1) {
          idleMachines.splice(machineIndex, 1);
        }
        
        console.log(`Assigned job ${job.id} from queue to machine ${suitableMachine.machineId}`);
        
        // Stop if no more idle machines
        if (idleMachines.length === 0) break;
      }
    }
  }
  
  // Find an available machine that can handle the job's current operation
  private findAvailableMachineForJob(
    job: MachineSlotJob, 
    availableMachines: MachineSlot[], 
    facility: Facility
  ): MachineSlot | null {
    const operation = job.method.operations[job.currentOperationIndex];
    if (!operation) return null;
    
    for (const machine of availableMachines) {
      const equipment = facility.equipment.find(e => e.id === machine.machineId);
      if (!equipment) continue;
      
      const def = this.equipmentDefinitions.get(equipment.equipmentId);
      if (!def) continue;
      
      // Check if machine provides required tag
      const providesTag = def.tags.some(tag => {
        if (tag.category !== operation.requiredTag.category) return false;
        
        if (typeof operation.requiredTag.minimum === 'boolean') {
          return tag.value === true;
        } else {
          return typeof tag.value === 'number' && tag.value >= operation.requiredTag.minimum;
        }
      });
      
      if (providesTag) {
        return machine;
      }
    }
    
    return null;
  }
  
  // Start a job on a specific machine
  private startJobOnMachine(job: MachineSlotJob, machine: MachineSlot, facility: Facility): void {
    machine.currentJob = job;
    job.currentMachineId = machine.machineId;
    job.state = 'in_progress';
    
    const durationInGameHours = this.gameMinutesToHours(this.calculateOperationDuration(job, machine, facility));
    machine.currentProgress = {
      stepIndex: job.currentOperationIndex,
      startTime: this.currentGameTime.totalGameHours,
      estimatedCompletion: this.currentGameTime.totalGameHours + durationInGameHours,
      lastUpdateTime: Date.now()
    };
    
    // Consume materials if needed
    this.consumeOperationMaterials(job, facility);
  }
  
  // Complete current operation and move job forward
  private completeOperation(
    workspace: MachineWorkspace, 
    machine: MachineSlot,
    facility: Facility
  ): void {
    const job = machine.currentJob;
    if (!job) return;
    
    const operation = job.method.operations[job.currentOperationIndex];
    
    // Check for failure
    if (operation.can_fail && Math.random() < operation.failure_chance) {
      console.log(`Operation failed for job ${job.id}: ${operation.name}`);
      // Handle failure based on type
      if (operation.failure_result === 'scrap') {
        job.state = 'failed';
        workspace.completedJobs.push(job);
      } else if (operation.failure_result === 'downgrade') {
        job.finalQuality = (job.finalQuality || 85) * 0.8;
      }
      // For 'rework', just repeat the operation
    } else {
      // Success! Handle material transformation
      this.processOperationTransformation(job, operation);
      
      // Mark operation complete
      job.completedOperations.push(operation.id);
      job.currentOperationIndex++;
      
      console.log(`Job ${job.id} completed operation: ${operation.name}`);
    }
    
    // Clear machine
    machine.currentJob = undefined;
    machine.currentProgress = undefined;
    job.currentMachineId = undefined;
    
    // Check if job is complete or needs next operation
    if (job.currentOperationIndex >= job.method.operations.length) {
      // Job complete! Move any remaining items from job inventory to facility
      this.finalizeJobInventory(job, facility);
      
      job.state = 'completed';
      job.completedAt = this.currentGameTime.totalGameHours;
      
      workspace.completedJobs.push(job);
      
      // Trigger completion callback
      if (this.onJobComplete) {
        this.onJobComplete(job);
      }
      
      console.log(`Job ${job.id} completed!`);
    } else {
      // Job needs next operation - return to facility queue
      job.state = 'queued';
      this.addJobToQueue(workspace, job);
      console.log(`Job ${job.id} returned to queue for next operation: ${job.method.operations[job.currentOperationIndex]?.name}`);
    }
  }
  
  // Set facility reference for workspace operations
  private facilities: Map<string, Facility> = new Map();
  
  setFacility(facility: Facility): void {
    this.facilities.set(facility.id, facility);
  }
  
  // Helper to get facility
  private getFacility(facilityId: string): Facility | null {
    return this.facilities.get(facilityId) || null;
  }
  
  // Get workspace for facility
  getWorkspace(facilityId: string): MachineWorkspace | undefined {
    return this.workspaces.get(facilityId);
  }
  
  // NEW: Cancel a job and recover materials from job inventory
  cancelJob(facilityId: string, jobId: string): boolean {
    const workspace = this.workspaces.get(facilityId);
    const facility = this.facilities.get(facilityId);
    
    if (!workspace || !facility) {
      console.error(`Cannot cancel job ${jobId}: workspace or facility not found`);
      return false;
    }
    
    // Find the job (could be in queue or currently processing)
    let job: MachineSlotJob | undefined;
    let jobLocation: 'queue' | 'machine' | 'completed' | null = null;
    let machineSlot: MachineSlot | undefined;
    
    // Check if job is in queue
    const queueIndex = workspace.jobQueue.findIndex(j => j.id === jobId);
    if (queueIndex !== -1) {
      job = workspace.jobQueue[queueIndex];
      jobLocation = 'queue';
    }
    
    // Check if job is currently being processed on a machine
    if (!job) {
      for (const slot of workspace.machines.values()) {
        if (slot.currentJob?.id === jobId) {
          job = slot.currentJob;
          jobLocation = 'machine';
          machineSlot = slot;
          break;
        }
      }
    }
    
    // Check if job is already completed
    if (!job) {
      const completedIndex = workspace.completedJobs.findIndex(j => j.id === jobId);
      if (completedIndex !== -1) {
        console.warn(`Job ${jobId} is already completed and cannot be cancelled`);
        return false;
      }
    }
    
    if (!job) {
      console.error(`Job ${jobId} not found`);
      return false;
    }
    
    // Calculate what can be recovered
    const recoveryInfo = this.calculateCancellationRecovery(job);
    
    // Recovery: Move all items from job inventory back to facility
    this.finalizeJobInventory(job, facility);
    
    // Clean up job state
    job.state = 'cancelled';
    job.completedAt = this.currentGameTime.totalGameHours;
    
    // Remove job from its current location
    if (jobLocation === 'queue') {
      workspace.jobQueue.splice(queueIndex, 1);
    } else if (jobLocation === 'machine' && machineSlot) {
      // Clear machine
      machineSlot.currentJob = undefined;
      machineSlot.currentProgress = undefined;
    }
    
    // Add to completed jobs for record keeping
    workspace.completedJobs.push(job);
    
    console.log(`Job ${jobId} cancelled. Recovery: ${recoveryInfo.totalItemsRecovered} items, ${recoveryInfo.estimatedValue} credits value`);
    
    return true;
  }
  
  // NEW: Calculate what would be recovered if job is cancelled
  calculateCancellationRecovery(job: MachineSlotJob): {
    recoveredItems: { itemId: string; quantity: number; tags: string[] }[];
    totalItemsRecovered: number;
    estimatedValue: number;
    operationsCompleted: number;
    timeInvested: number;
  } {
    const recoveredItems: { itemId: string; quantity: number; tags: string[] }[] = [];
    let totalItems = 0;
    let estimatedValue = 0;
    
    // Calculate items that would be recovered from job inventory
    for (const group of job.jobInventory.groups.values()) {
      for (const slot of group.slots) {
        for (const instance of slot.stack.instances) {
          recoveredItems.push({
            itemId: instance.baseItemId,
            quantity: instance.quantity,
            tags: instance.tags
          });
          totalItems += instance.quantity;
          // Simple value estimation (would need proper calculation in real implementation)
          estimatedValue += instance.quantity * 10; // Placeholder
        }
      }
    }
    
    return {
      recoveredItems,
      totalItemsRecovered: totalItems,
      estimatedValue,
      operationsCompleted: job.completedOperations.length,
      timeInvested: job.startedAt ? (this.currentGameTime.totalGameHours - job.startedAt) : 0
    };
  }
  
  // NEW: Process material transformation during operation completion
  private processOperationTransformation(job: MachineSlotJob, operation: MachineOperation): void {
    const producedItems: ItemInstance[] = [];
    
    // Handle new materialConsumption/materialProduction system
    if (operation.materialConsumption || operation.materialProduction) {
      // Consume materials
      if (operation.materialConsumption) {
        for (const consumption of operation.materialConsumption) {
          const needed = consumption.count * job.quantity;
          
          let itemsToConsume: ItemInstance[];
          if (consumption.tags && consumption.tags.length > 0) {
            itemsToConsume = inventoryManager.getBestQualityItemsWithTags(
              job.jobInventory,
              consumption.itemId,
              needed,
              consumption.tags,
              consumption.maxQuality
            );
          } else {
            itemsToConsume = inventoryManager.getBestQualityItems(
              job.jobInventory,
              consumption.itemId,
              needed
            );
          }
          
          // Remove consumed items
          for (const item of itemsToConsume) {
            inventoryManager.removeItem(job.jobInventory, item.id, item.quantity);
          }
          
          // Track consumption for record keeping
          if (!job.consumedMaterials) job.consumedMaterials = new Map();
          const consumed = job.consumedMaterials.get(consumption.itemId) || 0;
          job.consumedMaterials.set(consumption.itemId, consumed + needed);
          
          console.log(`Job ${job.id} consumed ${needed} ${consumption.itemId} during operation`);
        }
      }
      
      // Produce materials
      if (operation.materialProduction) {
        for (const production of operation.materialProduction) {
          const quantity = production.count * job.quantity;
          
          // Create produced item
          const producedItem = createItemInstance({
            baseItemId: production.itemId,
            tags: production.tags || [],
            quality: production.quality || 85, // Default quality if not specified
            quantity,
            metadata: {
              source: 'manufacturing',
              operationId: operation.id,
              jobId: job.id,
              producedAt: this.currentGameTime.totalGameHours
            }
          });
          
          // Add to job inventory
          inventoryManager.addItem(job.jobInventory, producedItem);
          producedItems.push(producedItem);
          
          console.log(`Job ${job.id} produced ${quantity} ${production.itemId} with tags [${production.tags?.join(', ')}]`);
        }
      }
    } else if (operation.material_requirements) {
      // LEGACY: Handle old material_requirements with consumed_at_start: false
      // TODO: Remove this branch after migrating all methods to new system
      for (const req of operation.material_requirements) {
        if (!req.consumed_at_start) {
          const needed = req.quantity * job.quantity;
          
          let itemsToConsume: ItemInstance[];
          if (req.required_tags && req.required_tags.length > 0) {
            itemsToConsume = inventoryManager.getBestQualityItemsWithTags(
              job.jobInventory,
              req.material_id,
              needed,
              req.required_tags,
              req.max_quality
            );
          } else {
            itemsToConsume = inventoryManager.getBestQualityItems(
              job.jobInventory,
              req.material_id,
              needed
            );
          }
          
          // Remove consumed items
          for (const item of itemsToConsume) {
            inventoryManager.removeItem(job.jobInventory, item.id, item.quantity);
          }
          
          // Track consumption
          if (!job.consumedMaterials) job.consumedMaterials = new Map();
          const consumed = job.consumedMaterials.get(req.material_id) || 0;
          job.consumedMaterials.set(req.material_id, consumed + needed);
          
          console.log(`Job ${job.id} consumed ${needed} ${req.material_id} during operation (legacy)`);
        }
      }
    }
    
    // Track operation products
    if (producedItems.length > 0) {
      job.operationProducts.set(job.currentOperationIndex, producedItems);
    }
  }
  
  // NEW: Move all remaining items from job inventory to facility inventory
  private finalizeJobInventory(job: MachineSlotJob, facility: Facility): void {
    if (!facility.inventory) {
      console.warn('Facility has no inventory system for job finalization');
      return;
    }
    
    // Move all items from job inventory to facility inventory
    for (const group of job.jobInventory.groups.values()) {
      for (const slot of group.slots) {
        for (const instance of slot.stack.instances) {
          // Remove from job inventory
          inventoryManager.removeItem(job.jobInventory, instance.id, instance.quantity);
          // Add to facility inventory
          inventoryManager.addItem(facility.inventory, instance);
        }
      }
    }
    
    console.log(`Job ${job.id} finalized - all items moved to facility inventory`);
  }
}