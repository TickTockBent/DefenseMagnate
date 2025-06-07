// Equipment management UI panel

import { useGameStore } from '../state/gameStoreWithEquipment';
import type { Equipment, EquipmentInstance, TagCategory } from '../types';
import { getTagCategoryName } from '../types';

export function EquipmentPanel() {
  const { 
    selectedFacilityId, 
    facilities, 
    equipmentDatabase,
    credits,
    purchaseEquipment,
    sellEquipment,
    maintainEquipment 
  } = useGameStore();
  
  const facility = facilities.find(f => f.id === selectedFacilityId);
  
  if (!facility) {
    return (
      <div className="font-mono text-teal-400 p-4">
        <pre className="whitespace-pre">
{`╔════════════════════════════════════════════════════════════════════╗
║ EQUIPMENT MANAGEMENT                                               ║
║                                                                    ║
║ No facility selected                                               ║
╚════════════════════════════════════════════════════════════════════╝`}
        </pre>
      </div>
    );
  }
  
  // Calculate utilization for each equipment
  const getUtilization = (instance: EquipmentInstance): number => {
    if (!facility.production_queue) return 0;
    const allocations = facility.production_queue.equipmentAllocations.get(instance.id);
    return allocations ? allocations.length : 0;
  };
  
  // Format tag display
  const formatTags = (equipment: Equipment): string => {
    const tags = equipment.tags
      .filter(tag => tag.value)
      .map(tag => {
        if (typeof tag.value === 'boolean') {
          return getTagCategoryName(tag.category);
        }
        return `${getTagCategoryName(tag.category)} ${tag.value}${tag.unit || ''}`;
      })
      .join(', ');
    return tags.length > 50 ? tags.substring(0, 47) + '...' : tags;
  };
  
  // Get condition display
  const getConditionDisplay = (condition: number): string => {
    if (condition >= 90) return `[████████] ${condition}%`;
    if (condition >= 70) return `[██████__] ${condition}%`;
    if (condition >= 50) return `[████____] ${condition}%`;
    if (condition >= 30) return `[██______] ${condition}%`;
    return `[________] ${condition}%`;
  };
  
  return (
    <div className="font-mono text-teal-400 p-4">
      <pre className="whitespace-pre">
{`╔════════════════════════════════════════════════════════════════════╗
║ EQUIPMENT MANAGEMENT - ${facility.name.padEnd(44)} ║
╠════════════════════════════════════════════════════════════════════╣
║ Space: ${facility.used_floor_space}/${facility.floor_space}m² used │ Credits: $${credits.toLocaleString().padEnd(35)} ║
╚════════════════════════════════════════════════════════════════════╝

INSTALLED EQUIPMENT
┌──────────────────────────────┬──────────┬────────────┬─────────────┐
│ Equipment                    │ Condition│ Status     │ Actions     │
├──────────────────────────────┼──────────┼────────────┼─────────────┤`}
        </pre>
        
        {facility.equipment.length === 0 ? (
          <pre className="whitespace-pre">
{`│ No equipment installed       │          │            │             │`}
          </pre>
        ) : (
          facility.equipment.map((instance, idx) => {
            const equipment = equipmentDatabase.get(instance.equipmentId);
            if (!equipment) return null;
            
            const utilization = getUtilization(instance);
            const statusText = utilization > 0 ? `In Use (${utilization})` : 'Idle';
            const needsMaintenance = instance.condition < 50;
            
            return (
              <div key={instance.id}>
                <pre className="whitespace-pre">
{`│ ${equipment.name.padEnd(28)} │ ${getConditionDisplay(instance.condition).padEnd(8)} │ ${statusText.padEnd(10)} │`}
                </pre>
                <span className="inline-block">
                  {needsMaintenance && (
                    <button 
                      onClick={() => maintainEquipment(facility.id, instance.id)}
                      className="text-yellow-400 hover:text-yellow-300 mx-1"
                      disabled={credits < equipment.condition.maintenanceCost}
                    >
                      [MAINTAIN]
                    </button>
                  )}
                  <button 
                    onClick={() => sellEquipment(facility.id, instance.id)}
                    className="text-red-400 hover:text-red-300 mx-1"
                    disabled={utilization > 0}
                  >
                    [SELL]
                  </button>
                </span>
                <pre className="whitespace-pre">
{`│  └─ ${formatTags(equipment).padEnd(62)} │`}
                </pre>
              </div>
            );
          })
        )}
        
        <pre className="whitespace-pre">
{`└──────────────────────────────┴──────────┴────────────┴─────────────┘

AVAILABLE EQUIPMENT
┌──────────────────────────────┬───────────┬──────────┬──────────────┐
│ Equipment                    │ Space     │ Cost     │ Daily Ops    │
├──────────────────────────────┼───────────┼──────────┼──────────────┤`}
        </pre>
        
        {Array.from(equipmentDatabase.values())
          .filter(eq => {
            // Only show equipment that fits and we can afford
            return eq.footprint <= (facility.floor_space - facility.used_floor_space) &&
                   eq.purchaseCost + eq.installationCost <= credits;
          })
          .slice(0, 5)
          .map((equipment, idx) => (
            <div key={equipment.id}>
              <pre className="whitespace-pre">
{`│ ${equipment.name.padEnd(28)} │ ${(equipment.footprint + 'm²').padEnd(9)} │ $${equipment.purchaseCost.toLocaleString().padEnd(7)} │ $${equipment.dailyOperatingCost}/day`.padEnd(13)}
              </pre>
              <button 
                onClick={() => purchaseEquipment(facility.id, equipment.id)}
                className="text-green-400 hover:text-green-300 mx-1"
              >
                [PURCHASE]
              </button>
              <pre className="whitespace-pre">
{`│  └─ ${formatTags(equipment).padEnd(62)} │`}
              </pre>
            </div>
          ))}
        
        <pre className="whitespace-pre">
{`└──────────────────────────────┴───────────┴──────────┴──────────────┘

CAPACITY OVERVIEW
┌─────────────────────────────┬────────────┬────────────┬────────────┐
│ Tag Category                │ Available  │ In Use     │ Total      │
├─────────────────────────────┼────────────┼────────────┼────────────┤`}
        </pre>
        
        {facility.equipment_capacity && Array.from(facility.equipment_capacity.entries())
          .filter(([_, value]) => value > 0)
          .slice(0, 8)
          .map(([category, total]) => {
            // Calculate in-use capacity
            let inUse = 0;
            if (facility.production_queue) {
              for (const job of facility.production_queue.jobs) {
                const progress = job.stepProgress[job.currentStepIndex];
                if (progress?.consumedCapacity) {
                  inUse += progress.consumedCapacity.get(category) || 0;
                }
              }
            }
            
            const available = total - inUse;
            const categoryName = getTagCategoryName(category);
            
            return (
              <pre key={category} className="whitespace-pre">
{`│ ${categoryName.padEnd(27)} │ ${available.toString().padEnd(10)} │ ${inUse.toString().padEnd(10)} │ ${total.toString().padEnd(10)} │`}
              </pre>
            );
          })}
        
        <pre className="whitespace-pre">
{`└─────────────────────────────┴────────────┴────────────┴────────────┘`}
        </pre>
    </div>
  );
}