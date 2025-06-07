# Defense Magnate

A real-time arms manufacturing management game built with React, TypeScript, and Vite. Players run an arms manufacturing company in a fractured galactic warzone, managing production workflows, machine assignments, materials, and contracts in real-time.

## 🎮 Game Overview

Defense Magnate is a browser-based management simulation where you:
- **Manufacture weapons and components** using realistic machine workspace systems
- **Manage real-time production** with 1 minute = 1 game hour time scale  
- **Optimize machine utilization** with facility-wide job queues and dynamic assignment
- **Source materials** from dynamic markets with procedural suppliers
- **Fulfill contracts** with quality requirements and deadline pressure
- **Build your business** through the complete acquire-manufacture-sell cycle

## 🔧 Recent Updates - Economic Systems Complete

### 📋 **Latest Features - Material Standardization & Markets**

#### **✨ NEW: Tag-Based Inventory System**
- **Unified Items**: Single item types with quality and condition tags
- **Quality System**: 0-100% quality scale affecting value and contracts
- **Smart Storage**: Items grouped by type with expandable categories
- **Manufacturing Integration**: Products receive tags like [forged], [restored], [junk]

#### **💰 NEW: Dynamic Market System**
- **Procedural Suppliers**: "Titan Mining Corp", "Battlefield Salvage LLC" 
- **Market Dynamics**: Prices fluctuate based on supply/demand simulation
- **Purchase Orders**: Buy materials with delivery timers
- **Player Sales**: List products for sale at custom prices

#### **📋 NEW: Contract System**
- **Customer Orders**: Procedurally generated contracts with requirements
- **Quality Standards**: Contracts specify minimum acceptable quality
- **Deadline Pressure**: Time limits with early delivery bonuses
- **Automatic Fulfillment**: Smart matching of inventory to contract specs

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
- **[ASCII Style Guide](docs/ascii-style-guide.md)**: UI design patterns and conventions

## 🎯 Current Status

**Economic Systems: ✅ COMPLETE**  
**Manufacturing v1: ✅ COMPLETE**

The game now features a complete economic loop:

### 🏭 Manufacturing
- Machine workspace system with real-time job flow
- Multiple products with varied manufacturing methods
- Tag-based quality system for all produced items
- Visual progress tracking and completion notifications

### 💰 Markets
- Dynamic material markets with procedural suppliers
- Price fluctuations based on supply/demand
- Player product sales with automatic transactions
- Delivery timers for purchased materials

### 📋 Contracts  
- Customer contracts with quality requirements
- Deadline pressure and early delivery bonuses
- Automatic fulfillment from tagged inventory
- Multiple customer types with different needs

### 📦 Inventory
- Unified item system with tags and quality
- Smart material consumption (best quality first)
- Expandable category display in UI
- Seamless legacy system migration

The game is ready for the next development pass focusing on supply contracts and reputation systems.

## 🔮 Vision

Defense Magnate aims to be a deep, engaging management simulation that combines:
- **Realistic manufacturing constraints** that feel intuitive and strategic
- **Real-time progression** that respects player time while staying engaging
- **Complex systems** presented through clean, understandable interfaces
- **Meaningful choices** in equipment, contracts, and business strategy
- **Rich discovery mechanics** that reward curiosity and experimentation

The game will eventually expand to Steam via Electron/Tauri wrapper while maintaining its browser-first design philosophy.