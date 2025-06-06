// Constraints Tooltip - Shows detailed reasons why production can't start

import type { ManufacturingMethod, Facility, TagCategory } from '../types';
import type { ProductionAnalysis } from '../utils/productionAnalyzer';
import { analyzeProductionConstraints } from '../utils/productionAnalyzer';
import { getTagCategoryName } from '../types';

interface ConstraintsTooltipProps {
  method: ManufacturingMethod;
  quantity: number;
  facility: Facility;
  materials: Record<string, number>;
  equipmentDatabase: Map<string, any>;
  availableCapacity: Map<TagCategory, number>;
  onClose: () => void;
}

export function ConstraintsTooltip({
  method,
  quantity,
  facility,
  materials,
  equipmentDatabase,
  availableCapacity,
  onClose
}: ConstraintsTooltipProps) {
  const analysis = analyzeProductionConstraints(
    method,
    quantity,
    facility,
    materials,
    equipmentDatabase,
    availableCapacity
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-black border-2 border-teal-400 p-4 max-w-4xl max-h-96 overflow-y-auto font-mono text-teal-400">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl">Production Constraint Analysis</h3>
          <button 
            onClick={onClose}
            className="text-red-400 hover:text-red-300"
          >
            [CLOSE]
          </button>
        </div>
        
        {/* Summary */}
        <div className="mb-4 p-2 border border-gray-700">
          <div className={analysis.canProduce ? 'text-green-400' : 'text-red-400'}>
            Status: {analysis.canProduce ? 'Ready to produce' : 'Cannot produce'}
          </div>
          <div className="text-sm text-gray-400">
            Requested: {quantity} units | Maximum possible: {analysis.maxPossibleQuantity} units
          </div>
        </div>
        
        {/* Constraints by Step */}
        <div className="space-y-4">
          {analysis.constraints.map((constraint, idx) => (
            <div key={idx} className="border border-red-700 bg-red-900 bg-opacity-20 p-3">
              <div className="text-yellow-400 mb-2">
                Step {constraint.stepIndex + 1}: {constraint.step.name}
              </div>
              
              <div className="space-y-2">
                {constraint.constraints.map((c, cidx) => (
                  <div key={cidx} className="ml-2">
                    <div className="text-red-300">
                      {c.type === 'material' ? '📦' : '🔧'} {c.name}: 
                      <span className="text-white ml-2">
                        Need {c.required}, Have {c.available} (deficit: {c.deficit})
                      </span>
                    </div>
                    
                    <div className="ml-6 mt-1">
                      <div className="text-xs text-gray-400">Solutions:</div>
                      {c.solutions.map((solution, sidx) => (
                        <div key={sidx} className="text-xs text-teal-300 ml-2">
                          • {solution}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Required Equipment */}
        {analysis.requiredEquipment.size > 0 && (
          <div className="mt-4">
            <div className="text-gray-400 mb-2">Equipment Needed:</div>
            <div className="grid grid-cols-2 gap-2">
              {Array.from(analysis.requiredEquipment.values()).map(eq => (
                <div key={eq.id} className="border border-gray-700 p-2 text-sm">
                  <div className="text-teal-300">{eq.name}</div>
                  <div className="text-xs text-gray-400">
                    Cost: ${eq.purchaseCost.toLocaleString()}
                    {eq.installationCost > 0 && ` + $${eq.installationCost.toLocaleString()} install`}
                  </div>
                  <div className="text-xs text-gray-400">
                    Space: {eq.footprint}m² | Daily: ${eq.dailyOperatingCost}/day
                  </div>
                  <div className="text-xs text-gray-500">
                    Provides: {eq.tags
                      .filter(t => t.value)
                      .map(t => `${getTagCategoryName(t.category)}: ${t.value}${t.unit || ''}`)
                      .join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recommendations */}
        <div className="mt-4">
          <div className="text-gray-400 mb-2">Recommendations:</div>
          <div className="space-y-1">
            {analysis.recommendations.map((rec, idx) => (
              <div key={idx} className="text-sm text-yellow-300">
                • {rec}
              </div>
            ))}
          </div>
        </div>
        
        {/* Step-by-Step Requirements */}
        <div className="mt-4">
          <div className="text-gray-400 mb-2">Full Method Requirements:</div>
          <div className="space-y-3">
            {method.steps.map((step, idx) => (
              <div key={idx} className="border border-gray-800 p-2 text-sm">
                <div className="text-teal-300 mb-1">
                  Step {idx + 1}: {step.name} ({step.duration_percentage}% of time)
                </div>
                
                {/* Materials */}
                {step.material_requirements.length > 0 && (
                  <div className="mb-1">
                    <span className="text-gray-500">Materials: </span>
                    {step.material_requirements.map(mat => {
                      const available = materials[mat.material_id] || 0;
                      const needed = mat.quantity * quantity;
                      const hasEnough = available >= needed;
                      
                      return (
                        <span key={mat.material_id} className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                          {mat.material_id} ({needed} needed, {available} available){' '}
                        </span>
                      );
                    })}
                  </div>
                )}
                
                {/* Equipment */}
                <div className="mb-1">
                  <span className="text-gray-500">Equipment: </span>
                  {step.required_tags.map(req => {
                    const tagName = getTagCategoryName(req.category);
                    const available = availableCapacity.get(req.category) || 0;
                    
                    if (typeof req.minimum === 'boolean') {
                      const hasIt = available > 0;
                      return (
                        <span key={req.category} className={hasIt ? 'text-green-400' : 'text-red-400'}>
                          {tagName} {hasIt ? '✓' : '✗'}{' '}
                        </span>
                      );
                    } else {
                      let colorClass = 'text-green-400';
                      if (available < req.minimum * 0.2) colorClass = 'text-red-400';
                      else if (available < req.minimum) colorClass = 'text-yellow-400';
                      
                      return (
                        <span key={req.category} className={colorClass}>
                          {tagName} ({available}/{req.minimum}{req.optimal ? `/${req.optimal}` : ''}){' '}
                        </span>
                      );
                    }
                  })}
                </div>
                
                {/* Labor */}
                <div className="text-xs text-gray-500">
                  Labor: {step.labor_skill} worker required
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}