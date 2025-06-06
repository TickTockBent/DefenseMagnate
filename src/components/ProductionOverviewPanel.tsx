// Production Overview Panel - Shows capacity, constraints, and recommendations

import { useGameStore } from '../state/gameStoreWithEquipment';
import { analyzeBottlenecks } from '../utils/productionAnalyzer';
import { TagCategory, getTagCategoryName, JobState, StepState } from '../types';

export function ProductionOverviewPanel() {
  const { 
    selectedFacilityId, 
    facilities,
    equipmentDatabase
  } = useGameStore();
  
  const facility = facilities.find(f => f.id === selectedFacilityId);
  
  if (!facility || !facility.production_queue) {
    return null;
  }
  
  const bottlenecks = analyzeBottlenecks(facility, equipmentDatabase);
  
  // Get job statistics
  const jobStats = {
    active: 0,
    queued: 0,
    completed: 0,
    failed: 0
  };
  
  facility.production_queue.jobs.forEach(job => {
    switch (job.state) {
      case JobState.IN_PROGRESS: jobStats.active++; break;
      case JobState.QUEUED: jobStats.queued++; break;
      case JobState.COMPLETED: jobStats.completed++; break;
      case JobState.FAILED: jobStats.failed++; break;
    }
  });
  
  // Calculate total capacity vs used
  const capacityUtilization: Array<{
    category: TagCategory;
    name: string;
    total: number;
    used: number;
    available: number;
    percentage: number;
    activeJobs: string[];
  }> = [];
  
  for (const [category, total] of facility.equipment_capacity) {
    if (total === 0) continue;
    
    let used = 0;
    const activeJobs: string[] = [];
    
    // Calculate used capacity
    for (const job of facility.production_queue.jobs) {
      if (job.state === JobState.IN_PROGRESS) {
        const stepProgress = job.stepProgress[job.currentStepIndex];
        if (stepProgress?.state === StepState.IN_PROGRESS && stepProgress.consumedCapacity) {
          const consumed = stepProgress.consumedCapacity.get(category as any) || 0;
          if (consumed > 0) {
            used += consumed;
            activeJobs.push(`${job.productId} (Step ${job.currentStepIndex + 1})`);
          }
        }
      }
    }
    
    capacityUtilization.push({
      category,
      name: getTagCategoryName(category),
      total,
      used,
      available: total - used,
      percentage: (used / total) * 100,
      activeJobs
    });
  }
  
  // Sort by utilization percentage
  capacityUtilization.sort((a, b) => b.percentage - a.percentage);
  
  // Get capacity bar display
  const getCapacityBar = (percentage: number): string => {
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    let bar = '[';
    
    for (let i = 0; i < filled; i++) {
      bar += '█';
    }
    for (let i = 0; i < empty; i++) {
      bar += '_';
    }
    
    bar += ']';
    return bar;
  };
  
  // Get color class based on utilization
  const getUtilizationColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 70) return 'text-yellow-400';
    if (percentage >= 50) return 'text-teal-400';
    return 'text-green-400';
  };
  
  return (
    <div className="font-mono text-teal-400 border border-gray-700 p-4 mt-4">
      <pre className="whitespace-pre text-gray-400">
╔════════════════════════════════════════════════════════════════════╗
║ PRODUCTION OVERVIEW                                                ║
╚════════════════════════════════════════════════════════════════════╝
      </pre>
      
      {/* Job Statistics */}
      <div className="grid grid-cols-4 gap-2 mb-4 text-sm">
        <div className="border border-gray-800 p-2 text-center">
          <div className="text-green-400 text-lg">{jobStats.active}</div>
          <div className="text-gray-500 text-xs">Active</div>
        </div>
        <div className="border border-gray-800 p-2 text-center">
          <div className="text-yellow-400 text-lg">{jobStats.queued}</div>
          <div className="text-gray-500 text-xs">Queued</div>
        </div>
        <div className="border border-gray-800 p-2 text-center">
          <div className="text-teal-400 text-lg">{jobStats.completed}</div>
          <div className="text-gray-500 text-xs">Completed</div>
        </div>
        <div className="border border-gray-800 p-2 text-center">
          <div className="text-red-400 text-lg">{jobStats.failed}</div>
          <div className="text-gray-500 text-xs">Failed</div>
        </div>
      </div>
      
      {/* Capacity Utilization */}
      <pre className="whitespace-pre text-gray-400">
CAPACITY UTILIZATION:
      </pre>
      
      <div className="space-y-2">
        {capacityUtilization.map(cap => (
          <div key={cap.category} className="border border-gray-800 p-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">{cap.name}</span>
              <span className={`text-sm ${getUtilizationColor(cap.percentage)}`}>
                {getCapacityBar(cap.percentage)} {cap.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Available: {cap.available}/{cap.total}</span>
              <span>Used by: {cap.used > 0 ? cap.activeJobs.join(', ') : 'None'}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Bottleneck Analysis */}
      {bottlenecks.length > 0 && (
        <>
          <pre className="whitespace-pre text-gray-400 mt-4">
BOTTLENECK ANALYSIS:
          </pre>
          
          <div className="space-y-2">
            {bottlenecks.map((bottleneck, idx) => (
              <div key={idx} className="border border-yellow-800 bg-yellow-900 bg-opacity-20 p-2 text-sm">
                <div className="text-yellow-400">
                  ⚠ {getTagCategoryName(bottleneck.category)} - {bottleneck.utilization.toFixed(0)}% utilized
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {bottleneck.recommendation}
                  {bottleneck.waitingJobs > 0 && (
                    <span className="text-yellow-300 ml-2">
                      ({bottleneck.waitingJobs} jobs waiting)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* Equipment Recommendations */}
      <pre className="whitespace-pre text-gray-400 mt-4">
RECOMMENDED UPGRADES:
      </pre>
      
      <div className="space-y-1 text-sm">
        {bottlenecks.slice(0, 3).map((bottleneck, idx) => {
          // Find equipment that provides this category
          const recommendations = Array.from(equipmentDatabase.values())
            .filter(eq => eq.tags.some(tag => tag.category === bottleneck.category && tag.value))
            .sort((a, b) => {
              // Sort by value/cost ratio
              const aValue = a.tags.find(t => t.category === bottleneck.category)?.value || 0;
              const bValue = b.tags.find(t => t.category === bottleneck.category)?.value || 0;
              const aRatio = (typeof aValue === 'number' ? aValue : 1) / a.purchaseCost;
              const bRatio = (typeof bValue === 'number' ? bValue : 1) / b.purchaseCost;
              return bRatio - aRatio;
            })
            .slice(0, 2);
          
          return (
            <div key={idx} className="text-gray-400">
              {idx + 1}. Add {getTagCategoryName(bottleneck.category)}:
              {recommendations.map(eq => (
                <div key={eq.id} className="ml-4 text-xs text-gray-500">
                  • {eq.name} - ${eq.purchaseCost.toLocaleString()}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}