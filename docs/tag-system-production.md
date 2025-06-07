# Tag-Based Equipment and Production System

## Core Concept

Production capacity is determined by equipment **tags** and **capacity values** rather than arbitrary production line limits. Each manufacturing step requires specific tags and consumes capacity, creating natural bottlenecks and strategic equipment decisions.

## Equipment Tag System

### Tag Categories

#### Physical Manipulation
- **Basic Manipulation** (X%): Hand tools, simple assembly work
- **Precision Manipulation** (X%): Fine detail work, delicate assembly
- **Heavy Manipulation** (X%): Moving large components, industrial assembly

#### Machining Operations
- **Turning** (X%): Lathe operations, cylindrical shaping
- **Milling** (X%): Material removal, precision cutting
- **Drilling** (X%): Hole creation, threading operations
- **Grinding** (X%): Surface finishing, precision tolerance work

#### Supporting Operations
- **Surface** (Xm²): Available work surface area
- **Storage** (Xm³): Material and component storage capacity
- **Holding** (boolean): Ability to secure work pieces (vises, clamps)
- **Powered** (boolean): Requires electricity, enables advanced operations
- **Manual** (boolean): Hand-operated, slower but no power costs
- **Automated** (boolean): Reduces labor requirements

#### Specialized Capabilities
- **Clean Room** (boolean): Sterile environment for electronics
- **Heavy Lifting** (boolean): Overhead cranes, material handling
- **Hazmat** (boolean): Dangerous material handling capability
- **Quality Control** (boolean): Testing and inspection equipment

### Equipment Examples

#### Basic Hand Tools
```
Hand Tools, Basic
- Tags: Basic Manipulation 10%, Manual
- Cost: $200
- Space: 0m² (stored in toolbox)
- Operating Cost: $0/day
```

#### Manual Lathe
```
Manual Lathe, Vintage
- Tags: Turning 8%, Manual, Surface 2m², Holding
- Cost: $1,500
- Space: 3m²
- Operating Cost: $2/day (maintenance)
```

#### CNC Machining Center
```
Haas VF-2 CNC Mill
- Tags: Milling 85%, Turning 45%, Drilling 90%, Automated, Powered, Surface 4m²
- Cost: $350,000
- Space: 25m²
- Operating Cost: $150/day (power, maintenance, tooling)
```

## Manufacturing Step Requirements

### Step Definition Structure
```
Manufacturing Step: {
  name: "Precision Machining"
  duration_percentage: 50
  materials: [{material: "machined_parts", quantity: 1}]
  required_tags: {
    "Turning": 20,      // Minimum 20% efficiency required
    "Milling": 15,      // Minimum 15% efficiency required  
    "Surface": 2,       // Requires 2m² work surface
    "Holding": true,    // Must have holding capability
    "Powered": true     // Must be powered equipment
  }
  failure_risk: 10
  labor_type: "skilled_machinist"
}
```

### Tag Requirement Types

#### Efficiency Requirements
- **Target Efficiency**: "Turning 20%" represents the optimal tool efficiency for this operation
- **Quality Degradation**: Lower efficiency tools can be used but with penalties
- **Capacity Consumption**: Each operation consumes the specified amount during production

#### Boolean Requirements
- **Must Have**: "Powered: true" means equipment must have the Powered tag
- **Exclusive Use**: "Holding: true" means the holding capacity is fully occupied

### Tool Quality vs Requirement System

#### Efficiency Deficit Calculation
```
Tool Quality Assessment:
Required: Turning 20%
Available: Turning 8% (manual lathe)
Efficiency Ratio: 8% ÷ 20% = 40% (60% deficit)

Penalty Applied: Severe penalties for 40% efficiency ratio
```

#### Penalty Tiers
Equipment efficiency relative to requirements determines production penalties:

**80-100% of requirement (Optimal Range)**:
- Time Penalty: None
- Quality Impact: None  
- Failure Risk: Base risk only

**60-79% of requirement (Suboptimal)**:
- Time Penalty: +50% duration
- Quality Reduction: -10% final quality
- Failure Risk: +5% per step

**40-59% of requirement (Poor Tools)**:
- Time Penalty: +100% duration (2x longer)
- Quality Reduction: -20% final quality
- Failure Risk: +10% per step

**20-39% of requirement (Inadequate Tools)**:
- Time Penalty: +200% duration (3x longer)
- Quality Reduction: -35% final quality
- Failure Risk: +25% per step

**Below 20% of requirement (Barely Functional)**:
- Time Penalty: +400% duration (5x longer)
- Quality Reduction: -50% final quality
- Failure Risk: +50% per step

#### Extreme Deficit Threshold
**35% Below Specification Rule**: When tool efficiency drops to 65% or less of requirements, failure rates become extremely high (25%+ per step), making production economically unviable but not impossible.

**Example Scenarios**:
```
Scenario 1 - Hand Tools vs Precision Work:
Required: Turning 25%, Milling 20%
Available: Hand Files 5%, Manual Drill 3%
Result: 20% efficiency ratio → 50% failure risk, 5x time penalty

Scenario 2 - Adequate but Not Optimal:
Required: Turning 25%, Milling 20%  
Available: Benchtop Lathe 18%, Mini Mill 15%
Result: 70% efficiency ratio → +50% time, -10% quality, manageable
```

## Production Job Queue and Scheduling System

### Core Concept: Step-Based Job Flow
Jobs progress through manufacturing steps sequentially, but multiple jobs can be in progress simultaneously at different steps. Equipment constraints only affect the specific steps that require them.

### Job State Management

#### Job Progress Tracking
```
Job Object: {
  id: "job_001"
  product: "basic_sidearm_forge"
  current_step: 2
  step_progress: 65%
  materials_consumed: ["steel", "plastic"]
  materials_pending: ["machined_parts"]
  worker_assigned: "worker_003"
  estimated_completion: "2 hours"
}
```

#### Step States
- **WAITING**: Job ready for this step, but equipment/workers unavailable
- **IN_PROGRESS**: Currently being worked on
- **COMPLETED**: Step finished, ready for next step
- **BLOCKED**: Missing materials or prerequisites

### Production Flow Example

**Scenario**: 3 Forge Basic Sidearm jobs in queue

```
Job #1: [✓ Material Prep] → [✓ Machining] → [● Assembly 40%] → [⏳ QC]
Job #2: [✓ Material Prep] → [⏳ WAITING: Machining] → [⏳ Queued] → [⏳ Queued]
Job #3: [● Material Prep 80%] → [⏳ Queued] → [⏳ Queued] → [⏳ Queued]

Equipment Status:
- Workbench A: Job #1 (Assembly step)
- Workbench B: Job #3 (Material Prep step)  
- Lathe/Mill: Job #1 (recently freed, Job #2 next in queue)
- Assembly Station: Available (Job #1 will use when Assembly completes)
```

### Step-Level Resource Allocation

#### Equipment Sharing Logic
Equipment is allocated per-step, not per-job:

```
Step Requirements Check:
Job #2 - Machining Step:
- Needs: Turning 20%, Milling 15%, Surface 2m², Holding
- Available: Turning 35%, Milling 25%, Surface 4m², Holding 2 slots
- Result: ✓ CAN START (equipment available)

Job #4 - Machining Step (if queued):
- Needs: Turning 20%, Milling 15%, Surface 2m², Holding  
- Available: Turning 15%, Milling 10%, Surface 2m², Holding 1 slot
- Result: ✗ BLOCKED (insufficient turning/milling capacity)
```

### Dynamic Scheduling Algorithm

#### Priority Queue Management
1. **Step Completion**: When a job finishes a step, immediately check next step availability
2. **Equipment Liberation**: When equipment frees up, assign to highest priority waiting job
3. **Material Availability**: Jobs can only start steps if required materials are available
4. **Worker Assignment**: Steps require appropriate skill levels and available workers

#### Intelligent Queuing
```
Scheduling Decision Matrix:
1. Can Job #2 start Machining? 
   - Equipment: ✓ Available
   - Materials: ✓ In inventory  
   - Worker: ✓ Skilled machinist free
   - Result: START IMMEDIATELY

2. Can Job #4 start Material Prep?
   - Equipment: ✓ Workbench available
   - Materials: ✓ Steel and plastic in stock
   - Worker: ✓ Unskilled worker available
   - Result: START (prep for future machining slot)
```

### Bottleneck Analysis and Optimization

#### Real-Time Bottleneck Identification
The system tracks which equipment types are consistently blocking production:

```
Bottleneck Report (Last 24 hours):
- Turning/Milling: 89% utilization (CRITICAL BOTTLENECK)
- Surface Area: 45% utilization  
- Storage: 12% utilization
- Assembly Tools: 34% utilization

Recommendation: Invest in second lathe to eliminate machining bottleneck
```

#### Production Optimization Strategies

**Pipeline Efficiency**:
- **Batch Material Prep**: Prepare materials for 5 jobs while machining is busy
- **Equipment Balancing**: Add equipment to eliminate bottlenecks
- **Worker Cross-Training**: Flexible workers can handle multiple step types

**Queue Management**:
- **Priority Contracts**: Rush orders jump the queue
- **Efficiency Batching**: Group similar operations to reduce setup time
- **Resource Forecasting**: Start material prep based on predicted equipment availability

### Multi-Method Production Coordination

#### Shared Resource Competition
Different manufacturing methods compete for the same equipment:

```
Active Production Mix:
- 2x Restore jobs: Using Basic Manipulation, Surface area
- 1x Forge job: Using Turning/Milling (exclusive), Surface area  
- 3x Cobble jobs: Using Storage, Surface area

Resource Allocation:
- Surface: 6m² total, 6m² in use (100% utilization)
- Turning/Milling: Exclusive to Forge method
- Storage: High demand from Cobble method
- Basic Manipulation: Shared between Restore and Cobble
```

#### Strategic Production Planning
Players must balance production methods based on:
- **Contract Mix**: Military orders need Forge quality, rebels accept Cobble
- **Material Availability**: Lots of damaged weapons favor Restore method
- **Equipment Investment**: Expensive machining equipment favors Forge focus
- **Market Timing**: Rush orders may require switching to faster methods

### Implementation Benefits

1. **Realistic Manufacturing**: Mirrors actual production floor constraints
2. **Strategic Depth**: Equipment investment decisions have clear impact
3. **Dynamic Optimization**: Players constantly optimize workflow and bottlenecks
4. **Visual Feedback**: Production board shows real-time job flow and equipment status
5. **Scalable Complexity**: System handles simple and complex manufacturing equally well
6. **Emergency Flexibility**: Can prioritize rush orders or adapt to supply disruptions

## Strategic Equipment Planning

### Capacity Balancing
Players must balance different tag capacities based on their production mix:

- **Surface-Heavy**: Restoration and assembly operations need lots of workbenches
- **Machining-Heavy**: Forging operations need multiple lathes and mills
- **Storage-Heavy**: Bulk cobbling operations need material storage

### Upgrade Pathways

#### Throughput Scaling
- **Add Equipment**: More lathes = more parallel machining operations
- **Upgrade Efficiency**: Better lathe (35% → 80%) = more operations per machine
- **Specialization**: Dedicated equipment for specific manufacturing methods

#### Capability Expansion  
- **New Tags**: Adding "Clean Room" unlocks electronics manufacturing
- **Size Scaling**: "Heavy Lifting" enables vehicle production
- **Quality Improvement**: "Precision Grinding" improves final product quality

### Economic Optimization
Equipment choices create trade-offs between:
- **Capital Investment** vs **Operating Costs**
- **Flexibility** vs **Efficiency** 
- **Throughput** vs **Quality**
- **Manual Labor** vs **Automation**

## Implementation Benefits

1. **Intuitive Constraints**: Players understand why they can't machine without a lathe
2. **Natural Progression**: Hand tools → power tools → automated systems feels authentic  
3. **Strategic Depth**: Equipment combinations create unique facility personalities
4. **Emergent Specialization**: Players develop manufacturing "builds" organically
5. **Scalable Complexity**: New tags and equipment types easily integrate
6. **Economic Realism**: Production capacity directly tied to capital investment