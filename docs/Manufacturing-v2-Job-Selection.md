# Manufacturing V2 - Job Creation Interface Design

## Overview

The new Job Creation Interface replaces the current product dropdown system with a sophisticated, scalable interface that can handle hundreds of products, automatic operation discovery, and intelligent workflow generation.

## Interface Architecture

### **Two-Panel Layout**

#### **Left Panel: Product & Action Selection**
- **Product Tree**: Hierarchical categorization of all available products
- **Inventory Actions**: Context-sensitive operations for items in storage
- **Search & Filters**: Find products quickly in large catalogs

#### **Right Panel: Job Configuration & Preview**
- **Operation Preview**: Shows generated workflow before starting
- **Enhancement Selection**: Available enhancements for the operation
- **Cost/Benefit Analysis**: Materials, time, and profitability preview
- **Start Job Controls**: Final confirmation and job initiation

## Left Panel: Product & Action Selection

### **Product Tree Structure**
```
📁 WEAPONS
├─ 📁 Handheld Weapons
│   ├─ 🔫 Basic Sidearm
│   ├─ 🗡️ Tactical Knife
│   └─ 🏹 Crossbow (locked - research required)
├─ 📁 Vehicle Weapons
│   └─ 💥 Plasma Cannon (locked - no blueprint)
└─ 📁 Ammunition
    └─ 🔸 Energy Cell

📁 TOOLS & EQUIPMENT
├─ 📁 Hand Tools
│   ├─ 🔨 Basic Hammer
│   └─ 🪚 Precision Saw
├─ 📁 Power Tools
│   └─ ⚡ Electric Drill
└─ 📁 Machinery
    └─ 🏭 Manual Lathe

📁 COMPONENTS
├─ 📁 Mechanical
│   ├─ ⚙️ Mechanical Assembly
│   └─ 🔩 Mechanical Components
└─ 📁 Electronics
    └─ 💾 Circuit Board (locked)
```

### **Product Tree Features**
- **Dynamic Generation**: Tree built from all defined BaseItems
- **Knowledge Gating**: Locked items show research/discovery requirements
- **Visual Indicators**: Icons, colors, and badges for different states
- **Expansion Memory**: Remembers which categories are expanded
- **Search Integration**: Filter tree in real-time with search

### **Inventory Actions Section**
```
📦 ITEMS IN INVENTORY

🔫 Basic Sidearm [damaged] (3)
├─ 🔧 Repair → Preview workflow
├─ 🔬 Disassemble → Preview components
└─ 🗑️ Scrap → Recycle to materials

⚙️ Mechanical Assembly [functional] (2)  
├─ 🔧 Refurbish → Improve condition
├─ 🔬 Disassemble → Preview components
└─ 📦 Use in Assembly → Show compatible products

🧱 Steel (15.2 units)
└─ 🏭 Prepare Stock → Choose billet/cylinder/sheet/wire
```

### **Context-Sensitive Operations**
The system automatically detects valid operations for each item:

#### **For Tier 3 Items (Assemblies)**
- **Repair**: If damaged/junk condition
- **Disassemble**: Always available for assemblies
- **Refurbish**: If functional but low quality
- **Upgrade**: If enhancement options available

#### **For Tier 2 Items (Shaped Materials)**
- **Further Shaping**: If additional processing possible
- **Use in Assembly**: Show products that require this component
- **Recycle**: Break down to Tier 1 materials (future)

#### **For Tier 1 Items (Raw Materials)**
- **Prepare Stock**: Create billets, cylinders, sheets, wire
- **Direct Processing**: Skip stock preparation for simple operations

## Right Panel: Job Configuration & Preview

### **Operation Preview Section**
```
🔧 REPAIR: Basic Sidearm [damaged]

ANALYSIS SUMMARY
├─ Input: 1x Basic Sidearm [damaged] (15% quality)
├─ Expected Recovery: Mechanical Assembly (damaged), Small Tube (good), Small Casing (damaged)
├─ Replacement Needed: New casing, repair mechanical assembly
└─ Estimated Result: Basic Sidearm [functional] (65-75% quality)

GENERATED WORKFLOW
1. Disassembly (15min) - Separate components
   └─ Outputs: 1x Mechanical Assembly [damaged], 1x Small Tube, 1x Small Casing [damaged]

2. Component Analysis (10min) - Assess damage
   └─ Decision: Tube is salvageable, assemblies need work

3. Mechanical Assembly Repair (45min) - Disassemble and rebuild
   ├─ Uses: 3x Mechanical Components [rough] (from disassembly)
   ├─ Needs: 7x Mechanical Components [rough] (manufacture new)
   └─ Outputs: 1x Mechanical Assembly [functional]

4. New Casing Creation (18min) - Replace damaged casing
   ├─ Uses: 0.3x Plastic
   └─ Outputs: 1x Small Casing [functional]

5. Final Assembly (35min) - Rebuild complete weapon
   └─ Outputs: 1x Basic Sidearm [functional]

MATERIALS REQUIRED
├─ Steel: 0.7 units (for replacement components)
├─ Plastic: 0.3 units (for new casing)
└─ Existing: 1x Basic Sidearm [damaged]

ESTIMATED TOTALS
├─ Time: 2h 3min (123 minutes)
├─ Cost: 45 credits (materials)
├─ Result Value: 180 credits
└─ Profit: 135 credits (300% margin)
```

### **Enhancement Selection Section**
```
🌟 AVAILABLE ENHANCEMENTS

Performance
☐ Corrosion Resistance [+25min, +12cr] → +35cr value
  └─ Requires: Chemical Bath Station ✓

Aesthetic  
☐ Premium Finish [+35min, +8cr] → +25cr value
  └─ Requires: Polishing Equipment ✓

Functional
☐ Modular Mount [+40min, +15cr] → +45cr value
  └─ Requires: Precision Drill ✗ (Missing equipment)

ENHANCEMENT SUMMARY
├─ Selected: Corrosion Resistance
├─ Additional Time: +25 minutes
├─ Additional Cost: +12 credits  
├─ Additional Value: +35 credits
└─ New Profit: 158 credits (351% margin)
```

### **Smart Recommendations**
```
💡 SYSTEM RECOMMENDATIONS

Efficiency
├─ ⚡ Parallel Processing: Start steel billet preparation now (save 15min)
├─ 📦 Batch Operation: 3 damaged sidearms available - repair all together?
└─ 🔄 Component Stockpiling: Make extra rough components for future repairs

Profitability  
├─ 💰 Enhancement Value: Corrosion resistance adds 23cr net profit
├─ 📈 Market Timing: Sidearm prices up 15% this week
└─ ⚖️ Alternative: Disassembly yields 95cr in components vs 135cr repair profit

Equipment
├─ 🛠️ Missing Tools: Precision Drill would unlock Modular Mount enhancement
└─ ⏰ Bottleneck Alert: Milling operations will queue - consider second mill
```

## User Workflow Examples

### **Scenario 1: Manufacturing New Product**
1. **Navigate Product Tree** → Weapons → Handheld → Basic Sidearm
2. **System Analysis** → "No materials available, need 1.1 steel + 0.3 plastic"
3. **Workflow Generation** → Shows complete manufacturing sequence
4. **Enhancement Selection** → Choose desired enhancements
5. **Start Job** → Queues complete workflow

### **Scenario 2: Repairing Damaged Item**
1. **Inventory Actions** → Select "Basic Sidearm [damaged]" → "Repair"
2. **Damage Analysis** → Shows component condition assessment
3. **Repair Strategy** → Disassemble, replace damaged parts, reassemble
4. **Cost Preview** → Materials needed vs value improvement
5. **Start Repair** → Queues adaptive repair workflow

### **Scenario 3: Disassembly Operation**
1. **Inventory Actions** → Select "Basic Sidearm [functional]" → "Disassemble"
2. **Recovery Preview** → Shows expected components and conditions
3. **Value Analysis** → Component values vs intact product value
4. **Disassembly Method** → Choose careful vs fast disassembly
5. **Start Disassembly** → Queues component recovery workflow

### **Scenario 4: Stock Preparation**
1. **Inventory Actions** → Select "Steel (15.2 units)" → "Prepare Stock"
2. **Shape Selection** → Choose billet/cylinder/sheet/wire based on intended use
3. **Quantity Planning** → How much stock to prepare
4. **Efficiency Preview** → Batch processing recommendations
5. **Start Preparation** → Queues stock shaping operations

## Technical Implementation

### **Component Architecture**
```typescript
// Main job creation interface
<JobCreationInterface>
  <LeftPanel>
    <ProductTree products={availableProducts} onSelect={handleProductSelect} />
    <InventoryActions items={facilityInventory} onAction={handleInventoryAction} />
    <SearchAndFilters onFilter={handleFilter} />
  </LeftPanel>
  
  <RightPanel>
    <OperationPreview workflow={generatedWorkflow} />
    <EnhancementSelector available={availableEnhancements} onSelect={handleEnhancementSelect} />
    <SystemRecommendations recommendations={smartSuggestions} />
    <JobStartControls onStart={handleJobStart} />
  </RightPanel>
</JobCreationInterface>
```

### **Data Flow**
1. **Product Selection** → Triggers workflow generation
2. **Inventory Analysis** → Identifies available materials and items
3. **Gap Analysis** → Calculates what needs to be manufactured
4. **Enhancement Discovery** → Finds available enhancements based on equipment
5. **Workflow Generation** → Creates complete operation sequence
6. **Cost Calculation** → Computes materials, time, and profitability
7. **Job Creation** → Converts workflow to machine workspace jobs

### **Integration Points**
- **Product Database** → Drives product tree generation
- **Manufacturing V2** → Provides workflow generation and analysis
- **Enhancement System** → Discovers and applies enhancements
- **Inventory System** → Provides item context and availability
- **Machine Workspace** → Receives generated jobs for execution

## Scalability Features

### **Performance Optimizations**
- **Lazy Loading** → Load product details only when selected
- **Virtual Scrolling** → Handle thousands of products efficiently
- **Cached Analysis** → Store workflow analysis results
- **Background Processing** → Generate previews without blocking UI

### **Future Expansion Ready**
- **Research Integration** → Products unlock through technology trees
- **Custom Recipes** → Player-created manufacturing methods
- **Batch Operations** → Process multiple items simultaneously
- **Automation Scripts** → Save and replay common workflows

## Success Metrics

### **Usability Goals**
- **Fast Product Discovery** → Find any product in <10 seconds
- **Clear Operation Understanding** → Preview shows exactly what will happen
- **Efficient Job Creation** → Complete workflow in <30 seconds
- **Intelligent Suggestions** → System recommendations improve player decisions

### **Scalability Goals**
- **1000+ Products** → Interface remains responsive and navigable
- **Complex Workflows** → Handle 50+ operation sequences smoothly
- **Batch Processing** → Process dozens of items simultaneously
- **Real-time Updates** → Live inventory and equipment status

This Job Creation Interface transforms Manufacturing V2 from a simple crafting system into a sophisticated production planning tool that scales from garage workshop to industrial empire while remaining intuitive and accessible.