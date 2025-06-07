// LEGACY TYPES - Production Job Queue System - TO BE REMOVED AFTER V1 TESTING
// These types are replaced by MachineSlotJob and MachineWorkspace system
// Kept temporarily to avoid breaking existing imports

import { JobState, StepState, JobPriority } from '../constants/enums';
import type { TagRequirement } from './equipment';
import type { ManufacturingMethod, ManufacturingStep } from './manufacturing';
import type { Material } from './material';

// ManufacturingStep is now imported from manufacturing.ts to avoid conflicts

// Step progress tracking
export interface StepProgress {
  stepId: string;
  state: StepState;
  progress: number; // 0-100%
  startTime?: number; // Game time when started
  estimatedCompletion?: number; // Game time when expected to finish
  
  // Resources currently allocated
  allocatedEquipment?: string[]; // Equipment instance IDs
  allocatedWorker?: string; // Worker ID
  consumedCapacity?: Map<string, number>; // Tag category -> amount consumed
  
  // Quality tracking
  qualityModifier: number; // Cumulative quality effects
  failureRiskModifier: number; // Cumulative failure risk
  
  // Failure/retry information
  failureCount: number;
  lastFailureReason?: string;
}

// Complete production job
export interface ProductionJob {
  id: string;
  facilityId: string;
  
  // Product information
  productId: string;
  method: ManufacturingMethod;
  quantity: number;
  
  // Job metadata
  priority: JobPriority;
  createdAt: number; // Game time
  startedAt?: number;
  completedAt?: number;
  
  // Overall state
  state: JobState;
  currentStepIndex: number;
  
  // Step tracking
  steps: ManufacturingStep[];
  stepProgress: StepProgress[];
  
  // Material tracking
  reservedMaterials: Map<string, number>; // Materials set aside for this job
  consumedMaterials: Map<string, number>; // Materials actually used
  
  // Quality and output
  finalQuality?: number; // 0-100%
  outputQuantity?: number; // May be less than requested due to failures
  
  // Contract association
  contractId?: string; // If fulfilling a specific contract
  
  // Cost tracking
  laborCost: number;
  materialCost: number;
  equipmentCost: number; // Depreciation and operating costs
}

// Job queue for a facility
export interface ProductionQueue {
  facilityId: string;
  jobs: ProductionJob[];
  
  // Scheduling preferences
  schedulingMode: 'fifo' | 'priority' | 'optimal' | 'contract_first';
  allowParallelMethods: boolean; // Can different methods run simultaneously?
  
  // Resource allocation
  equipmentAllocations: Map<string, string[]>; // Equipment ID -> Job IDs using it
  workerAllocations: Map<string, string>; // Worker ID -> Job ID
  
  // Performance tracking
  completedJobsToday: number;
  failedJobsToday: number;
  averageCompletionTime: number;
  bottleneckTracking: Map<string, number>; // Tag category -> wait time
}

// Scheduling decision for next job/step
export interface SchedulingDecision {
  jobId: string;
  stepIndex: number;
  canStart: boolean;
  blockingReasons?: string[];
  estimatedStartTime?: number;
  requiredResources: {
    equipment: string[];
    workers: string[];
    materials: Map<string, number>;
  };
}

// Helper functions for job management

export function calculateStepDuration(
  step: ManufacturingStep,
  totalMethodDuration: number,
  timeMultiplier: number = 1.0
): number {
  return (totalMethodDuration * step.duration_percentage / 100) * timeMultiplier;
}

export function getNextWaitingStep(job: ProductionJob): { step: ManufacturingStep; index: number } | null {
  for (let i = 0; i < job.steps.length; i++) {
    const progress = job.stepProgress[i];
    if (progress.state === StepState.WAITING || 
        (progress.state === StepState.BLOCKED && i === job.currentStepIndex)) {
      return { step: job.steps[i], index: i };
    }
  }
  return null;
}

export function calculateJobProgress(job: ProductionJob): number {
  if (job.steps.length === 0) return 0;
  
  let totalProgress = 0;
  for (let i = 0; i < job.steps.length; i++) {
    const step = job.steps[i];
    const progress = job.stepProgress[i];
    
    if (progress.state === StepState.COMPLETED) {
      totalProgress += step.duration_percentage;
    } else if (progress.state === StepState.IN_PROGRESS) {
      totalProgress += (step.duration_percentage * progress.progress / 100);
    }
  }
  
  return totalProgress;
}

export function estimateJobCompletion(job: ProductionJob, currentTime: number): number {
  let remainingTime = 0;
  
  for (let i = job.currentStepIndex; i < job.steps.length; i++) {
    const step = job.steps[i];
    const progress = job.stepProgress[i];
    
    if (progress.state === StepState.COMPLETED) continue;
    
    const stepDuration = calculateStepDuration(step, 100); // Base duration
    if (progress.state === StepState.IN_PROGRESS) {
      remainingTime += stepDuration * (1 - progress.progress / 100);
    } else {
      remainingTime += stepDuration;
    }
  }
  
  return currentTime + remainingTime;
}

// Priority comparison for job scheduling
export function compareJobPriority(a: ProductionJob, b: ProductionJob): number {
  // First by priority level
  if (a.priority !== b.priority) {
    return b.priority - a.priority;
  }
  
  // Then by contract association
  if (a.contractId && !b.contractId) return -1;
  if (!a.contractId && b.contractId) return 1;
  
  // Finally by creation time (FIFO)
  return a.createdAt - b.createdAt;
}

// Check if a job can start its next step
export function canStartNextStep(
  job: ProductionJob,
  availableEquipment: Map<string, number>,
  availableMaterials: Map<string, number>,
  availableWorkers: string[]
): SchedulingDecision {
  const nextStep = getNextWaitingStep(job);
  if (!nextStep) {
    return {
      jobId: job.id,
      stepIndex: -1,
      canStart: false,
      blockingReasons: ['No waiting steps'],
      requiredResources: {
        equipment: [],
        workers: [],
        materials: new Map()
      }
    };
  }
  
  const { step, index } = nextStep;
  const blockingReasons: string[] = [];
  const requiredResources = {
    equipment: [] as string[],
    workers: [] as string[],
    materials: new Map<string, number>()
  };
  
  // Check equipment requirements
  for (const req of step.required_tags || []) {
    const available = availableEquipment.get(req.category as any) || 0;
    if (typeof req.minimum === 'number' && available < req.minimum * 0.2) {
      blockingReasons.push(`Insufficient ${req.category}: ${available} < ${req.minimum * 0.2}`);
    }
  }
  
  // Check material requirements
  for (const mat of step.material_requirements) {
    const matId = mat.material_id;
    const available = availableMaterials.get(matId) || 0;
    if (available < mat.quantity) {
      blockingReasons.push(`Insufficient ${matId}: ${available} < ${mat.quantity}`);
    }
    requiredResources.materials.set(matId, mat.quantity);
  }
  
  // Check worker requirements
  const availableWorkerCount = availableWorkers.filter(w => 
    // Check worker skill matches labor type
    true // Simplified for now
  ).length;
  
  if (availableWorkerCount === 0) {
    blockingReasons.push(`No available ${step.labor_skill} workers`);
  }
  
  return {
    jobId: job.id,
    stepIndex: index,
    canStart: blockingReasons.length === 0,
    blockingReasons,
    requiredResources
  };
}