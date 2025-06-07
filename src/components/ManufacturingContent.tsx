import { useGameStore } from '../state/gameStore'
import { getAllProductIds, getProductData, canAffordMaterials } from '../data/productHelpers'
import { getProductionProgress, formatGameTimeRemaining, getProductionTimeRemainingHours } from '../utils/timeSystem'
import { useEffect } from 'react'

export function ManufacturingContent() {
  const facilities = useGameStore((state) => state.facilities)
  const materials = useGameStore((state) => state.materials)
  const productionLines = useGameStore((state) => state.productionLines)
  const completedProducts = useGameStore((state) => state.completedProducts)
  const gameTime = useGameStore((state) => state.gameTime)
  const startProduction = useGameStore((state) => state.startProduction)
  const startMultiStepProduction = useGameStore((state) => state.startMultiStepProduction)
  const processCompletedProduction = useGameStore((state) => state.processCompletedProduction)
  const processMultiStepProduction = useGameStore((state) => state.processMultiStepProduction)
  
  const availableProducts = getAllProductIds()
  const garage = facilities[0] // Our starting garage
  
  // Legacy production processing is now handled by main game clock in App.tsx
  // This component only displays the UI state

  const handleStartProduction = (productId: string) => {
    if (garage) {
      startProduction(garage.id, productId, 1) // Make 1 unit
    }
  }

  const handleStartMultiStepProduction = (productId: string, methodId: string) => {
    if (garage) {
      startMultiStepProduction(garage.id, productId, methodId, 1) // Make 1 unit
    }
  }

  // Helper function to check if we can afford materials for a manufacturing method
  const canAffordMethodMaterials = (method: any, quantity: number) => {
    for (const step of method.steps) {
      for (const matReq of step.material_requirements) {
        const needed = matReq.quantity * quantity;
        const available = materials[matReq.material_id] || 0;
        if (available < needed) {
          return false;
        }
      }
    }
    return true;
  }

  // Helper function to calculate step progress for multi-step lines
  const getStepProgress = (line: any) => {
    if (!line.manufacturing_method || !line.step_instances) return null;
    
    const method = line.manufacturing_method;
    const currentStepIndex = line.current_step_index || 0;
    const currentStep = method.steps[currentStepIndex];
    const stepInstance = line.step_instances[currentStepIndex];
    
    if (!currentStep || !stepInstance) return null;
    
    const stepDurationHours = method.total_duration_hours * (currentStep.duration_percentage / 100);
    const stepStartTime = stepInstance.start_game_time || line.startGameTime;
    const stepElapsedTime = gameTime.totalGameHours - stepStartTime;
    const stepProgress = Math.min(100, Math.max(0, (stepElapsedTime / stepDurationHours) * 100));
    
    return {
      currentStepIndex,
      currentStep,
      stepInstance,
      stepProgress,
      totalSteps: method.steps.length
    };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="terminal-header">
        <span className="ascii-accent">⚙</span> MANUFACTURING
      </div>

      {/* Implementation Status Notice */}
      <div className="terminal-card border-blue-600">
        <div className="text-center">
          <div className="text-blue-400 font-mono text-lg mb-2">⚠ PARTIALLY IMPLEMENTED</div>
          <div className="text-gray-400 text-sm">
            Basic production works with real-time progress. Missing: complex assembly lines, material logistics, quality control, and advanced manufacturing features.
          </div>
        </div>
      </div>

      {/* Garage Status */}
      {garage && (
        <div className="terminal-card">
          <h3 className="text-white font-medium mb-3">{garage.name}</h3>
          <div className="text-sm text-gray-400 mb-4">
            {garage.description}
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Type:</span>
              <div className="text-teal-400">{garage.type}</div>
            </div>
            <div>
              <span className="text-gray-400">Production Lines:</span>
              <div className="text-teal-400">{garage.production_lines}</div>
            </div>
            <div>
              <span className="text-gray-400">Max Size:</span>
              <div className="text-teal-400">{garage.max_item_size}</div>
            </div>
          </div>
        </div>
      )}

      {/* Available Products with Manufacturing Methods */}
      <div>
        <h3 className="text-sm font-mono text-gray-400 mb-4">AVAILABLE PRODUCTS & METHODS</h3>
        <div className="space-y-4">
          {availableProducts.map((productId) => {
            const product = getProductData(productId)
            if (!product) return null
            
            return (
              <div key={productId} className="terminal-card">
                <h4 className="text-white font-medium mb-3">{product.name}</h4>
                
                {/* Show manufacturing methods if available */}
                {product.manufacturing_methods && product.manufacturing_methods.length > 0 ? (
                  <div className="space-y-3">
                    {product.manufacturing_methods.map((method) => {
                      const canAfford = canAffordMethodMaterials(method, 1);
                      
                      return (
                        <div key={method.id} className="bg-gray-800 p-3 rounded border-l-2 border-teal-600">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="text-teal-400 font-medium">{method.name}</h5>
                              <div className="text-xs text-gray-400 mt-1">{method.description}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Duration: {method.total_duration_hours}h • Quality: {method.output_quality_range[0]}-{method.output_quality_range[1]}%
                                {method.input_state && <span> • Requires: {method.input_state} input</span>}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleStartMultiStepProduction(productId, method.id)}
                              disabled={!canAfford}
                              className={`px-3 py-1 text-sm font-mono rounded ${
                                canAfford 
                                  ? 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer' 
                                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {canAfford ? 'START' : 'INSUFFICIENT'}
                            </button>
                          </div>
                          
                          {/* Show step breakdown */}
                          <div className="text-xs text-gray-500 mt-2">
                            <div className="font-medium mb-1">Manufacturing Steps:</div>
                            {method.steps.map((step, stepIndex) => {
                              const materialsText = step.material_requirements.length > 0 
                                ? step.material_requirements.map(req => `${req.quantity}x ${req.material_id}`).join(', ')
                                : 'No materials';
                              
                              return (
                                <div key={step.id} className="ml-2 mb-1">
                                  <span className="text-gray-400">{stepIndex + 1}.</span> {step.name} ({step.duration_percentage}%)
                                  <div className="ml-4 text-gray-600">
                                    Materials: {materialsText}
                                    {step.can_fail && <span className="text-yellow-400 ml-2">[{(step.failure_chance * 100).toFixed(0)}% fail risk]</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Fallback to legacy single-method production */
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-gray-400 mt-1">Legacy Production Method:</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {product.materials_required.map(req => (
                            <div key={req.material_id}>
                              • {req.quantity_per_unit}x {req.material_id} 
                              <span className={`ml-2 ${(materials[req.material_id] || 0) >= req.quantity_per_unit ? 'text-green-400' : 'text-red-400'}`}>
                                ({materials[req.material_id] || 0} available)
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Labor: {product.base_labor_hours} hours • Complexity: {product.complexity_rating}/10
                        </div>
                      </div>
                      <button 
                        onClick={() => handleStartProduction(productId)}
                        disabled={!canAffordMaterials(productId, 1, materials)}
                        className={`px-3 py-1 text-sm font-mono rounded ${
                          canAffordMaterials(productId, 1, materials)
                            ? 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer' 
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {canAffordMaterials(productId, 1, materials) ? 'START PRODUCTION' : 'INSUFFICIENT MATERIALS'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Production */}
      {productionLines.length > 0 && (
        <div>
          <h3 className="text-sm font-mono text-gray-400 mb-4">ACTIVE PRODUCTION</h3>
          <div className="space-y-3">
            {productionLines.map((line) => {
              if (!line.productId) return null
              const product = getProductData(line.productId)
              if (!product) return null
              
              // Check if this is a multi-step production line
              const stepInfo = getStepProgress(line);
              
              if (stepInfo) {
                // Multi-step production line
                const { currentStepIndex, currentStep, stepProgress, totalSteps } = stepInfo;
                const overallProgress = getProductionProgress(line.startGameTime, line.durationHours, gameTime.totalGameHours);
                const timeRemaining = getProductionTimeRemainingHours(line.startGameTime, line.durationHours, gameTime.totalGameHours);
                const isComplete = line.status === 'completed' || overallProgress >= 100;
                const isFailed = line.status === 'failed';
                
                return (
                  <div key={line.id} className={`terminal-card ${isComplete ? 'border-green-600' : isFailed ? 'border-red-600' : 'border-teal-600'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-white font-medium">{product.name}</h4>
                        <div className="text-sm text-gray-400">
                          Method: {line.manufacturing_method?.name} • Quantity: {line.quantity}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {isFailed ? 'Production Failed' : isComplete ? 'Complete!' : `Step ${currentStepIndex + 1}/${totalSteps}: ${currentStep.name}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-mono ${isComplete ? 'text-green-400' : isFailed ? 'text-red-400' : gameTime.isPaused ? 'text-yellow-400' : 'text-teal-400'}`}>
                          {isFailed ? 'FAILED' : isComplete ? 'COMPLETE' : gameTime.isPaused ? 'PAUSED' : 'IN PROGRESS'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {isComplete ? 'Ready for collection' : formatGameTimeRemaining(timeRemaining)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Multi-step progress visualization */}
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400 mb-2">Manufacturing Progress:</div>
                      {line.manufacturing_method?.steps.map((step, stepIndex) => {
                        const instance = line.step_instances?.[stepIndex];
                        const isCurrentStep = stepIndex === currentStepIndex;
                        const isCompleted = instance?.status === 'completed';
                        const isFailed = instance?.status === 'failed';
                        
                        let statusColor = 'text-gray-500';
                        let statusSymbol = '○';
                        if (isCompleted) {
                          statusColor = 'text-green-400';
                          statusSymbol = '●';
                        } else if (isFailed) {
                          statusColor = 'text-red-400';
                          statusSymbol = '✗';
                        } else if (isCurrentStep) {
                          statusColor = 'text-teal-400';
                          statusSymbol = '◐';
                        }
                        
                        return (
                          <div key={step.id} className="flex items-center space-x-2 text-xs">
                            <span className={statusColor}>{statusSymbol}</span>
                            <span className={isCurrentStep ? 'text-white' : 'text-gray-400'}>
                              {step.name} ({step.duration_percentage}%)
                            </span>
                            {isCurrentStep && !isCompleted && !isFailed && (
                              <div className="flex-1 max-w-32">
                                <div className="w-full bg-gray-700 rounded-full h-1">
                                  <div 
                                    className="bg-teal-500 h-1 rounded-full" 
                                    style={{ width: `${Math.min(100, stepProgress)}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            {step.can_fail && (
                              <span className="text-yellow-400">⚠</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Overall progress bar */}
                    <div className="mt-3">
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${isFailed ? 'bg-red-500' : ''}`}
                          style={{ width: `${Math.min(100, overallProgress)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Legacy single-step production line
                const progress = getProductionProgress(line.startGameTime, line.durationHours, gameTime.totalGameHours);
                const timeRemaining = getProductionTimeRemainingHours(line.startGameTime, line.durationHours, gameTime.totalGameHours);
                const isComplete = progress >= 100;
                
                return (
                  <div key={line.id} className={`terminal-card ${isComplete ? 'border-green-600' : 'border-teal-600'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-medium">{product.name}</h4>
                        <div className="text-sm text-gray-400">
                          Quantity: {line.quantity} • Progress: {Math.floor(progress)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Status: {isComplete ? 'Complete!' : line.status} (Legacy Method)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-mono ${isComplete ? 'text-green-400' : gameTime.isPaused ? 'text-yellow-400' : 'text-teal-400'}`}>
                          {isComplete ? 'COMPLETE' : gameTime.isPaused ? 'PAUSED' : 'IN PROGRESS'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {isComplete ? 'Ready for collection' : formatGameTimeRemaining(timeRemaining)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${Math.min(100, progress)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}

      {/* Completed Products Inventory */}
      {Object.keys(completedProducts).length > 0 && (
        <div>
          <h3 className="text-sm font-mono text-gray-400 mb-4">COMPLETED PRODUCTS</h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(completedProducts).map(([productName, quantity]) => (
              <div key={productName} className="terminal-card border-green-600">
                <div className="text-center">
                  <h4 className="text-white font-medium">{productName}</h4>
                  <div className="text-2xl font-mono text-green-400 my-2">{quantity}</div>
                  <div className="text-xs text-gray-500">Units ready</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}