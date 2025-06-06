// Simplified Equipment Panel

import { useGameStore } from '../state/gameStoreWithEquipment';

export function EquipmentPanelSimple() {
  const { 
    selectedFacilityId, 
    facilities, 
    equipmentDatabase,
    credits,
    purchaseEquipment
  } = useGameStore();
  
  const facility = facilities.find(f => f.id === selectedFacilityId);
  
  if (!facility) {
    return (
      <div className="font-mono text-teal-400 p-4">
        <pre>No facility selected</pre>
      </div>
    );
  }
  
  return (
    <div className="font-mono text-teal-400 p-4">
      <pre className="whitespace-pre">
{`╔════════════════════════════════════════════════════════════════════╗
║ EQUIPMENT MANAGEMENT - ${facility.name.padEnd(44)} ║
╠════════════════════════════════════════════════════════════════════╣
║ Space: ${facility.used_floor_space}/${facility.floor_space}m² used │ Credits: $${credits.toLocaleString().padEnd(35)} ║
╚════════════════════════════════════════════════════════════════════╝`}
      </pre>
      
      <div className="mt-4">
        <h3 className="text-gray-400 mb-2">INSTALLED EQUIPMENT:</h3>
        {facility.equipment.length === 0 ? (
          <div className="text-gray-500">No equipment installed</div>
        ) : (
          <div className="space-y-2">
            {facility.equipment.map(eq => {
              const def = equipmentDatabase.get(eq.equipmentId);
              if (!def) return null;
              
              return (
                <div key={eq.id} className="border border-gray-700 p-2">
                  <div className="flex justify-between">
                    <span className="text-teal-300">{def.name}</span>
                    <span className="text-gray-400">{eq.condition}%</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Space: {def.footprint}m² | Daily cost: ${def.dailyOperatingCost}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <h3 className="text-gray-400 mb-2">AVAILABLE EQUIPMENT:</h3>
        <div className="space-y-2">
          {Array.from(equipmentDatabase.values())
            .filter(eq => {
              const spaceAvailable = eq.footprint <= (facility.floor_space - facility.used_floor_space);
              const canAfford = eq.purchaseCost + eq.installationCost <= credits;
              return spaceAvailable && canAfford;
            })
            .slice(0, 8)
            .map(equipment => (
              <div key={equipment.id} className="border border-gray-800 p-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-teal-300">{equipment.name}</span>
                    <div className="text-xs text-gray-400">
                      ${equipment.purchaseCost.toLocaleString()} | {equipment.footprint}m² | ${equipment.dailyOperatingCost}/day
                    </div>
                  </div>
                  <button 
                    onClick={() => purchaseEquipment(facility.id, equipment.id)}
                    className="text-green-400 hover:text-green-300 border border-green-400 px-2 py-1 text-xs"
                  >
                    BUY
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}