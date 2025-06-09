import { useGameStore } from '../state/gameStoreWithEquipment'
import { ResearchContent } from './ResearchContent'
import { MachineWorkspaceView } from './MachineWorkspaceView'
import { IntelligentJobCreationInterface } from './IntelligentJobCreationInterface'
import { ContractsContent } from './ContractsContent'
import { MarketContent } from './MarketContent'
import { EquipmentPanelSimple } from './EquipmentPanelSimple'
import { AutomaticWorkflowGeneration, GeneratedWorkflow } from '../systems/automaticWorkflowGeneration'
import { ManufacturingV2Integration } from '../systems/manufacturingV2Integration'

export function ContentPanel() {
  const activeTab = useGameStore((state) => state.activeTab)
  const facilities = useGameStore((state) => state.facilities)
  const startMachineJob = useGameStore((state) => state.startMachineJob)

  // Handle job start from intelligent interface
  const handleIntelligentJobStart = (workflow: GeneratedWorkflow, enhancements?: any) => {
    const facility = facilities[0]; // Use main facility
    if (!facility) return;

    // Convert generated workflow to machine-based method format
    const method = ManufacturingV2Integration.convertPlanToMethod({
      targetProduct: workflow.id,
      targetQuantity: 1,
      inputAnalysis: [],
      componentGaps: [],
      requiredOperations: workflow.operations,
      estimatedDuration: workflow.estimatedDuration,
      materialRequirements: workflow.materialRequirements,
      planningTime: Date.now(),
      plannerVersion: 'v2.1',
      confidence: workflow.confidence
    });

    // Start the job
    startMachineJob(facility.id, workflow.id, method.id, 1, enhancements);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'research':
        return <ResearchContent />
      case 'manufacturing':
        return <MachineWorkspaceView />
      case 'job_planning':
        return (
          <IntelligentJobCreationInterface 
            facility={facilities[0]} 
            onJobStart={handleIntelligentJobStart}
          />
        )
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