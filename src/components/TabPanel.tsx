import { useGameStore } from '../state/gameStoreWithEquipment' // UPDATED: Using current store

type Tab = 'research' | 'manufacturing' | 'catalog' | 'equipment' | 'market' | 'contracts'

const tabs: { id: Tab; label: string }[] = [
  { id: 'research', label: 'R&D' },
  { id: 'manufacturing', label: 'Workshop' },
  { id: 'catalog', label: 'Catalog' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'market', label: 'Market' },
  { id: 'contracts', label: 'Contracts' },
]

export function TabPanel() {
  const activeTab = useGameStore((state) => state.activeTab)
  const setActiveTab = useGameStore((state) => state.setActiveTab)

  const tabContent = `+--------------------+
| SYSTEMS            |
|                    |
${tabs.map(tab => {
    const isActive = tab.id === activeTab
    const prefix = isActive ? '>' : ' '
    return `| ${prefix} ${tab.label.padEnd(16)} |`
  }).join('\n')}
|                    |
|                    |
|                    |
|                    |
|                    |
+--------------------+`

  return (
    <pre className="ascii-box h-full">
      {tabContent.split('\n').map((line, index) => {
        const tabIndex = index - 3 // Adjust for header lines
        if (tabIndex >= 0 && tabIndex < tabs.length) {
          const tab = tabs[tabIndex]
          const isActive = tab.id === activeTab
          const style = isActive ? 'text-white' : 'text-teal-400'
          return (
            <div
              key={tab.id}
              className={`${style} cursor-pointer hover:text-white transition-colors`}
              onClick={() => setActiveTab(tab.id)}
            >
              {line}
            </div>
          )
        }
        return <div key={index}>{line}</div>
      })}
    </pre>
  )
}