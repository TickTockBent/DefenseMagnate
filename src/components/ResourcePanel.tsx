import { useGameStore } from '../state/gameStoreWithEquipment'
import { useState } from 'react'
import { ItemInstance } from '../types'
import { getDisplayName, getQualityDescription } from '../utils/itemSystem'
import { baseItems } from '../data/baseItems'

export function ResourcePanel() {
  const selectedFacilityId = useGameStore((state) => state.selectedFacilityId)
  const facilities = useGameStore((state) => state.facilities)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId)
  const materialEntries = selectedFacility ? Object.entries(selectedFacility.current_storage) : []
  
  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  return (
    <div className="space-y-6">
      {/* New Inventory System */}
      {selectedFacility?.inventory && (
        <div className="terminal-card">
          <div className="terminal-header">
            <span className="ascii-accent">▼</span> INVENTORY ({selectedFacility.name})
          </div>
          <div className="space-y-2">
            {selectedFacility.inventory.groups instanceof Map ? Array.from(selectedFacility.inventory.groups.values()).map(group => {
              const isExpanded = expandedGroups.has(group.category)
              const totalItems = group.slots.reduce((sum, slot) => 
                sum + slot.stack.totalQuantity, 0
              )
              
              return (
                <div key={group.category} className="border border-gray-700">
                  <div 
                    className="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-800"
                    onClick={() => toggleGroup(group.category)}
                  >
                    <span className="text-gray-300 text-sm">
                      {isExpanded ? '▼' : '►'} {group.category} ({totalItems} items)
                    </span>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-3 pb-2 space-y-1">
                      {group.slots.map(slot => {
                        const baseItem = baseItems[slot.baseItemId]
                        if (!baseItem) return null
                        
                        return (
                          <div key={slot.baseItemId} className="ml-2">
                            <div className="text-gray-400 text-xs font-semibold">
                              {baseItem.name} ({slot.stack.totalQuantity} total)
                            </div>
{(() => {
                              // Group instances by display name and quality description for visual merging
                              const groupedInstances = new Map<string, {instances: ItemInstance[], totalQuantity: number}>();
                              
                              slot.stack.instances.forEach(item => {
                                const displayName = getDisplayName(item);
                                const qualityDesc = getQualityDescription(item.quality);
                                const key = `${displayName}_${qualityDesc}`;
                                
                                if (!groupedInstances.has(key)) {
                                  groupedInstances.set(key, { instances: [], totalQuantity: 0 });
                                }
                                
                                const group = groupedInstances.get(key)!;
                                group.instances.push(item);
                                group.totalQuantity += item.quantity;
                              });
                              
                              return Array.from(groupedInstances.entries()).map(([key, group]) => {
                                const firstItem = group.instances[0];
                                return (
                                  <div key={key} className="ml-3 text-xs text-gray-500">
                                    • {getDisplayName(firstItem)} x{group.totalQuantity}
                                    <span className="text-gray-600 ml-1">
                                      ({getQualityDescription(firstItem.quality)})
                                    </span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }) : (
              <div className="text-red-400 text-xs">
                Inventory Error: groups is not a Map
                <div className="text-xs mt-1 text-gray-500">
                  Type: {typeof selectedFacility.inventory.groups}, 
                  Value: {String(selectedFacility.inventory.groups) || 'undefined'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legacy Materials (Fallback) */}
      {selectedFacility && !selectedFacility.inventory && (
        <div className="terminal-card">
          <div className="terminal-header">
            <span className="ascii-accent">◇</span> MATERIALS - LEGACY ({selectedFacility.name})
          </div>
          <div className="space-y-3">
            {materialEntries.map(([name, amount]) => (
              <div key={name} className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">{name}</span>
                <span className="font-mono text-teal-400">{amount.toLocaleString()}</span>
              </div>
            ))}
            {materialEntries.length === 0 && (
              <div className="text-gray-500 text-sm">No materials in storage</div>
            )}
          </div>
        </div>
      )}

      {/* Starmap */}
      <div className="terminal-card">
        <div className="terminal-header">
          <span className="ascii-accent">◇</span> STARMAP: SECTOR 3C
        </div>
        <div className="bg-gray-800 rounded p-4 mb-4">
          <div className="grid grid-cols-6 gap-1 font-mono text-center text-sm">
            <span className="text-gray-600">·</span>
            <span className="text-gray-600">·</span>
            <span className="status-danger">X</span>
            <span className="text-gray-600">·</span>
            <span className="status-warning">P</span>
            <span className="text-gray-600">·</span>
            
            <span className="status-info">S</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-600">·</span>
            <span className="text-yellow-400">!</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-600">·</span>
            
            <span className="text-gray-600">·</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-600">·</span>
            <span className="status-danger">X</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <div><span className="status-danger">X</span> Conflict</div>
          <div><span className="status-warning">P</span> Pirates</div>
          <div><span className="text-yellow-400">!</span> Disruption</div>
          <div><span className="status-info">S</span> Scout</div>
        </div>
      </div>
    </div>
  )
}