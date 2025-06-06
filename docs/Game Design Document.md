# Defense Magnate - Game Design Document

## Overview

*Defense Magnate* is a single-player, browser-playable management simulation game set in a fractured galactic warzone. The player assumes the role of CEO of an arms manufacturing company, navigating the complex demands of industrial production, political contracts, shifting supply chains, and technological progress. The tone is hard-industrial with a retrofuturistic interface and emergent consequences.

The game will launch as a web application with no backend, using clever encoding for save data and a modular interface for managing different systems. A Steam release may follow using Electron or Tauri.

---

## Core Gameplay Features

### 1. **Industrial Management Loop**

* Players manage R\&D, manufacturing, and contract fulfillment.
* Start with basic weapons (e.g., phasers) and scale to building modular capital ships.
* Use production facilities with customizable efficiency, retooling costs, and outputs.

### 2. **R\&D System**

* Allocate points or resources to tech trees (weapons, sensors, hulls, power systems).
* Progress unlocks new schematics and production options.
* Research speed and cost are influenced by facility investment and tech alignment.

### 3. **Dynamic Contract System**

* Compete for military and corporate contracts with faction-specific needs.
* Contracts include deadlines, budget caps, and custom loadouts.
* Fulfilling a contract may have ripple effects (e.g., attacking your own suppliers).

### 4. **Supply Chain Mechanics**

* Materials like space-titanium, quantum plastics, and antimatter sourced from galactic nodes.
* Supply chains can be disrupted by war, piracy, or your own deliveries.
* Players may scout new suppliers or develop substitute materials through R\&D.

### 5. **Starmap Incident System**

* Right panel features a starmap showing:

  * Conflicts (⚔️), pirate activity (☠️), disruptions (⚠️), and scouting ops (👁️)
* Strategic decisions emerge from interpreting and reacting to these map events.

### 6. **Save System & Portability**

* Game state saved to browser localStorage
* Manual export/import available via compressed string code ("Command Codes")
* Supports offline play and infinite scalability

### 7. **Optional Features for Expansion**

* Reputation system (greedy vs principled)
* Faction favor unlocks exclusive tech or black market access
* Factory sabotage and espionage
* Seasonal resets with preserved legacy elements (for replayability)

---

## UI Design

### Layout

* **Left Panel**: Tabbed vertical UI with sections:

  * R\&D
  * Manufacturing
  * Contracts
  * Supply Lines
  * Logistics (future)

* **Right Panel**: Split horizontal display

  * **Top**: Resource Inventory (materials, component stock, labor units)
  * **Bottom**: Map Viewer (space or planetary)

### Style

* Retro-industrial interface
* Teal, gray, and black theme with clear fonts and iconography
* Animated overlays for system access ("\[ACCESSING CONTRACT TERMINAL...]")
* Modular cards/panels for each system view

---

## Technology Stack

### Frontend

* **React** (UI + state handling with Zustand or Jotai)
* **TailwindCSS** (UI styling)
* **Vite** (build system)
* **PixiJS** (optional: starmap or animated component viewer)

### Save System

* Browser `localStorage` for autosave
* Manual export/import with compressed save string (e.g., base64 + LZ-string)
* Potential future support for IPFS uploads or `.save` file download

### Deployment

* **GitHub Pages**, **Netlify**, or **Vercel** for web version
* **Electron** or **Tauri** wrapper for Steam release
* Optional Steamworks SDK integration (achievements, cloud saves)

---

## Development Roadmap (Phases)

### Phase 1: MVP Core Loop

* Static tech tree with 3 unlockable items
* One factory type with editable production output
* A handful of sample materials and one initial supplier
* 2–3 starter contracts with simple requirements and deadlines
* A basic UI layout with tabbed navigation (R\&D, Manufacturing, Contracts)
* A working save/load system using localStorage
* Export/import functionality with compressed save strings (Command Codes)
* Simulated turn-timer or manual "next turn" button to drive progression

### Phase 2: Map + Incidents

* Implement starmap with simple icons and tooltips
* Add dynamic supply disruptions and newsfeed
* Enable scouting mechanic

### Phase 3: Reactive World

* Tie player deliveries to incidents
* Simulate simple war dynamics between 2-3 factions
* Introduce supplier switching and material substitutes

### Phase 4: Steam Readiness

* Wrap game in Electron or Tauri
* Add achievements and file-based save support
* Prepare for marketing and distribution

---

## Summary

*Defense Magnate* blends systemic strategy with narrative emergence, giving players the thrill of running a war-fueling megacorp in an unstable galaxy. Its browser-first, backendless design ensures accessibility and modifiability, while retaining enough depth to expand into a premium platform release. Every contract fulfilled, every ship deployed, and every decision made echoes through the war-torn stars.
