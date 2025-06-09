import { useGameStore } from '../state/gameStoreWithEquipment'
import { ResearchContent } from './ResearchContent'
import { MachineWorkspaceView } from './MachineWorkspaceView'
import { IntelligentJobCreationInterface } from './IntelligentJobCreationInterface'
import { ContractsContent } from './ContractsContent'
import { MarketContent } from './MarketContent'
import { EquipmentPanelSimple } from './EquipmentPanelSimple'
import { AutomaticWorkflowGeneration, GeneratedWorkflow } from '../systems/automaticWorkflowGeneration'
import { ManufacturingV2Integration } from '../systems/manufacturingV2Integration'
import { ManufacturingPlan } from '../types/manufacturing'

export function ContentPanel() {
  const activeTab = useGameStore((state) => state.activeTab)
  const facilities = useGameStore((state) => state.facilities)
  const startMachineJob = useGameStore((state) => state.startMachineJob)

  // Handle job start from intelligent interface
  const handleIntelligentJobStart = (plan: GeneratedWorkflow, enhancements?: any) => {
    const facility = facilities[0]; // Use main facility
    if (!facility) {
      console.error('No facility available for job creation');
      return;
    }

    console.log('Creating job from plan:', plan.name, 'with', plan.requiredOperations.length, 'operations');

    // Convert unified plan directly to machine-based method format
    const method = ManufacturingV2Integration.convertPlanToMethod(plan);
    
    console.log('Converted to method:', method.name, 'with ID:', method.id);

    // Start the job using the target product from the plan
    // Pass the dynamic method object directly since it's not in predefined arrays
    startMachineJob(facility.id, plan.targetProduct, method.id, plan.targetQuantity, enhancements, false, method);
    console.log('Job started successfully');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'research':
        return <ResearchContent />
      case 'manufacturing':
        return <MachineWorkspaceView />
      case 'catalog':
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