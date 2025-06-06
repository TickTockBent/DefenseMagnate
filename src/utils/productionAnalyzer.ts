// Production constraint analyzer - helps players understand bottlenecks

import { 
  Equipment, 
  EquipmentInstance,
  TagCategory, 
  getTagCategoryName,
  ManufacturingMethod, 
  ManufacturingStep,
  Facility
} from '../types';

export interface ConstraintAnalysis {
  step: ManufacturingStep;
  stepIndex: number;
  constraints: Array<{
    type: 'material' | 'equipment';
    name: string;
    required: number;
    available: number;
    deficit: number;
    solutions: string[];
  }>;
}

export interface ProductionAnalysis {
  canProduce: boolean;
  maxPossibleQuantity: number;
  constraints: ConstraintAnalysis[];
  recommendations: string[];
  requiredEquipment: Map<string, Equipment>;
}

export function analyzeProductionConstraints(
  method: ManufacturingMethod,
  quantity: number,
  facility: Facility,
  materials: Record<string, number>,
  equipmentDatabase: Map<string, Equipment>,
  availableCapacity: Map<TagCategory, number>
): ProductionAnalysis {
  const constraints: ConstraintAnalysis[] = [];
  const recommendations = new Set<string>();
  const requiredEquipment = new Map<string, Equipment>();
  let maxPossibleQuantity = Infinity;
  let canProduce = true;
  
  // Analyze each step
  method.steps.forEach((step, stepIndex) => {
    const stepConstraints: ConstraintAnalysis['constraints'] = [];
    
    // Check material constraints
    step.material_requirements.forEach(mat => {
      const available = materials[mat.material_id] || 0;
      const requiredTotal = mat.quantity * quantity;
      
      if (available < requiredTotal) {
        const maxFromMaterial = Math.floor(available / mat.quantity);
        maxPossibleQuantity = Math.min(maxPossibleQuantity, maxFromMaterial);
        canProduce = false;
        
        stepConstraints.push({
          type: 'material',
          name: mat.material_id,
          required: requiredTotal,
          available: available,
          deficit: requiredTotal - available,
          solutions: [
            `Purchase ${requiredTotal - available} more ${mat.material_id}`,
            `Reduce quantity to ${maxFromMaterial} or less`
          ]
        });
        
        recommendations.add(`Need more ${mat.material_id}: ${available}/${requiredTotal}`);
      }
    });
    
    // Check equipment constraints
    step.required_tags.forEach(req => {
      const tagName = getTagCategoryName(req.category);
      const available = availableCapacity.get(req.category) || 0;
      
      if (typeof req.minimum === 'boolean') {
        if (req.minimum && available === 0) {
          canProduce = false;
          
          // Find equipment that provides this tag
          const providingEquipment = findEquipmentWithTag(req.category, equipmentDatabase);
          providingEquipment.forEach(eq => requiredEquipment.set(eq.id, eq));
          
          stepConstraints.push({
            type: 'equipment',
            name: tagName,
            required: 1,
            available: 0,
            deficit: 1,
            solutions: providingEquipment.slice(0, 3).map(eq => 
              `Purchase ${eq.name} ($${eq.purchaseCost.toLocaleString()})`
            )
          });
          
          recommendations.add(`Missing required: ${tagName}`);
        }
      } else {
        // Numeric requirement
        if (available < req.minimum) {
          const deficit = req.minimum - available;
          canProduce = false;
          
          // Find equipment that provides this tag
          const providingEquipment = findEquipmentWithTag(req.category, equipmentDatabase)
            .filter(eq => {
              const tagValue = getEquipmentTagValue(eq, req.category);
              return tagValue > 0;
            })
            .sort((a, b) => {
              // Sort by efficiency per dollar
              const aValue = getEquipmentTagValue(a, req.category);
              const bValue = getEquipmentTagValue(b, req.category);
              const aEfficiency = aValue / a.purchaseCost;
              const bEfficiency = bValue / b.purchaseCost;
              return bEfficiency - aEfficiency;
            });
          
          providingEquipment.forEach(eq => requiredEquipment.set(eq.id, eq));
          
          stepConstraints.push({
            type: 'equipment',
            name: tagName,
            required: req.minimum,
            available: available,
            deficit: deficit,
            solutions: providingEquipment.slice(0, 3).map(eq => {
              const value = getEquipmentTagValue(eq, req.category);
              return `Purchase ${eq.name} (+${value} ${tagName}, $${eq.purchaseCost.toLocaleString()})`;
            })
          });
          
          // Calculate how many items can be produced with current capacity
          if (req.consumes) {
            const maxFromCapacity = Math.floor(available / req.consumes);
            maxPossibleQuantity = Math.min(maxPossibleQuantity, maxFromCapacity);
          }
          
          recommendations.add(`Need more ${tagName}: ${available}/${req.minimum}`);
        } else if (req.optimal && available < req.optimal) {
          // Sub-optimal but workable
          recommendations.add(`${tagName} sub-optimal: ${available}/${req.optimal} (will be slower)`);
        }
      }
    });
    
    if (stepConstraints.length > 0) {
      constraints.push({
        step,
        stepIndex,
        constraints: stepConstraints
      });
    }
  });
  
  // Add general recommendations
  if (canProduce) {
    recommendations.add('All requirements met - production can start');
  } else if (maxPossibleQuantity > 0) {
    recommendations.add(`Maximum possible quantity: ${maxPossibleQuantity}`);
  }
  
  return {
    canProduce,
    maxPossibleQuantity: maxPossibleQuantity === Infinity ? quantity : maxPossibleQuantity,
    constraints,
    recommendations: Array.from(recommendations),
    requiredEquipment
  };
}

// Find equipment that provides a specific tag
function findEquipmentWithTag(
  category: TagCategory,
  equipmentDatabase: Map<string, Equipment>
): Equipment[] {
  const results: Equipment[] = [];
  
  for (const [_, equipment] of equipmentDatabase) {
    for (const tag of equipment.tags) {
      if (tag.category === category && tag.value) {
        results.push(equipment);
        break;
      }
    }
  }
  
  return results;
}

// Get the value of a specific tag from equipment
function getEquipmentTagValue(equipment: Equipment, category: TagCategory): number {
  for (const tag of equipment.tags) {
    if (tag.category === category) {
      if (typeof tag.value === 'number') return tag.value;
      if (tag.value === true) return 1;
    }
  }
  return 0;
}

// Analyze bottlenecks across all production
export function analyzeBottlenecks(
  facility: Facility,
  equipmentDatabase: Map<string, Equipment>
): Array<{
  category: TagCategory;
  utilization: number;
  waitingJobs: number;
  recommendation: string;
}> {
  if (!facility.production_queue) return [];
  
  const bottlenecks: Map<TagCategory, { utilization: number; waitingJobs: number }> = new Map();
  
  // Analyze utilization
  for (const [category, total] of facility.equipment_capacity) {
    let used = 0;
    let waiting = 0;
    
    // Count usage from active jobs
    for (const job of facility.production_queue.jobs) {
      if (job.state === 'in_progress' && job.stepProgress[job.currentStepIndex]) {
        const consumed = job.stepProgress[job.currentStepIndex].consumedCapacity?.get(category as any) || 0;
        used += consumed;
      } else if (job.state === 'queued') {
        // Check if this job is waiting for this resource
        const step = job.steps[0]; // Check first step
        for (const req of step.required_tags) {
          if (req.category === category && typeof req.minimum === 'number') {
            waiting++;
            break;
          }
        }
      }
    }
    
    const utilization = total > 0 ? (used / total) * 100 : 0;
    bottlenecks.set(category, { utilization, waitingJobs: waiting });
  }
  
  // Generate recommendations
  return Array.from(bottlenecks.entries())
    .filter(([_, data]) => data.utilization > 50 || data.waitingJobs > 0)
    .map(([category, data]) => {
      let recommendation = '';
      
      if (data.utilization > 80) {
        recommendation = `Critical bottleneck - add more ${getTagCategoryName(category)} equipment immediately`;
      } else if (data.utilization > 50) {
        recommendation = `High utilization - consider adding ${getTagCategoryName(category)} equipment`;
      } else if (data.waitingJobs > 0) {
        recommendation = `${data.waitingJobs} jobs waiting for ${getTagCategoryName(category)} capacity`;
      }
      
      return {
        category,
        utilization: data.utilization,
        waitingJobs: data.waitingJobs,
        recommendation
      };
    })
    .sort((a, b) => b.utilization - a.utilization);
}