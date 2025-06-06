# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Defense Magnate is a single-player, browser-playable management simulation game where players run an arms manufacturing company in a fractured galactic warzone. The game is built as a web application with no backend, using browser localStorage for saves and compressed string codes for save portability.

## Technology Stack

- **Frontend**: React with functional components
- **State Management**: Zustand (single store pattern)
- **Styling**: TailwindCSS with ASCII-based UI design
- **Build System**: Vite
- **Optional**: PixiJS for starmap/animations
- **Deployment**: GitHub Pages/Netlify/Vercel
- **Future Steam Release**: Electron or Tauri wrapper

## Project Structure

```
/src
  /components       → UI panels and controls
  /state            → Zustand store(s)
  /systems          → Game logic modules (e.g. researchSystem.ts)
  /data             → Static JSON (tech trees, contracts, materials)
  /utils            → Encoders, helpers, date/math tools
  App.tsx           → Layout shell
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

## Core Architecture

### Game State Structure
The game uses a centralized state pattern with Zustand. The core `GameState` interface includes:
- `resources`: Material and component inventory
- `research`: Current and completed R&D projects
- `factories`: Production facilities and their queues
- `contracts`: Active and available contracts
- `turn`: Current game turn/tick

### Save System
- Autosave to browser `localStorage`
- Manual export/import via compressed base64 strings ("Command Codes")
- No backend dependencies - fully client-side

### UI Design
- Fully ASCII-based terminal aesthetic using monospace fonts
- Layout: Left panel (tabs), Center (active content), Right (resources/map)
- Color scheme: Teal, gray, black with semantic coloring
- All UI elements rendered as text characters and ASCII art

## Development Workflow

1. **Task Decomposition**: Break objectives into clearly scoped subtasks
2. **Single Responsibility**: Each code generation addresses one component/feature
3. **State-First Development**: Define gameState shape early
4. **Progressive Enhancement**: Use stubs and mocks for incomplete systems
5. **Modular Code**: Keep systems composable and loosely coupled

## Key Guidelines

- Prefer clarity over cleverness in code
- Use functional React components exclusively
- Style exclusively with Tailwind utility classes
- Avoid direct state mutation outside Zustand store
- Keep UI components in `<pre>` or whitespace-pre for ASCII layout
- Follow the ASCII UI patterns defined in docs/ascii-style-guide.md