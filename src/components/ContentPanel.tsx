import { useGameStore } from '../state/gameStore-simple'
import { ResearchContent } from './ResearchContent'
import { ManufacturingContent } from './ManufacturingContent'
import { ContractsContent } from './ContractsContent'
import { SupplyContent } from './SupplyContent'

export function ContentPanel() {
  const activeTab = useGameStore((state) => state.activeTab)

  const renderContent = () => {
    switch (activeTab) {
      case 'research':
        return <ResearchContent />
      case 'manufacturing':
        return <ManufacturingContent />
      case 'contracts':
        return <ContractsContent />
      case 'supply':
        return <SupplyContent />
      default:
        return <div>Unknown tab</div>
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      {renderContent()}
    </div>
  )
}