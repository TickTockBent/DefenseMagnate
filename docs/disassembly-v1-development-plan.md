# Disassembly v1 Development Plan

## Overview
This document outlines the phased implementation of the component-driven manufacturing system, building on the existing codebase and addressing specific implementation gaps.

## Current System Analysis Summary

### Strengths to Build Upon
- Robust tag-based inventory system with quality tracking
- Material consumption tracking via `job.consumedMaterials` Map
- Operation-based manufacturing with discrete steps
- Support for `consumed_at_start` flag (though `false` case not implemented)
- Existing job state management and facility-wide queue system

### Key Gaps to Address
- No implementation for consuming materials at operation completion (`consumed_at_start: false`)
- No concept of intermediate products or work-in-progress items
- Job cancellation loses all consumed materials
- No persistent storage of partial manufacturing state

## Phase 1: Material Reservation & Production System

### Goals
- Transform from immediate consumption to material reservation
- Add material transformation capabilities (consume → produce)
- Enable meaningful job cancellation with material recovery

### Core Concept
Materials are **reserved** when a job starts but only **consumed** when they are transformed into something else. This allows cancellation at any point with recovery of untransformed materials.

### Tasks
1. **Implement Job Sub-Inventory**
   - Add to `MachineSlotJob`:
     ```typescript
     jobInventory: InventoryState; // Job's own inventory for materials and products
     operationProducts: Map<number, ItemInstance[]>; // Track per-operation outputs
     ```
   - When job starts, move all required materials from facility to job inventory
   - Operations consume/produce within the job inventory
   - Completed products move to facility inventory
   - Cancelled jobs return all items to facility

2. **Fix Material Consumption**
   - Remove all `consumed_at_start: true` logic
   - Implement consumption only when materials are transformed:
     - Steel consumed → Rough components produced
     - Plastic consumed → Casing produced
   - Track consumption in `consumedMaterials` for record keeping

3. **Add Production Capability**
   - Extend `MachineOperation`:
     ```typescript
     materialConsumption?: Array<{
       itemId: string;
       count: number;
       tags?: string[];
     }>;
     materialProduction?: Array<{
       itemId: string;
       count: number;
       tags?: string[];
       quality?: number;
     }>;
     ```
   - In `completeOperation()`:
     - Consume specified materials from reserved pool
     - Create and add produced items to inventory
     - Track products in job state

4. **Update Job Cancellation**
   - Return all reserved materials to available state
   - Keep any intermediate products created
   - Clear job from all tracking

### Example Flow (Basic Sidearm)
1. **Job Start**: Move 1 steel, 0.3 plastic to job inventory
2. **Op 2**: Consume 1 steel → Produce 10 mechanical-component [rough] [low-tech]
3. **Op 3**: Consume 5 rough components → Produce 5 mechanical-component [precision] [low-tech]
4. **Op 4**: Consume 5 rough + 5 precision → Produce 1 mechanical-assembly [assembly] [low-tech]
5. **Op 5**: Consume 0.3 plastic → Produce 1 plastic-casing [casing] [low-tech]
6. **Op 6**: Consume assembly + casing → Produce 1 basic-sidearm [forged] [low-tech]

If cancelled after Op 3: Job inventory has 0.3 plastic + 5 precision components, all returned to facility

### Deliverables
- Job-specific sub-inventory for materials and products
- Materials moved to job, not consumed until transformation
- Tag-based component creation (rough → precision)
- Cancellation returns all job inventory to facility

## Phase 2: Component Definitions & Tag System

### Goals
- Define base component items differentiated by tags
- Create tag system for manufacturing states
- Implement tag-based manufacturing methods

### Tasks
1. **Define Base Component Items**
   - Add to `src/data/baseItems.ts`:
     ```typescript
     'mechanical-component': { name: 'Mechanical Component', weight: 0.1, volume: 0.05, baseValue: 5 },
     'mechanical-assembly': { name: 'Mechanical Assembly', weight: 0.3, volume: 0.15, baseValue: 50 },
     'plastic-casing': { name: 'Plastic Casing', weight: 0.15, volume: 0.2, baseValue: 10 },
     ```

2. **Add Component Tags**
   - Add to `src/data/itemTags.ts`:
     - `[rough]` - Unfinished state (mechanical-component [rough])
     - `[precision]` - Refined state (mechanical-component [precision])
     - `[assembly]` - Combined components
     - `[casing]` - External housing
     - `[low-tech]` - Technology level

3. **Create Component-Based Sidearm Method**
   - Replace traditional method with component flow:
     - Material Prep → Rough Milling → Precision Turning → Assembly → Casing → Final Assembly → QC
   - Each operation transforms materials or tags

### Deliverables
- Tag-based component system
- Complete component manufacturing method
- Validated tag transformations

## Phase 3: Enhanced Material Sourcing & Quality

### Goals
- Allow operations to source from job inventory and facility inventory
- Implement quality inheritance through component chain
- Support component stockpiling workflows

### Tasks
1. **Cross-Inventory Material Sourcing**
   - Operations check job inventory first, then facility inventory
   - Support mixed sourcing (some components from each)
   - Enable using pre-made components from facility

2. **Quality Inheritance System**
   - Track quality through tag transformations
   - Equipment condition affects component quality
   - Store quality lineage in item metadata

3. **Component Stockpiling Support**
   - Allow jobs that only produce components
   - Enable selling components on market
   - Support component-focused manufacturing

### Deliverables
- Flexible component sourcing
- Quality tracking through transformations
- Component-based business models

## Phase 4: Job Cancellation & Recovery

### Goals
- Implement cancellation with job inventory recovery
- Show clear recovery preview
- Handle active operations gracefully

### Tasks
1. **Enhanced Cancel Logic**
   - Return entire job inventory to facility
   - Handle operations in progress
   - Calculate time/material investment lost

2. **Recovery Preview**
   - Show what will be recovered from job inventory
   - Display progress and investment lost
   - Preview recovery value

3. **Cancellation UI**
   - Cancel button with recovery preview
   - Show job inventory contents
   - Confirm cancellation consequences

### Deliverables
- Job inventory recovery system
- Clear cancellation UI
- Proper cleanup of job state

## Phase 5: UI Enhancements

### Goals
- Display job inventory and material flow
- Show component transformations clearly
- Help players understand the new system

### Tasks
1. **Job Inventory Display**
   - Show job's current inventory contents
   - Display what each operation will consume/produce
   - Visual flow of materials through operations

2. **Component Flow Visualization**
   - ASCII arrows showing transformations
   - Tag changes clearly displayed
   - Operation progress with inventory state

3. **Manufacturing Method Updates**
   - Show new component-based methods
   - Compare with traditional methods
   - Highlight cancellation benefits

### Deliverables
- Job inventory UI
- Component flow visualization
- Updated manufacturing interface

## Phase 6: System Integration & Testing

### Goals
- Integrate with contracts and market systems
- Ensure save compatibility
- Test performance and stability

### Tasks
1. **Contract & Market Integration**
   - Component-produced items fulfill contracts
   - Components can be sold on markets
   - Quality calculations work correctly

2. **Save System Updates**
   - Job inventory saves/loads properly
   - Migration for existing saves
   - No data loss during updates

3. **Performance & Testing**
   - Test job inventory operations
   - Verify memory usage
   - Complete end-to-end workflows

### Deliverables
- Full system integration
- Save compatibility
- Performance validation

## Phase 7: Disassembly Foundation

### Goals
- Create reverse manufacturing operations
- Enable component recovery from products
- Foundation for salvage business model

### Tasks
1. **Disassembly Operations**
   - Operations that consume products, produce components
   - Quality-based recovery rates
   - Tool requirements for disassembly

2. **Basic Disassembly Method**
   - Disassemble Basic Sidearm into components
   - Recovery rates based on product condition
   - Tag preservation through disassembly

3. **Disassembly UI**
   - Show expected component recovery
   - Preview quality and quantities
   - Salvage business workflow

### Deliverables
- Working disassembly system
- Component recovery mechanics
- Foundation for repair services

## Implementation Notes

### Key Code Locations
- **Material Consumption**: `src/systems/machineWorkspace.ts` - `consumeOperationMaterials()` and `completeOperation()`
- **Job State**: `src/types/machineSlot.ts` - `MachineSlotJob` interface
- **Inventory**: `src/utils/inventoryManager.ts` - All inventory operations
- **Manufacturing Methods**: `src/data/manufacturingMethods.ts` - Method definitions
- **UI Components**: `src/components/ManufacturingContent.tsx` and `MachineWorkspaceView.tsx`

### Testing Strategy
- Unit tests for reservation system
- Integration tests for component flow
- Performance tests for large inventories
- Save/load tests for migration

### Risk Mitigation
- Feature flag for component methods
- Keep traditional methods working
- Incremental rollout to players
- Extensive error handling

## Success Metrics
- Zero regression in existing features
- <100ms overhead for component operations
- Intuitive UI (player feedback)
- Smooth migration (no data loss)

## Implementation Order

1. **Phase 1**: Job sub-inventory & production system
2. **Phase 2**: Component definitions & tag system
3. **Phase 3**: Enhanced material sourcing & quality
4. **Phase 4**: Job cancellation & recovery
5. **Phase 5**: UI enhancements
6. **Phase 6**: System integration & testing
7. **Phase 7**: Disassembly foundation