// Machine Workspace View - Shows machines with job slots

import { useGameStore } from '../state/gameStoreWithEquipment';
import { MachineSlot, MachineSlotJob, MachineWorkspace, Facility, ItemTag, ItemManufacturingType } from '../types';
import { Equipment, EquipmentInstance } from '../types';
import { formatGameTime } from '../utils/gameClock';
import { useState, useEffect, useRef, useCallback } from 'react';
import { basicSidearmMethods, tacticalKnifeMethods } from '../data/manufacturingMethods';
import { inventoryManager } from '../utils/inventoryManager';
import { getDisplayName, getQualityDescription } from '../utils/itemSystem';
import { baseItems, getBaseItem } from '../data/baseItems';

// Helper function to format product names for display
function formatProductName(productId: string): string {
  return productId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Manufacturing v2 workflow simulation - returns raw material requirements only
function simulateManufacturingV2Workflow(method: any): Array<{ materialId: string; quantity: number }> {
  const rawMaterialCounts = new Map<string, number>();
  
  // Track all material flows through the operations
  const inventory = new Map<string, number>(); // Simulated workflow inventory
  
  // Process operations in sequence to simulate workflow
  for (const operation of method.operations) {
    // Consume materials for this operation
    if (operation.materialConsumption) {
      for (const consumption of operation.materialConsumption) {
        const needed = consumption.count;
        const available = inventory.get(consumption.itemId) || 0;
        
        if (available >= needed) {
          // Use from workflow inventory
          inventory.set(consumption.itemId, available - needed);
        } else {
          // Need to source additional materials
          const stillNeeded = needed - available;
          inventory.set(consumption.itemId, 0); // Use all available
          
          // Check if this is a raw material or intermediate
          const baseItem = getBaseItem(consumption.itemId);
          if (baseItem?.manufacturingType === ItemManufacturingType.RAW_MATERIAL) {
            // This is a raw material - add to requirements
            const existing = rawMaterialCounts.get(consumption.itemId) || 0;
            rawMaterialCounts.set(consumption.itemId, existing + stillNeeded);
          } else {
            // This is an intermediate material - it should be produced by earlier operations
            // If it's not available, there's likely an issue with the workflow
            console.warn(`Manufacturing v2 workflow missing intermediate material: ${consumption.itemId}`);
          }
        }
      }
    }
    
    // Produce materials from this operation
    if (operation.materialProduction) {
      for (const production of operation.materialProduction) {
        const produced = production.count;
        const existing = inventory.get(production.itemId) || 0;
        inventory.set(production.itemId, existing + produced);
      }
    }
  }
  
  // Convert map to array format
  return Array.from(rawMaterialCounts.entries()).map(([materialId, quantity]) => ({
    materialId,
    quantity
  }));
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
  allJobs: MachineSlotJob[]; // LEGACY: Not used in current implementation, jobs come from workspace
}

function UnifiedJobList({ workspace }: UnifiedJobListProps) {
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
  
  // Collect all jobs: active (from machines), queued, and recently completed
  const activeJobs = Array.from(workspace.machines.values())
    .map(slot => slot.currentJob)
    .filter((job): job is MachineSlotJob => job !== null && job !== undefined);
  
  const queuedJobs = workspace.jobQueue || [];
  
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
  
  // No need for complex timer logic - just use the filtered list
  const visibleJobs = combinedJobs.filter(job => {
    // Double-check job is defined
    if (!job || !job.id) {
      return false;
    }
    return true;
  });
  
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
                      
                      {job.state === 'queued' && (
                        <div className="text-xs text-gray-400 mt-1">
                          Next: {job.method.operations[job.currentOperationIndex]?.name}
                        </div>
                      )}
                      
                      {job.state === 'in_progress' && (() => {
                        const progress = getJobProgress(job);
                        return progress ? (
                          <div className="text-xs text-yellow-300 mt-1">
                            Current: {progress.currentOperation} ({progress.percentage}%)
                          </div>
                        ) : (
                          <div className="text-xs text-yellow-300 mt-1">
                            Current: {job.method.operations[job.currentOperationIndex]?.name || 'Processing...'}
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
                      {/* Operation progress */}
                      <div className="flex flex-wrap gap-1 text-xs">
                        {job.method.operations.map((op, idx) => {
                          const isComplete = job.completedOperations.includes(op.id);
                          const isCurrent = idx === job.currentOperationIndex;
                          const isPending = idx > job.currentOperationIndex;
                          
                          let statusClass = 'text-gray-600';
                          let statusSymbol = '○';
                          
                          if (isComplete) {
                            statusClass = 'text-green-400';
                            statusSymbol = '✓';
                          } else if (isCurrent) {
                            statusClass = 'text-yellow-400';
                            statusSymbol = '◐';
                          } else if (isPending) {
                            statusClass = 'text-gray-500';
                            statusSymbol = '○';
                          }
                          
                          return (
                            <div key={op.id} className={`${statusClass} flex items-center`}>
                              <span>{statusSymbol}</span>
                              <span className="ml-1">{op.name}</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Job Inventory Display */}
                      {job.state === 'in_progress' && <JobInventoryDisplay job={job} />}
                      
                      {/* Operation Flow Display */}
                      {job.state === 'in_progress' && <OperationFlowDisplay job={job} />}
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

interface ProductionInterfaceProps {
  facility: Facility;
}

function ProductionInterface({ facility }: ProductionInterfaceProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [showMethodDetails, setShowMethodDetails] = useState<string | null>(null);
  const [startingJob, setStartingJob] = useState<string | null>(null);
  const startMachineJob = useGameStore(state => state.startMachineJob);
  
  const handleStartJob = (facilityId: string, productId: string, methodId: string, quantity: number) => {
    // Show immediate feedback for just this method
    setStartingJob(methodId);
    startMachineJob(facilityId, productId, methodId, quantity);
    // Clear the feedback after a short delay
    setTimeout(() => setStartingJob(null), 300);
  };

  // Available products (expand this as more products are added)
  const availableProducts = [
    { id: 'basic_sidearm', name: 'Basic Sidearm', methods: basicSidearmMethods },
    { id: 'tactical_knife', name: 'Tactical Knife', methods: tacticalKnifeMethods }
  ];

  const selectedProductData = availableProducts.find(p => p.id === selectedProduct);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm text-gray-400 mb-2">START NEW JOB</h3>
        
        {/* Product Selection Dropdown */}
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">Select Product:</div>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 text-gray-300 text-xs p-2 focus:border-teal-400 focus:outline-none"
          >
            <option value="">-- Choose Product --</option>
            {availableProducts.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {/* Method Selection */}
        {selectedProductData && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Select Method:</div>
            <div className="space-y-2">
              {selectedProductData.methods.map(method => {
                // NEW: Manufacturing v2 workflow simulation and validation
                const isManufacturingV2 = method.id.includes('v2') || method.name.includes('v2');
                
                let hasAllMaterials = false;
                const missingMaterials: string[] = [];
                
                if (isManufacturingV2) {
                  // Manufacturing v2: Simulate workflow and check only raw materials
                  const rawMaterialNeeds = simulateManufacturingV2Workflow(method);
                  
                  hasAllMaterials = rawMaterialNeeds.every(need => {
                    let available: number;
                    if (facility.inventory) {
                      available = inventoryManager.getAvailableQuantity(facility.inventory, need.materialId);
                    } else {
                      available = facility.current_storage[need.materialId] || 0;
                    }
                    
                    const hasEnough = available >= need.quantity;
                    if (!hasEnough) {
                      missingMaterials.push(`${need.quantity} ${need.materialId} (have: ${available})`);
                    }
                    return hasEnough;
                  });
                } else {
                  // Legacy: Calculate net material requirements (consumption - production)
                  const materialBalance = new Map<string, { consumed: number; produced: number; tags?: string[]; maxQuality?: number }>();
                  
                  // Track consumption and production across all operations
                  method.operations.forEach(op => {
                    // Track consumption
                    if (op.materialConsumption) {
                      op.materialConsumption.forEach(mc => {
                        const stateTags = mc.tags?.filter(tag => ['rough', 'precision', 'assembly', 'casing'].includes(tag)).sort() || [];
                        const key = `${mc.itemId}-${stateTags.join(',')}`;
                        const existing = materialBalance.get(key) || { consumed: 0, produced: 0 };
                        materialBalance.set(key, {
                          consumed: existing.consumed + mc.count,
                          produced: existing.produced,
                          tags: mc.tags,
                          maxQuality: mc.maxQuality
                        });
                      });
                    }
                    
                    // Track production  
                    if (op.materialProduction) {
                      op.materialProduction.forEach(mp => {
                        const stateTags = mp.tags?.filter(tag => ['rough', 'precision', 'assembly', 'casing'].includes(tag)).sort() || [];
                        const key = `${mp.itemId}-${stateTags.join(',')}`;
                        const existing = materialBalance.get(key) || { consumed: 0, produced: 0 };
                        materialBalance.set(key, {
                          consumed: existing.consumed,
                          produced: existing.produced + mp.count,
                          tags: mp.tags,
                          maxQuality: existing.maxQuality
                        });
                      });
                    }
                    
                    // Legacy format: material_requirements
                    if (op.material_requirements) {
                      op.material_requirements.forEach(req => {
                        const key = `${req.material_id}-${req.required_tags?.join(',') || 'any'}`;
                        const existing = materialBalance.get(key) || { consumed: 0, produced: 0 };
                        materialBalance.set(key, {
                          consumed: existing.consumed + req.quantity,
                          produced: existing.produced,
                          tags: req.required_tags,
                          maxQuality: req.max_quality
                        });
                      });
                    }
                  });
                  
                  // Only check materials with net consumption (consumed > produced)
                  const netRequiredMaterials: Array<{
                    material_id: string;
                    quantity: number;
                    required_tags?: string[];
                    max_quality?: number;
                  }> = [];
                  for (const [key, balance] of materialBalance) {
                    const netConsumption = balance.consumed - balance.produced;
                    if (netConsumption > 0) {
                      const itemId = key.split('-')[0];
                      netRequiredMaterials.push({
                        material_id: itemId,
                        quantity: netConsumption,
                        required_tags: balance.tags,
                        max_quality: balance.maxQuality
                      });
                    }
                  }
                  
                  // Check availability for legacy methods
                  hasAllMaterials = netRequiredMaterials.every(mat => {
                    const materialId = mat.material_id;
                    const quantity = mat.quantity;
                    const requiredTags = mat.required_tags;
                    const maxQuality = mat.max_quality;
                    
                    let available: number;
                    if (facility.inventory) {
                      if (requiredTags && requiredTags.length > 0) {
                        available = inventoryManager.getAvailableQuantityWithTags(facility.inventory, materialId, requiredTags as ItemTag[], maxQuality);
                      } else {
                        available = inventoryManager.getAvailableQuantity(facility.inventory, materialId);
                      }
                    } else {
                      available = facility.current_storage[materialId] || 0;
                    }
                    
                    const hasEnough = available >= quantity;
                    if (!hasEnough) {
                      const tagDisplay = requiredTags && requiredTags.length > 0 ? ` [${requiredTags.join(', ')}]` : '';
                      const qualityDisplay = maxQuality !== undefined ? ` (≤${maxQuality}%)` : '';
                      missingMaterials.push(`${quantity} ${materialId}${tagDisplay}${qualityDisplay} (have: ${available})`);
                    }
                    return hasEnough;
                  });
                }
                
                return (
                  <div key={method.id} className="border border-gray-600 bg-gray-900">
                    <div className="p-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-teal-400 text-xs">{method.name}</div>
                          <div className="text-gray-400 text-xs">{method.description}</div>
                          <div className="text-gray-500 text-xs mt-1">
                            {method.operations.length} operations, ~{method.operations.reduce((sum, op) => sum + op.baseDurationMinutes, 0)} min
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => setShowMethodDetails(showMethodDetails === method.id ? null : method.id)}
                            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 text-xs border border-gray-600"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleStartJob(facility.id, selectedProduct!, method.id, 1)}
                            disabled={!hasAllMaterials}
                            title={!hasAllMaterials ? `Missing materials:\n${missingMaterials.join('\n')}` : ''}
                            className={`px-3 py-1 text-xs border transition-colors ${
                              !hasAllMaterials
                                ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                                : startingJob === method.id 
                                  ? 'bg-green-700 border-green-500 text-green-100' 
                                  : 'bg-teal-800 hover:bg-teal-700 text-teal-100 border-teal-600'
                            }`}
                          >
                            {!hasAllMaterials ? 'No Materials' : startingJob === method.id ? 'Started!' : 'Start'}
                          </button>
                        </div>
                      </div>
                    
                    {/* Method Details */}
                    {showMethodDetails === method.id && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="text-xs">
                          {/* NEW: Show operation flow for component-based methods */}
                          {method.id.includes('component') ? (
                            <div className="mb-3">
                              <span className="text-gray-500">Component Flow:</span>
                              <div className="ml-2 space-y-2 mt-2">
                                {method.operations.map((op, idx) => (
                                  <div key={op.id} className="text-xs">
                                    <div className="text-yellow-400 font-semibold">
                                      {idx + 1}. {op.name} ({op.baseDurationMinutes}min)
                                    </div>
                                    <div className="ml-3 text-gray-400">
                                      {op.materialConsumption && op.materialConsumption.length > 0 && (
                                        <div>
                                          <span className="text-red-300">Consumes:</span>
                                          {op.materialConsumption.map(mc => (
                                            <span key={mc.itemId} className="ml-1">
                                              {mc.count} {mc.itemId.replace(/-/g, ' ')}
                                              {mc.tags && mc.tags.length > 0 && <span className="text-blue-300"> [{mc.tags.join(', ')}]</span>}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {op.materialProduction && op.materialProduction.length > 0 && (
                                        <div>
                                          <span className="text-green-300">Produces:</span>
                                          {op.materialProduction.map(mp => (
                                            <span key={mp.itemId} className="ml-1">
                                              {mp.count} {mp.itemId.replace(/-/g, ' ')}
                                              {mp.tags && mp.tags.length > 0 && <span className="text-blue-300"> [{mp.tags.join(', ')}]</span>}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {!op.materialConsumption && !op.materialProduction && (
                                        <div className="text-gray-500">Preparation step</div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            /* Legacy materials display */
                            <div className="mb-2">
                              <span className="text-gray-500">Materials:</span>
                              <div className="ml-2 space-y-1">
                                {method.operations.flatMap(op => op.material_requirements || []).map((mat, idx) => {
                                  // Check availability from new inventory or legacy storage
                                  let available: number;
                                  if (facility.inventory) {
                                    if (mat.required_tags && mat.required_tags.length > 0) {
                                      available = inventoryManager.getAvailableQuantityWithTags(facility.inventory, mat.material_id, mat.required_tags as ItemTag[], mat.max_quality);
                                    } else {
                                      available = inventoryManager.getAvailableQuantity(facility.inventory, mat.material_id);
                                    }
                                  } else {
                                    available = facility.current_storage[mat.material_id] || 0;
                                  }
                                  const hasEnough = available >= mat.quantity;
                                  
                                  const tagDisplay = mat.required_tags && mat.required_tags.length > 0 
                                    ? ` [${mat.required_tags.join(', ')}]` 
                                    : '';
                                  const qualityDisplay = mat.max_quality !== undefined 
                                    ? ` (≤${mat.max_quality}%)` 
                                    : '';
                                
                                return (
                                  <div key={idx} className={hasEnough ? "text-gray-400" : "text-red-400"}>
                                    • {mat.material_id}{tagDisplay}{qualityDisplay}: {mat.quantity} {mat.consumed_at_start ? '(consumed at start)' : '(consumed at end)'}
                                    <span className="ml-2 text-xs">
                                      (Available: {available})
                                    </span>
                                  </div>
                                );
                              })}
                              {method.operations.every(op => !op.material_requirements || op.material_requirements.length === 0) && (
                                <div className="text-gray-400">No materials required</div>
                              )}
                            </div>
                            </div>
                          )}
                          
                          {/* Operations display (for both types) */}
                          {!method.id.includes('component') && (
                            <div>
                              <span className="text-gray-500">Operations:</span>
                              <div className="ml-2 space-y-1">
                                {method.operations.map((op, idx) => (
                                  <div key={op.id} className="text-gray-400">
                                    {idx + 1}. {op.name} ({op.baseDurationMinutes}min) - {op.description}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
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
          <div className="text-green-400 font-mono text-lg mb-2">✓ MANUFACTURING V1 COMPLETE</div>
          <div className="text-gray-400 text-sm">
            Machine workspace system with facility-wide job queues and real-time job notifications fully functional.
          </div>
        </div>
      </div>
      
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
      
      {/* Production interface */}
      <ProductionInterface facility={facility} />
      
      {/* Unified job list */}
      <UnifiedJobList workspace={workspace} allJobs={allJobs} />
      
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