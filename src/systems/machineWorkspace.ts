// Machine Workspace System - Manages job flow through machine slots

import { 
  MachineSlot, 
  MachineWorkspace, 
  MachineSlotJob,
  JobSubOperation,
  MachineBasedMethod,
  MachineOperation,
  Facility, 
  Equipment, 
  EquipmentInstance,
  EquipmentStatus,
  TagCategory,
  JobPriority,
  ItemInstance,
  ItemTag,
  ItemManufacturingType
  // OperationType // LEGACY: Not used in MachineOperation, only in DynamicOperation
} from '../types'; // Using barrel exports
import { TIME_SCALE, type GameTime } from '../utils/gameClock';
import { inventoryManager } from '../utils/inventoryManager';
import { createItemInstance } from '../utils/itemSystem';
import { getBaseItem } from '../data/baseItems';
import { ManufacturingV2Integration } from './manufacturingV2Integration';
import { globalEventBus, EventType, EventUtils } from './eventBus';
import { globalJobStateManager, JobReadinessState } from './jobStateManager';
import { globalJobAssignmentCoordinator } from './jobAssignmentCoordinator';

export class MachineWorkspaceManager {
  private workspaces: Map<string, MachineWorkspace> = new Map();
  private equipmentDefinitions: Map<string, Equipment>;
  private currentGameTime: GameTime = { totalGameHours: 0, days: 0, hours: 0, isPaused: false, gameSpeed: 1.0 };
  private onJobComplete: ((job: MachineSlotJob) => void) | null = null;
  
  constructor(equipmentDatabase: Map<string, Equipment>) {
    this.equipmentDefinitions = equipmentDatabase;
    
    // Initialize the global coordinator with equipment database
    globalJobAssignmentCoordinator.setEquipmentDatabase(equipmentDatabase);
    
    // Set up event-driven job assignment
    this.initializeEventHandlers();
  }
  
  // Initialize event handlers for event-driven architecture
  private initializeEventHandlers(): void {
    // Listen for job assignments from coordinator
    globalEventBus.subscribe(EventType.JOB_STARTED, this.onJobStarted.bind(this));
    
    // When operations complete, check for dependent operations
    globalEventBus.subscribe(EventType.OPERATION_COMPLETED, this.onOperationCompleted.bind(this));
    
    // Note: MACHINE_AVAILABLE and FACILITY_STATE_CHANGED are now handled by the coordinator
    console.log('🎯 MachineWorkspaceManager: Event handlers initialized (coordinator pattern)');
  }
  
  // Event handler: Job started by coordinator
  private onJobStarted(event: any): void {
    const { jobId, machineId, facilityId, subOperationIndex, operationName, estimatedDuration } = event.data;
    console.log(`🎯 MachineWorkspaceManager: Executing job assignment from coordinator: ${jobId} → ${machineId}`);
    
    // Execute the assignment decided by the coordinator
    this.executeCoordinatorAssignment(jobId, machineId, facilityId, subOperationIndex);
  }
  
  // Event handler: Operation completed
  private onOperationCompleted(event: any): void {
    const { jobId, operationIndex, facilityId } = event.data;
    console.log(`🎯 EVENT: Operation ${operationIndex} completed for job ${jobId}`);
    
    // This might make other operations ready - job state manager handles this
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
        
        // Emit machine available event for initial job assignment
        const capabilities = def.tags.map(t => t.category);
        const machineEventEmitter = EventUtils.createMachineEventEmitter(equipment.id, facility.id);
        machineEventEmitter.becameAvailable(capabilities);
      }
    }
    
    this.workspaces.set(facility.id, workspace);
    
    // Register facility with the coordinator
    globalJobAssignmentCoordinator.registerFacility(facility);
    console.log(`🎯 Facility ${facility.id} registered with JobAssignmentCoordinator`);
    
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
      
      // COORDINATOR: Notify that new machine is available
      const capabilities = def.tags.map(t => t.category);
      const machineEventEmitter = EventUtils.createMachineEventEmitter(newEquipment.id, facility.id);
      machineEventEmitter.becameAvailable(capabilities);
      console.log(`New equipment ${def.name} available - coordinator notified`);
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
    rushOrder: boolean = false,
    enhancementSelection?: import('../types').EnhancementSelection
  ): MachineSlotJob {
    const workspace = this.workspaces.get(facilityId);
    if (!workspace) throw new Error('Workspace not initialized');
    
    const facility = this.facilities.get(facilityId);
    if (!facility) throw new Error('Facility not found');
    
    // All jobs now use dynamic workflows - unified system
    let actualMethod = method;
    console.log(`Creating job for ${method.name}`);
    
    // Create job inventory
    const jobInventory = inventoryManager.createEmptyInventory(100); // Small capacity for job
    
    const job: MachineSlotJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      facilityId,
      productId,
      method: actualMethod,
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
      consumedMaterials: new Map(),
      
      // All jobs now use sub-operations for dynamic execution
      subOperations: new Map(),
      
      // PHASE 2: Enhancement selection
      enhancementSelection
    };
    
    // Move required materials from facility to job inventory
    this.moveJobMaterials(job, facility);
    
    // Initialize sub-operations for all jobs
    this.initializeSubOperations(job, facility);
    
    // Add to event-driven job state manager instead of workspace queue
    globalJobStateManager.addJob(job);
    
    console.log(`Job ${job.id} added to job state manager for ${job.method.operations[0]?.name}`);
    
    return job;
  }
  
  // Initialize sub-operations within the parent job
  private initializeSubOperations(job: MachineSlotJob, facility: Facility): void {
    if (!job.subOperations) {
      console.warn(`Job ${job.id} has no sub-operations map`);
      return;
    }
    
    console.log(`Initializing sub-operations for job ${job.id} with ${job.method.operations.length} operations`);
    
    // Create sub-operations for each operation in the method
    job.method.operations.forEach((operation, index) => {
      const subOperation: JobSubOperation = {
        id: `${job.id}_subop_${index}`,
        operationIndex: index,
        operation: operation,
        state: 'pending' // All start as pending, will be queued when materials are available
      };
      
      job.subOperations!.set(index, subOperation);
      console.log(`Created sub-operation ${index}: ${operation.name} (state: pending)`);
    });
    
    // Check which sub-operations can start immediately
    this.evaluateSubOperationReadiness(job, facility);
  }
  
  // Evaluate which sub-operations are ready to be queued
  private evaluateSubOperationReadiness(job: MachineSlotJob, facility: Facility): void {
    if (!job.subOperations) return;
    
    console.log(`Evaluating sub-operation readiness for job ${job.id}`);
    
    let newSubOperationsQueued = false;
    
    // Check each pending sub-operation to see if it can start
    for (const [index, subOp] of job.subOperations) {
      if (subOp.state !== 'pending') continue; // Skip already processed sub-operations
      
      // Check if this sub-operation has all required materials
      if (this.canStartSubOperation(job, subOp, facility)) {
        console.log(`Sub-operation ${index} (${subOp.operation.name}) is ready - marking as queued`);
        subOp.state = 'queued';
        newSubOperationsQueued = true;
      } else {
        console.log(`Sub-operation ${index} (${subOp.operation.name}) is not ready - missing materials`);
      }
    }
    
    // If new sub-operations became queued, notify the coordinator
    if (newSubOperationsQueued) {
      console.log(`New sub-operations queued for job ${job.id}, notifying coordinator`);
      globalEventBus.emit(EventType.FACILITY_STATE_CHANGED, {
        facilityId: facility.id,
        readyJobAvailable: true,
        jobId: job.id
      });
    }
  }
  
  // Check if a sub-operation can start based on dependencies and available materials
  private canStartSubOperation(job: MachineSlotJob, subOp: JobSubOperation, facility: Facility): boolean {
    const operation = subOp.operation;
    
    // FIRST: Check operation dependencies - must complete operations in sequence
    if (subOp.operationIndex > 0) {
      // Check if all previous operations are completed
      for (let i = 0; i < subOp.operationIndex; i++) {
        const previousSubOp = job.subOperations?.get(i);
        if (!previousSubOp || previousSubOp.state !== 'completed') {
          console.log(`Sub-operation ${subOp.operationIndex} (${subOp.operation.name}) blocked by incomplete operation ${i}`);
          return false;
        }
      }
    }
    
    // SECOND: Check material availability
    if (!operation.materialConsumption) {
      return true; // No materials needed and dependencies satisfied
    }
    
    // Check each material requirement
    for (const consumption of operation.materialConsumption) {
      const needed = consumption.count * job.quantity;
      let available: number;
      
      // Check job inventory first
      if (consumption.tags && consumption.tags.length > 0) {
        available = inventoryManager.getAvailableQuantityWithTags(
          job.jobInventory, 
          consumption.itemId, 
          consumption.tags, 
          consumption.maxQuality
        );
      } else {
        // For assembly operations, exclude damaged items (require functional components)
        // Check operation name since MachineOperation doesn't have operationType
        if (operation.name.toLowerCase().includes('assembl')) {
          // Get all items of this type
          const allItems = inventoryManager.getAllItems(job.jobInventory)
            .filter(item => item.baseItemId === consumption.itemId);
          
          // Count only non-damaged items (functional components)
          available = allItems
            .filter(item => !item.tags.includes(ItemTag.DAMAGED))
            .reduce((sum, item) => sum + item.quantity, 0);
        } else {
          available = inventoryManager.getAvailableQuantity(job.jobInventory, consumption.itemId);
        }
      }
      
      // For raw materials, also check facility inventory
      const baseItem = getBaseItem(consumption.itemId);
      if (available < needed && baseItem?.manufacturingType === ItemManufacturingType.RAW_MATERIAL && facility.inventory) {
        const facilityAvailable = consumption.tags && consumption.tags.length > 0
          ? inventoryManager.getAvailableQuantityWithTags(
              facility.inventory,
              consumption.itemId,
              consumption.tags,
              consumption.maxQuality
            )
          : inventoryManager.getAvailableQuantity(facility.inventory, consumption.itemId);
          
        available += facilityAvailable;
      }
      
      if (available < needed) {
        console.log(`Sub-operation ${subOp.id} lacks materials: need ${needed} ${consumption.itemId}, have ${available}`);
        return false;
      }
    }
    
    return true;
  }
  
  // Analyze operations to group them by type and identify dependencies
  private analyzeOperationDependencies(operations: MachineOperation[]): Map<string, Array<{operation: MachineOperation, index: number}>> {
    const groups = new Map<string, Array<{operation: MachineOperation, index: number}>>();
    
    // Group operations by their required machine type
    operations.forEach((op, index) => {
      const machineType = op.requiredTag.category;
      if (!groups.has(machineType)) {
        groups.set(machineType, []);
      }
      groups.get(machineType)!.push({ operation: op, index });
    });
    
    return groups;
  }
  
  // Create an independent sub-job that can run in parallel
  private createIndependentSubJob(
    parentJob: MachineSlotJob, 
    operation: MachineOperation,
    operationIndex: number
  ): MachineSlotJob {
    // Create a single-operation method
    const subMethod: MachineBasedMethod = {
      ...parentJob.method,
      id: `${parentJob.method.id}_sub_${operationIndex}`,
      name: `${operation.name} (Sub-job)`,
      operations: [operation]
    };
    
    // Create the sub-job
    const subJob: MachineSlotJob = {
      id: `${parentJob.id}_sub_${operationIndex}`,
      facilityId: parentJob.facilityId,
      productId: parentJob.productId,
      method: subMethod,
      quantity: parentJob.quantity,
      priority: parentJob.priority,
      rushOrder: parentJob.rushOrder,
      state: 'queued',
      createdAt: Date.now(),
      currentOperationIndex: 0,
      completedOperations: [],
      
      // Share the parent's inventory
      jobInventory: parentJob.jobInventory,
      operationProducts: parentJob.operationProducts,
      consumedMaterials: parentJob.consumedMaterials || new Map(),
      
      // Mark as sub-job
      isParallelOperation: true,
      parentJobId: parentJob.id,
      originalOperationIndex: operationIndex // Track which operation this was in the parent
    };
    
    return subJob;
  }
  
  // Move initial materials for job start - backwards planning approach
  private moveJobMaterials(job: MachineSlotJob, facility: Facility): void {
    if (!facility.inventory) {
      console.warn('Facility has no inventory system');
      return;
    }
    
    // Backwards planning approach: Only move input items for the workflow
    // Materials for operations are moved just-in-time when operations start
    
    // For repair workflows, move the damaged item being repaired
    if (job.method.name.toLowerCase().includes('repair')) {
      console.log(`Repair job ${job.id}: Looking for damaged item to repair`);
      
      // Find the damaged item in facility inventory that matches the target product
      const damagedItems = inventoryManager.getAllItems(facility.inventory)
        .filter(item => {
          return item.baseItemId === job.productId && 
                 (item.tags.includes(ItemTag.DAMAGED) || item.quality < 50);
        })
        .slice(0, job.quantity); // Only take what we need
      
      if (damagedItems.length > 0) {
        for (const item of damagedItems) {
          inventoryManager.removeItem(facility.inventory, item.id, item.quantity);
          inventoryManager.addItem(job.jobInventory, item);
          console.log(`Moved damaged ${item.baseItemId} to repair job ${job.id}`);
        }
      } else {
        console.warn(`No damaged ${job.productId} found for repair job ${job.id}`);
      }
      
    } else if (job.method.name.toLowerCase().includes('disassembl')) {
      console.log(`Disassembly job ${job.id}: Looking for item to disassemble`);
      
      // For disassembly jobs, we need to find the input item from the first operation's material consumption
      const firstOperation = job.method.operations[0];
      if (firstOperation && firstOperation.materialConsumption && firstOperation.materialConsumption.length > 0) {
        const inputItemId = firstOperation.materialConsumption[0].itemId;
        const requiredTags = firstOperation.materialConsumption[0].tags || [];
        
        console.log(`Disassembly job ${job.id}: Looking for ${inputItemId} with tags:`, requiredTags);
        
        // Find items that match the required criteria
        const allItems = inventoryManager.getAllItems(facility.inventory);
        const suitableItems = allItems.filter(item => {
          const matchesItemId = item.baseItemId === inputItemId;
          const matchesTags = requiredTags.length === 0 || requiredTags.every(tag => item.tags.includes(tag));
          return matchesItemId && matchesTags;
        }).slice(0, job.quantity);
        
        console.log(`Found ${suitableItems.length} suitable items for disassembly`);
        
        for (const item of suitableItems) {
          inventoryManager.removeItem(facility.inventory, item.id, item.quantity);
          inventoryManager.addItem(job.jobInventory, item);
          console.log(`Moved ${item.baseItemId} (tags: ${item.tags}) to disassembly job ${job.id}`);
        }
        
        if (suitableItems.length === 0) {
          console.warn(`No suitable ${inputItemId} found for disassembly job ${job.id}`);
        }
      } else {
        console.error(`Disassembly job ${job.id} has no material consumption defined in first operation`);
      }
      
    } else {
      // For manufacturing jobs, don't move materials upfront
      // Materials will be moved just-in-time when each operation starts
      console.log(`Manufacturing job ${job.id}: Materials will be moved just-in-time`);
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
    // All jobs now use the unified dynamic system
    
    // NEW: Check materialConsumption first
    if (operation.materialConsumption) {
      for (const consumption of operation.materialConsumption) {
        const needed = consumption.count * job.quantity;
        let available: number;
        
        // Check both job inventory AND facility inventory for raw materials
        {
          const baseItem = getBaseItem(consumption.itemId);
          const isRawMaterial = baseItem?.manufacturingType === ItemManufacturingType.RAW_MATERIAL;
          
          // Check job inventory first
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
          
          // If not enough in job inventory and it's a raw material, check facility inventory
          if (available < needed && isRawMaterial && facility.inventory) {
            const facilityAvailable = consumption.tags && consumption.tags.length > 0
              ? inventoryManager.getAvailableQuantityWithTags(
                  facility.inventory,
                  consumption.itemId,
                  consumption.tags,
                  consumption.maxQuality
                )
              : inventoryManager.getAvailableQuantity(facility.inventory, consumption.itemId);
              
            available += facilityAvailable;
          }
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
    // All jobs now use the unified dynamic system
    
    // Pull raw materials from facility if needed
    if (operation.materialConsumption) {
      for (const consumption of operation.materialConsumption) {
        const needed = consumption.count * job.quantity;
        const baseItem = getBaseItem(consumption.itemId);
        const isRawMaterial = baseItem?.manufacturingType === ItemManufacturingType.RAW_MATERIAL;
        
        // Check how much we have in job inventory
        let inJobInventory: number;
        if (consumption.tags && consumption.tags.length > 0) {
          inJobInventory = inventoryManager.getAvailableQuantityWithTags(
            job.jobInventory,
            consumption.itemId,
            consumption.tags,
            consumption.maxQuality
          );
        } else {
          inJobInventory = inventoryManager.getAvailableQuantity(job.jobInventory, consumption.itemId);
        }
        
        // If we need more and it's a raw material, pull from facility
        if (inJobInventory < needed && isRawMaterial && facility.inventory) {
          const stillNeeded = needed - inJobInventory;
          
          let itemsToMove: ItemInstance[];
          if (consumption.tags && consumption.tags.length > 0) {
            itemsToMove = inventoryManager.getBestQualityItemsWithTags(
              facility.inventory,
              consumption.itemId,
              stillNeeded,
              consumption.tags,
              consumption.maxQuality
            );
          } else {
            itemsToMove = inventoryManager.getBestQualityItems(
              facility.inventory,
              consumption.itemId,
              stillNeeded
            );
          }
          
          // Move items from facility to job
          for (const item of itemsToMove) {
            inventoryManager.removeItem(facility.inventory, item.id, item.quantity);
            inventoryManager.addItem(job.jobInventory, item);
          }
          
          console.log(`Manufacturing v2 job ${job.id} pulled ${itemsToMove.length} ${consumption.itemId} from facility`);
        }
      }
    }
    
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
  
  // Update a single workspace - EVENT-DRIVEN VERSION (no polling)
  private updateWorkspace(workspace: MachineWorkspace, deltaTime: number): void {
    const facility = this.getFacility(workspace.facilityId);
    if (!facility) return;
    
    // Only process machines that are currently working - no job assignment polling
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
    
    // Job assignment is now event-driven - happens when machines become available
    // No more polling for jobs!
  }
  
  // Execute assignment decision from coordinator
  private executeCoordinatorAssignment(jobId: string, machineId: string, facilityId: string, subOperationIndex: number): void {
    const workspace = this.workspaces.get(facilityId);
    const facility = this.getFacility(facilityId);
    
    console.log(`🔍 DEBUG: executeCoordinatorAssignment for facility ${facilityId}`);
    console.log(`🔍 DEBUG: workspace found: ${!!workspace}, facility found: ${!!facility}`);
    console.log(`🔍 DEBUG: available workspaces: ${Array.from(this.workspaces.keys())}`);
    console.log(`🔍 DEBUG: available facilities: ${Array.from(this.facilities.keys())}`);
    
    if (!workspace || !facility) {
      console.error(`Cannot execute assignment: workspace or facility not found for ${facilityId}`);
      return;
    }
    
    // Get the specific machine
    const machine = workspace.machines.get(machineId);
    if (!machine) {
      console.error(`Machine ${machineId} not found in workspace`);
      return;
    }
    
    if (machine.currentJob) {
      console.warn(`Machine ${machineId} is already occupied, cannot assign job ${jobId}`);
      return;
    }
    
    // Find the job in job state manager (check both ready and in-progress jobs)
    const readyJobs = globalJobStateManager.getReadyJobs();
    const inProgressJobs = globalJobStateManager.getJobsByState(JobReadinessState.IN_PROGRESS);
    const allAssignableJobs = [...readyJobs, ...inProgressJobs];
    
    const job = allAssignableJobs.find(j => j.id === jobId);
    
    if (!job) {
      console.error(`Job ${jobId} not found in assignable jobs (ready: ${readyJobs.length}, in-progress: ${inProgressJobs.length})`);
      return;
    }
    
    if (!job.subOperations) {
      console.error(`Job ${jobId} has no sub-operations`);
      return;
    }
    
    // Get the specific sub-operation
    const subOp = job.subOperations.get(subOperationIndex);
    if (!subOp || subOp.state !== 'queued') {
      console.error(`Sub-operation ${subOperationIndex} not ready for job ${jobId}`);
      return;
    }
    
    // Execute the assignment
    console.log(`✅ Executing coordinator assignment: Job ${jobId} sub-op ${subOperationIndex} → Machine ${machineId}`);
    this.startSubOperationOnMachine(job, subOp, machine, facility);
    
    // Note: Job state manager is updated by startSubOperationOnMachine
  }
  
  // DEPRECATED: Job assignment is now handled by coordinator
  // This method is kept for legacy compatibility but should not be called
  private tryAssignJobToMachine(job: MachineSlotJob, machine: MachineSlot, facility: Facility): boolean {
    console.warn('⚠️  tryAssignJobToMachine called but job assignment is now handled by coordinator!');
    return false;
  }
  
  // REMOVED: Duplicate method that was causing issues with temporary job creation
  
  // LEGACY: This method is now replaced by event-driven assignment
  private assignSubOperations(workspace: MachineWorkspace, facility: Facility, idleMachines: MachineSlot[]): void {
    console.warn('⚠️  assignSubOperations called but this is now event-driven! This should not happen.');
    
    // Go through all jobs in the queue (including active ones)
    const allJobs = [
      ...workspace.jobQueue,
      ...Array.from(workspace.machines.values())
        .map(machine => machine.currentJob)
        .filter(job => job !== undefined) as MachineSlotJob[]
    ];
    
    // Look for jobs with ready sub-operations
    for (const job of allJobs) {
      if (!job.subOperations) continue;
      if (idleMachines.length === 0) break;
      
      // Re-evaluate sub-operation readiness in case materials have become available
      this.evaluateSubOperationReadiness(job, facility);
      
      // Find queued sub-operations that can be assigned
      for (const [index, subOp] of job.subOperations) {
        if (subOp.state !== 'queued') continue;
        if (idleMachines.length === 0) break;
        
        // Find a suitable machine for this sub-operation
        const suitableMachine = this.findMachineForOperation(subOp.operation, idleMachines, facility);
        
        if (suitableMachine) {
          console.log(`Assigning sub-operation ${index} (${subOp.operation.name}) from job ${job.id} to machine ${suitableMachine.machineId}`);
          
          // Start the sub-operation on the machine
          this.startSubOperationOnMachine(job, subOp, suitableMachine, facility);
          
          // Remove machine from idle list
          const machineIndex = idleMachines.indexOf(suitableMachine);
          if (machineIndex > -1) {
            idleMachines.splice(machineIndex, 1);
          }
        }
      }
    }
  }
  
  // MANUFACTURING V2: Start a sub-operation on a machine
  private startSubOperationOnMachine(
    job: MachineSlotJob, 
    subOp: JobSubOperation, 
    machine: MachineSlot, 
    facility: Facility
  ): void {
    // Update sub-operation state
    subOp.state = 'in_progress';
    subOp.assignedMachineId = machine.machineId;
    subOp.startedAt = this.currentGameTime.totalGameHours;
    
    // Move materials from job inventory for this specific operation
    this.consumeSubOperationMaterials(job, subOp, facility);
    
    // Calculate operation duration
    const equipment = facility.equipment.find(e => e.id === machine.machineId);
    const equipmentDef = equipment ? this.equipmentDefinitions.get(equipment.equipmentId) : null;
    
    let durationMultiplier = 1.0;
    if (equipmentDef) {
      // Find matching tag for efficiency calculation
      const matchingTag = equipmentDef.tags.find(tag => tag.category === subOp.operation.requiredTag.category);
      if (matchingTag && typeof matchingTag.value === 'number') {
        // Check the unit to determine how to calculate efficiency
        if (matchingTag.unit === '%') {
          // Percentage-based efficiency (e.g., 85% efficiency)
          durationMultiplier = Math.max(0.5, 100 / matchingTag.value);
        } else {
          // Level-based capability (e.g., level 1, level 5)
          // Higher levels are better, but don't dramatically reduce time
          // Level 1 = 1.0x time, Level 2 = 0.9x time, Level 5 = 0.6x time
          durationMultiplier = Math.max(0.5, 1.0 / Math.sqrt(matchingTag.value));
        }
      }
    }
    
    const baseDurationGameHours = this.gameMinutesToHours(subOp.operation.baseDurationMinutes);
    const adjustedDuration = baseDurationGameHours * durationMultiplier;
    
    // Set up sub-operation progress tracking
    subOp.progress = {
      startTime: this.currentGameTime.totalGameHours,
      estimatedCompletion: this.currentGameTime.totalGameHours + adjustedDuration,
      lastUpdateTime: Date.now()
    };
    
    // Create a temporary job-like structure for machine tracking
    const machineJob: MachineSlotJob = {
      ...job,
      id: subOp.id, // Use sub-operation ID for tracking
      method: {
        ...job.method,
        operations: [subOp.operation] // Single operation for this machine
      },
      currentOperationIndex: 0,
      state: 'in_progress'
    };
    
    machine.currentJob = machineJob;
    machine.currentProgress = {
      stepIndex: 0, // Sub-operations are single-step
      startTime: this.currentGameTime.totalGameHours,
      estimatedCompletion: this.currentGameTime.totalGameHours + adjustedDuration,
      lastUpdateTime: Date.now()
    };
    
    // Update job state manager with IN_PROGRESS status (suppress event to avoid duplicates)
    globalJobStateManager.markJobStarted(job.id, true);
    
    console.log(`Started sub-operation ${subOp.operation.name} on machine ${machine.machineId} (duration: ${adjustedDuration.toFixed(2)} hours)`);
  }
  
  // MANUFACTURING V2: Consume materials for a specific sub-operation
  private consumeSubOperationMaterials(job: MachineSlotJob, subOp: JobSubOperation, facility: Facility): void {
    if (!subOp.operation.materialConsumption) return;
    
    console.log(`Consuming materials for sub-operation ${subOp.operation.name}`);
    
    for (const consumption of subOp.operation.materialConsumption) {
      const needed = consumption.count * job.quantity;
      let itemsToConsume: ItemInstance[];
      
      // First, try to get from job inventory
      if (consumption.tags && consumption.tags.length > 0) {
        itemsToConsume = inventoryManager.getBestQualityItemsWithTags(
          job.jobInventory,
          consumption.itemId,
          needed,
          consumption.tags,
          consumption.maxQuality
        );
      } else {
        // For assembly operations, exclude damaged items (require functional components)
        // Check operation name since MachineOperation doesn't have operationType
        if (subOp.operation.name.toLowerCase().includes('assembl')) {
          // Get all items and filter out damaged ones
          const allItems = inventoryManager.getAllItems(job.jobInventory)
            .filter(item => item.baseItemId === consumption.itemId && !item.tags.includes(ItemTag.DAMAGED))
            .sort((a, b) => b.quality - a.quality); // Sort by quality, best first
          
          // Take items up to needed quantity
          itemsToConsume = [];
          let remaining = needed;
          for (const item of allItems) {
            if (remaining <= 0) break;
            const takeQuantity = Math.min(remaining, item.quantity);
            if (takeQuantity > 0) {
              itemsToConsume.push({
                ...item,
                quantity: takeQuantity
              });
              remaining -= takeQuantity;
            }
          }
        } else {
          itemsToConsume = inventoryManager.getBestQualityItems(
            job.jobInventory,
            consumption.itemId,
            needed
          );
        }
      }
      
      // If not enough in job inventory, get from facility inventory (for raw materials)
      const stillNeeded = needed - itemsToConsume.reduce((sum, item) => sum + item.quantity, 0);
      if (stillNeeded > 0) {
        const baseItem = getBaseItem(consumption.itemId);
        if (baseItem?.manufacturingType === ItemManufacturingType.RAW_MATERIAL && facility.inventory) {
          let additionalItems: ItemInstance[];
          
          if (consumption.tags && consumption.tags.length > 0) {
            additionalItems = inventoryManager.getBestQualityItemsWithTags(
              facility.inventory,
              consumption.itemId,
              stillNeeded,
              consumption.tags,
              consumption.maxQuality
            );
          } else {
            additionalItems = inventoryManager.getBestQualityItems(
              facility.inventory,
              consumption.itemId,
              stillNeeded
            );
          }
          
          // Move additional items from facility to job inventory, then consume
          for (const item of additionalItems) {
            inventoryManager.removeItem(facility.inventory, item.id, item.quantity);
            inventoryManager.addItem(job.jobInventory, item);
            itemsToConsume.push(item);
          }
        }
      }
      
      // Consume the items from job inventory
      for (const item of itemsToConsume) {
        inventoryManager.removeItem(job.jobInventory, item.id, item.quantity);
        console.log(`Consumed ${item.quantity} ${consumption.itemId} from job inventory`);
      }
    }
  }
  
  
  // Find a machine that can handle a specific operation
  private findMachineForOperation(
    operation: any, // MachineOperation
    availableMachines: MachineSlot[],
    facility: Facility
  ): MachineSlot | null {
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
  
  
  // Find an available machine that can handle the job's current operation
  private findAvailableMachineForJob(
    job: MachineSlotJob, 
    availableMachines: MachineSlot[], 
    facility: Facility
  ): MachineSlot | null {
    const operation = job.method.operations[job.currentOperationIndex];
    if (!operation) {
      console.log(`DEBUG: No operation found for job ${job.id} at index ${job.currentOperationIndex}`);
      return null;
    }
    
    console.log(`DEBUG: Looking for machine for operation "${operation.name}"`);
    console.log(`DEBUG: Operation requires:`, operation.requiredTag);
    console.log(`DEBUG: Available machines:`, availableMachines.length);
    
    for (const machine of availableMachines) {
      const equipment = facility.equipment.find(e => e.id === machine.machineId);
      if (!equipment) {
        console.log(`DEBUG: Machine ${machine.machineId} has no equipment record`);
        continue;
      }
      
      const def = this.equipmentDefinitions.get(equipment.equipmentId);
      if (!def) {
        console.log(`DEBUG: Equipment ${equipment.equipmentId} has no definition`);
        continue;
      }
      
      console.log(`DEBUG: Checking machine ${machine.machineId} (${def.name})`);
      console.log(`DEBUG: Equipment tags:`, def.tags);
      
      // Check if machine provides required tag
      const providesTag = def.tags.some(tag => {
        console.log(`DEBUG: Comparing tag ${tag.category} (value: ${tag.value}) with required ${operation.requiredTag.category} (min: ${operation.requiredTag.minimum})`);
        
        if (tag.category !== operation.requiredTag.category) {
          console.log(`DEBUG: Tag category mismatch`);
          return false;
        }
        
        if (typeof operation.requiredTag.minimum === 'boolean') {
          const matches = tag.value === true;
          console.log(`DEBUG: Boolean match: ${matches}`);
          return matches;
        } else {
          const matches = typeof tag.value === 'number' && tag.value >= operation.requiredTag.minimum;
          console.log(`DEBUG: Numeric match: tag.value (${tag.value}) >= minimum (${operation.requiredTag.minimum}) = ${matches}`);
          return matches;
        }
      });
      
      console.log(`DEBUG: Machine ${machine.machineId} provides required tag: ${providesTag}`);
      
      if (providesTag) {
        console.log(`DEBUG: Selected machine ${machine.machineId} for operation ${operation.name}`);
        return machine;
      }
    }
    
    console.log(`DEBUG: No suitable machine found for operation ${operation.name}`);
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
    if (!job) {
      console.log(`DEBUG: completeOperation called but no current job on machine`);
      return;
    }
    
    console.log(`DEBUG: Completing operation for job ${job.id}`);
    
    // Check if this is a Manufacturing v2 sub-operation
    if (job.id.includes('_subop_')) {
      console.log(`DEBUG: Job ${job.id} is a sub-operation, using sub-operation completion logic`);
      this.completeSubOperation(workspace, machine, facility, job);
      return;
    }
    
    console.log(`DEBUG: Job ${job.id} is a regular job, using standard completion logic`);
    
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
    
    // Emit machine available event for coordinator
    const equipment = facility.equipment.find(e => e.id === machine.machineId);
    if (equipment) {
      const equipmentDef = this.equipmentDefinitions.get(equipment.equipmentId);
      if (equipmentDef) {
        const capabilities = equipmentDef.tags.map(t => t.category);
        const machineEventEmitter = EventUtils.createMachineEventEmitter(machine.machineId, facility.id);
        machineEventEmitter.becameAvailable(capabilities);
      }
    }
    
    // Check if this is a sub-job
    if (job.isParallelOperation && job.parentJobId) {
      // Sub-job complete, just mark it as completed
      job.state = 'completed';
      job.completedAt = this.currentGameTime.totalGameHours;
      workspace.completedJobs.push(job);
      console.log(`Sub-job ${job.id} completed!`);
    } else if (job.currentOperationIndex >= job.method.operations.length) {
      // Main job complete! Move any remaining items from job inventory to facility
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
  
  // MANUFACTURING V2: Complete a sub-operation
  private completeSubOperation(
    workspace: MachineWorkspace, 
    machine: MachineSlot,
    facility: Facility,
    subOperationJob: MachineSlotJob
  ): void {
    console.log(`DEBUG: Completing sub-operation ${subOperationJob.id}`);
    
    // Find the parent job and sub-operation
    const parentJobId = subOperationJob.id.split('_subop_')[0];
    const subOpIndex = parseInt(subOperationJob.id.split('_subop_')[1]);
    
    console.log(`DEBUG: Looking for parent job ${parentJobId}, sub-operation index ${subOpIndex}`);
    
    // Find parent job from job state manager (since jobs are now managed there)
    const allJobStates = globalJobStateManager.getAllJobStates();
    const allJobs = allJobStates.map(jobState => jobState.job);
    
    console.log(`DEBUG: Searching in ${allJobs.length} total jobs from JobStateManager`);
    console.log(`DEBUG: Job IDs available:`, allJobs.map(j => j.id));
    
    const parentJob = allJobs.find(job => job.id === parentJobId);
    if (!parentJob || !parentJob.subOperations) {
      console.error(`DEBUG: Could not find parent job ${parentJobId} for sub-operation ${subOperationJob.id}`);
      console.error(`DEBUG: Parent job found: ${!!parentJob}, has subOperations: ${parentJob?.subOperations ? 'yes' : 'no'}`);
      return;
    }
    
    console.log(`DEBUG: Found parent job ${parentJob.id} with ${parentJob.subOperations.size} sub-operations`);
    
    const subOp = parentJob.subOperations.get(subOpIndex);
    if (!subOp) {
      console.error(`Could not find sub-operation ${subOpIndex} in parent job ${parentJobId}`);
      return;
    }
    
    const operation = subOp.operation;
    
    // Check for failure
    if (operation.can_fail && Math.random() < operation.failure_chance) {
      console.log(`Sub-operation failed: ${operation.name}`);
      subOp.state = 'failed';
    } else {
      // Success! Handle material transformation
      this.processSubOperationTransformation(parentJob, subOp);
      
      // Mark sub-operation complete
      subOp.state = 'completed';
      subOp.completedAt = this.currentGameTime.totalGameHours;
      
      console.log(`Sub-operation ${subOp.operation.name} completed for job ${parentJob.id}`);
      
      // Check if any new sub-operations can start with the produced materials
      this.evaluateSubOperationReadiness(parentJob, facility);
      
      // Re-evaluate parent job state in case it has new ready sub-operations
      globalJobStateManager.evaluateJobState(parentJob.id);
    }
    
    // Clear machine
    machine.currentJob = undefined;
    machine.currentProgress = undefined;
    
    // EMIT EVENTS: Operation completed and machine available
    globalEventBus.emit(EventType.OPERATION_COMPLETED, {
      jobId: parentJob.id,
      operationIndex: subOpIndex,
      facilityId: facility.id,
      machineId: machine.machineId,
      outputs: parentJob.operationProducts.get(subOpIndex) || []
    });
    
    // Emit machine available event to trigger job assignment
    const machineEventEmitter = EventUtils.createMachineEventEmitter(machine.machineId, facility.id);
    const equipment = facility.equipment.find(e => e.id === machine.machineId);
    const equipmentDef = equipment ? this.equipmentDefinitions.get(equipment.equipmentId) : undefined;
    const capabilities = equipmentDef ? equipmentDef.tags.map(t => t.category) : [];
    machineEventEmitter.becameAvailable(capabilities);
    
    // Check if parent job is complete
    this.checkParentJobCompletion(workspace, parentJob, facility);
  }
  
  // MANUFACTURING V2: Process material transformation for a sub-operation
  private processSubOperationTransformation(job: MachineSlotJob, subOp: JobSubOperation): void {
    const operation = subOp.operation;
    
    // SPECIAL CASE: Component Extraction - extract components from consumed item to job inventory
    if (operation.name === 'Component Extraction') {
      console.log(`Processing component extraction for ${operation.name}`);
      this.extractComponentsToJobInventory(job, subOp, operation);
      return;
    }
    
    // STANDARD CASE: Use defined materialProduction
    if (operation.materialProduction) {
      for (const production of operation.materialProduction) {
        const producedCount = production.count * job.quantity;
        
        // Create the produced items
        for (let i = 0; i < producedCount; i++) {
          const producedItem = createItemInstance({
            baseItemId: production.itemId,
            quantity: 1,
            quality: production.quality || 75,
            tags: production.tags || []
          });
          
          // Add to job inventory
          inventoryManager.addItem(job.jobInventory, producedItem);
        }
        
        console.log(`Sub-operation produced ${producedCount} ${production.itemId}`);
      }
    }
  }
  
  // Extract components from disassembled item and add to job inventory
  private extractComponentsToJobInventory(job: MachineSlotJob, subOp: JobSubOperation, operation: any): void {
    // Find the consumed item to determine what components to extract
    if (!operation.materialConsumption || operation.materialConsumption.length === 0) {
      console.warn(`Component extraction operation has no material consumption defined`);
      return;
    }
    
    const consumedItemId = operation.materialConsumption[0].itemId;
    const baseItem = getBaseItem(consumedItemId);
    if (!baseItem || !baseItem.assemblyComponents) {
      console.warn(`Cannot extract components: no assembly definition for ${consumedItemId}`);
      return;
    }
    
    console.log(`Extracting components from ${baseItem.name} to job inventory`);
    
    // Extract each component according to the assembly definition
    for (const component of baseItem.assemblyComponents) {
      // For extraction, preserve roughly 80% of original quality with some variation
      const baseQuality = 25; // Low quality for damaged items being disassembled
      const qualityVariation = (Math.random() - 0.5) * 20; // ±10% variation
      const componentQuality = Math.round(Math.max(5, Math.min(95, baseQuality + qualityVariation)));
      
      // Determine component condition tags
      const componentTags: import('../types').ItemTag[] = [];
      if (componentQuality < 30) {
        componentTags.push('damaged' as import('../types').ItemTag);
      }
      
      // Create extracted component
      const extractedComponent = createItemInstance({
        baseItemId: component.componentId,
        quantity: component.quantity * job.quantity,
        quality: componentQuality,
        tags: componentTags,
        metadata: {
          source: 'extraction',
          extractedFrom: consumedItemId,
          extractedAt: this.currentGameTime.totalGameHours
        }
      });
      
      // Add to job inventory for assessment
      inventoryManager.addItem(job.jobInventory, extractedComponent);
      
      console.log(`Extracted ${component.quantity}x ${component.componentId} at ${componentQuality}% quality`);
    }
  }
  
  // MANUFACTURING V2: Check if parent job is complete
  private checkParentJobCompletion(
    workspace: MachineWorkspace, 
    parentJob: MachineSlotJob, 
    facility: Facility
  ): void {
    if (!parentJob.subOperations) return;
    
    // Check if all sub-operations are complete
    const allComplete = Array.from(parentJob.subOperations.values()).every(
      subOp => subOp.state === 'completed' || subOp.state === 'failed'
    );
    
    if (allComplete) {
      console.log(`All sub-operations complete for job ${parentJob.id}`);
      
      // Remove parent job from queue if it's still there
      const queueIndex = workspace.jobQueue.findIndex(job => job.id === parentJob.id);
      if (queueIndex !== -1) {
        workspace.jobQueue.splice(queueIndex, 1);
      }
      
      // Mark parent job as complete
      parentJob.state = 'completed';
      parentJob.completedAt = this.currentGameTime.totalGameHours;
      
      // Move any remaining items from job inventory to facility
      this.finalizeJobInventory(parentJob, facility);
      
      // Add to completed jobs
      workspace.completedJobs.push(parentJob);
      
      // Trigger completion callback
      if (this.onJobComplete) {
        this.onJobComplete(parentJob);
      }
      
      console.log(`Manufacturing v2 job ${parentJob.id} completed!`);
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
    
    console.log(`Finalizing job ${job.id} - moving items from job inventory to facility`);
    
    // Collect all items to move (create copies before removing from job inventory)
    const itemsToMove: ItemInstance[] = [];
    for (const group of job.jobInventory.groups.values()) {
      for (const slot of group.slots) {
        for (const instance of slot.stack.instances) {
          // Create a copy of the item instance
          const itemCopy: ItemInstance = {
            id: instance.id,
            baseItemId: instance.baseItemId,
            quantity: instance.quantity,
            quality: instance.quality,
            tags: [...instance.tags],
            acquiredAt: instance.acquiredAt,
            lastModified: Date.now(),
            metadata: instance.metadata ? { ...instance.metadata } : undefined
          };
          itemsToMove.push(itemCopy);
          console.log(`Will move ${itemCopy.quantity}x ${itemCopy.baseItemId} (quality: ${itemCopy.quality}%) to facility`);
        }
      }
    }
    
    // Remove all items from job inventory
    for (const item of itemsToMove) {
      inventoryManager.removeItem(job.jobInventory, item.id, item.quantity);
    }
    
    // Add all items to facility inventory
    let successfulMoves = 0;
    for (const item of itemsToMove) {
      // Debug: Check if base item exists
      const baseItem = getBaseItem(item.baseItemId);
      
      const success = inventoryManager.addItem(facility.inventory, item);
      if (success) {
        successfulMoves++;
        console.log(`Successfully moved ${item.quantity}x ${item.baseItemId} to facility inventory`);
      } else {
        console.error(`Failed to move ${item.quantity}x ${item.baseItemId} to facility inventory - baseItem: ${!!baseItem}`);
      }
    }
    
    console.log(`Job ${job.id} finalized - ${successfulMoves}/${itemsToMove.length} items successfully moved to facility inventory`);
  }
}