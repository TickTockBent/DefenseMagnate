# Defense Magnate - Claude Dev Workflow & Style Guide

## Purpose

This document defines the workflow and style guidelines for Claude when acting as an autonomous development agent for *Defense Magnate*. It is optimized for incremental, modular programming with consistent architecture, readable code, and extensibility in mind.

---

## High-Level Workflow

1. **Task Decomposition**

   * Begin each session by breaking the objective into clearly scoped subtasks.
   * Suggest a logical build order and request confirmation before proceeding.

2. **Single Responsibility Focus**

   * Each code generation step should address *one* component, feature, or function.
   * Avoid mixing UI and logic unless it's a tightly coupled behavior.

3. **State-First Development**

   * Define the shape of the global `gameState` object early.
   * All features should interact with this state via centralized update logic.

4. **Progressive Enhancement**

   * Stub incomplete systems with placeholder data or mock logic.
   * Wrap complex functionality behind interfaces or modular handlers for future refinement.

5. **Validation and Integration**

   * After generating a module or component, summarize:

     * What it does
     * How it connects to existing systems
     * Any assumptions made

---

## Code Style Guidelines

### General

* Prefer **clarity** over cleverness
* Keep code **modular and composable**
* Include inline comments only where necessary — prefer self-documenting code

### File/Folder Conventions

```
/src
  /components       → UI panels and controls
  /state            → Zustand store(s)
  /systems          → Game logic modules (e.g. researchSystem.ts)
  /data             → Static JSON (tech trees, contracts, materials)
  /utils            → Encoders, helpers, date/math tools
  App.tsx           → Layout shell
```

### React

* Functional components only
* Avoid unnecessary hooks; prefer derived state from `gameState`
* Props should be clearly typed and minimal

### Zustand

* Single store unless complexity demands splitting
* Use selectors and actions — no direct state mutation outside store

### UI Styling (Tailwind)

* Use Tailwind utility classes exclusively
* Follow structure: layout first → spacing → colors → typography
* Prefer `flex`, `grid`, and `gap` over nested divs

### Game State

```ts
interface GameState {
  resources: Record<string, number>;
  research: {
    current: string | null;
    completed: string[];
  };
  factories: Factory[];
  contracts: Contract[];
  turn: number;
}
```

---

## Save System Rules

* Use `localStorage` for autosaves
* Implement manual save/export as compressed base64 string
* Implement manual import that validates and parses the string into `gameState`

---

## Claude Behavioral Prompts

* Always **explain what you’re about to build** and **why**
* Ask before integrating major features
* Avoid speculative features unless explicitly requested
* Always include code **and** brief implementation summary
* Use markdown formatting when presenting code

---

## Deliverables Format

For each step, Claude should return:

1. Summary of what is being built
2. Code block(s) with full implementations
3. Explanation of any interactions with other modules or future stubs

Example:

> "This component displays the current list of contracts and allows the user to accept them. It pulls from the Zustand store and dispatches `acceptContract`."

---

## Versioning & Changes

If the scope or structure of the project changes, this guide should be updated accordingly. Claude may suggest updates to this document if patterns shift during development.

---

## Final Note

Claude is expected to operate as a helpful, modular assistant — not an over-eager architect. Simplicity and forward compatibility are more valuable than sweeping abstractions or deep nesting. The goal is a clean, extensible codebase that can grow with player feedback and future content.
