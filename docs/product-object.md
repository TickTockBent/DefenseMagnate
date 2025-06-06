# Product Game Object Definition

## Core Properties

### Identity & Classification
- `id`: Unique identifier
- `name`: Display name (e.g., "Basic Sidearm", "M-47 Plasma Rifle")
- `category`: Product type enum (handheld_weapon, vehicle_weapon, electronics, vehicle, ship_component, etc.)
- `description`: Marketing/technical description
- `military_classification`: Security level (civilian, restricted, military, classified)

### Physical Requirements
- `size_class`: Physical size enum (tiny, small, medium, large, huge)
- `weight`: Mass in kg (affects shipping, handling requirements)
- `floor_space_required`: Production space needed per unit
- `complexity_rating`: 1-10 scale affecting production time and error rates

### Economic Data
- `base_material_cost`: Raw material expense per unit
- `base_labor_hours`: Standard human-hours required
- `market_price`: Current selling price
- `development_cost`: One-time R&D investment to unlock this product
- `profit_margin`: Calculated field (market_price - total_production_cost)

## Production Requirements

### Required Tools & Equipment
- `required_tools`: Array of tool/equipment types needed
  - `hand_tools`: Basic assembly (screwdrivers, wrenches, etc.)
  - `power_tools`: Drills, grinders, welders
  - `precision_machinery`: Lathes, mills, measurement equipment
  - `automated_systems`: Robotic assembly, CNC machines
  - `specialized_equipment`: Clean rooms, pressure chambers, testing rigs

### Required Facility Traits
- `required_traits`: Array of facility capabilities needed
  - `clean_room`: Sterile environment
  - `heavy_lifting`: Overhead cranes, forklifts
  - `precision_machining`: High-tolerance manufacturing
  - `hazmat_certified`: Dangerous material handling
  - `quality_control`: Testing and inspection capability

### Material Dependencies
- `materials_required`: Array of input materials and quantities
  - `material_id`: Reference to material type
  - `quantity_per_unit`: How much needed per product
  - `substitutable`: Whether alternatives can be used
  - `critical_path`: Whether this material blocks production if unavailable

## Production Efficiency Modifiers

### Tool Efficiency Matrix
- `tool_efficiency_bonus`: Multipliers based on available tools
  - Having required tools: 1.0x (baseline)
  - Missing required tools: 0.3x (improvised production)
  - Having superior tools: 1.5x (automated systems vs manual)

### Complexity Scaling
- `complexity_penalties`: How complexity affects production
  - `error_rate_base`: Base defect chance (scales with complexity)
  - `learning_curve`: Time reduction as workers gain experience
  - `quality_sensitivity`: How much tool/facility quality affects output

### Batch Size Effects
- `optimal_batch_size`: Most efficient production quantity
- `setup_time`: Fixed time to configure production line
- `economies_of_scale`: Efficiency gains with larger batches

## Quality Control

### Quality Metrics
- `quality_rating`: 1-100 scale representing build quality
- `reliability_factor`: Expected operational lifespan
- `defect_types`: Possible failure modes
  - `cosmetic`: Doesn't affect function
  - `performance`: Reduced effectiveness
  - `critical`: Complete failure/safety hazard

### Quality Dependencies
- `quality_factors`: What affects final product quality
  - `worker_skill_level`: Experienced vs novice workers
  - `tool_precision`: Quality of manufacturing equipment
  - `material_grade`: Input material quality
  - `production_speed`: Rush jobs vs careful work
  - `facility_condition`: Well-maintained vs worn equipment

## Market & Contract Data

### Sales Information
- `demand_volatility`: How much market price fluctuates
- `seasonal_demand`: Cyclical market patterns
- `competing_products`: Alternative products that serve similar roles
- `target_customers`: Who typically buys this product (military, corporate, civilian)

### Contract Compatibility
- `contract_categories`: Types of contracts this product can fulfill
- `customization_options`: Available modifications or variants
- `delivery_constraints`: Special shipping/handling requirements
- `warranty_period`: Support obligation after delivery

## Research & Development

### Tech Tree Position
- `prerequisite_tech`: Technologies needed to unlock this product
- `unlocks_tech`: Technologies this product enables
- `research_complexity`: Difficulty/cost to develop
- `innovation_potential`: Likelihood of breakthrough improvements

### Upgrade Paths
- `variant_products`: Enhanced versions of this base product
- `modular_components`: Interchangeable parts or add-ons
- `scaling_options`: Larger/smaller versions of the same design

## Design Goals

This structure allows us to:
1. **Create production puzzles** - players must acquire the right tools and facilities
2. **Support economic gameplay** - cost/benefit analysis drives decisions
3. **Enable quality differentiation** - rushed vs careful production has consequences
4. **Scale complexity naturally** - simple products are forgiving, complex ones demand investment
5. **Support emergent strategies** - players can specialize in different market segments