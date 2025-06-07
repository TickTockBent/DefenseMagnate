# Material Standardization System

## Implementation Status: ✅ COMPLETE

The material standardization system has been fully implemented across all game systems. This document describes both the design and the actual implementation.

## Unified Item Types
Replace separate item variants with single item types modified by quality and condition tags:

**Old System** (separate items):
- `damaged_basic_sidearm` → `basic_sidearm_functional`
- `basic_sidearm_junk` 
- `basic_sidearm_restored`

**New System** (one item + tags):
- `basic_sidearm` + `[damaged]` tag + 15% quality
- `basic_sidearm` + `[junk]` tag + 35% quality (max quality capped at 45%)
- `basic_sidearm` + `[restored]` tag + 65% quality
- `basic_sidearm` + `[forged]` tag + 90% quality

## Tag-Based Modifications

### Condition Tags
- **[damaged]**: Severe quality penalty, essentially non-functional, very low value
- **[junk]**: Quality cap at 45%, made from scrap materials
- **[restored]**: Repaired from damaged condition, moderate base quality
- **[forged]**: Manufactured from raw materials, high base quality
- **[hand-forged]**: Artisan quality bonus, premium market value
- **[military-grade]**: Meets military specifications, access to premium contracts

### Material Tags  
- **[titanium]**: Lightweight, corrosion-resistant, premium pricing
- **[steel]**: Standard materials, balanced cost/performance
- **[composite]**: Advanced materials, specialized applications
- **[salvaged]**: Recycled materials, cost savings but potential quality variations

## Quality System Integration
- **Base Quality**: Determined by manufacturing method and materials
- **Tag Modifiers**: Condition tags apply quality penalties or bonuses
- **Quality Caps**: Some tags limit maximum achievable quality
- **Market Value**: Quality and tags determine selling price and contract eligibility

## Inventory Organization
Materials inventory displays items grouped by type with expandable tag/quality sorting:

```
INVENTORY - MATERIALS & PRODUCTS

▼ Basic Sidearms (47 total)
  ├─ [damaged] (10 items)
  │   ├─ Quality 15% - 3 items
  │   ├─ Quality 18% - 4 items  
  │   └─ Quality 12% - 3 items
  ├─ [restored] (25 items)
  │   ├─ Quality 65% - 12 items
  │   ├─ Quality 68% - 8 items
  │   └─ Quality 62% - 5 items
  └─ [forged] (12 items)
      ├─ Quality 88% - 6 items
      └─ Quality 92% - 6 items

▼ Steel Materials (245kg total)
  ├─ [standard] - 180kg @ 85% purity
  ├─ [premium] - 45kg @ 95% purity  
  └─ [salvaged] - 20kg @ 70% purity
```

## Implementation Details

### Core Architecture
- **Base Items**: 18 standardized items across materials, products, and components
- **Tag System**: 16 tags with quality/value modifiers and special effects
- **Inventory Manager**: Full CRUD operations with reservation system
- **Migration System**: Seamless conversion from legacy storage format

### Manufacturing Integration
- Manufacturing methods now produce items with specific tags
- Quality determined by method type and random variation within ranges
- Materials consumed from inventory (best quality used first)
- Products added to inventory with appropriate tags and metadata

### UI Components
- **ResourcePanel**: Expandable inventory groups showing tags and quality
- **MachineWorkspaceView**: Real-time material availability checking
- **Manufacturing UI**: Shows required vs available materials with color coding

### Backward Compatibility
- Dual-mode operation supports both legacy and new systems
- Automatic migration when facilities are accessed
- No loss of existing player progress during transition