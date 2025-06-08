// Manufacturing Methods - Manufacturing v2
// Dynamic methods that use intelligent workflow generation

import { MachineBasedMethod, ItemTag, TagCategory, ItemInstance } from '../types';
import { ManufacturingV2Integration } from '../systems/manufacturingV2Integration';

// Manufacturing v2 Dynamic Methods
// These methods use intelligent workflow generation based on available inputs

// Simulate a realistic starting inventory with only raw materials
const simulatedRawMaterialInventory: ItemInstance[] = [
  // Steel available for manufacturing
  {
    id: 'sim_steel_1',
    baseItemId: 'steel',
    quantity: 20,
    quality: 75,
    tags: [],
    acquiredAt: 0,
    lastModified: 0
  },
  // Plastic available for manufacturing
  {
    id: 'sim_plastic_1', 
    baseItemId: 'plastic',
    quantity: 15,
    quality: 70,
    tags: [],
    acquiredAt: 0,
    lastModified: 0
  }
];

// Simple test method for debugging
const basicSidearmTestMethod: MachineBasedMethod = {
  id: 'basic_sidearm_test',
  name: 'Test Manufacturing (Debug)',
  description: 'Simple test method to verify workflow generation',
  outputTags: [ItemTag.FORGED, ItemTag.LOW_TECH],
  qualityRange: [60, 80],
  operations: [
    {
      id: 'test_form_billet',
      name: 'Form Steel Billet',
      description: 'Basic steel stock preparation for component machining',
      requiredTag: { category: TagCategory.MILLING, minimum: 5 },
      baseDurationMinutes: 15,
      materialConsumption: [{ itemId: 'steel', count: 0.1 }],
      materialProduction: [{ itemId: 'small-steel-billet', count: 1, quality: 70, tags: [] }],
      can_fail: true,
      failure_chance: 0.02,
      labor_skill: 'skilled_technician'
    },
    {
      id: 'test_machine_components',
      name: 'Machine Components (rough, low-tech)',
      description: 'Basic machined mechanical parts',
      requiredTag: { category: TagCategory.MILLING, minimum: 5 },
      baseDurationMinutes: 250, // 25 minutes per component * 10 components
      materialConsumption: [{ itemId: 'small-steel-billet', count: 10 }],
      materialProduction: [{ itemId: 'mechanical-component', count: 10, quality: 75, tags: [ItemTag.ROUGH, ItemTag.LOW_TECH] }],
      can_fail: true,
      failure_chance: 0.04,
      labor_skill: 'skilled_technician'
    },
    {
      id: 'test_assemble_mechanical',
      name: 'Assemble Mechanical Assembly',
      description: 'Assembly of mechanical components with low-tech finish',
      requiredTag: { category: TagCategory.BASIC_MANIPULATION, minimum: 8 },
      baseDurationMinutes: 45,
      materialConsumption: [{ itemId: 'mechanical-component', count: 10, tags: [ItemTag.ROUGH, ItemTag.LOW_TECH] }],
      materialProduction: [{ itemId: 'mechanical-assembly', count: 1, quality: 75, tags: [ItemTag.LOW_TECH] }],
      can_fail: true,
      failure_chance: 0.02,
      labor_skill: 'skilled_technician'
    }
  ],
  output_state: 'functional',
  output_quality_range: [60, 80],
  labor_cost_multiplier: 1.0,
  complexity_rating: 3,
  profit_margin_modifier: 1.0,
  customer_appeal: ['test_manufacturing']
};

// Generate the dynamic method and add debug logging
console.log('Generating Manufacturing v2 basic sidearm method...');
export const basicSidearmForgeMethod: MachineBasedMethod = (() => {
  try {
    const method = ManufacturingV2Integration.generateDynamicMethod(
      'basic_sidearm',
      1,
      [], // No specific input items - will work with any available materials
      simulatedRawMaterialInventory  // Realistic inventory with raw materials only
    );
    
    console.log('Generated Manufacturing v2 method with operations:', method.operations.map(op => op.name));
    
    // Override the name and description for better UI display
    method.id = 'basic_sidearm_forge_v2';
    method.name = 'Forge New (v2)';
    method.description = 'Intelligently manufacture a new sidearm using available materials and optimal workflow';
    
    return method;
  } catch (error) {
    console.error('Failed to generate Manufacturing v2 method:', error);
    // Return a fallback method
    return basicSidearmTestMethod;
  }
})();

export const basicSidearmRestoreMethod: MachineBasedMethod = ManufacturingV2Integration.generateDynamicMethod(
  'basic_sidearm',
  1,
  [], // Will detect damaged sidearms automatically
  []
);

basicSidearmRestoreMethod.id = 'basic_sidearm_restore_v2'; 
basicSidearmRestoreMethod.name = 'Restore/Repair (v2)';
basicSidearmRestoreMethod.description = 'Intelligently restore damaged weapons or manufacture new ones based on available inputs';

export const basicSidearmDisassembleMethod: MachineBasedMethod = ManufacturingV2Integration.createSmartMethod('basic_sidearm_disassembly');

basicSidearmDisassembleMethod.id = 'basic_sidearm_disassemble_v2';
basicSidearmDisassembleMethod.name = 'Disassemble (v2)';
basicSidearmDisassembleMethod.description = 'Intelligently disassemble sidearms to recover maximum components based on condition';

// Export methods array
export const basicSidearmMethods = [
  basicSidearmTestMethod,       // Simple test method
  basicSidearmForgeMethod,      // Smart forging from raw materials
  basicSidearmRestoreMethod,    // Smart restoration/repair
  basicSidearmDisassembleMethod // Smart disassembly
];

// Tactical knife methods will be implemented when knife components are defined
export const tacticalKnifeMethods: MachineBasedMethod[] = [];

// Helper function to create Manufacturing v2 methods for any product
export function createManufacturingV2Methods(productId: string): MachineBasedMethod[] {
  const forge = ManufacturingV2Integration.generateDynamicMethod(productId, 1, [], []);
  forge.id = `${productId}_forge_v2`;
  forge.name = 'Forge New (v2)';
  forge.description = `Intelligently manufacture ${productId} using optimal workflow`;
  
  const restore = ManufacturingV2Integration.generateDynamicMethod(productId, 1, [], []);
  restore.id = `${productId}_restore_v2`;
  restore.name = 'Restore/Repair (v2)';
  restore.description = `Intelligently restore or manufacture ${productId} based on available inputs`;
  
  const disassemble = ManufacturingV2Integration.createSmartMethod(`${productId}_disassembly`);
  disassemble.id = `${productId}_disassemble_v2`;
  disassemble.name = 'Disassemble (v2)';
  disassemble.description = `Intelligently disassemble ${productId} to recover components`;
  
  return [forge, restore, disassemble];
}