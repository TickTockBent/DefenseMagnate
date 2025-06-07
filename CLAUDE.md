# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Defense Magnate is a single-player, browser-playable real-time management simulation game where players run an arms manufacturing company in a fractured galactic warzone. The game operates in real-time with a 1 minute = 1 game hour time scale, allowing players to watch their production lines progress naturally. The game is built as a web application with no backend, using browser localStorage for saves and compressed string codes for save portability.

**Current Status**: Manufacturing v1 Pass Complete - Core manufacturing system with tag-based equipment constraints fully implemented and functional.

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
│   ├── ManufacturingContentEnhanced.tsx    # Main manufacturing UI
│   ├── EquipmentPanel.tsx                   # Equipment management
│   ├── ProductionOverviewPanel.tsx          # Production monitoring
│   └── ConstraintsTooltip.tsx               # Constraint explanations
├── constants/           # Game enums and constants
│   └── enums.ts        # All game enums consolidated
├── data/               # Static game data and equipment definitions
│   ├── equipment.ts    # Equipment database and starter sets
│   ├── materials.ts    # Material definitions
│   └── productHelpers.ts # Product manufacturing data
├── state/              # Zustand game state management
│   └── gameStoreWithEquipment.ts # Main game store with equipment
├── systems/            # Core game logic
│   └── productionScheduler.ts # Real-time production scheduling
├── types/              # TypeScript type definitions (barrel exported)
│   ├── index.ts        # Barrel export for all types
│   ├── game.ts         # High-level game state composition
│   ├── equipment.ts    # Equipment and tag system types
│   ├── manufacturing.ts # Manufacturing process types
│   ├── productionJob.ts # Production job queue types
│   └── future.ts       # Type definitions for planned features
├── utils/              # Utility functions and formatters
│   ├── formatters.ts   # Display formatting functions
│   └── gameClock.ts    # Real-time game clock
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

## Core Architecture (Manufacturing v1 Complete)

### Game State Structure
The game uses a centralized state pattern with Zustand. The core `GameState` interface in `types/game.ts` includes:
- `gameTime`: Real-time clock with pause/speed controls (1 real minute = 1 game hour)
- `facilities`: Production facilities with equipment and real-time job queues
- `materials`: Raw materials and component inventory with storage limits
- `equipmentDatabase`: Global equipment definitions and market
- `research`: Future R&D projects and technology trees
- `contracts`: Future contract system and customer relations
- `ui`: Player preferences and interface state

### Tag-Based Manufacturing System
- **Equipment Tags**: Each equipment provides specific capabilities (e.g., "Turning 8%", "Surface 2m²")
- **Production Constraints**: Manufacturing steps require specific tag combinations  
- **Dynamic Capacity**: Equipment capacity calculated automatically from installed tools
- **Quality & Efficiency**: Equipment condition affects production speed and output quality
- **Real-Time Scheduling**: Production jobs allocated to equipment with bottleneck analysis

### Production Job Queue System
- **Job Scheduling**: Priority-based job queue with equipment allocation
- **Step Progression**: Multi-step manufacturing with real-time resource management
- **Constraint Analysis**: Real-time feedback on why production can't start
- **Bottleneck Tracking**: Identifies which equipment types are limiting production

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

### Save System
- Autosave to browser `localStorage`
- Manual export/import via compressed base64 strings ("Command Codes")
- No backend dependencies - fully client-side

### UI Design
- **ASCII Terminal Aesthetic**: Retro sci-fi styling with monospace fonts
- **Layout**: Left panel (tabs), Center (active content), Right (resources/equipment)
- **Color Scheme**: Teal, gray, black with semantic coloring for status
- **Real-Time Feedback**: Live constraint analysis and production monitoring
- **Tooltip System**: Detailed explanations of equipment requirements

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

**✅ Manufacturing v1 Complete**: 
- Tag-based equipment constraints working
- Real-time production job scheduling
- Multi-step manufacturing processes  
- Dynamic equipment capacity calculation
- Comprehensive constraint analysis and UI feedback
- Starter garage with full equipment and materials for testing

**🚧 Next Priority**: Materials & Supply Chain system

## Testing Setup

The game starts with a fully equipped garage containing:
- Basic hand tools (manipulation capability)
- Workbench (surface and holding capability)  
- Storage shelving (storage capacity)
- Manual lathe (turning operations)
- Manual mill (milling and drilling operations)
- Starter materials for all manufacturing methods

Players can immediately test:
- **Forge Basic Sidearm**: Make pristine weapons from steel + plastic
- **Restore Basic Sidearm**: Repair damaged weapons with spare parts  
- **Cobble Basic Sidearm**: Assemble junk-quality weapons from scrap