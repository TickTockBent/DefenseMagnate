// Simplified Manufacturing Content to test the new equipment system

import { useGameStore } from '../state/gameStoreWithEquipment';

export function ManufacturingContentSimple() {
  const { 
    selectedFacilityId, 
    facilities,
    materials,
    credits,
    equipmentDatabase
  } = useGameStore();
  
  const facility = facilities.find(f => f.id === selectedFacilityId);
  
  if (!facility) {
    return (
      <div className="font-mono text-teal-400 p-4">
        <pre>No facility selected. You now have an equipment-based manufacturing system!</pre>
      </div>
    );
  }
  
  return (
    <div className="font-mono text-teal-400 p-4">
      <pre className="whitespace-pre">
{`╔════════════════════════════════════════════════════════════════════╗
║ MANUFACTURING - ${facility.name.padEnd(51)} ║
╠════════════════════════════════════════════════════════════════════╣
║ Credits: $${credits.toLocaleString().padEnd(15)} │ Equipment System Active!${' '.padEnd(25)} ║
╚════════════════════════════════════════════════════════════════════╝`}
      </pre>
      
      <div className="mt-4">
        <h3 className="text-gray-400 mb-2">INSTALLED EQUIPMENT:</h3>
        {facility.equipment.length === 0 ? (
          <div className="text-red-400">No equipment installed! Visit the Equipment tab to purchase tools.</div>
        ) : (
          <div className="space-y-2">
            {facility.equipment.map(eq => {
              const def = equipmentDatabase.get(eq.equipmentId);
              if (!def) return null;
              
              return (
                <div key={eq.id} className="border border-gray-700 p-2">
                  <div className="text-teal-300">{def.name}</div>
                  <div className="text-sm text-gray-400">Condition: {eq.condition}%</div>
                  <div className="text-xs text-gray-500">
                    {def.tags.map(tag => `${tag.category}: ${tag.value}${tag.unit || ''}`).join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <h3 className="text-gray-400 mb-2">MATERIALS:</h3>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(materials).map(([material, amount]) => (
            <div key={material} className="border border-gray-800 p-1 text-center">
              <div className="text-xs text-gray-400">{material}</div>
              <div className="text-teal-400">{amount}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 p-3 border border-yellow-600 bg-yellow-900 bg-opacity-20">
        <div className="text-yellow-400">🚧 NEW EQUIPMENT SYSTEM ACTIVE</div>
        <div className="text-sm text-gray-300 mt-2">
          • Production is now limited by actual equipment capabilities<br/>
          • Visit the Equipment tab to purchase tools<br/>
          • Each manufacturing step requires specific equipment<br/>
          • No more producing 50 sidearms in a garage without proper tools!
        </div>
      </div>
    </div>
  );
}