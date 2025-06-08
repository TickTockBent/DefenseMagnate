// Manufacturing Methods - Manufacturing v2
// Dynamic methods that use intelligent workflow generation

import { MachineBasedMethod } from '../types';
import { ManufacturingV2Integration } from '../systems/manufacturingV2Integration';

// Manufacturing v2 Dynamic Methods
// These methods use intelligent workflow generation based on available inputs

export const basicSidearmForgeMethod: MachineBasedMethod = ManufacturingV2Integration.generateDynamicMethod(
  'basic_sidearm',
  1,
  [], // No specific input items - will work with any available materials
  []  // No specific inventory requirements - will adapt to what's available
);

// Override the name and description for better UI display
basicSidearmForgeMethod.id = 'basic_sidearm_forge_v2';
basicSidearmForgeMethod.name = 'Forge New (v2)';
basicSidearmForgeMethod.description = 'Intelligently manufacture a new sidearm using available materials and optimal workflow';

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