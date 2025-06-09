# Manufacturing V2 - Clean Recipe Definitions

## Recipe Structure Overview

These recipes follow the three-tier manufacturing hierarchy with clear operation types and realistic time estimates. All recipes represent ONE possible way to manufacture each item - future expansions will add alternative methods.

## Tier 1: Raw Materials
- **Steel**: Refined material, cannot be manufactured (sourced from mining/purchasing)
- **Plastic**: Refined material, cannot be manufactured (sourced from mining/purchasing)

## Tier 2: Shaped Materials & Direct Products

### **Small Steel Billet**
- **Required Materials**: 0.1 Steel
- **Manufacturing Type**: Milling [rough]
- **Estimated Time**: 15 minutes
- **Description**: Basic steel stock preparation for component machining

### **Small Steel Cylinder** 
- **Required Materials**: 0.1 Steel
- **Manufacturing Type**: Turning [rough]
- **Estimated Time**: 20 minutes
- **Description**: Round steel stock for boring operations

### **Mechanical Component [rough] [low-tech]**
- **Required Materials**: 1x Small Steel Billet
- **Manufacturing Type**: Milling [rough]
- **Estimated Time**: 25 minutes
- **Description**: Basic machined mechanical parts

### **Small Tube**
- **Required Materials**: 1x Small Steel Cylinder
- **Manufacturing Type**: Boring [rough]
- **Estimated Time**: 30 minutes
- **Description**: Hollow cylindrical component created by boring

### **Small Casing**
- **Required Materials**: 0.3 Plastic
- **Manufacturing Type**: Milling [rough]
- **Estimated Time**: 18 minutes
- **Description**: Molded plastic housing component

## Tier 3: Assemblies

### **Mechanical Assembly [low-tech]**
- **Required Materials**: 10x Mechanical Components [rough] [low-tech]
- **Manufacturing Type**: Assembly [Basic]
- **Estimated Time**: 45 minutes
- **Description**: Combined mechanical components forming internal mechanism

### **Basic Sidearm [low-tech]**
- **Required Materials**: 
  - 1x Mechanical Assembly [low-tech]
  - 1x Small Tube
  - 1x Small Casing
- **Manufacturing Type**: Assembly [Precision]
- **Estimated Time**: 35 minutes
- **Description**: Complete low-tech sidearm weapon

## Operation Type Requirements

### **Equipment Capability Rules**
- **[Precision] operations**: Can satisfy [Rough] requirements (higher capability includes lower)
- **[Rough] operations**: Cannot satisfy [Precision] requirements
- **New Operation Types**: 
  - **Boring**: Requires specialized boring equipment (drill press, hand bore)
  - **Assembly [Basic]**: Basic manipulation and surface area
  - **Assembly [Precision]**: Precision manipulation and measurement tools

### **Equipment Compatibility Matrix**
```
Milling [rough]:     Manual Mill, CNC Mill, Hand Tools (slow)
Milling [precision]: CNC Mill, Precision Manual Mill
Turning [rough]:     Manual Lathe, CNC Lathe
Turning [precision]: CNC Lathe, Precision Manual Lathe  
Boring [rough]:      Drill Press, Hand Bore, CNC Machine
Boring [precision]:  CNC Machine, Precision Drill Press
Assembly [Basic]:    Workbench, Hand Tools
Assembly [Precision]: Workbench + Precision Tools, Assembly Station
```

## Complete Manufacturing Flow Example

### **Basic Sidearm Total Requirements**
Starting from raw materials:
- **1.0 Steel** (for 10x components via billets)
- **0.1 Steel** (for tube via cylinder)  
- **0.3 Plastic** (for casing)
- **Total Steel**: 1.1 units
- **Total Plastic**: 0.3 units

### **Operation Sequence**
1. **Steel Preparation** (35min): 1.1 Steel → 10x Small Steel Billet + 1x Small Steel Cylinder
2. **Component Manufacturing** (250min): 10x Small Steel Billet → 10x Mechanical Components [rough] [low-tech]
3. **Tube Manufacturing** (30min): 1x Small Steel Cylinder → 1x Small Tube
4. **Casing Manufacturing** (18min): 0.3 Plastic → 1x Small Casing
5. **Mechanical Assembly** (45min): 10x Mechanical Components → 1x Mechanical Assembly [low-tech]
6. **Final Assembly** (35min): Mechanical Assembly + Small Tube + Small Casing → Basic Sidearm [low-tech]

**Total Manufacturing Time**: ~413 minutes (~7 hours)
**Critical Path**: Component manufacturing (250min of the total time)

## Recipe Design Notes

### **Realistic Proportions**
- Steel billets use 0.1 steel each (reasonable for small components)
- 10 components needed for assembly (realistic mechanical complexity)
- Plastic casing uses 0.3 units (appropriate for housing)

### **Operation Time Scaling**
- **Preparation operations**: 15-20 minutes (simple shaping)
- **Component manufacturing**: 25-30 minutes (precision work)
- **Assembly operations**: 35-45 minutes (complex fitting and adjustment)

### **Future Expansion Ready**
- Additional boring equipment can be added
- Alternative manufacturing methods for same products
- Quality variations based on equipment used
- Material substitutions (titanium cylinders, aluminum billets, etc.)

### **Equipment Investment Drivers**
- **Boring equipment**: Required for tube manufacturing (new purchase needed)
- **Precision assembly tools**: Required for final sidearm assembly
- **Multiple workstations**: Parallel operations reduce total time significantly

## Testing Validation

### **Material Flow Check**
✓ All Tier 2 items source from Tier 1 materials
✓ All Tier 3 items source from Tier 2 items or other Tier 3 items
✓ No circular dependencies in requirements
✓ No artificial material multiplication

### **Operation Logic Check**
✓ Shaping operations (milling, turning, boring) create shaped materials
✓ Assembly operations combine multiple components
✓ Operation types match equipment capabilities
✓ Time estimates reflect operation complexity

### **Manufacturing Hierarchy Check**
✓ Raw materials cannot be manufactured
✓ Shaped materials can be recycled but not disassembled
✓ Assemblies can be disassembled back to components
✓ Clear boundaries between tiers maintained