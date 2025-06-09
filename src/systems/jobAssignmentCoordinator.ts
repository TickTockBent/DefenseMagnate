// Job Assignment Coordinator
// Central authority for matching ready jobs with available machines

import { globalEventBus, EventType, EventUtils } from './eventBus';
import { globalJobStateManager, JobReadinessState } from './jobStateManager';
import type { MachineSlotJob, Facility, Equipment, MachineSlot } from '../types';
import { JobPriority } from '../constants/enums';

// Assignment decision data
interface AssignmentCandidate {
  jobId: string;
  machineId: string;
  facilityId: string;
  compatibilityScore: number;
  estimatedDuration: number;
}

// Assignment result
interface JobAssignment {
  jobId: string;
  machineId: string;
  facilityId: string;
  subOperationIndex: number;
  operationName: string;
  estimatedDuration: number;
}

export class JobAssignmentCoordinator {
  private facilities: Map<string, Facility> = new Map();
  private equipmentDefinitions: Map<string, Equipment> = new Map();
  private availableMachines: Map<string, Set<string>> = new Map(); // facilityId -> machineIds
  private assignmentHistory: JobAssignment[] = [];

  constructor(equipmentDatabase: Map<string, Equipment>) {
    this.equipmentDefinitions = equipmentDatabase;
    this.initializeEventHandlers();
  }

  // Set up event listeners
  private initializeEventHandlers(): void {
    // Listen for jobs becoming ready
    globalEventBus.subscribe(EventType.FACILITY_STATE_CHANGED, this.onFacilityStateChanged.bind(this));
    
    // Listen for machines becoming available
    globalEventBus.subscribe(EventType.MACHINE_AVAILABLE, this.onMachineAvailable.bind(this));
    
    // Listen for machines becoming occupied
    globalEventBus.subscribe(EventType.MACHINE_OCCUPIED, this.onMachineOccupied.bind(this));
    
    console.log('🎯 JobAssignmentCoordinator: Event handlers initialized');
  }

  // Set equipment database (called by MachineWorkspaceManager)
  setEquipmentDatabase(equipmentDatabase: Map<string, Equipment>): void {
    this.equipmentDefinitions = equipmentDatabase;
    console.log(`🎯 JobAssignmentCoordinator: Equipment database updated with ${equipmentDatabase.size} definitions`);
  }

  // Register a facility with the coordinator
  registerFacility(facility: Facility): void {
    this.facilities.set(facility.id, facility);
    
    // Initialize available machines set
    if (!this.availableMachines.has(facility.id)) {
      this.availableMachines.set(facility.id, new Set());
    }
    
    console.log(`🎯 JobAssignmentCoordinator: Registered facility ${facility.id}`);
  }

  // Check if a job has queued sub-operations that can be assigned
  private hasQueuedSubOperations(job: MachineSlotJob): boolean {
    if (!job.subOperations) return false;
    
    // Check for any sub-operations in 'queued' state
    return Array.from(job.subOperations.values()).some(subOp => subOp.state === 'queued');
  }

  // Event handler: Facility state changed (new ready jobs)
  private onFacilityStateChanged(event: any): void {
    const { facilityId, readyJobAvailable, jobId } = event.data;
    
    if (readyJobAvailable && jobId) {
      console.log(`🎯 JobAssignmentCoordinator: New ready job ${jobId} in facility ${facilityId}`);
      this.tryAssignReadyJobs(facilityId);
    }
  }

  // Event handler: Machine became available
  private onMachineAvailable(event: any): void {
    const { facilityId, machineId, capabilities } = event.data;
    
    console.log(`🎯 JobAssignmentCoordinator: Machine ${machineId} available in facility ${facilityId}`);
    
    // Track available machine
    if (!this.availableMachines.has(facilityId)) {
      this.availableMachines.set(facilityId, new Set());
    }
    this.availableMachines.get(facilityId)!.add(machineId);
    
    // Try to assign jobs to this newly available machine
    this.tryAssignReadyJobs(facilityId);
  }

  // Event handler: Machine became occupied
  private onMachineOccupied(event: any): void {
    const { facilityId, machineId } = event.data;
    
    // Remove from available machines
    const availableInFacility = this.availableMachines.get(facilityId);
    if (availableInFacility) {
      availableInFacility.delete(machineId);
    }
    
    console.log(`🎯 JobAssignmentCoordinator: Machine ${machineId} now occupied`);
  }

  // Main assignment logic: try to match ready jobs with available machines
  private tryAssignReadyJobs(facilityId: string): void {
    const facility = this.facilities.get(facilityId);
    if (!facility) {
      console.warn(`JobAssignmentCoordinator: Facility ${facilityId} not registered`);
      return;
    }

    const availableMachinesInFacility = this.availableMachines.get(facilityId) || new Set();
    if (availableMachinesInFacility.size === 0) {
      console.log(`🎯 JobAssignmentCoordinator: No available machines in facility ${facilityId}`);
      return;
    }

    // Get jobs that can be assigned: both READY jobs and IN_PROGRESS jobs with queued sub-operations
    const readyJobs = globalJobStateManager.getReadyJobs()
      .filter(job => job.facilityId === facilityId);
    
    const inProgressJobs = globalJobStateManager.getJobsByState(JobReadinessState.IN_PROGRESS)
      .filter(job => job.facilityId === facilityId)
      .filter(job => this.hasQueuedSubOperations(job));

    const assignableJobs = [...readyJobs, ...inProgressJobs];

    if (assignableJobs.length === 0) {
      console.log(`🎯 JobAssignmentCoordinator: No assignable jobs in facility ${facilityId}`);
      return;
    }

    console.log(`🎯 JobAssignmentCoordinator: Attempting to assign ${assignableJobs.length} assignable jobs (${readyJobs.length} ready, ${inProgressJobs.length} in-progress with queued sub-ops) to ${availableMachinesInFacility.size} available machines`);

    // Find the best assignments
    const assignments = this.findOptimalAssignments(assignableJobs, availableMachinesInFacility, facility);
    
    // Execute assignments
    for (const assignment of assignments) {
      this.executeAssignment(assignment);
    }
  }

  // Find optimal job-machine assignments
  private findOptimalAssignments(
    assignableJobs: MachineSlotJob[], 
    availableMachines: Set<string>, 
    facility: Facility
  ): JobAssignment[] {
    const assignments: JobAssignment[] = [];
    const usedMachines = new Set<string>();
    const assignedJobs = new Set<string>();

    // Generate all possible assignments with compatibility scores
    const candidates: AssignmentCandidate[] = [];
    
    for (const job of assignableJobs) {
      if (!job.subOperations) continue;
      
      // Find ready sub-operations for this job
      for (const [subOpIndex, subOp] of job.subOperations) {
        if (subOp.state !== 'queued') continue;
        
        // Check each available machine
        for (const machineId of availableMachines) {
          if (usedMachines.has(machineId)) continue;
          
          const compatibility = this.calculateCompatibility(subOp.operation, machineId, facility);
          const equipment = facility.equipment.find(e => e.id === machineId);
          const equipmentDef = this.equipmentDefinitions.get(equipment?.equipmentId || '');
          console.log(`🔍 COMPATIBILITY: Machine ${machineId} (${equipmentDef?.name || 'unknown'}) for operation "${subOp.operation.name}" - score: ${compatibility.score}, duration: ${compatibility.estimatedDuration}`);
          
          if (compatibility.score > 0) {
            candidates.push({
              jobId: job.id,
              machineId: machineId,
              facilityId: facility.id,
              compatibilityScore: compatibility.score,
              estimatedDuration: compatibility.estimatedDuration
            });
          }
        }
      }
    }

    // Sort by compatibility score (higher is better) and job priority
    candidates.sort((a, b) => {
      const jobA = assignableJobs.find(j => j.id === a.jobId);
      const jobB = assignableJobs.find(j => j.id === b.jobId);
      
      // First sort by job priority
      const priorityA = this.getJobPriorityScore(jobA);
      const priorityB = this.getJobPriorityScore(jobB);
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      
      // Then by compatibility score
      return b.compatibilityScore - a.compatibilityScore;
    });

    console.log(`🎯 ASSIGNMENT: Sorted candidates:`, candidates.map(c => ({
      jobId: c.jobId,
      machineId: c.machineId,
      score: c.compatibilityScore,
      duration: c.estimatedDuration
    })));

    // Assign jobs greedily (first come, first served with priority)
    for (const candidate of candidates) {
      if (usedMachines.has(candidate.machineId) || assignedJobs.has(candidate.jobId)) {
        continue; // Machine or job already assigned
      }

      const job = assignableJobs.find(j => j.id === candidate.jobId);
      if (!job || !job.subOperations) continue;

      // Find the ready sub-operation for this job
      const readySubOp = Array.from(job.subOperations.entries())
        .find(([index, subOp]) => subOp.state === 'queued');
      
      if (readySubOp) {
        const [subOpIndex, subOp] = readySubOp;
        
        assignments.push({
          jobId: candidate.jobId,
          machineId: candidate.machineId,
          facilityId: candidate.facilityId,
          subOperationIndex: subOpIndex,
          operationName: subOp.operation.name,
          estimatedDuration: candidate.estimatedDuration
        });

        usedMachines.add(candidate.machineId);
        assignedJobs.add(candidate.jobId);
      }
    }

    return assignments;
  }

  // Calculate compatibility between operation and machine
  private calculateCompatibility(
    operation: any, 
    machineId: string, 
    facility: Facility
  ): { score: number; estimatedDuration: number } {
    const equipment = facility.equipment.find(e => e.id === machineId);
    if (!equipment) {
      console.log(`🔍 COMPAT: Equipment not found for machine ${machineId}`);
      return { score: 0, estimatedDuration: 0 };
    }

    const equipmentDef = this.equipmentDefinitions.get(equipment.equipmentId);
    if (!equipmentDef) {
      console.log(`🔍 COMPAT: Equipment definition not found for ${equipment.equipmentId}`);
      return { score: 0, estimatedDuration: 0 };
    }

    console.log(`🔍 COMPAT: Checking machine ${machineId} (${equipmentDef.name}) for operation requiring ${operation.requiredTag.category} >= ${operation.requiredTag.minimum}`);
    console.log(`🔍 COMPAT: Machine provides tags:`, equipmentDef.tags.map(t => `${t.category}=${t.value}`));

    // Check if machine can handle the operation
    const compatibleTag = equipmentDef.tags.find(tag => {
      if (tag.category !== operation.requiredTag.category) return false;
      
      if (typeof operation.requiredTag.minimum === 'boolean') {
        return tag.value === true;
      } else {
        return typeof tag.value === 'number' && tag.value >= operation.requiredTag.minimum;
      }
    });

    if (!compatibleTag) {
      console.log(`🔍 COMPAT: No compatible tag found for ${operation.requiredTag.category}`);
      return { score: 0, estimatedDuration: 0 };
    }

    console.log(`🔍 COMPAT: Compatible tag found: ${compatibleTag.category}=${compatibleTag.value}`);

    // Calculate compatibility score (higher is better)
    let score = 100; // Base compatibility
    
    // Better equipment gets higher score
    if (typeof compatibleTag.value === 'number' && typeof operation.requiredTag.minimum === 'number') {
      const efficiency = compatibleTag.value / operation.requiredTag.minimum;
      const bonus = Math.min(200, efficiency * 10 + Math.log2(efficiency) * 30);
      score += bonus;
      console.log(`🔍 COMPAT: Efficiency: ${compatibleTag.value}/${operation.requiredTag.minimum} = ${efficiency.toFixed(2)}, bonus: ${bonus.toFixed(1)}, total score: ${score.toFixed(1)}`);
    }

    // Estimate duration based on equipment efficiency
    let estimatedDuration = operation.baseDurationMinutes || 60;
    if (typeof compatibleTag.value === 'number' && typeof operation.requiredTag.minimum === 'number') {
      const efficiency = compatibleTag.value / operation.requiredTag.minimum;
      estimatedDuration = estimatedDuration / Math.max(0.5, efficiency); // Better equipment = faster
    }

    return { score, estimatedDuration };
  }

  // Get job priority score for sorting
  private getJobPriorityScore(job?: MachineSlotJob): number {
    if (!job) return 0;
    
    const priorityMap = {
      [JobPriority.CRITICAL]: 200,
      [JobPriority.RUSH]: 150,
      [JobPriority.HIGH]: 100,
      [JobPriority.NORMAL]: 50,
      [JobPriority.LOW]: 10
    };
    
    const basePriority = priorityMap[job.priority] || 50;
    const rushBonus = job.rushOrder ? 50 : 0;
    const ageBonus = Math.max(0, (Date.now() - job.createdAt) / (1000 * 60 * 60)); // 1 point per hour
    
    return basePriority + rushBonus + ageBonus;
  }

  // Execute a job assignment
  private executeAssignment(assignment: JobAssignment): void {
    console.log(`🎯 JobAssignmentCoordinator: ASSIGNING job ${assignment.jobId} to machine ${assignment.machineId} for operation "${assignment.operationName}"`);
    
    // Emit assignment event
    globalEventBus.emit(EventType.JOB_STARTED, {
      jobId: assignment.jobId,
      machineId: assignment.machineId,
      facilityId: assignment.facilityId,
      subOperationIndex: assignment.subOperationIndex,
      operationName: assignment.operationName,
      estimatedDuration: assignment.estimatedDuration
    });

    // Track the assignment
    this.assignmentHistory.push(assignment);
    
    // Remove machine from available list
    const availableInFacility = this.availableMachines.get(assignment.facilityId);
    if (availableInFacility) {
      availableInFacility.delete(assignment.machineId);
    }

    // Note: Job state manager will be updated by MachineWorkspaceManager when assignment is executed
  }

  // Get assignment statistics for debugging
  getStats(): {
    totalAssignments: number;
    availableMachines: number;
    facilitiesRegistered: number;
  } {
    let totalAvailableMachines = 0;
    for (const machines of this.availableMachines.values()) {
      totalAvailableMachines += machines.size;
    }

    return {
      totalAssignments: this.assignmentHistory.length,
      availableMachines: totalAvailableMachines,
      facilitiesRegistered: this.facilities.size
    };
  }
}

// Global coordinator instance (will be initialized with equipment database)
export const globalJobAssignmentCoordinator = new JobAssignmentCoordinator(new Map());