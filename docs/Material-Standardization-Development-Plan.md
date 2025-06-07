# Material Standardization Development Plan

## Overview
Implement a unified item system with tag-based modifications to replace the current fragmented item variants. This will standardize all materials and products using base types + condition/material tags + quality percentages.

## Current System Analysis

### **Problems to Solve**:
- **Fragmented Item Types**: `basic_sidearm_pristine`, `basic_sidearm_junk`, `damaged_weapons` etc.
- **Complex Storage Keys**: `basic_sidearm_pristine`, `steel`, `aluminum` etc.
- **Manufacturing Method Confusion**: Different methods for essentially the same item
- **Quality System Inconsistency**: Quality ranges vary by method rather than being standardized

### **Target System**:
- **Single Base Items**: `basic_sidearm`, `tactical_knife`, `steel`, `aluminum`
- **Tag-Based Modifications**: `[damaged]`, `[restored]`, `[forged]`, `[military-grade]`, `[titanium]`, `[salvaged]`
- **Unified Quality**: 0-100% quality scale with tag-based caps and modifiers
- **Inventory Grouping**: Items grouped by base type with expandable quality/tag breakdown

## Development Phases

### **Phase 1: Core Type System (Priority: High)**
**Goal**: Create new unified item and tag architecture

#### 1.1 Type Definitions
- [ ] Create `types/items.ts` with unified item system
  - `BaseItem` interface (id, name, category, baseValue)
  - `ItemTag` enum (condition tags, material tags, special tags)
  - `ItemInstance` interface (baseItem + tags[] + quality + quantity)
  - `ItemCategory` enum (materials, products, components)
- [ ] Create `types/inventory.ts` for new storage system
  - `InventorySlot` interface (baseItemId + ItemInstance[])
  - `InventoryGroup` interface (category + InventorySlot[])
  - `FacilityInventory` interface (groups + total counts)
- [ ] Update barrel exports in `types/index.ts`

#### 1.2 Item Database
- [ ] Create `data/baseItems.ts` with standardized item definitions
  - Materials: steel, aluminum, plastic, electronics, etc.
  - Products: basic_sidearm, tactical_knife
  - Components: machined_parts, circuits, etc.
- [ ] Create `data/itemTags.ts` with tag definitions and effects
  - Condition tags with quality modifiers
  - Material tags with value modifiers
  - Special tags with unique effects
- [ ] Create utility functions in `utils/itemSystem.ts`
  - `createItemInstance()`, `applyTagModifiers()`, `calculateMarketValue()`

#### 1.3 Legacy Compatibility Layer
- [ ] Create `utils/legacyItemMigration.ts`
  - Map old storage keys to new ItemInstance format
  - Convert existing facility storage to new system
  - Preserve existing quantities and approximate qualities

### **Phase 2: Inventory System (Priority: High)**
**Goal**: Replace facility storage with new grouped inventory system

#### 2.1 Storage Migration
- [ ] Update `Facility` interface to use new inventory system
  - Replace `current_storage: Record<string, number>` 
  - Add `inventory: FacilityInventory`
- [ ] Create migration function for existing facilities
  - Convert `basic_sidearm_pristine: 5` → `basic_sidearm + [forged] tag + 90% quality`
  - Convert `steel: 100` → `steel + [standard] tag + 85% purity`
  - Preserve total quantities and approximate quality distributions

#### 2.2 Inventory UI Components
- [ ] Create `components/InventoryPanel.tsx`
  - Expandable/collapsible item groups by base type
  - Tag and quality breakdown within each group
  - Item actions (use, sell, scrap, upgrade)
- [ ] Create `components/ItemInstanceCard.tsx`
  - Display base item + tags + quality
  - Visual quality indicators and tag badges
  - Action buttons context-appropriate
- [ ] Update `ResourcePanel.tsx` to use new inventory system

#### 2.3 Inventory Operations
- [ ] Implement inventory management functions
  - `addItemToInventory()`, `removeItemFromInventory()`, `moveItemBetweenSlots()`
  - `groupItemsByType()`, `filterItemsByTag()`, `sortItemsByQuality()`
- [ ] Update all existing storage operations to use new system
  - Manufacturing completion → new inventory system
  - Market deliveries → new inventory system
  - Contract fulfillment → new inventory system

### **Phase 3: Manufacturing System Integration (Priority: High)**
**Goal**: Update manufacturing to produce items with appropriate tags and quality

#### 3.1 Manufacturing Method Redesign
- [ ] Simplify manufacturing methods to focus on tag assignment
  - **Forge New**: Produces `[forged]` tag items (80-95% quality)
  - **Restore Damaged**: Consumes `[damaged]` items → produces `[restored]` (55-75% quality)
  - **Quick Assembly**: Produces `[junk]` tag items (30-45% quality cap)
  - **Military Production**: Produces `[military-grade]` tag items (85-98% quality)
- [ ] Update `MachineBasedMethod` to specify output tags
  - `outputTags: ItemTag[]` - tags to apply to produced items
  - `qualityRange: [number, number]` - quality range for this method
  - `qualityCap?: number` - maximum quality limit (for junk items)

#### 3.2 Material Consumption Updates
- [ ] Update material requirements to support tag-specific consumption
  - Allow methods to prefer certain tagged materials
  - `material_requirements` can specify tag preferences
  - Example: Military production prefers `[premium]` steel over `[salvaged]`
- [ ] Update manufacturing completion to use new item creation
  - Generate `ItemInstance` with appropriate tags and calculated quality
  - Add to facility inventory using new system

#### 3.3 Manufacturing UI Updates
- [ ] Update `MachineWorkspaceView.tsx` manufacturing interface
  - Show available base materials with tag breakdown
  - Display expected output tags and quality ranges
  - Method selection shows tag and quality implications

### **Phase 4: Market System Integration (Priority: Medium)**
**Goal**: Update market and contracts to handle tagged items and quality-based pricing

#### 4.1 Market Lot Generation Updates
- [ ] Update `MarketGenerator.ts` to generate tagged material lots
  - Materials spawn with random tags: `[standard]`, `[premium]`, `[salvaged]`
  - Quality percentages determine pricing multipliers
  - Tag combinations affect availability and pricing
- [ ] Update market pricing to be tag and quality aware
  - Base price × quality modifier × tag modifier
  - `[premium]` materials cost more but enable better manufacturing
  - `[salvaged]` materials cost less but limit quality potential

#### 4.2 Player Product Sales Updates
- [ ] Update product listing system for tagged items
  - List items by base type with tag and quality breakdown
  - Pricing suggestions based on tag and quality
  - Market demand varies by tag type (military items sell faster)
- [ ] Update `PlayerListing` to include tag and quality information
  - Better market matching for items with desirable tags
  - Quality affects sale probability and price

#### 4.3 Contract System Updates
- [ ] Update `CustomerContract` requirements to specify tags
  - Military contracts require `[military-grade]` or `[forged]` items
  - Civilian contracts accept any tags but pay based on quality
  - Corporate contracts prefer `[forged]` but accept `[restored]`
- [ ] Update contract fulfillment to match tags and quality
  - Quality requirements are strict minimums
  - Tag requirements determine contract eligibility
  - Payment bonuses for exceeding requirements

### **Phase 5: UI Polish and Advanced Features (Priority: Low)**
**Goal**: Enhance user experience with the new system

#### 5.1 Advanced Inventory Features
- [ ] Implement inventory filtering and sorting
  - Filter by tags, quality ranges, item categories
  - Sort by quality, value, quantity, recently acquired
  - Search functionality for large inventories
- [ ] Add inventory management tools
  - Bulk operations (scrap all junk items, sell all restored items)
  - Quality upgrade paths (combine items to improve quality)
  - Item repair and maintenance systems

#### 5.2 Market Intelligence
- [ ] Add market analysis tools
  - Price history for different tag combinations
  - Demand predictions based on contract trends
  - Optimal timing suggestions for buying/selling
- [ ] Enhanced contract matching
  - Automatic suggestions for which items to use for contracts
  - Contract profitability analysis considering item costs
  - Alternative fulfillment options with different items

#### 5.3 Manufacturing Optimization
- [ ] Manufacturing planning tools
  - Material requirement planning for upcoming contracts
  - Optimal manufacturing method suggestions based on available materials
  - Quality prediction based on current materials and equipment
- [ ] Advanced manufacturing methods
  - Hybrid methods that combine different approaches
  - Specialized methods unlocked by research
  - Equipment-specific bonus tags

## Implementation Strategy

### **Development Sequence**:
1. **Types and Data Layer** (Phase 1) - Foundation for everything else
2. **Inventory System** (Phase 2) - Core storage and UI changes
3. **Manufacturing Integration** (Phase 3) - Production system updates
4. **Market Integration** (Phase 4) - Economic system updates
5. **Polish and Enhancement** (Phase 5) - Advanced features

### **Migration Strategy**:
- **Backward Compatibility**: Maintain legacy system during transition
- **Gradual Migration**: Convert systems one at a time with fallback support
- **Data Preservation**: Ensure no loss of player progress during migration
- **Testing at Each Phase**: Verify complete functionality before proceeding

### **Code Organization**:
```
src/
├── types/
│   ├── items.ts              # Core item system types
│   ├── inventory.ts          # Inventory management types
│   └── index.ts              # Updated barrel exports
├── data/
│   ├── baseItems.ts          # Standardized item definitions
│   ├── itemTags.ts           # Tag definitions and effects
│   └── legacyItemMapping.ts  # Migration mapping
├── utils/
│   ├── itemSystem.ts         # Core item utilities
│   ├── inventoryManager.ts   # Inventory operations
│   └── legacyMigration.ts    # Conversion utilities
├── components/
│   ├── InventoryPanel.tsx    # New inventory UI
│   ├── ItemInstanceCard.tsx  # Individual item display
│   └── TagBadge.tsx          # Tag visualization
└── systems/
    ├── itemFactory.ts        # Item creation and modification
    └── qualityCalculator.ts  # Quality and value calculations
```

## Success Criteria

### **Phase Completion Metrics**:
- [ ] **Phase 1**: All existing items can be represented in new system
- [ ] **Phase 2**: Facility storage fully migrated with no data loss
- [ ] **Phase 3**: Manufacturing produces correctly tagged items
- [ ] **Phase 4**: Market and contracts work with tagged items
- [ ] **Phase 5**: UI provides excellent user experience with new system

### **Quality Assurance**:
- [ ] **Data Integrity**: No loss of existing player progress
- [ ] **Performance**: New system performs as well as old system
- [ ] **User Experience**: New system is more intuitive than old system
- [ ] **Extensibility**: Easy to add new items, tags, and behaviors

## Risk Mitigation

### **Major Risks**:
1. **Data Loss During Migration** - Mitigation: Comprehensive backup and fallback systems
2. **Performance Degradation** - Mitigation: Efficient data structures and caching
3. **UI Complexity** - Mitigation: Progressive disclosure and sensible defaults
4. **Breaking Changes** - Mitigation: Gradual migration with compatibility layers

### **Testing Strategy**:
- **Unit Tests**: Core item system functions
- **Integration Tests**: Full workflow testing at each phase
- **Migration Tests**: Verify data conversion accuracy
- **Performance Tests**: Ensure system scales appropriately

This phased approach ensures a smooth transition to the new material standardization system while maintaining all existing functionality and preserving player progress.