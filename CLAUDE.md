# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Defense Magnate is a single-player, browser-playable real-time management simulation game where players run an arms manufacturing company in a fractured galactic warzone. The game operates in real-time with a 1 minute = 1 game hour time scale, allowing players to watch their production lines progress naturally. The game is built as a web application with no backend, using browser localStorage for saves and compressed string codes for save portability.

**Current Status**: Materials & Contracts v1 Complete - Full economic foundation with material standardization, dynamic markets, customer contracts, and tag-based inventory system implemented and functional.

## Technology Stack

- **Frontend**: React 18 with functional components and hooks
- **State Management**: Zustand with single store pattern
- **Styling**: TailwindCSS with ASCII-based UI design system
- **Build System**: Vite with TypeScript strict mode
- **Type System**: Comprehensive TypeScript with barrel exports
- **Architecture**: Relaxed import system with consolidated enums
- **Deployment**: GitHub Pages/Netlify/Vercel (browser-first)
- **Future Steam Release**: Electron or Tauri wrapper

## Project Structure

```
src/
├── components/          # UI components and panels
│   ├── MachineWorkspaceView.tsx             # Main manufacturing UI with machine slots
│   ├── ContentPanel.tsx                     # Tab-based content routing
│   ├── ResourcePanel.tsx                    # Material inventory display
│   ├── HorizontalTabs.tsx                   # Main navigation tabs
│   └── TabPanel.tsx                         # Generic tab wrapper
├── data/               # Static game data and manufacturing definitions
│   ├── equipment.ts    # Equipment database and starter sets
│   ├── materials.ts    # Material definitions  
│   ├── manufacturingMethods.ts              # Product manufacturing methods
│   ├── baseItems.ts    # Unified base item definitions
│   ├── itemTags.ts     # Tag effects and calculations
│   └── productHelpers.ts # Legacy product data
├── state/              # Zustand game state management
│   └── gameStoreWithEquipment.ts # Main game store with full economic systems
├── systems/            # Core game logic
│   ├── machineWorkspace.ts                  # Machine slot job management
│   ├── marketGenerator.ts                   # Market lot and supplier generation
│   ├── contractGenerator.ts                 # Customer contract generation
│   └── productionScheduler.ts # Legacy production system
├── types/              # TypeScript type definitions (barrel exported)
│   ├── index.ts        # Barrel export for all types
│   ├── facility.ts     # Facility and equipment types
│   ├── machineSlot.ts  # Machine workspace and job slot types
│   ├── manufacturing.ts # Manufacturing process types
│   ├── material.ts     # Material and inventory types
│   ├── items.ts        # Item and tag system types
│   ├── inventory.ts    # Inventory management types
│   ├── market.ts       # Market and supplier types
│   ├── contracts.ts    # Customer contract types
│   ├── product.ts      # Product definition types
│   ├── productionLine.ts # Legacy production types
│   └── shared.ts       # Common utility types
├── utils/              # Utility functions and formatters
│   ├── gameClock.ts    # Real-time game clock (1 min = 1 hour)
│   ├── ascii.ts        # ASCII art utilities
│   ├── timeSystem.ts   # Time formatting utilities
│   ├── inventoryManager.ts                  # Inventory CRUD operations
│   ├── itemSystem.ts   # Item creation and management
│   ├── facilityMigration.ts                 # Legacy storage migration
│   └── legacyItemMigration.ts               # Legacy item migration
└── App.tsx             # Main application layout
```

## Development Commands

Since this is a new project without existing build configuration, typical commands would be:

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting (once configured)
npm run lint

# Type checking (once TypeScript is configured)
npm run typecheck
```

## Core Architecture (Materials & Contracts v1 Complete)

### Game State Structure
The game uses a centralized state pattern with Zustand. The core `GameState` interface includes:
- `gameTime`: Real-time clock with pause/speed controls (1 real minute = 1 game hour)
- `facilities`: Production facilities with equipment and unified inventory systems
- `machineWorkspace`: Facility-wide job queue and machine slot management
- `equipmentDatabase`: Global equipment definitions and capabilities
- `jobCompletionNotifications`: Real-time completion feedback system
- `marketState`: Dynamic material markets and player product listings
- `contractState`: Customer contracts with quality requirements and deadlines
- `credits`: Player currency for all economic transactions
- `materials`: Legacy materials tracking (superseded by inventory system)
- `research`: Future R&D projects and technology trees (planned)

### Machine Workspace System
- **Facility-Wide Job Queue**: Single priority queue for all jobs, not machine-specific queues
- **Machine Slots**: Each machine has one slot that can be occupied or idle
- **Dynamic Job Assignment**: Jobs pull from facility queue to any suitable idle machine
- **Real-Time Job Flow**: Jobs move through operations automatically as machines become available
- **Pull-Based Architecture**: Machines pull work rather than jobs being pushed to machines

### Single-Machine Operations Architecture
- **Operation Decomposition**: Each manufacturing step uses exactly one machine
- **Tag-Based Requirements**: Operations require specific equipment capabilities (SURFACE, TURNING, MILLING, etc.)
- **Sequential Processing**: Jobs flow through multiple single-machine operations in sequence
- **Equipment Efficiency**: Machine quality affects operation duration and success rates
- **Material Consumption**: Materials consumed at operation start or completion

### Multi-Product Manufacturing
- **Basic Sidearm**: 3 manufacturing methods (Forge New, Restore Damaged, Cobble Together)
- **Tactical Knife**: 3 manufacturing methods (Forge New, Restore Damaged, Quick Sharpen)
- **Method Variety**: Different complexity levels (2-6 operations, 11-135 minutes)
- **Equipment Utilization**: Different methods stress different machine types
- **Customer Segments**: Methods target different quality/price markets

### Real-Time System
- **Time Scale**: 1 real minute = 1 game hour for balanced pacing
- **Global Clock**: Centralized time system driving all game mechanics (`utils/gameClock.ts`)
- **Pause/Resume**: Players can pause the entire game at any time
- **Production**: Items craft in real-time with step-by-step progression
- **Future Speed Controls**: Framework ready for variable speed (1x to 100x+)

### Equipment System
- **Equipment Database**: 15+ equipment types from hand tools to CNC machines
- **Equipment Instances**: Individual tools with condition, maintenance, and history
- **Capacity Aggregation**: Total facility capabilities calculated from installed equipment
- **Starter Sets**: Pre-configured equipment packages for different facility types

### Material Standardization System
- **Unified Items**: 18 base items replace 50+ separate variants using tag-based modifications
- **Tag System**: 16 tags including [damaged], [forged], [military-grade], [titanium], [salvaged]
- **Quality Scale**: 0-100% quality system with tag-based modifiers and caps
- **Inventory Manager**: Full CRUD operations with reservation system and dual compatibility
- **Legacy Migration**: Automatic conversion from old storage format preserves player progress

### Market System
- **Dynamic Generation**: Procedural suppliers like "Titan Mining Corp", "Battlefield Salvage LLC"
- **Market Forces**: Supply/demand simulation affects pricing over time
- **Purchase Orders**: Material buying with delivery timers and automatic inventory updates
- **Player Sales**: List manufactured products for sale with custom pricing
- **Quality Integration**: Materials and products sold with full tag and quality information

### Contract System
- **Customer Orders**: Procedural generation of contracts with specific requirements
- **Quality Standards**: Contracts specify minimum quality levels for fulfillment
- **Deadline Management**: Time limits with early delivery bonus payments
- **Auto-Fulfillment**: Smart matching of inventory items to contract specifications
- **Customer Segments**: Rebels, military, corporate with different quality/price needs

### Save System
- Autosave to browser `localStorage`
- Manual export/import via compressed base64 strings ("Command Codes")
- No backend dependencies - fully client-side

### UI Design
- **ASCII Terminal Aesthetic**: Retro sci-fi styling with monospace fonts
- **Layout**: Left panel (tabs), Center (active content), Right (resources/map)
- **Color Scheme**: Teal, gray, black with semantic coloring for status
- **Machine Grid**: Visual equipment layout with live status indicators
- **Activity Spinners**: Thematic animations for active machines (⚒ workbench, ◉ lathe, ⟲ mill)
- **Job Notifications**: Pop-up completion alerts with auto-dismiss
- **Product Dropdown**: Clean selection interface with expandable method details
- **Queue Visualization**: Scrollable facility-wide job queue with priority indicators

## Development Workflow

1. **Task Decomposition**: Break objectives into clearly scoped subtasks
2. **Single Responsibility**: Each code generation addresses one component/feature
3. **State-First Development**: Define gameState shape early
4. **Progressive Enhancement**: Use stubs and mocks for incomplete systems
5. **Modular Code**: Keep systems composable and loosely coupled

## Key Guidelines

- **Prefer clarity over cleverness** in code implementation
- **Use functional React components exclusively** with hooks
- **Style exclusively with Tailwind utility classes** for consistency
- **Use barrel exports** - Always import from `'../types'` not individual files
- **Calculate equipment capacity dynamically** from installed equipment, never hardcode
- **Follow tag-based constraints** - equipment provides tags, manufacturing steps require tags
- **Maintain real-time updates** - all systems should work with the game clock
- **Keep UI components in `<pre>`** or whitespace-pre for ASCII layout
- **Follow ASCII UI patterns** defined in docs/ascii-style-guide.md

## Architecture Patterns

### Import/Export Guidelines
```typescript
// ✅ GOOD: Use barrel exports
import { Equipment, TagCategory, JobState } from '../types';

// ❌ BAD: Direct file imports
import { Equipment } from '../types/equipment';
import { TagCategory } from '../types/equipment';
```

### Equipment Capacity Pattern
```typescript
// ✅ GOOD: Calculate dynamically
facility.equipment_capacity = aggregateEquipmentTags(facility.equipment, equipmentDatabase);

// ❌ BAD: Hardcode capacity
facility.equipment_capacity = new Map([
  [TagCategory.TURNING, 8],  // Don't do this!
]);
```

### Type Organization
- **Core types**: `types/index.ts` (barrel export)
- **Game state**: `types/game.ts` (high-level composition)
- **Future systems**: `types/future.ts` (planned features)
- **Constants**: `constants/enums.ts` (all enums)
- **Utilities**: `utils/formatters.ts` (pure functions)

## Current Implementation Status

**✅ Materials & Contracts v1 Complete**: 
- Complete economic foundation with acquire-manufacture-sell loop
- Material standardization system with 18 base items + 16 tags
- Dynamic market system with procedural suppliers and pricing
- Customer contract system with quality requirements and deadlines
- Unified inventory system with legacy migration support
- Market selling interface integrated with new inventory system

**✅ Manufacturing v1 Complete**: 
- Machine workspace system with facility-wide job queues
- Single-machine operation architecture with tag-based equipment matching
- Real-time job flow through multiple machines automatically
- Two complete product lines with 6 total manufacturing methods
- Job completion notifications with thematic machine activity indicators
- Product dropdown selection with detailed method breakdowns
- Full equipment database with 6 machine types and thematic spinners

**🚧 Next Priority**: Supply Contracts & Reputation system for business relationships

## Testing Setup

The game starts with a fully equipped garage containing:
- **Basic Hand Tools** (⚡ basic manipulation 10)
- **Precision Hand Tools** (⚙ precision manipulation 8, basic manipulation 15)  
- **Basic Workbench** (⚒ surface 2m², holding capability, storage 0.5m³)
- **Manual Lathe** (◉ turning operations 8%)
- **Manual Mill** (⟲ milling 10%, drilling 15%)
- **Basic Measuring Tools** (📐 measuring and quality control)

### Available Products & Methods

**Basic Sidearm (6 operations, 135 min total)**:
- **Forge New**: Premium quality from steel + plastic → pristine quality
- **Restore Damaged**: Repair damaged weapons → functional quality  
- **Cobble Together**: Quick assembly → junk quality

**Tactical Knife (2-6 operations, 11-85 min total)**:
- **Forge New**: High-quality blade from steel + aluminum → pristine quality
- **Restore Damaged**: Repair damaged knives → functional quality
- **Quick Sharpen**: Fast edge restoration → functional quality

### Material Inventory
Starting materials support immediate testing:
- Steel (20 units), Plastic (15 units), Aluminum (2 units)
- Damaged weapons and knives for restoration methods
- Machined parts and electronics for repairs
- All materials consumed realistically during production

Players can immediately test multi-product workflows, queue management, machine utilization optimization, and completion notifications.