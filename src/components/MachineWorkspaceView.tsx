// Machine Workspace View - Shows machines with job slots

import { useGameStore } from '../state/gameStoreWithEquipment';
import { MachineSlot, MachineSlotJob, MachineWorkspace, Facility, ItemTag, ItemManufacturingType } from '../types';
import { Equipment, EquipmentInstance } from '../types';
import { formatGameTime } from '../utils/gameClock';
import { useState, useEffect, useRef, useCallback } from 'react';
import { inventoryManager } from '../utils/inventoryManager';
import { getDisplayName, getQualityDescription } from '../utils/itemSystem';
import { baseItems, getBaseItem } from '../data/baseItems';
import { globalJobStateManager, JobReadinessState } from '../systems/jobStateManager';

// Job State Debug Panel Component
function JobStateDebugPanel() {
  const stats = globalJobStateManager.getStats();
  
  return (
    <div className="terminal-card border-blue-600 mb-4">
      <div className="text-blue-400 font-mono text-sm mb-2">🔍 JOB STATE MANAGER</div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
        <div className="text-center">
          <div className="text-green-400 text-lg font-bold">{stats.ready}</div>
          <div className="text-gray-400">READY</div>
        </div>
        <div className="text-center">
          <div className="text-yellow-400 text-lg font-bold">{stats.active}</div>
          <div className="text-gray-400">ACTIVE</div>
        </div>
        <div className="text-center">
          <div className="text-orange-400 text-lg font-bold">{stats.blocked}</div>
          <div className="text-gray-400">BLOCKED</div>
        </div>
        <div className="text-center">
          <div className="text-emerald-400 text-lg font-bold">{stats.completed}</div>
          <div className="text-gray-400">COMPLETED</div>
        </div>
        <div className="text-center">
          <div className="text-teal-400 text-lg font-bold">{stats.total}</div>
          <div className="text-gray-400">TOTAL</div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format product names for display
function formatProductName(productId: string): string {
  return productId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


interface MachineCardProps {
  equipment: EquipmentInstance;
  definition: Equipment;
  slot: MachineSlot;
  currentTime: number;
}

function MachineSpinner({ equipmentId, isActive }: { equipmentId: string; isActive: boolean }) {
  if (!isActive) return null;
  
  // Determine spinner type based on equipment
  const getSpinnerForEquipment = (equipmentId: string) => {
    switch (equipmentId) {
      case 'workbench_basic':
        return { symbol: '⚒', animation: 'animate-bounce', color: 'text-yellow-400' };
      case 'lathe_manual':
        return { symbol: '◉', animation: 'animate-spin', color: 'text-blue-400' };
      case 'mill_manual':
        return { symbol: '⟲', animation: 'animate-spin', color: 'text-green-400' };
      case 'hand_tools_basic':
        return { symbol: '🔧', animation: 'animate-pulse', color: 'text-orange-400' };
      case 'hand_tools_precision':
        return { symbol: '⚙', animation: 'animate-spin', color: 'text-purple-400' };
      case 'measuring_tools_basic':
        return { symbol: '📐', animation: 'animate-pulse', color: 'text-teal-400' };
      default:
        return { symbol: '⚡', animation: 'animate-pulse', color: 'text-yellow-400' };
    }
  };
  
  const spinner = getSpinnerForEquipment(equipmentId);
  
  return (
    <div className={`absolute top-1 right-1 text-xs ${spinner.color} ${spinner.animation}`}>
      {spinner.symbol}
    </div>
  );
}

function MachineCard({ equipment, definition, slot, currentTime }: MachineCardProps) {
  const [realTimeProgress, setRealTimeProgress] = useState(0);
  const [realTimeRemaining, setRealTimeRemaining] = useState('N/A');
  const animationFrameRef = useRef<number | null>(null);
  const gameTime = useGameStore((state) => state.gameTime);
  const prevGameSpeedRef = useRef(gameTime.gameSpeed);
  const speedChangeTimeRef = useRef<number | null>(null);
  
  const getProgressBar = (progress: number) => {
    const filled = Math.floor(progress * 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };
  
  const updateRealTimeProgress = useCallback(() => {
    if (!slot.currentJob || !slot.currentProgress) {
      setRealTimeProgress(0);
      setRealTimeRemaining('N/A');
      return;
    }
    
    const realTimeMs = Date.now();
    const gameSpeed = gameTime.gameSpeed || 1;
    const isPaused = gameTime.isPaused;
    
    if (isPaused) {
      // When paused, use the store's current progress without interpolation
      const elapsed = currentTime - slot.currentProgress.startTime;
      const duration = slot.currentProgress.estimatedCompletion - slot.currentProgress.startTime;
      const progress = duration > 0 ? elapsed / duration : 0;
      const clampedProgress = Math.min(1, Math.max(0, progress));
      
      setRealTimeProgress(clampedProgress);
      
      const remaining = Math.max(0, duration - elapsed);
      const remainingMinutes = Math.floor(remaining * 60);
      const remainingSeconds = Math.floor((remaining * 3600) % 60);
      setRealTimeRemaining(`${remainingMinutes}m ${remainingSeconds}s`);
      return;
    }
    
    // Detect speed changes and reset interpolation baseline
    if (prevGameSpeedRef.current !== gameSpeed) {
      prevGameSpeedRef.current = gameSpeed;
      speedChangeTimeRef.current = realTimeMs;
    }
    
    // Calculate real-time progress using actual time passage
    // Base rate: 1 game hour = 60 seconds real time (60000ms)
    const msPerGameHour = 60000;
    let lastUpdateTime = slot.currentProgress.lastUpdateTime || realTimeMs;
    
    // If speed changed recently, use the speed change time as baseline to avoid jumps
    if (speedChangeTimeRef.current && speedChangeTimeRef.current > lastUpdateTime) {
      lastUpdateTime = speedChangeTimeRef.current;
    }
    
    // Calculate how much real time has passed since the last valid update
    const realTimeSinceUpdate = realTimeMs - lastUpdateTime;
    
    // Convert to game time progression at current speed
    // At 2x speed: 1000ms real time = 2000ms worth of game progression
    const gameProgressionMs = realTimeSinceUpdate * gameSpeed;
    const gameTimeSinceUpdate = gameProgressionMs / msPerGameHour;
    
    // Add interpolated time to the store's current time
    const interpolatedCurrentTime = currentTime + gameTimeSinceUpdate;
    
    const elapsed = interpolatedCurrentTime - slot.currentProgress.startTime;
    const duration = slot.currentProgress.estimatedCompletion - slot.currentProgress.startTime;
    const progress = duration > 0 ? elapsed / duration : 0;
    
    // Clamp progress to prevent going over 100% while waiting for store update
    const clampedProgress = Math.min(1, Math.max(0, progress));
    setRealTimeProgress(clampedProgress);
    
    // Calculate real-time remaining (never go negative)
    const remaining = Math.max(0, duration - elapsed);
    const remainingMinutes = Math.floor(remaining * 60);
    const remainingSeconds = Math.floor((remaining * 3600) % 60);
    
    if (clampedProgress >= 1) {
      // When complete, show completion status
      setRealTimeRemaining('Completing...');
    } else if (!isNaN(remainingMinutes) && !isNaN(remainingSeconds)) {
      setRealTimeRemaining(`${remainingMinutes}m ${remainingSeconds}s`);
    } else {
      setRealTimeRemaining('Calculating...');
    }
  }, [slot, currentTime, gameTime]);
  
  // Real-time animation loop
  useEffect(() => {
    if (!slot.currentJob) {
      setRealTimeProgress(0);
      setRealTimeRemaining('N/A');
      return;
    }
    
    const animate = () => {
      updateRealTimeProgress();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [slot.currentJob, updateRealTimeProgress]);
  
  const getTimeRemaining = () => realTimeRemaining;
  const getProgress = () => realTimeProgress;
  
  return (
    <div className="border border-teal-400 bg-gray-900 p-2 relative">
      {/* Machine Activity Spinner */}
      <MachineSpinner equipmentId={equipment.equipmentId} isActive={!!slot.currentJob} />
      
      <div className="mb-2">
        <h3 className="text-teal-400 font-bold text-sm">{definition.name}</h3>
        <span className="text-xs text-gray-500">Condition: {equipment.condition}%</span>
      </div>
      
      {/* Job Status - consistent height layout */}
      <div className="h-16 flex flex-col justify-between">
        {slot.currentJob ? (
          <>
            <div className="text-xs text-white mb-1">
              Making: {formatProductName(slot.currentJob.productId)}
            </div>
            <div className="text-xs text-gray-300 mb-1">
              {slot.currentJob.method.operations[slot.currentJob.currentOperationIndex]?.name}
            </div>
            <div>
              <div className="text-teal-400 text-xs">{getProgressBar(getProgress())}</div>
              <div className="text-gray-400 text-xs">{Math.floor(getProgress() * 100)}% - {getTimeRemaining()}</div>
            </div>
          </>
        ) : (
          <>
            <div className="text-xs text-gray-500 mb-1">IDLE</div>
            <div className="text-xs text-gray-600 mb-1">Waiting for work</div>
            <div>
              <div className="text-gray-700 text-xs">░░░░░░░░░░</div>
              <div className="text-gray-600 text-xs">Ready</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Component to display job inventory contents
function JobInventoryDisplay({ job }: { job: MachineSlotJob }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!job.jobInventory) {
    return <div className="text-xs text-gray-500">No job inventory</div>;
  }
  
  // Count total items in job inventory
  let totalItems = 0;
  const inventoryItems: Array<{ baseItemId: string; name: string; quantity: number; quality: number; tags: string[] }> = [];
  
  for (const group of job.jobInventory.groups.values()) {
    for (const slot of group.slots) {
      for (const instance of slot.stack.instances) {
        totalItems += instance.quantity;
        const baseItem = baseItems[instance.baseItemId];
        if (baseItem) {
          inventoryItems.push({
            baseItemId: instance.baseItemId,
            name: baseItem.name,
            quantity: instance.quantity,
            quality: instance.quality,
            tags: instance.tags
          });
        }
      }
    }
  }
  
  if (totalItems === 0) {
    return <div className="text-xs text-gray-500">Job inventory empty</div>;
  }
  
  return (
    <div className="mt-2">
      <div 
        className="text-xs text-blue-300 cursor-pointer hover:text-blue-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '▼' : '►'} Job Inventory ({totalItems} items)
      </div>
      
      {isExpanded && (
        <div className="ml-3 mt-1 space-y-1">
          {inventoryItems.map((item, idx) => (
            <div key={idx} className="text-xs text-gray-400">
              • {item.quantity}x {getDisplayName({ 
                id: `temp-${idx}`, 
                baseItemId: item.baseItemId, 
                tags: item.tags as ItemTag[], 
                quality: item.quality,
                quantity: item.quantity,
                acquiredAt: 0,
                lastModified: 0
              })}
              <span className="text-gray-600 ml-1">
                ({getQualityDescription(item.quality)})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Component to show what upcoming operations will do
function OperationFlowDisplay({ job }: { job: MachineSlotJob }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const upcomingOperations = job.method.operations.slice(job.currentOperationIndex + 1);
  
  if (upcomingOperations.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-2">
      <div 
        className="text-xs text-green-300 cursor-pointer hover:text-green-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '▼' : '►'} Upcoming Operations ({upcomingOperations.length})
      </div>
      
      {isExpanded && (
        <div className="ml-3 mt-1 space-y-2">
          {upcomingOperations.map((op, idx) => (
            <div key={op.id} className="text-xs border-l-2 border-gray-600 pl-2">
              <div className="text-yellow-300 font-semibold">
                {job.currentOperationIndex + idx + 2}. {op.name}
              </div>
              
              {/* Show material transformations for component-based methods */}
              {op.materialConsumption && op.materialConsumption.length > 0 && (
                <div className="text-red-300 text-xs">
                  Consumes: {op.materialConsumption.map(mc => 
                    `${mc.count} ${mc.itemId.replace(/-/g, ' ')}${mc.tags ? ` [${mc.tags.join(', ')}]` : ''}`
                  ).join(', ')}
                </div>
              )}
              
              {op.materialProduction && op.materialProduction.length > 0 && (
                <div className="text-green-300 text-xs">
                  Produces: {op.materialProduction.map(mp => 
                    `${mp.count} ${mp.itemId.replace(/-/g, ' ')}${mp.tags ? ` [${mp.tags.join(', ')}]` : ''}`
                  ).join(', ')}
                </div>
              )}
              
              {/* Legacy material requirements */}
              {op.material_requirements && op.material_requirements.length > 0 && (
                <div className="text-gray-400 text-xs">
                  Materials: {op.material_requirements.map(req => 
                    `${req.quantity} ${req.material_id}${req.required_tags ? ` [${req.required_tags.join(', ')}]` : ''}`
                  ).join(', ')}
                </div>
              )}
              
              {!op.materialConsumption && !op.materialProduction && !op.material_requirements && (
                <div className="text-gray-500 text-xs">Processing step</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface UnifiedJobListProps {
  workspace: MachineWorkspace;
  facility: Facility;
  equipmentDatabase: Map<string, Equipment>;
  allJobs: MachineSlotJob[]; // LEGACY: Not used in current implementation, jobs come from workspace
}

function UnifiedJobList({ workspace, facility, equipmentDatabase }: UnifiedJobListProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const cancelMachineJob = useGameStore(state => state.cancelMachineJob);
  const gameTime = useGameStore(state => state.gameTime);
  
  // Helper function to get current operation progress for a job
  const getJobProgress = (job: MachineSlotJob) => {
    if (job.state !== 'in_progress' || !job.currentMachineId) {
      return null;
    }
    
    const machineSlot = workspace.machines.get(job.currentMachineId);
    if (!machineSlot || !machineSlot.currentProgress) {
      return null;
    }
    
    const progress = machineSlot.currentProgress;
    const elapsed = gameTime.totalGameHours - progress.startTime;
    const duration = progress.estimatedCompletion - progress.startTime;
    const percentage = duration > 0 ? Math.min(100, Math.max(0, (elapsed / duration) * 100)) : 0;
    
    return {
      currentOperation: job.method.operations[job.currentOperationIndex]?.name || 'Unknown',
      percentage: Math.round(percentage)
    };
  };
  
  // Collect all jobs: active (from machines), ready/blocked (from job state manager), and recently completed
  const activeJobs = Array.from(workspace.machines.values())
    .map(slot => slot.currentJob)
    .filter((job): job is MachineSlotJob => job !== null && job !== undefined);
  
  // Get jobs from the new event-driven job state manager
  const readyJobs = globalJobStateManager.getReadyJobs();
  const blockedJobs = globalJobStateManager.getBlockedJobs();
  const inProgressJobs = globalJobStateManager.getJobsByState(JobReadinessState.IN_PROGRESS);
  
  const queuedJobs = [...readyJobs, ...blockedJobs, ...inProgressJobs];
  
  // Filter completed jobs that are less than 5 seconds old (using game time)
  const currentGameTime = gameTime.totalGameHours;
  const recentCompletedJobs = (workspace.completedJobs || [])
    .filter(job => {
      if (!job || !job.completedAt) return false;
      // Convert 5 seconds real time to game time (5 seconds = 5/3600 game hours at 1x speed)
      const gameTimeWindow = (5 / 3600) * gameTime.gameSpeed; // Adjust for game speed
      return (currentGameTime - job.completedAt) <= gameTimeWindow;
    })
    .slice(-5); // Still limit to last 5 for performance
  
  // Combine all jobs and filter out any undefined/null entries
  const combinedJobs = [...activeJobs, ...queuedJobs, ...recentCompletedJobs]
    .filter((job): job is MachineSlotJob => job !== null && job !== undefined);
  
  // MANUFACTURING V2: Filter to show only parent jobs, not sub-operations
  const visibleJobs = combinedJobs.filter(job => {
    // Double-check job is defined
    if (!job || !job.id) {
      return false;
    }
    // Hide sub-operations (they have _subop_ in their ID)
    if (job.id.includes('_subop_')) {
      return false;
    }
    return true;
  });
  
  // Helper to get sub-operation progress for all jobs
  const getSubOperationProgress = (job: MachineSlotJob) => {
    // Always try to use the enhanced display - create basic progress info even for legacy jobs
    if (!job.subOperations || job.subOperations.size === 0) {
      // Create a synthetic sub-operation view for legacy jobs
      return {
        completed: job.completedOperations?.length || 0,
        inProgress: job.state === 'in_progress' ? 1 : 0,
        queued: job.state === 'queued' ? 1 : 0,
        pending: Math.max(0, (job.method.operations.length || 0) - (job.completedOperations?.length || 0) - (job.state === 'in_progress' ? 1 : 0)),
        total: job.method.operations.length || 1,
        percentage: Math.round(((job.completedOperations?.length || 0) / (job.method.operations.length || 1)) * 100),
        operationGroups: new Map(),
        isLegacy: true
      };
    }
    
    const subOps = Array.from(job.subOperations.values());
    const completed = subOps.filter(sub => sub.state === 'completed').length;
    const inProgress = subOps.filter(sub => sub.state === 'in_progress').length;
    const queued = subOps.filter(sub => sub.state === 'queued').length;
    const pending = subOps.filter(sub => sub.state === 'pending').length;
    
    // Group by operation type for better display
    const operationGroups = new Map<string, Array<{subOp: any, status: string}>>();
    
    subOps.forEach(subOp => {
      const opName = subOp.operation.name.replace(' (1x)', ''); // Remove (1x) suffix for grouping
      if (!operationGroups.has(opName)) {
        operationGroups.set(opName, []);
      }
      operationGroups.get(opName)!.push({
        subOp,
        status: subOp.state
      });
    });
    
    return {
      total: subOps.length,
      completed,
      inProgress,
      queued,
      pending,
      percentage: Math.round((completed / subOps.length) * 100),
      operationGroups
    };
  };
  
  const handleCancelJob = (jobId: string, facilityId: string) => {
    cancelMachineJob(facilityId, jobId);
    setShowCancelConfirm(null);
  };
  
  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs(prev => {
      const updated = new Set(prev);
      if (updated.has(jobId)) {
        updated.delete(jobId);
      } else {
        updated.add(jobId);
      }
      return updated;
    });
  };
  
  const getJobStatusInfo = (job: MachineSlotJob) => {
    // Get the enhanced state from job state manager
    const jobState = globalJobStateManager.getJobState(job.id);
    
    if (jobState) {
      switch (jobState.state) {
        case JobReadinessState.READY_TO_START:
          return {
            statusText: 'READY',
            statusColor: 'text-green-400',
            borderColor: 'border-green-600',
            bgColor: 'bg-green-900'
          };
        case JobReadinessState.BLOCKED_BY_DEPENDENCIES:
          return {
            statusText: 'BLOCKED (DEPS)',
            statusColor: 'text-orange-400',
            borderColor: 'border-orange-600',
            bgColor: 'bg-orange-900'
          };
        case JobReadinessState.BLOCKED_BY_MATERIALS:
          return {
            statusText: 'BLOCKED (MATERIALS)',
            statusColor: 'text-red-400',
            borderColor: 'border-red-600',
            bgColor: 'bg-red-900'
          };
        case JobReadinessState.BLOCKED_BY_EQUIPMENT:
          return {
            statusText: 'BLOCKED (EQUIPMENT)',
            statusColor: 'text-purple-400',
            borderColor: 'border-purple-600',
            bgColor: 'bg-purple-900'
          };
        case JobReadinessState.IN_PROGRESS:
          return {
            statusText: 'IN PROGRESS',
            statusColor: 'text-yellow-400',
            borderColor: 'border-yellow-600',
            bgColor: 'bg-yellow-900'
          };
        case JobReadinessState.COMPLETED:
          return {
            statusText: 'COMPLETED',
            statusColor: 'text-emerald-400',
            borderColor: 'border-emerald-600',
            bgColor: 'bg-emerald-900'
          };
      }
    }
    
    // Fallback to legacy states
    switch (job.state) {
      case 'queued':
        return {
          statusText: 'QUEUED',
          statusColor: 'text-blue-400',
          borderColor: 'border-blue-600',
          bgColor: 'bg-blue-900'
        };
      case 'in_progress':
        return {
          statusText: 'IN PROGRESS',
          statusColor: 'text-yellow-400',
          borderColor: 'border-yellow-600',
          bgColor: 'bg-yellow-900'
        };
      case 'completed':
        return {
          statusText: 'COMPLETED',
          statusColor: 'text-green-400',
          borderColor: 'border-green-600',
          bgColor: 'bg-green-900'
        };
      default:
        return {
          statusText: 'UNKNOWN',
          statusColor: 'text-gray-400',
          borderColor: 'border-gray-600',
          bgColor: 'bg-gray-900'
        };
    }
  };
  
  const totalJobs = visibleJobs.length;
  const activeCount = activeJobs.length;
  const queuedCount = queuedJobs.length;
  
  return (
    <div className="border border-gray-600 bg-gray-900 p-3 mb-4">
      <h3 className="text-gray-400 font-bold mb-3">
        FACILITY JOBS ({totalJobs}) - Active: {activeCount}, Queued: {queuedCount}
      </h3>
      
      <div className="max-h-96 overflow-y-auto">
        {visibleJobs.length === 0 ? (
          <div className="text-gray-500">No jobs</div>
        ) : (
          <div className="space-y-3">
            {visibleJobs.map(job => {
              // Safety check - ensure job is defined
              if (!job || !job.id) {
                return null;
              }
              
              const statusInfo = getJobStatusInfo(job);
              const isExpanded = expandedJobs.has(job.id);
              const canCancel = job.state === 'queued' || job.state === 'in_progress';
              
              return (
                <div key={job.id} className={`border-l-4 ${statusInfo.borderColor} pl-3 py-2 ${statusInfo.bgColor} bg-opacity-10`}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleJobExpansion(job.id)}
                          className="text-xs text-gray-400 hover:text-gray-200"
                        >
                          {isExpanded ? '▼' : '►'}
                        </button>
                        <div className="text-sm text-white">
                          {formatProductName(job.productId)} ({job.method.name})
                        </div>
                        <span className={`text-xs font-bold ${statusInfo.statusColor}`}>
                          {statusInfo.statusText}
                        </span>
                        {job.rushOrder && (
                          <span className="text-red-400 font-bold text-xs">RUSH</span>
                        )}
                      </div>
                      
                      {/* Enhanced status display for all jobs */}
                      {(() => {
                        const v2Progress = getSubOperationProgress(job);
                        
                        return (
                          <div className="text-xs mt-1 space-y-1">
                            <div className="text-teal-300">
                              Progress: {v2Progress.completed}/{v2Progress.total} operations ({v2Progress.percentage}%)
                            </div>
                            
                            {/* Show current active operation */}
                            {(() => {
                              // For real v2 jobs with sub-operations
                              if (job.subOperations && job.subOperations.size > 0) {
                                const activeOp = Array.from(job.subOperations.entries())
                                  .find(([_, subOp]) => subOp.state === 'in_progress');
                                
                                if (activeOp) {
                                  const [index, subOp] = activeOp;
                                  const equipment = facility?.equipment.find(e => e.id === subOp.assignedMachineId);
                                  const equipmentDef = equipment ? equipmentDatabase.get(equipment.equipmentId) : null;
                                  
                                  return (
                                    <div className="text-yellow-300">
                                      ◐ Current: {subOp.operation.name} 
                                      {equipmentDef && (
                                        <span className="text-teal-400"> ({equipmentDef.name})</span>
                                      )}
                                    </div>
                                  );
                                }
                                
                                const queuedOp = Array.from(job.subOperations.entries())
                                  .find(([_, subOp]) => subOp.state === 'queued');
                                
                                if (queuedOp) {
                                  const [index, subOp] = queuedOp;
                                  return (
                                    <div className="text-blue-300">
                                      ● Next: {subOp.operation.name}
                                    </div>
                                  );
                                }
                                
                                const pendingOp = Array.from(job.subOperations.entries())
                                  .find(([_, subOp]) => subOp.state === 'pending');
                                
                                if (pendingOp) {
                                  const [index, subOp] = pendingOp;
                                  return (
                                    <div className="text-gray-400">
                                      ○ Waiting: {subOp.operation.name}
                                    </div>
                                  );
                                }
                              } else {
                                // For legacy jobs, show current operation based on job state
                                if (job.state === 'queued') {
                                  return (
                                    <div className="text-blue-300">
                                      ● Next: {job.method.operations[job.currentOperationIndex]?.name || 'Starting...'}
                                    </div>
                                  );
                                } else if (job.state === 'in_progress') {
                                  return (
                                    <div className="text-yellow-300">
                                      ◐ Current: {job.method.operations[job.currentOperationIndex]?.name || 'Processing...'}
                                    </div>
                                  );
                                }
                              }
                              
                              return null;
                            })()}
                            
                            {/* Summary counts for jobs with multiple operations */}
                            {v2Progress.inProgress > 1 && (
                              <div className="text-yellow-400">
                                +{v2Progress.inProgress - 1} more active
                              </div>
                            )}
                            {v2Progress.queued > 1 && (
                              <div className="text-blue-400">
                                {v2Progress.queued} ready to start
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    
                    {canCancel && (
                      <button
                        onClick={() => setShowCancelConfirm(showCancelConfirm === job.id ? null : job.id)}
                        className="text-xs text-red-400 hover:text-red-300 px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  {/* Cancel confirmation */}
                  {showCancelConfirm === job.id && canCancel && (
                    <div className="mb-2 p-2 bg-gray-800 border border-red-600 text-xs">
                      <div className="text-red-400 font-semibold mb-1">Cancel Job?</div>
                      <div className="text-gray-300 mb-2">
                        Progress: {job.completedOperations.length}/{job.method.operations.length} operations
                      </div>
                      <div className="text-gray-400 mb-2">
                        {job.jobInventory ? (
                          <div>All job inventory will be returned to facility</div>
                        ) : (
                          <div>Created components will be recovered</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCancelJob(job.id, job.facilityId)}
                          className="bg-red-700 hover:bg-red-600 text-red-100 px-2 py-1 text-xs"
                        >
                          Cancel Job
                        </button>
                        <button
                          onClick={() => setShowCancelConfirm(null)}
                          className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 text-xs"
                        >
                          Keep Job
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Expanded job details */}
                  {isExpanded && (
                    <div className="mt-2 ml-4 space-y-2">
                      {(() => {
                        const v2Progress = getSubOperationProgress(job);
                        
                        // Always use the enhanced detailed display for all jobs
                        return (
                          <div className="space-y-4">
                            {/* Expected Outputs */}
                            <div className="bg-gray-800 p-2 border border-gray-600">
                              <div className="text-teal-400 text-xs font-semibold mb-1">
                                🎯 Expected Outcomes
                              </div>
                              <div className="ml-2 space-y-1">
                                {(() => {
                                  // Show only FINAL outputs from the last operation that produces something
                                  const outputs = new Set<string>();
                                  if (job.method?.operations) {
                                    // Find the last operation that produces materials (this is the final output)
                                    const operations = job.method.operations;
                                    for (let i = operations.length - 1; i >= 0; i--) {
                                      const op = operations[i];
                                      if (op.materialProduction && op.materialProduction.length > 0) {
                                        op.materialProduction.forEach(prod => {
                                          const baseItem = getBaseItem(prod.itemId);
                                          if (baseItem) {
                                            outputs.add(`${prod.count}x ${baseItem.name}`);
                                          }
                                        });
                                        break; // Only show the final production step
                                      }
                                    }
                                  }
                                  
                                  if (outputs.size === 0) {
                                    // Fallback to product name
                                    outputs.add(`1x ${formatProductName(job.productId)}`);
                                  }
                                  
                                  return Array.from(outputs).map((output, idx) => (
                                    <div key={idx} className="text-xs text-teal-300">
                                      • {output}
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                            
                            {/* Individual Sub-Operations with Details */}
                            <div className="space-y-2">
                              {job.subOperations && job.subOperations.size > 0 ? (
                                // Real v2 jobs with sub-operations
                                Array.from(job.subOperations.entries()).map(([index, subOp]) => {
                                  const statusIcon = {
                                    'completed': '✓',
                                    'in_progress': '◐',
                                    'queued': '●',
                                    'pending': '○',
                                    'failed': '✗'
                                  }[subOp.state] || '○';
                                  
                                  const statusColor = {
                                    'completed': 'text-green-400',
                                    'in_progress': 'text-yellow-400',
                                    'queued': 'text-blue-400',
                                    'pending': 'text-gray-400',
                                    'failed': 'text-red-400'
                                  }[subOp.state] || 'text-gray-400';
                                  
                                  const bgColor = {
                                    'completed': 'bg-green-900',
                                    'in_progress': 'bg-yellow-900',
                                    'queued': 'bg-blue-900',
                                    'pending': 'bg-gray-900',
                                    'failed': 'bg-red-900'
                                  }[subOp.state] || 'bg-gray-900';
                                  
                                  return (
                                    <div key={index} className={`border-l-2 border-gray-600 pl-2 py-1 ${bgColor} bg-opacity-20`}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className={`${statusColor} font-mono text-xs`}>{statusIcon}</span>
                                          <span className="text-xs text-white font-medium">
                                            {index + 1}. {subOp.operation.name}
                                          </span>
                                          <span className={`text-xs ${statusColor} uppercase font-bold`}>
                                            {subOp.state}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          ~{subOp.operation.baseDurationMinutes || 0}min
                                        </div>
                                      </div>
                                      
                                      {/* Operation Details */}
                                      <div className="ml-4 mt-1 space-y-1">
                                        {/* Machine Assignment */}
                                        {subOp.assignedMachineId && (
                                          <div className="text-xs text-teal-300">
                                            🔧 Machine: {(() => {
                                              const equipment = facility?.equipment.find(e => e.id === subOp.assignedMachineId);
                                              const equipmentDef = equipment ? equipmentDatabase.get(equipment.equipmentId) : null;
                                              return equipmentDef?.name || subOp.assignedMachineId;
                                            })()}
                                          </div>
                                        )}
                                        
                                        {/* Required Capabilities */}
                                        {subOp.operation.requiredTag && (
                                          <div className="text-xs text-purple-300">
                                            📋 Requires: {subOp.operation.requiredTag.category} ≥ {subOp.operation.requiredTag.minimum}
                                          </div>
                                        )}
                                        
                                        {/* Material Consumption */}
                                        {subOp.operation.materialConsumption && subOp.operation.materialConsumption.length > 0 && (
                                          <div className="text-xs text-red-300">
                                            📥 Consumes: {subOp.operation.materialConsumption.map(mat => {
                                              const baseItem = getBaseItem(mat.itemId);
                                              return `${mat.count}x ${baseItem?.name || mat.itemId}`;
                                            }).join(', ')}
                                          </div>
                                        )}
                                        
                                        {/* Material Production */}
                                        {subOp.operation.materialProduction && subOp.operation.materialProduction.length > 0 && (
                                          <div className="text-xs text-green-300">
                                            📤 Produces: {subOp.operation.materialProduction.map(mat => {
                                              const baseItem = getBaseItem(mat.itemId);
                                              return `${mat.count}x ${baseItem?.name || mat.itemId}`;
                                            }).join(', ')}
                                          </div>
                                        )}
                                        
                                        {/* Progress for in-progress operations */}
                                        {subOp.state === 'in_progress' && subOp.startedAt && (
                                          <div className="text-xs text-yellow-300">
                                            ⏱️ Started: {formatGameTime({
                                              totalGameHours: subOp.startedAt,
                                              days: Math.floor(subOp.startedAt / 24),
                                              hours: subOp.startedAt % 24,
                                              isPaused: false,
                                              gameSpeed: 1
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                // Legacy jobs - show operations from method
                                job.method.operations.map((op, index) => {
                                  const isCompleted = index < (job.completedOperations?.length || 0);
                                  const isCurrent = index === job.currentOperationIndex && job.state === 'in_progress';
                                  const isPending = index > job.currentOperationIndex;
                                  
                                  const statusIcon = isCompleted ? '✓' : isCurrent ? '◐' : isPending ? '○' : '●';
                                  const statusColor = isCompleted ? 'text-green-400' : isCurrent ? 'text-yellow-400' : isPending ? 'text-gray-400' : 'text-blue-400';
                                  const bgColor = isCompleted ? 'bg-green-900' : isCurrent ? 'bg-yellow-900' : isPending ? 'bg-gray-900' : 'bg-blue-900';
                                  const status = isCompleted ? 'COMPLETED' : isCurrent ? 'IN PROGRESS' : isPending ? 'PENDING' : 'QUEUED';
                                  
                                  return (
                                    <div key={index} className={`border-l-2 border-gray-600 pl-2 py-1 ${bgColor} bg-opacity-20`}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className={`${statusColor} font-mono text-xs`}>{statusIcon}</span>
                                          <span className="text-xs text-white font-medium">
                                            {index + 1}. {op.name}
                                          </span>
                                          <span className={`text-xs ${statusColor} uppercase font-bold`}>
                                            {status}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          ~{op.baseDurationMinutes || 0}min
                                        </div>
                                      </div>
                                      
                                      {/* Legacy operation details */}
                                      <div className="ml-4 mt-1 space-y-1">
                                        {op.material_requirements && op.material_requirements.length > 0 && (
                                          <div className="text-xs text-red-300">
                                            📥 Requires: {op.material_requirements.map(mat => 
                                              `${mat.quantity}x ${mat.material_id}`
                                            ).join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                            
                            {/* Job Inventory Status */}
                            {job.jobInventory && (
                              <div className="bg-gray-800 p-2 border border-gray-600">
                                <div className="text-orange-400 text-xs font-semibold mb-1">
                                  📦 Job Inventory
                                </div>
                                <div className="ml-2 space-y-1">
                                  {(() => {
                                    const allItems = inventoryManager.getAllItems(job.jobInventory);
                                    if (allItems.length === 0) {
                                      return <div className="text-xs text-gray-500">Empty</div>;
                                    }
                                    
                                    return allItems.map((item, idx) => {
                                      const baseItem = getBaseItem(item.baseItemId);
                                      return (
                                        <div key={idx} className="text-xs text-orange-300">
                                          • {item.quantity}x {baseItem?.name || item.baseItemId} ({item.quality}% quality)
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


function JobCompletionNotifications() {
  const notifications = useGameStore(state => state.jobCompletionNotifications);
  const dismissNotification = useGameStore(state => state.dismissNotification);
  
  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    const timeouts = notifications.map(notification => 
      setTimeout(() => {
        dismissNotification(notification.id);
      }, 5000)
    );
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [notifications, dismissNotification]);
  
  if (notifications.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="bg-teal-800 border border-teal-400 text-teal-100 p-3 rounded shadow-lg max-w-sm animate-bounce"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-bold text-sm">Job Completed!</div>
              <div className="text-xs">
                {notification.quantity}x {notification.productId}
              </div>
              <div className="text-xs text-teal-300">
                Method: {notification.methodName}
              </div>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="text-teal-300 hover:text-teal-100 ml-2"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MachineWorkspaceView() {
  const { 
    facilities, 
    selectedFacilityId, 
    equipmentDatabase, 
    machineWorkspace: workspace, 
    gameTime
  } = useGameStore();
  
  // Force re-render every 2 seconds to ensure job progress updates are visible
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  const facility = facilities.find(f => f.id === selectedFacilityId);
  
  if (!facility) {
    return <div className="text-gray-500">No facility selected</div>;
  }
  
  if (!workspace) {
    return <div className="text-gray-500">No workspace found</div>;
  }
  
  // Get all jobs (active, queued, and recently completed)
  const allJobs: MachineSlotJob[] = [];
  
  // Add currently running jobs
  workspace.machines.forEach(slot => {
    if (slot.currentJob) allJobs.push(slot.currentJob);
  });
  
  // Add queued jobs from facility queue
  allJobs.push(...workspace.jobQueue);
  
  // Add recently completed jobs
  allJobs.push(...workspace.completedJobs.slice(-5)); // Last 5 completed
  
  return (
    <div className="font-mono text-sm">
      {/* Job Completion Notifications */}
      <JobCompletionNotifications />
      
      <div className="mb-4">
        <h2 className="text-xl text-teal-400 mb-2">
          {facility.name.toUpperCase()} - EQUIPMENT STATUS
        </h2>
        <div className="text-xs text-gray-500">
          Time: {formatGameTime(gameTime)}
        </div>
      </div>

      {/* Implementation Status Notice */}
      <div className="terminal-card border-green-600 mb-4">
        <div className="text-center">
          <div className="text-green-400 font-mono text-lg mb-2">✅ EVENT-DRIVEN ARCHITECTURE ACTIVE</div>
          <div className="text-gray-400 text-sm">
            Jobs are now processed using an event-driven system for optimal performance.
          </div>
        </div>
      </div>
      
      {/* Job State Manager Debug Panel */}
      <JobStateDebugPanel />
      
      {/* Machine cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {facility.equipment.map(eq => {
          const def = equipmentDatabase.get(eq.equipmentId);
          const slot = workspace.machines.get(eq.id);
          
          if (!def || !slot) return null;
          
          return (
            <MachineCard
              key={eq.id}
              equipment={eq}
              definition={def}
              slot={slot}
              currentTime={gameTime.totalGameHours}
            />
          );
        })}
      </div>
      
      {/* Job management */}
      <UnifiedJobList workspace={workspace} facility={facility} equipmentDatabase={equipmentDatabase} allJobs={allJobs} />
      
      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
        <div>Total Machines: {workspace.machines.size}</div>
        <div>Active Jobs: {Array.from(workspace.machines.values()).filter(m => m.currentJob).length}</div>
        <div>Queued Jobs: {workspace.jobQueue.length}</div>
        <div>Completed Today: {workspace.completedJobs.length}</div>
      </div>
    </div>
  );
}