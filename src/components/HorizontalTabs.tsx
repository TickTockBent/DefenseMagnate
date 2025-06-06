import { useGameStore } from '../state/gameStoreWithEquipment'

type Tab = 'research' | 'manufacturing' | 'equipment' | 'contracts' | 'supply'

const tabs: { id: Tab; label: string; description: string }[] = [
  { id: 'research', label: 'R&D', description: 'Research & Development' },
  { id: 'manufacturing', label: 'Manufacturing', description: 'Production Facilities' },
  { id: 'equipment', label: 'Equipment', description: 'Equipment Management' },
  { id: 'contracts', label: 'Contracts', description: 'Available Jobs' },
  { id: 'supply', label: 'Supply', description: 'Supply Chains' },
]

export function HorizontalTabs() {
  const activeTab = useGameStore((state) => state.activeTab)
  const setActiveTab = useGameStore((state) => state.setActiveTab)

  return (
    <div className="flex items-center space-x-1">
      <span className="ascii-accent text-sm mr-4">▶</span>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${isActive ? 'active' : ''}`}
            title={tab.description}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}