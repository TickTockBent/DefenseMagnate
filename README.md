# Defense Magnate

A real-time arms manufacturing management game built with React, TypeScript, and Vite. Players run an arms manufacturing company in a fractured galactic warzone, managing production workflows, machine assignments, materials, and contracts in real-time.

## 🎮 Game Overview

Defense Magnate is a browser-based management simulation where you:
- **Manufacture weapons and components** using realistic machine workspace systems with component-based workflows
- **Manage real-time production** with 1 minute = 1 game hour time scale and live progress tracking
- **Optimize machine utilization** with facility-wide job queues and dynamic assignment
- **Control production pipelines** with job cancellation and material recovery at any stage
- **Disassemble and recover materials** from finished products and damaged items for reuse
- **Source materials** from dynamic markets with procedural suppliers
- **Fulfill contracts** with quality requirements and deadline pressure
- **Build your business** through the complete acquire-manufacture-sell-disassemble cycle

## 🔧 Recent Updates

### 📋 **Patch Notes v1.5 - Manufacturing v2 Arc (January 2025)** ⚡

This major update introduces event-driven job management with dynamic assignment, enhanced UI for sub-operation tracking, and comprehensive material validation systems.

#### **🎯 Event-Driven Job Assignment Coordinator**
- **⚡ Dynamic Job Scheduling**: JobAssignmentCoordinator automatically assigns jobs to best available machines based on compatibility scoring
- **🔄 Real-Time Assignment**: Jobs are assigned immediately when machines become available, eliminating polling overhead
- **📊 Machine Capability Scoring**: Logarithmic compatibility scoring system prioritizes precision equipment over basic tools
- **🎮 Optimal Machine Selection**: Jobs now go to the fastest/best machine instead of first available machine
- **⚠️ Equipment Availability Events**: Machine availability triggers immediate job assignment evaluation

#### **🏗️ Enhanced Job State Management**
- **📱 Event-Driven Architecture**: Replaced polling-based job management with reactive event system for better performance
- **🔄 Job Readiness States**: Comprehensive state tracking (READY, BLOCKED_BY_MATERIALS, BLOCKED_BY_DEPENDENCIES, IN_PROGRESS, COMPLETED)
- **⏱️ Real-Time Progress**: Sub-operations show live progress with machine assignments and completion status
- **🎯 Sub-Operation Tracking**: Individual operations within jobs tracked separately for parallel execution
- **📊 Facility-Wide Coordination**: Global job state manager coordinates work across all machines

#### **🎨 Advanced Job Management UI**
- **📋 Unified Job Display**: Merged separate job queue and active job displays into comprehensive view with persistent expansion states
- **⚙️ Sub-Operation Details**: Detailed breakdown showing individual operations, machine assignments, and material flows
- **🎯 Expected Outcomes**: Clear display of final outputs from manufacturing workflows
- **📦 Job Inventory Tracking**: Real-time display of materials and intermediate products within job inventories
- **🔧 Smart Cancellation**: Context-aware cancel buttons with material recovery preview
- **📈 Progress Visualization**: Color-coded operation states with completion percentages and time estimates

#### **🔧 Manufacturing Workflow Improvements**
- **🏗️ Component-Based Repair**: Fixed repair workflows to use actual assembly components instead of placeholder materials
- **⏳ Backwards Planning**: Repair jobs properly disassemble → inspect → repair → reassemble using baseItem definitions
- **🔄 Material Flow Tracking**: Just-in-time material movement ensures components are available when operations need them
- **📊 Operation Dependencies**: Sequential operation execution with proper dependency checking
- **⚡ Parallel Execution**: Sub-operations can run on different machines simultaneously when materials are available

#### **🧹 Inventory System Cleanup**
- **✅ Material Validation**: Comprehensive validation of all manufacturing operations against baseItem definitions
- **🧹 Undefined Item Cleanup**: Automatic removal of undefined items from inventories and catalogs
- **🔍 Global Validation**: Console utilities for validating material references across all manufacturing methods
- **📦 Inventory Integrity**: Fixed misleading success counters and improved error handling for inventory operations
- **⚠️ Capacity Management**: Upgraded facility storage capacity from 100 to 1000 units with automatic migration

#### **🎮 User Experience Enhancements**
- **🏭 Workshop Tab**: Renamed "Manufacturing" tab to "Workshop" for clearer terminology
- **🗑️ Legacy UI Removal**: Removed old product selection dropdown and outdated interface components
- **📊 Job State Debug Panel**: Added real-time statistics showing ready, active, blocked, and completed job counts
- **⚡ Performance Optimizations**: Event-driven architecture reduces CPU usage and improves responsiveness
- **🎯 Visual Feedback**: Enhanced machine activity indicators and job status display

### 📋 **Patch Notes v1.4 - Disassembly v1 Arc (January 2025)** 🔧

This major update introduces component-based manufacturing with intermediate product tracking, job cancellation with material recovery, and disassembly operations.

#### **🔄 Component-Based Manufacturing System**
- **🏗️ Job Sub-Inventories**: Each job now tracks materials and intermediate products separately
- **⚙️ Material Transformation**: Operations consume materials and produce specific components with tags
- **📊 Transparent Workflows**: See exactly what materials and components each operation uses/produces
- **🔗 Component Chaining**: Complex products built through multi-stage component transformation
- **🎯 Quality Inheritance**: Components inherit and modify quality from source materials

#### **❌ Advanced Job Cancellation**
- **🔧 Mid-Stage Recovery**: Cancel jobs at any point and recover all materials and intermediate products
- **💰 Partial Completion**: Keep components created by completed operations when cancelling
- **📦 Inventory Return**: All job sub-inventory materials automatically returned to facility
- **⚠️ Smart UI**: Cancel confirmation shows progress and recovery preview
- **🎮 Player Control**: Full control over production pipeline with minimal material loss

#### **♻️ Disassembly Operations**
- **🔨 Pristine Disassembly**: Carefully disassemble functional weapons to recover high-quality components
- **⚡ Damaged Salvage**: Force disassembly of damaged items to extract usable materials
- **🎯 Component Recovery**: Get plastic casings, mechanical assemblies, and material scraps
- **⚙️ Reverse Engineering**: Use recovered components in new manufacturing workflows
- **📊 Quality Preservation**: Component quality reflects source item condition

#### **🎨 Enhanced Job Management UI**
- **📋 Unified Job List**: Merged separate job queue and active job displays into single, comprehensive view
- **📊 Persistent Expansion**: Job details stay expanded when switching between queued/active/completed states
- **⏱️ Real-Time Progress**: In-progress jobs show current operation with live percentage (e.g., "Current: Rough Milling (67%)")
- **✅ Completed Job Lingering**: Finished jobs show "COMPLETED" status for 5 seconds before auto-dismissing
- **🎯 Status-Based Organization**: Color-coded job states (blue=queued, yellow=active, green=completed)
- **🔧 Smart Cancellation**: Context-aware cancel buttons only appear for cancellable jobs

#### **⚡ Performance & UX Improvements**
- **🚀 Fixed Progress Bar Interpolation**: Eliminated jumping/snapping at high game speeds
- **🔄 Stable Job State Management**: Jobs no longer flicker between lists during state transitions
- **🧹 Legacy UI Cleanup**: Removed empty resource displays and unused components
- **⏰ Improved Timing System**: Better synchronization between game time and real-time updates
- **🎮 Responsive Controls**: More intuitive job monitoring and control interface

### 📋 **Patch Notes v1.3 - Optimization & Cleanup Arc (January 2025)** ⚡

This focused arc improved performance and responsiveness while cleaning up legacy technical debt.

#### **🚀 Real-Time UI Performance**
- **✨ Smooth Progress Bars**: Added requestAnimationFrame-based interpolation for seamless progress updates
- **⏱️ Real-Time Countdowns**: Time remaining now updates continuously instead of discrete 1-second jumps
- **⚸ Activity Indicators**: Machine spinners and progress bars now animate smoothly between store updates
- **⏸️ Pause Handling**: Real-time updates properly respect game pause state
- **📱 Responsive Feel**: UI now feels much more responsive and performant during production

#### **🧹 Legacy Code Cleanup**
- **🗑️ Removed Unused Components**: Eliminated 6 legacy components (ManufacturingContentEnhanced, ProductionOverviewPanel, etc.)
- **⚡ Timer Optimization**: Removed redundant update timers from legacy manufacturing system
- **🔧 Import Cleanup**: Fixed unused imports and improved TypeScript compliance
- **📦 Component Consolidation**: Kept EquipmentPanelSimple, removed complex EquipmentPanel
- **🎯 Type Safety**: Enhanced TypeScript types with proper lastUpdateTime tracking

#### **⚙️ Performance Improvements**
- **🔄 Dual Update System**: Real-time interpolation works alongside discrete game logic updates
- **🎬 Animation Optimization**: Proper cleanup of animation frames to prevent memory leaks  
- **📊 Progress Calculation**: Smooth progress calculation with proper clamping at 100%
- **⏰ Completion Status**: Shows "Completing..." when jobs reach 100% but await processing
- **🚀 Build Optimization**: Faster builds with reduced bundle size from removed components

### 📋 **Patch Notes v1.2 - Materials & Contracts Arc (December 2024)**

This major update introduces a complete economic foundation with material standardization, dynamic markets, and customer contracts.

#### **🏗️ Material Standardization System**
- **✨ Unified Item Types**: Replaced 50+ separate item variants with 18 base items + tags
- **🏷️ Tag-Based Modifications**: 16 tags including [damaged], [forged], [military-grade], [titanium]
- **📊 Quality System**: 0-100% quality scale with tag-based modifiers and caps
- **📦 Smart Inventory**: Items grouped by category with expandable tags and quality display
- **⚙️ Manufacturing Integration**: All production methods now output tagged items
- **🔄 Legacy Migration**: Seamless conversion from old storage format

#### **💰 Dynamic Market System**
- **🏭 Procedural Suppliers**: Dynamic generation of vendors like "Titan Mining Corp", "Battlefield Salvage LLC"
- **📈 Market Forces**: Price fluctuations based on supply/demand simulation  
- **🚚 Purchase Orders**: Buy materials with realistic delivery timers (1-7 days)
- **💳 Player Sales**: List manufactured products for sale with custom pricing
- **📊 Quality Integration**: Materials come with quality tags affecting manufacturing
- **🔄 Auto-Delivery**: Purchased materials automatically added to inventory

#### **📋 Customer Contract System**
- **📝 Procedural Contracts**: Dynamic generation of customer orders with varied requirements
- **⭐ Quality Standards**: Contracts specify minimum acceptable quality levels
- **⏰ Deadline Pressure**: Time limits with early delivery bonus payments
- **🎯 Smart Fulfillment**: Automatic matching of inventory items to contract specifications
- **💰 Payment Processing**: Credits awarded on successful completion
- **👥 Customer Types**: Rebels, military, corporate security with different needs

#### **🔧 System Integration Improvements**
- **📦 Inventory Overhaul**: New inventory system handles both legacy and tagged items
- **⚙️ Manufacturing Updates**: Material consumption uses best quality items first
- **🎨 UI Enhancements**: Visual tags, quality indicators, and availability checking
- **🔄 Market Selling**: Updated selling interface to work with new inventory system
- **📊 Economic Balance**: Profit margins and pricing balanced across all systems

## 🔧 Version Mv1 - Machine Workspace System (Complete)

### 📋 **Patch Notes - Manufacturing v1**

### ✅ **Core Systems Implemented:**

#### **Real-Time Game Engine**
- **Game Clock**: 1 real minute = 1 game hour with pause/resume functionality
- **Time System**: Centralized time management driving all game mechanics
- **State Management**: Zustand-based reactive state with real-time updates

#### **Tag-Based Manufacturing System**
- **Equipment Tags**: Each equipment provides specific capabilities (e.g., "Turning 8%", "Surface 2m²")
- **Production Constraints**: Manufacturing steps require specific tag combinations
- **Dynamic Capacity**: Equipment capacity calculated automatically from installed tools
- **Quality & Efficiency**: Equipment quality affects production speed and output quality
- **Real-Time Scheduling**: Production jobs allocated to equipment with bottleneck analysis

#### **Equipment System**
- **Equipment Database**: 15+ equipment types from hand tools to CNC machines
- **Equipment Instances**: Individual tools with condition, maintenance, and history
- **Starter Sets**: Pre-configured equipment packages for different facility types
- **Capacity Aggregation**: Total facility capabilities calculated from installed equipment

#### **Manufacturing Methods**
- **Multi-Method Products**: Each product can be made via different methods
- **Step-by-Step Production**: Complex manufacturing broken into sequential steps
- **Resource Allocation**: Materials, equipment, and labor assigned per step
- **Failure Mechanics**: Steps can fail with quality/scrap/retry outcomes

#### **Materials & Storage**
- **Material Database**: Raw materials, components, and finished products
- **Storage Management**: Capacity-limited storage with material tracking
- **Starter Materials**: Pre-loaded materials for immediate testing

#### **Production Job Queue System**
- **Job Scheduling**: Priority-based job queue with equipment allocation
- **Step Progression**: Real-time step completion with resource management
- **Production Monitoring**: Live progress tracking with bottleneck identification
- **Constraint Analysis**: Real-time feedback on why production can't start

#### **User Interface**
- **ASCII Terminal Aesthetic**: Retro sci-fi styling with monospace fonts
- **Manufacturing Dashboard**: Real-time production monitoring and control
- **Equipment Panel**: Equipment management with capacity visualization
- **Constraint Tooltips**: Detailed explanations of production requirements
- **Resource Panel**: Live material and storage tracking

### 🚧 **Planned Systems (Future Passes):**

#### **Supply Contracts (Next)**
- Recurring material delivery contracts
- Supplier relationships and reliability
- Contract negotiation mechanics
- Bulk purchasing discounts

#### **Reputation System**
- Customer satisfaction tracking
- Faction relationships affecting contracts
- Quality reputation impacting prices
- Exclusive deals for high reputation

#### **Research & Technology**
- Technology trees and research projects
- Reverse engineering of salvaged components
- Blueprint discovery and completion
- Manufacturing method unlocks

#### **Worker & Labor Management**
- Skilled workers with specializations
- Training and experience systems
- Labor efficiency and automation
- Worker management and assignments

#### **Discovery & Salvage**
- Auction system for salvage lots
- Component examination and discovery
- Hidden technology and blueprint fragments
- Risk/reward exploration mechanics

#### **Events & Galaxy Dynamics**
- Supply disruptions and market opportunities
- Political changes affecting demand
- Technology breakthroughs and competition
- Dynamic galaxy events and consequences

## 🛠️ Technical Architecture

### **Technology Stack**
- **Frontend**: React 18 with functional components and hooks
- **State Management**: Zustand for reactive game state
- **Styling**: TailwindCSS with ASCII-based design system
- **Build System**: Vite with TypeScript strict mode
- **Type System**: Comprehensive TypeScript with barrel exports

### **Code Organization**
```
src/
├── components/          # UI components and panels
├── constants/           # Game enums and constants
├── data/               # Static game data and equipment definitions
├── state/              # Zustand game state management
├── systems/            # Core game logic (production scheduler, etc.)
├── types/              # TypeScript type definitions (barrel exported)
├── utils/              # Utility functions and formatters
└── types/
    ├── index.ts        # Barrel export for all types
    ├── game.ts         # High-level game state composition
    └── future.ts       # Type definitions for planned features
```

### **Key Architectural Patterns**
- **Barrel Exports**: Single import point for all types (`import { ... } from '../types'`)
- **Consolidated Enums**: All game enums in `constants/enums.ts`
- **Dynamic Capacity Calculation**: Equipment capabilities calculated from installed tools
- **Real-Time Job Scheduling**: Production scheduler manages equipment allocation
- **Constraint-Based Manufacturing**: Tag requirements naturally limit production

### **Recent Refactoring (Manufacturing v1)**
- **Import/Export Cleanup**: Eliminated fragile individual type imports
- **Relaxed TypeScript Config**: Reduced import friction while maintaining type safety
- **Future-Proofed Types**: Added comprehensive type definitions for planned systems
- **Equipment-Driven Capacity**: Removed hardcoded values, now calculated from equipment

## 🚀 Development

### **Setup**
```bash
npm install
npm run dev
```

### **Available Commands**
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Code linting (when configured)
npm run typecheck    # TypeScript checking (when configured)
```

### **Game Testing**
The game starts with a garage equipped with:
- Basic hand tools, workbench, and storage
- Manual lathe and mill for machining operations
- Starter materials for testing all manufacturing methods
- Sufficient capacity to manufacture basic sidearms immediately

### **Manufacturing Testing**
Three basic sidearm manufacturing methods available:
1. **Forge Method**: Make pristine weapons from steel + plastic
2. **Restore Method**: Repair damaged weapons with spare parts
3. **Cobble Method**: Assemble junk-quality weapons from scrap

## 📖 Documentation

- **[Game Design Document](docs/Game%20Design%20Document.md)**: Complete game vision and mechanics
- **[Economic Systems Overview](docs/Economic-Systems-Overview.md)**: 🆕 Material standardization and markets
- **[Material Standardization](docs/Material%20Standardization.md)**: 🆕 Tag-based inventory system
- **[Materials & Contracts](docs/Materials%20and%20Contracts%20v1.md)**: 🆕 Market and contract systems
- **[Manufacturing System](docs/product-manufacture.md)**: Detailed manufacturing documentation
- **[Equipment System](docs/facility-object.md)**: Equipment and facility mechanics
- **[Try it out!](https://ticktockbent.github.io/DefenseMagnate/)**: Hosted on github pages for now. Keep in mind it's nowhere near completed!

## 🎯 Current Status

**Optimization & Cleanup Arc: ✅ COMPLETE**  
**Materials & Contracts v1: ✅ COMPLETE**  
**Manufacturing v1: ✅ COMPLETE**

### 🏆 Major Milestones Achieved

#### **Complete Economic Foundation**
The game now features a fully functional economic loop with all core systems integrated:

#### **🏭 Manufacturing System** 
- ✅ Real-time machine workspace with job queues
- ✅ Multi-product manufacturing with varied methods
- ✅ Tag-based quality system for all products
- ✅ Visual progress tracking and notifications
- ✅ Material constraints and availability checking

#### **💰 Market System**
- ✅ Dynamic material markets with procedural suppliers
- ✅ Supply/demand price simulation
- ✅ Player product sales with custom pricing
- ✅ Delivery tracking and automatic inventory updates
- ✅ Quality-aware material purchasing

#### **📋 Contract System**
- ✅ Procedural customer contract generation
- ✅ Quality requirements and deadline pressure
- ✅ Automatic fulfillment from tagged inventory
- ✅ Multiple customer segments with unique needs
- ✅ Early delivery bonuses and payment processing

#### **📦 Inventory & Materials**
- ✅ Unified tag-based item system (18 base items + 16 tags)
- ✅ Quality-based material consumption
- ✅ Smart inventory grouping and display
- ✅ Legacy migration system
- ✅ Market integration for selling products

### 🚀 Ready for Next Development Arc

The core game loop of **Acquire → Manufacture → Sell** is fully functional. Next development will focus on:

1. **Supply Contracts**: Recurring material delivery agreements
2. **Reputation System**: Customer relationships affecting available contracts  
3. **Research & Development**: Technology trees and equipment upgrades

## 🔮 Vision

Defense Magnate aims to be a deep, engaging management simulation that combines:
- **Realistic manufacturing constraints** that feel intuitive and strategic
- **Real-time progression** that respects player time while staying engaging
- **Complex systems** presented through clean, understandable interfaces
- **Meaningful choices** in equipment, contracts, and business strategy
- **Rich discovery mechanics** that reward curiosity and experimentation

The game will eventually expand to Steam via Electron/Tauri wrapper while maintaining its browser-first design philosophy.