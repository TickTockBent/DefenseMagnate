# ASCII UI Component Guide for Defense Magnate

This guide defines conventions and reusable layout patterns for building a fully ASCII-based user interface in React using monospace fonts, TailwindCSS, and semantic component structure. The goal is to create a readable, terminal-like interface with no graphical assets, styled entirely through text and layout.

---

## Font & Layout Rules

* Use a fixed-width monospace font (e.g. `font-mono` in Tailwind)
* Wrap major components in `<pre>` or `<div className="whitespace-pre">`
* Align all visual elements via spacing and characters — avoid CSS positioning for layout
* Use `text-green-400`, `text-gray-300`, `text-red-500`, etc. for visual signaling

---

## Global Layout

```
+-----------------------------------------------------------+
| [ DEFENSE MAGNATE COMMAND TERMINAL ]                      |
+--------------------+-------------------------------+------+
| [R&D] [MFG] [CTR]  | Current Tab Content           | RES  |
|                    |                               | MAP  |
|                    |                               |      |
+--------------------+-------------------------------+------+
```

* Left: Vertical tab bar
* Center: Active tab content
* Right: Resource summary + incident map

---

## Common Component Patterns

### 1. **Resource Inventory**

```txt
[RESOURCES]
Titanium       :  1250
Plasma Coils   :   470
Quantum Fiber  :   130
Crew Units     :    45
```

### 2. **Progress Bars**

```txt
[====        ] 40%  (in-progress)
[##########  ] 90%  (nearly done)
[COMPLETE]           (100%)
```

### 3. **Research Tree View**

```txt
[R&D PROJECTS]
└── Ion Beams [====     ] 70%
    └── Adaptive Coupling [--        ]
        └── Power Grid Mk2 [LOCKED]
```

### 4. **Factory Output Queue**

```txt
[FACTORY #1: ORBITAL LINE]
Status: Online (87% efficiency)
Queue:
  1. Railgun Mount         [###       ] ETA: 2 turns
  2. Ion Capacitor         [          ] Pending
```

### 5. **Contract Listings**

```txt
[ACTIVE CONTRACTS]
> Federation (Req: Ion Weapons)   PAY: 12,500cr  DUE: T+4
> Red Suns (Req: Hull Panels)     PAY:  8,000cr  DUE: T+3

[AVAILABLE CONTRACTS]
- Thalassian Pact: Needs Sensor Arrays (Mid Risk)
- Vek Consortium: Wants Rapidfire Cannons (High Risk, High Pay)
```

### 6. **Incident Map (Grid-Based)**

```txt
[STARMAP: SECTOR 3C]
┌────────────────────────┐
│ .  .  ⚔️  .  ☠️  .    │
│ 👁️  .  .   ⚠️  .  .   │
│ .  .  .   .   .  ⚔️    │
└────────────────────────┘
LEGEND: ⚔️ Conflict  ☠️ Pirates  ⚠️ Disruption  👁️ Scout
```

---

## Style Conventions

| Element         | Style Example          | Purpose                      |
| --------------- | ---------------------- | ---------------------------- |
| Labels          | `[R&D PROJECTS]`       | All-caps in brackets         |
| Values          | `Titanium : 1200`      | Colon-aligned for clarity    |
| Highlight Terms | `> CONTRACT` or `>`    | Use `>` to mark active focus |
| Progress        | `[####      ] 40%`     | ASCII bars with brackets     |
| Nested Trees    | `└──` and indentations | Clear hierarchy in lists     |

---

## React Rendering Notes

* Render each line of a block as a single string in an array using `.map()`
* Pad using `.padEnd()` / `.padStart()` for alignment
* Consider using a simple layout engine or helper functions to format columns
* Avoid dynamic height — reserve vertical space to minimize UI shifting

---

## Optional Enhancements

* Animate progress bars with timers
* Allow panel expansion/collapse via keyboard
* Add tooltips or descriptions on hover using Tailwind `relative` + `absolute` trick inside the fixed-width block
* Use color to reflect urgency (e.g. red for overdue, yellow for in-progress, green for done)

---

## Summary

The ASCII UI approach to *Defense Magnate* emphasizes clarity, speed, and a unique aesthetic identity. Combined with React’s modular component model, it supports rapid iteration and clean simulation-focused gameplay. Every element should feel like part of a control terminal — informative, concise, and reactive.
