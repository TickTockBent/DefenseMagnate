# Material Standardization System

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