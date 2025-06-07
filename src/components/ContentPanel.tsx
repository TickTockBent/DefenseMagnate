import { useGameStore } from '../state/gameStoreWithEquipment'
import { ResearchContent } from './ResearchContent'
import { MachineWorkspaceView } from './MachineWorkspaceView'
import { ContractsContent } from './ContractsContent'
import { MarketContent } from './MarketContent'
import { EquipmentPanelSimple } from './EquipmentPanelSimple'

export function ContentPanel() {
  const activeTab = useGameStore((state) => state.activeTab)

  const renderContent = () => {
    switch (activeTab) {
      case 'research':
        return <ResearchContent />
      case 'manufacturing':
        return <MachineWorkspaceView />
      case 'equipment':
        return <EquipmentPanelSimple />
      case 'market':
        return <MarketContent />
      case 'contracts':
        return <ContractsContent />
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