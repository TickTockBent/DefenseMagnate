// Machine Workspace View - Shows machines with job slots

import { useGameStore } from '../state/gameStoreWithEquipment';
import { MachineSlot, MachineSlotJob, MachineWorkspace, Facility, MachineBasedMethod } from '../types';
import { Equipment, EquipmentInstance } from '../types';
import { formatGameTime } from '../utils/gameClock';
import { useState, useEffect } from 'react';
import { basicSidearmMethods, tacticalKnifeMethods } from '../data/manufacturingMethods';
import { inventoryManager } from '../utils/inventoryManager';
// LEGACY: import { JobState } from '../constants/enums'; // No longer needed with new machine workspace system

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
  const getProgressBar = (progress: number) => {
    const filled = Math.floor(progress * 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };
  
  const getTimeRemaining = () => {
    if (!slot.currentJob || !slot.currentProgress) return 'N/A';
    
    // All times are now in game hours
    const elapsed = currentTime - slot.currentProgress.startTime;
    const duration = slot.currentProgress.estimatedCompletion - slot.currentProgress.startTime;
    const remaining = Math.max(0, duration - elapsed);
    
    // Convert game hours to minutes for display
    const remainingMinutes = Math.floor(remaining * 60);
    const remainingSeconds = Math.floor((remaining * 3600) % 60);
    
    if (isNaN(remainingMinutes) || isNaN(remainingSeconds)) {
      console.log('Time calculation error:', {
        elapsed,
        duration,
        remaining,
        estimatedCompletion: slot.currentProgress.estimatedCompletion,
        startTime: slot.currentProgress.startTime,
        currentTime
      });
      return 'ERROR';
    }
    
    return `${remainingMinutes}m ${remainingSeconds}s`;
  };
  
  const getProgress = () => {
    if (!slot.currentJob || !slot.currentProgress) return 0;
    
    // All times are now in game hours
    const elapsed = currentTime - slot.currentProgress.startTime;
    const duration = slot.currentProgress.estimatedCompletion - slot.currentProgress.startTime;
    const progress = duration > 0 ? elapsed / duration : 0;
    
    if (isNaN(progress)) {
      console.log('Progress calculation error:', {
        elapsed,
        duration,
        estimatedCompletion: slot.currentProgress.estimatedCompletion,
        startTime: slot.currentProgress.startTime
      });
      return 0;
    }
    
    return Math.min(1, Math.max(0, progress));
  };
  
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

interface JobFlowDisplayProps {
  jobs: MachineSlotJob[];
}

function JobFlowDisplay({ jobs }: JobFlowDisplayProps) {
  // Show up to 3 active jobs
  const activeJobs = jobs.filter(j => j.state === 'in_progress').slice(0, 3);
  
  return (
    <div className="border border-gray-600 bg-gray-900 p-3 mb-4">
      <h3 className="text-gray-400 font-bold mb-3">ACTIVE JOBS</h3>
      
      {activeJobs.length === 0 ? (
        <div className="text-gray-500">No active jobs</div>
      ) : (
        activeJobs.map(job => (
          <div key={job.id} className="mb-3 last:mb-0">
            <div className="text-sm text-white mb-1">
              {formatProductName(job.productId)} ({job.method.name})
            </div>
            
            <div className="flex space-x-2 text-xs">
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
                  <div key={op.id} className={`${statusClass}`}>
                    <span>{statusSymbol}</span>
                    <span className="ml-1">{op.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

interface JobQueueProps {
  workspace: MachineWorkspace;
}

function JobQueue({ workspace }: JobQueueProps) {
  // Use the facility-wide job queue
  const queuedJobs = workspace.jobQueue;

  return (
    <div className="border border-gray-600 bg-gray-900 p-3">
      <h3 className="text-gray-400 font-bold mb-3">FACILITY JOB QUEUE ({queuedJobs.length})</h3>
      
      <div className="max-h-32 overflow-y-auto">
        {queuedJobs.length === 0 ? (
          <div className="text-gray-500 text-sm">No jobs in queue</div>
        ) : (
          <div className="space-y-2">
            {queuedJobs.map(job => (
              <div key={job.id} className="text-xs border-l-2 border-gray-600 pl-2">
                <div className="flex justify-between items-center">
                  <span className="text-white">
                    {formatProductName(job.productId)} ({job.method.name})
                  </span>
                  {job.rushOrder && (
                    <span className="text-red-400 font-bold">RUSH</span>
                  )}
                </div>
                <div className="text-gray-400">
                  Next: {job.method.operations[job.currentOperationIndex]?.name}
                </div>
              </div>
            ))}
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
  const workspace = useGameStore(state => state.machineWorkspace);
  
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
                // Check if all materials are available
                const allMaterials = method.operations.flatMap(op => op.material_requirements);
                const hasAllMaterials = allMaterials.every(mat => {
                  let available: number;
                  if (facility.inventory) {
                    if (mat.required_tags && mat.required_tags.length > 0) {
                      available = inventoryManager.getAvailableQuantityWithTags(facility.inventory, mat.material_id, mat.required_tags);
                    } else {
                      available = inventoryManager.getAvailableQuantity(facility.inventory, mat.material_id);
                    }
                  } else {
                    available = facility.current_storage[mat.material_id] || 0;
                  }
                  return available >= mat.quantity;
                });
                
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
                          <div className="mb-2">
                            <span className="text-gray-500">Materials:</span>
                            <div className="ml-2 space-y-1">
                              {method.operations.flatMap(op => op.material_requirements).map((mat, idx) => {
                                // Check availability from new inventory or legacy storage
                                let available: number;
                                if (facility.inventory) {
                                  if (mat.required_tags && mat.required_tags.length > 0) {
                                    available = inventoryManager.getAvailableQuantityWithTags(facility.inventory, mat.material_id, mat.required_tags);
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
                                
                                return (
                                  <div key={idx} className={hasEnough ? "text-gray-400" : "text-red-400"}>
                                    • {mat.material_id}{tagDisplay}: {mat.quantity} {mat.consumed_at_start ? '(consumed at start)' : '(consumed at end)'}
                                    <span className="ml-2 text-xs">
                                      (Available: {available})
                                    </span>
                                  </div>
                                );
                              })}
                              {method.operations.every(op => op.material_requirements.length === 0) && (
                                <div className="text-gray-400">No materials required</div>
                              )}
                            </div>
                          </div>
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

      {/* Job Queue */}
      {workspace && <JobQueue workspace={workspace} />}
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
    gameTime, 
    startMachineJob 
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
      
      {/* Job flow visualization */}
      <JobFlowDisplay jobs={allJobs.filter(j => j.state === 'in_progress')} />
      
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