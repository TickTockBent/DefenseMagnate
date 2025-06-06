import { useGameStore } from '../state/gameStoreWithEquipment'
import { ResearchContent } from './ResearchContent'
import { ManufacturingContentEnhanced } from './ManufacturingContentEnhanced'
import { ContractsContent } from './ContractsContent'
import { SupplyContent } from './SupplyContent'
import { EquipmentPanelSimple } from './EquipmentPanelSimple'

export function ContentPanel() {
  const activeTab = useGameStore((state) => state.activeTab)

  const renderContent = () => {
    switch (activeTab) {
      case 'research':
        return <ResearchContent />
      case 'manufacturing':
        return <ManufacturingContentEnhanced />
      case 'equipment':
        return <EquipmentPanelSimple />
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