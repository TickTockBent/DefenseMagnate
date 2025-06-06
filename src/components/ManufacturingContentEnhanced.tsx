// Enhanced Manufacturing UI with equipment constraint visibility

import { useState } from 'react';
import { useGameStore } from '../state/gameStoreWithEquipment';
import { productsWithMethods } from '../data/productsWithTags';
import type { ManufacturingMethod, ManufacturingStep, TagCategory } from '../types';
import { meetsTagRequirements, getEfficiencyPenalty, calculateEfficiencyRatio, getTagCategoryName, JobState, StepState, JobPriority } from '../types';

export function ManufacturingContentEnhanced() {
  const { 
    selectedFacilityId, 
    facilities,
    materials,
    credits,
    gameTime,
    addProductionJob,
    equipmentDatabase
  } = useGameStore();
  
  const [selectedProduct, setSelectedProduct] = useState<string>('basic_sidearm');
  const [selectedMethod, setSelectedMethod] = useState<string>('basic_sidearm_forge');
  const [quantity, setQuantity] = useState<number>(1);
  const [showMethodDetails, setShowMethodDetails] = useState<boolean>(false);
  const [showConstraints, setShowConstraints] = useState<boolean>(false);
  
  const facility = facilities.find(f => f.id === selectedFacilityId);
  const product = productsWithMethods[selectedProduct as keyof typeof productsWithMethods];
  const method = product?.manufacturing_methods.find((m: ManufacturingMethod) => m.id === selectedMethod);
  
  if (!facility) {
    return (
      <div className="font-mono text-teal-400 p-4">
        <pre>No facility selected. Select a facility to begin manufacturing.</pre>
      </div>
    );
  }
  
  // Calculate available capacity
  const getAvailableCapacity = (): Map<TagCategory, number> => {
    const available = new Map<TagCategory, number>();
    
    // Copy current capacity
    if (facility.equipment_capacity) {
      for (const [category, value] of facility.equipment_capacity) {
        available.set(category, value);
      }
    }
    
    // Subtract capacity used by active jobs
    if (facility.production_queue) {
      for (const job of facility.production_queue.jobs) {
        if (job.state === JobState.IN_PROGRESS) {
          const stepProgress = job.stepProgress[job.currentStepIndex];
          if (stepProgress?.state === StepState.IN_PROGRESS && stepProgress.consumedCapacity) {
            for (const [category, consumed] of stepProgress.consumedCapacity) {
              const current = available.get(category as TagCategory) || 0;
              available.set(category as TagCategory, Math.max(0, current - consumed));
            }
          }
        }
      }
    }
    
    return available;
  };
  
  // Check if we can start production
  const checkProductionFeasibility = () => {
    if (!method) return { canStart: false, reasons: ['No method selected'] };
    
    const reasons: string[] = [];
    const availableCapacity = getAvailableCapacity();
    let canStart = true;
    
    // Check each step's requirements
    for (const step of method.steps) {
      // Check materials
      for (const mat of step.material_requirements) {
        const available = materials[mat.material_id] || 0;
        const needed = mat.quantity * quantity;
        if (available < needed) {
          reasons.push(`Need ${needed} ${mat.material_id}, have ${available}`);
          canStart = false;
        }
      }
      
      // Check equipment
      const equipCheck = meetsTagRequirements(availableCapacity, step.required_tags);
      if (!equipCheck.meets) {
        for (const req of step.required_tags) {
          const available = availableCapacity.get(req.category) || 0;
          if (typeof req.minimum === 'number' && available < req.minimum * 0.2) {
            const tagName = getTagCategoryName(req.category);
            reasons.push(`${step.name}: Need ${tagName} ${req.minimum}, have ${available}`);
            canStart = false;
          }
        }
      }
    }
    
    return { canStart, reasons };
  };
  
  const feasibility = checkProductionFeasibility();
  
  // Format time display
  const formatTime = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };
  
  // Get penalty display for a step
  const getStepPenaltyInfo = (step: ManufacturingStep) => {
    const availableCapacity = getAvailableCapacity();
    let worstPenalty = { timeMultiplier: 1, qualityMultiplier: 1, failureRiskIncrease: 0 };
    let limitingTag = '';
    
    for (const req of step.required_tags) {
      if (typeof req.minimum === 'number') {
        const available = availableCapacity.get(req.category) || 0;
        const ratio = calculateEfficiencyRatio(available, req.minimum, req.optimal);
        const penalty = getEfficiencyPenalty(ratio);
        
        if (penalty.timeMultiplier > worstPenalty.timeMultiplier) {
          worstPenalty = penalty;
          limitingTag = getTagCategoryName(req.category);
        }
      }
    }
    
    return { penalty: worstPenalty, limitingTag };
  };
  
  // Get active jobs display
  const getActiveJobs = () => {
    if (!facility.production_queue) return [];
    
    return facility.production_queue.jobs.filter(job => 
      job.state === JobState.IN_PROGRESS || job.state === JobState.QUEUED
    );
  };
  
  const activeJobs = getActiveJobs();
  
  return (
    <div className="font-mono text-teal-400 p-4 space-y-4">
      {/* Facility Header */}
      <pre className="whitespace-pre">
{`╔════════════════════════════════════════════════════════════════════╗
║ MANUFACTURING - ${facility.name.padEnd(51)} ║
╠════════════════════════════════════════════════════════════════════╣
║ Credits: $${credits.toLocaleString().padEnd(15)} │ Time: ${new Date(gameTime.elapsed).toISOString().substr(11, 8).padEnd(30)} ║
╚════════════════════════════════════════════════════════════════════╝`}
      </pre>
      
      {/* Equipment Overview */}
      <div>
        <pre className="whitespace-pre text-gray-400">
INSTALLED EQUIPMENT:
        </pre>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {facility.equipment.map(eq => {
            const def = equipmentDatabase.get(eq.equipmentId);
            if (!def) return null;
            
            const tags = def.tags
              .filter(t => typeof t.value === 'number' && t.value > 0)
              .map(t => `${getTagCategoryName(t.category)}: ${t.value}${t.unit || ''}`)
              .join(', ');
            
            return (
              <div key={eq.id} className="border border-gray-700 p-1">
                <div className="text-teal-300">{def.name} [{eq.condition}%]</div>
                <div className="text-gray-500 text-xs">{tags}</div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Production Queue */}
      <div>
        <pre className="whitespace-pre text-gray-400">
ACTIVE PRODUCTION ({activeJobs.length} jobs):
        </pre>
        {activeJobs.length === 0 ? (
          <pre className="text-gray-600">  No active production</pre>
        ) : (
          <div className="space-y-1">
            {activeJobs.map(job => {
              const progress = job.stepProgress.reduce((sum, sp) => 
                sp.state === StepState.COMPLETED ? sum + 100 : sum + sp.progress, 0
              ) / job.steps.length;
              
              return (
                <pre key={job.id} className="text-xs">
{`  [${job.state === JobState.QUEUED ? 'QUEUED' : 'ACTIVE'}] ${job.productId} x${job.quantity} - ${job.steps[job.currentStepIndex]?.name || 'Complete'} - ${progress.toFixed(0)}%`}
                </pre>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Product Selection */}
      <div>
        <pre className="whitespace-pre text-gray-400">
SELECT PRODUCT:
        </pre>
        <select 
          value={selectedProduct}
          onChange={(e) => {
            setSelectedProduct(e.target.value);
            const prod = productsWithMethods[e.target.value as keyof typeof productsWithMethods];
            if (prod?.manufacturing_methods[0]) {
              setSelectedMethod(prod.manufacturing_methods[0].id);
            }
          }}
          className="bg-black text-teal-400 border border-teal-600 p-1 font-mono"
        >
          {Object.entries(productsWithMethods).map(([id, prod]) => (
            <option key={id} value={id}>{prod.name}</option>
          ))}
        </select>
      </div>
      
      {/* Method Selection */}
      {product && (
        <div>
          <pre className="whitespace-pre text-gray-400">
SELECT METHOD:
          </pre>
          <div className="space-y-2">
            {product.manufacturing_methods.map(m => (
              <label key={m.id} className="block">
                <input
                  type="radio"
                  name="method"
                  value={m.id}
                  checked={selectedMethod === m.id}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="mr-2"
                />
                <span className={selectedMethod === m.id ? 'text-teal-300' : 'text-gray-500'}>
                  {m.name} - {m.output_state} quality ({m.output_quality_range[0]}-{m.output_quality_range[1]}%)
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {/* Method Details */}
      {method && (
        <div>
          <button
            onClick={() => setShowMethodDetails(!showMethodDetails)}
            className="text-yellow-400 hover:text-yellow-300"
          >
            [{showMethodDetails ? 'HIDE' : 'SHOW'} METHOD DETAILS]
          </button>
          
          {showMethodDetails && (
            <div className="mt-2 border border-gray-700 p-2">
              <pre className="whitespace-pre text-sm">
{`Duration: ${formatTime(method.total_duration_hours)} base time
Customer Appeal: ${method.customer_appeal.join(', ')}`}
              </pre>
              
              <div className="mt-2 space-y-2">
                {method.steps.map((step, idx) => {
                  const penaltyInfo = getStepPenaltyInfo(step);
                  const availableCapacity = getAvailableCapacity();
                  
                  return (
                    <div key={step.id} className="border border-gray-800 p-2">
                      <div className="text-teal-300">
                        Step {idx + 1}: {step.name} ({step.duration_percentage}% of time)
                      </div>
                      
                      {/* Material Requirements */}
                      {step.material_requirements.length > 0 && (
                        <div className="text-xs mt-1">
                          <span className="text-gray-500">Materials: </span>
                          {step.material_requirements.map(mat => {
                            const available = materials[mat.material_id] || 0;
                            const needed = mat.quantity * quantity;
                            const hasEnough = available >= needed;
                            
                            return (
                              <span key={mat.material_id} className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                                {mat.material_id} {needed}/{available} 
                              </span>
                            );
                          }).join(', ')}
                        </div>
                      )}
                      
                      {/* Equipment Requirements */}
                      <div className="text-xs mt-1">
                        <span className="text-gray-500">Equipment: </span>
                        {step.required_tags.map(req => {
                          const tagName = getTagCategoryName(req.category);
                          const available = availableCapacity.get(req.category) || 0;
                          
                          if (typeof req.minimum === 'boolean') {
                            const hasIt = available > 0;
                            return (
                              <span key={req.category} className={hasIt ? 'text-green-400' : 'text-red-400'}>
                                {tagName} {hasIt ? '✓' : '✗'} 
                              </span>
                            );
                          } else {
                            const ratio = calculateEfficiencyRatio(available, req.minimum, req.optimal);
                            let colorClass = 'text-green-400';
                            if (ratio < 0.2) colorClass = 'text-red-400';
                            else if (ratio < 0.6) colorClass = 'text-yellow-400';
                            
                            return (
                              <span key={req.category} className={colorClass}>
                                {tagName} {available}/{req.minimum}{req.optimal ? `(${req.optimal} optimal)` : ''} 
                              </span>
                            );
                          }
                        }).join(', ')}
                      </div>
                      
                      {/* Penalties */}
                      {penaltyInfo.penalty.timeMultiplier > 1 && (
                        <div className="text-xs mt-1 text-yellow-400">
                          ⚠ {penaltyInfo.limitingTag} penalty: {penaltyInfo.penalty.timeMultiplier}x time, 
                          {Math.round((1 - penaltyInfo.penalty.qualityMultiplier) * 100)}% quality loss, 
                          +{penaltyInfo.penalty.failureRiskIncrease}% failure risk
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Quantity Selection */}
      <div>
        <pre className="whitespace-pre text-gray-400">
QUANTITY:
        </pre>
        <input
          type="number"
          min="1"
          max="100"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className="bg-black text-teal-400 border border-teal-600 p-1 font-mono w-20"
        />
      </div>
      
      {/* Feasibility Check */}
      <div className="border border-gray-700 p-2">
        <div className="flex justify-between items-center">
          <div className={feasibility.canStart ? 'text-green-400' : 'text-red-400'}>
            {feasibility.canStart ? '✓ Ready to start production' : '✗ Cannot start production'}
          </div>
          {!feasibility.canStart && method && (
            <button
              onClick={() => setShowConstraints(true)}
              className="text-yellow-400 hover:text-yellow-300 text-sm"
            >
              [ANALYZE CONSTRAINTS]
            </button>
          )}
        </div>
        {!feasibility.canStart && (
          <div className="mt-1 text-xs space-y-1">
            {feasibility.reasons.slice(0, 3).map((reason, idx) => (
              <div key={idx} className="text-red-300">• {reason}</div>
            ))}
            {feasibility.reasons.length > 3 && (
              <div className="text-gray-500">... and {feasibility.reasons.length - 3} more issues</div>
            )}
          </div>
        )}
      </div>
      
      {/* Start Production Button */}
      <button
        onClick={() => {
          if (feasibility.canStart && method) {
            addProductionJob(
              facility.id,
              selectedProduct,
              selectedMethod,
              quantity,
              JobPriority.NORMAL
            );
          }
        }}
        disabled={!feasibility.canStart}
        className={`px-4 py-2 border ${
          feasibility.canStart 
            ? 'border-teal-400 text-teal-400 hover:bg-teal-900' 
            : 'border-gray-600 text-gray-600 cursor-not-allowed'
        }`}
      >
        [START PRODUCTION]
      </button>
      
      {/* Capacity Overview */}
      <div>
        <pre className="whitespace-pre text-gray-400">
CAPACITY UTILIZATION:
        </pre>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {Array.from(facility.equipment_capacity.entries())
            .filter(([_, total]) => total > 0)
            .map(([category, total]) => {
              const available = getAvailableCapacity().get(category) || 0;
              const used = total - available;
              const utilization = (used / total) * 100;
              
              let colorClass = 'text-green-400';
              if (utilization > 80) colorClass = 'text-red-400';
              else if (utilization > 50) colorClass = 'text-yellow-400';
              
              return (
                <div key={category} className="border border-gray-800 p-1">
                  <div className="text-gray-400">{getTagCategoryName(category)}</div>
                  <div className={colorClass}>
                    {available}/{total} ({utilization.toFixed(0)}% used)
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      
      {/* TODO: Add Production Overview Panel and Constraints Analysis Modal once types are fixed */}
      {showConstraints && (
        <div className="mt-4 p-4 border border-yellow-600 bg-yellow-900 bg-opacity-20">
          <div className="text-yellow-400 mb-2">Constraint Analysis (Under Development)</div>
          <button 
            onClick={() => setShowConstraints(false)}
            className="text-red-400 hover:text-red-300"
          >
            [CLOSE]
          </button>
        </div>
      )}
    </div>
  );
}