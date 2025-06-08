# Component-Driven Manufacturing System Design

## Overview

The component-driven manufacturing system replaces the current "raw materials to finished product" approach with a realistic multi-stage process that creates intermediate components. This system enables sophisticated salvage operations, granular repair mechanics, and true manufacturing flexibility while maintaining backwards compatibility.

## Core Concept

### Current System Limitations
The existing manufacturing system has an unrealistic "black box" approach where raw materials (steel, plastic) are consumed at the start of a job and a finished product emerges after all operations complete. This creates several problems:

- **Unrealistic Material Flow**: You can't "un-mill" shaped components back into raw steel
- **No Job Cancellation**: Canceling mid-process loses all invested materials
- **Limited Salvage Options**: Disassembly would unrealistically return raw materials
- **No Granular Repair**: Can't identify and replace specific damaged components

### New Component-Based Approach
Manufacturing becomes a series of transformative operations where each step consumes specific inputs and produces specific outputs. Raw materials are shaped into components, components are assembled into sub-assemblies, and sub-assemblies are combined into finished products.

**Example Flow**: Steel → Rough Components → Precision Components → Assembly → Casing → Final Product

## System Architecture

### Material Reservation vs Consumption
Operations now distinguish between **reserving** materials at job start and **consuming** them during specific operations:

- **Reservation**: Materials are locked for the job but remain in inventory until needed
- **Consumption**: Materials are actually used and removed from inventory during specific operations
- **Production**: Operations can create new items that are added to inventory

This allows jobs to be canceled mid-process with minimal material loss and enables more realistic material flow tracking.

### Component Hierarchy
Products are built through a hierarchical component system:

**Primary Components**: Direct transformations of raw materials
- Raw steel becomes rough components through milling operations
- Raw plastic becomes shaped casings through molding operations

**Secondary Components**: Refinements of primary components
- Rough components become precision components through turning/machining
- Multiple components combine into assemblies

**Final Products**: Assembly of secondary components
- Assemblies and casings combine into finished products
- Quality control operations verify and finalize products

### Technology Classification
Components are tagged with technology levels to prevent inappropriate mixing:

- **[low-tech]**: Basic mechanical components for simple weapons and tools
- **[electronics]**: Circuit boards, sensors, and electronic components (future)
- **[high-tech]**: Advanced materials and precision assemblies (future)

This prevents unrealistic scenarios like using precision weapon components in hover vehicles or mixing incompatible technology levels.

## Detailed Operation Types

### Transformation Operations
Convert raw materials into shaped components:

- **Milling Operations**: Convert steel into rough mechanical components
- **Turning Operations**: Refine rough components into precision parts
- **Molding Operations**: Shape plastic into casings and housings

### Assembly Operations
Combine multiple components into sub-assemblies:

- **Component Assembly**: Combine rough and precision components into mechanical assemblies
- **Final Assembly**: Integrate assemblies with casings and external components
- **Quality Control**: Validate and finalize assembled products

### Hybrid Operations
Some operations both consume and produce simultaneously:

- **Precision Machining**: Consumes rough components, produces precision components
- **Sub-Assembly**: Consumes multiple component types, produces integrated assemblies

## Manufacturing Method Structure

### Operation Definition
Each operation specifies exactly what it reserves, consumes, and produces:

**Material Reservation**: Items locked at job start but not consumed until needed
**Material Consumption**: Items actually used and removed during this specific operation
**Output Production**: New items created and added to inventory by this operation

### Sequential Dependency
Operations execute in strict sequence with each step dependent on the outputs of previous steps:

- Operation 1: Reserve steel → Mill rough components
- Operation 2: Consume rough components → Machine precision components  
- Operation 3: Consume rough + precision components → Assemble mechanism
- Operation 4: Reserve plastic → Mold casing
- Operation 5: Consume assembly + casing → Final product

### Flexible Sourcing
Operations can consume components regardless of their origin:

- Newly manufactured components from earlier operations
- Components salvaged from disassembled products
- Components purchased directly from markets
- Components recovered from failed or canceled jobs

## Basic Sidearm Example

### Traditional Method (Current)
6 operations consuming steel and plastic at start, producing finished sidearm after 135 minutes with no intermediate products or cancellation options.

### Component-Based Method (New)
6 operations with material reservation, progressive consumption, and intermediate component production:

**Material Preparation**: Reserve 1 steel, 0.3 plastic for the job
**Rough Milling**: Consume 1 steel → Produce 10 rough components [rough] [low-tech]
**Precision Turning**: Consume 5 rough components → Produce 5 precision components [precision] [low-tech]
**Component Assembly**: Consume 5 rough + 5 precision components → Produce 1 basic sidearm assembly [assembly] [low-tech]
**Casing Formation**: Consume 0.3 plastic → Produce 1 plastic casing [casing] [low-tech]
**Final Assembly**: Consume 1 assembly + 1 casing → Produce 1 basic sidearm [forged] [low-tech]

### Cancellation Recovery
Jobs can be canceled at any point with recovery of:

- **After Rough Milling**: 10 rough components + 0.3 plastic reserved
- **After Precision Turning**: 5 precision components + 0.3 plastic reserved
- **After Component Assembly**: 1 assembly + 0.3 plastic reserved
- **After Casing Formation**: 1 assembly + 1 casing

## Job State Management

### Enhanced Job Tracking
Jobs must track significantly more state information:

**Reserved Materials**: Items locked for this job but not yet consumed
**Intermediate Products**: Components created during manufacturing process
**Operation Progress**: Which operations have completed and what they produced
**Material Availability**: Real-time checking of component availability for upcoming operations

### Material Flow Validation
Before starting each operation, the system validates:

- **Input Availability**: Required components exist in inventory or were produced by previous operations
- **Equipment Availability**: Necessary tools and workspace are available
- **Reservation Integrity**: Reserved materials haven't been consumed by other processes

### Cross-Job Component Sharing
Components produced by one job can be consumed by other jobs:

- **Component Stockpiling**: Manufacture extra rough components for future use
- **Batch Efficiency**: Produce large quantities of components, then assemble multiple products
- **Supply Chain Optimization**: Balance component production with assembly demand

## Inventory Integration

### Component Storage
All intermediate components are stored in the facility inventory system using the existing tag-based organization:

**Rough Components**: Grouped by technology level ([low-tech], [electronics], etc.)
**Precision Components**: Organized by complexity and application
**Assemblies**: Categorized by product type and completion state
**Casings**: Classified by material and form factor

### Component Sourcing
Manufacturing operations can source components from multiple origins:

- **Job Output**: Components produced by earlier operations in the same job
- **Inventory Stock**: Components available in facility storage
- **Purchased Components**: Components bought directly from markets (future)
- **Salvaged Components**: Components recovered from disassembly operations

### Quality Inheritance
Components inherit quality characteristics from their source materials and manufacturing processes:

- **Raw Material Quality**: Starting purity/grade affects component quality
- **Tool Quality**: Equipment condition impacts precision and finish
- **Process Quality**: Operation success rate affects final component grade

## Disassembly Foundation

### Reversible Manufacturing
The component system naturally enables disassembly operations:

**Product Disassembly**: Finished products can be broken down into their constituent assemblies and casings
**Assembly Disassembly**: Sub-assemblies can be separated into individual components
**Component Recovery**: Damaged components can be salvaged for raw materials

### Disassembly Yield
Different disassembly methods provide different recovery rates:

**Hand Tool Disassembly**: Slow but careful, high component recovery rate
**Power Tool Disassembly**: Fast but aggressive, moderate component recovery
**Specialized Equipment**: Optimal speed and recovery for specific component types

### Condition-Based Recovery
Component condition affects disassembly yield:

**Pristine Components**: Near-perfect recovery of all sub-components
**Functional Components**: Good recovery with some material loss
**Damaged Components**: Partial recovery, some components become scrap
**Junk Components**: Minimal recovery, mostly scrap material

## Business Model Implications

### Salvage Operations
The component system enables entirely new business models:

**Component Harvesting**: Buy damaged products specifically for component recovery
**Selective Disassembly**: Extract valuable precision components while recycling rough components
**Component Trading**: Specialize in producing specific component types for other manufacturers

### Repair Services
Granular component tracking enables sophisticated repair operations:

**Diagnostic Disassembly**: Identify which specific components need replacement
**Selective Replacement**: Replace only damaged components while retaining functional ones
**Upgrade Integration**: Replace low-tech components with high-tech equivalents

### Manufacturing Flexibility
Component stockpiling enables responsive production:

**Just-In-Time Assembly**: Maintain component inventory for rapid product assembly
**Custom Configuration**: Mix and match components for specialized products
**Batch Optimization**: Balance component production runs with assembly demand

## Implementation Phases

### Phase 1: Core System
Implement basic component operations and job state tracking without disrupting existing manufacturing methods.

### Phase 2: Component Items
Add intermediate component items to the inventory system with appropriate tags and categorization.

### Phase 3: Enhanced Methods
Create component-based versions of existing manufacturing methods alongside traditional methods.

### Phase 4: UI Integration
Update manufacturing interface to display component flow, reservation status, and intermediate product creation.

### Phase 5: Migration Tools
Provide tools to convert existing manufacturing methods and inventory to the component system.

## Future Expansion

### Technology Progression
The component system naturally supports technological advancement:

**Electronics Integration**: [electronics] components for advanced weapons and equipment
**Material Sciences**: [composite] and [exotic] material components for cutting-edge products
**Automation Systems**: [automated] components that reduce manual labor requirements

### Cross-Product Components
Components can be designed for use across multiple product types:

**Universal Rough Components**: Basic mechanical parts used in weapons, tools, and vehicles
**Specialized Precision Components**: Highly specific parts for particular applications
**Modular Assemblies**: Sub-systems that can be integrated into different final products

### Quality Management
Future expansion can add sophisticated quality tracking:

**Component Quality Inheritance**: Track quality through the entire manufacturing chain
**Quality Control Operations**: Inspect and grade components at each stage
**Quality-Based Pricing**: Component value determined by precision and condition

## System Benefits

### Realistic Manufacturing
The component system reflects actual manufacturing processes where raw materials are progressively shaped and assembled into finished products.

### Strategic Depth
Players must balance component production, inventory management, and assembly scheduling to optimize their manufacturing operations.

### Emergent Complexity
The interaction between component sourcing, quality inheritance, and manufacturing flexibility creates rich strategic decision-making.

### Scalable Design
The component system can accommodate future expansion in products, materials, and manufacturing complexity without fundamental architectural changes.

### Player Agency
Job cancellation and component recovery give players meaningful control over their manufacturing investments and risk management.