# Machine Slot System V1 - Equipment Reservation Redesign

## Core Concept Change

**From**: Jobs reserve abstract equipment tags and block multiple machines
**To**: Jobs are placed into specific machine slots, one machine at a time

## How Jobs Flow Through Machines

### Step Granularity
Manufacturing steps are broken down to single-machine operations:

**Old Approach**:
```
Step 2: Precision Machining
- Requires: Turning 20% + Milling 15% simultaneously
- Blocks: Both lathe and mill for entire duration
```

**New Approach**:
```
Step 2a: Rough Milling (30 minutes)
- Requires: Milling 15%
- Uses: Mill only

Step 2b: Precision Turning (20 minutes)  
- Requires: Turning 20%
- Uses: Lathe only
```

### Job Scheduling Logic

1. **Job Ready**: Check if job needs next machine type
2. **Machine Available**: Find idle machine with required tags
3. **Slot Assignment**: Place job into machine's work slot
4. **Work Processing**: Machine handles timing and progress
5. **Job Release**: Machine releases completed job back to scheduler
6. **Next Step**: Job moves to next required machine or completes

## Visual Interface Design

### Equipment Status Display

Replace current equipment list with active machine status:

```
GARAGE WORKSHOP - Equipment Status

┌─ WORKBENCH A ────────────────────────────────────┐
│ [Job #47 - Sidearm Assembly]                     │
│ Progress: ████████████████░░░░ 80% (12min left)  │
│ Worker: Sarah (Unskilled)                        │
└───────────────────────────────────────────────────┘

┌─ MANUAL LATHE ───────────────────────────────────┐  
│ [Job #52 - Precision Turning]                    │
│ Progress: ██████░░░░░░░░░░░░░░ 30% (45min left)   │
│ Worker: Mike (Skilled Machinist)                 │
└───────────────────────────────────────────────────┘

┌─ UNDINE MILL ────────────────────────────────────┐
│ IDLE - Available for milling operations          │
│ Next in Queue: Job #49 - Component Prep          │
└───────────────────────────────────────────────────┘

┌─ HAND TOOLS ─────────────────────────────────────┐
│ IDLE - Available for basic operations            │
└───────────────────────────────────────────────────┘
```

### Job Flow Visualization

Show jobs moving between machines in real-time:

```
JOB #47: Basic Sidearm (Restore Method)
┌─ COMPLETED ─┐   ┌─ IN PROGRESS ─┐   ┌─ WAITING ─┐
│ Material    │ → │ Assembly       │ → │ Quality   │
│ Prep        │   │ (Workbench A)  │   │ Check     │
│ ✓ Done      │   │ 80% (12min)    │   │ Queued    │
└─────────────┘   └────────────────┘   └───────────┘

JOB #52: Basic Sidearm (Forge Method)  
┌─ COMPLETED ─┐   ┌─ IN PROGRESS ─┐   ┌─ WAITING ─┐   ┌─ WAITING ─┐
│ Material    │ → │ Precision      │ → │ Assembly  │ → │ Quality   │
│ Prep        │   │ (Manual Lathe) │   │ Queued    │   │ Check     │
│ ✓ Done      │   │ 30% (45min)    │   │           │   │ Queued    │
└─────────────┘   └────────────────┘   └───────────┘   └───────────┘
```

## Machine Queue Management

### Machine Capacity
Each machine type has limited work slots:
- **Basic Equipment**: 1 slot (workbench, hand tools)
- **Powered Equipment**: 1 slot (lathe, mill, drill press)
- **Advanced Equipment**: 2+ slots (automated systems, robotic cells)

### Queue Display
Show pending jobs waiting for each machine:

```
MANUAL LATHE - Work Queue
┌─ ACTIVE ─────────────────────────────────────────┐
│ Job #52 - Precision Turning (30% - 45min left)   │
└───────────────────────────────────────────────────┘
┌─ QUEUED ─────────────────────────────────────────┐
│ 1. Job #49 - Component Machining (Est: 25min)    │
│ 2. Job #51 - Frame Shaping (Est: 40min)          │
│ 3. Job #53 - Barrel Threading (Est: 15min)       │
└───────────────────────────────────────────────────┘
```

## Benefits of Machine-Slot System

### For Players
- **Clear Bottlenecks**: See exactly which machines are overloaded
- **Optimization Insight**: Identify which equipment to buy next
- **Workflow Understanding**: Watch jobs flow through realistic manufacturing process
- **Investment Planning**: Understand impact of additional machines vs upgrades

### For Implementation
- **Robust State Management**: Jobs are always "in" a specific machine or completed
- **No Phantom Reservations**: Can't double-book or lose equipment allocation
- **Natural Queuing**: Machines maintain their own job queues
- **Debugging Clarity**: Easy to trace where jobs are stuck or lost

## Player Experience Goals

### Workshop Feels Alive
- Jobs visibly moving between machines creates sense of active production
- Each machine shows real work happening with progress and timing
- Queue management becomes engaging puzzle of workflow optimization

### Clear Upgrade Path
- Bottleneck identification drives equipment purchase decisions
- Additional machines have immediate, visible impact on throughput
- Players develop intuition for facility layout and workflow design

### Authentic Manufacturing
- Reflects real-world job shop operations where work moves between stations
- Creates natural specialization as different machines handle different operations
- Builds toward industrial production concepts in later versions