# Facility Game Object Definition

## Core Properties

### Identity & Classification
- `id`: Unique identifier
- `name`: Display name (e.g., "Main Garage", "Factory Building A")
- `type`: Facility type enum (garage_workshop, machine_shop, electronics_lab, etc.)
- `description`: Flavor text

### Physical Constraints
- `production_lines`: Current number of available production lines
- `max_item_size`: Enum (tiny, small, medium, large, huge) - largest item this facility can produce
- `storage_capacity`: Total material/component storage units
- `floor_space`: Available space for upgrades (some upgrades consume space)

### Economic Data
- `purchase_cost`: What it cost to acquire this facility
- `operating_cost_per_day`: Daily maintenance/utilities
- `current_value`: Resale value if sold

## Capability System

### Traits Array
A list of special capabilities this facility possesses:
- `clean_room`: Can build electronics requiring sterile environment
- `heavy_lifting`: Can handle items above normal weight limits  
- `precision_machining`: Can manufacture high-tolerance components
- `hazmat_certified`: Can work with dangerous materials
- `automated_assembly`: Reduced labor requirements
- `quality_control`: Can detect/prevent defects

### Material Processing
- `can_refurbish`: Array of material types this facility can restore/reuse
- `manufacturing_bonus`: Multipliers for speed/quality/cost for different item categories

## Upgrade System

### Installed Upgrades
- `upgrades`: Array of upgrade objects currently installed
  - Each upgrade has: `id`, `name`, `effects`, `space_used`, `purchase_cost`, `install_date`

### Upgrade Effects Structure
- `production_line_bonus`: Additional production lines granted
- `storage_bonus`: Additional storage capacity
- `traits_granted`: New traits added to the facility
- `size_limit_increase`: Allows larger items to be produced
- `speed_multiplier`: Production speed modification
- `quality_bonus`: Quality improvement percentage
- `labor_cost_modifier`: Labor efficiency change

## Operational State

### Current Activity
- `active_production`: Array of what's currently being produced on each line
- `current_storage`: Inventory of materials/components stored here
- `pending_upgrades`: Upgrades purchased but not yet installed

### Condition & Status
- `condition`: Current state (operational, maintenance_needed, damaged, offline)
- `utilization_rate`: How busy the facility is (affects efficiency)
- `last_maintenance`: When facility was last serviced

## Validation Rules

The object needs to enforce:
- Cannot exceed max production lines
- Cannot store more than storage capacity
- Cannot produce items larger than max size unless specific traits allow it
- Cannot install upgrades if insufficient floor space
- Certain upgrades have prerequisite traits or other upgrades

## Design Goals

This structure allows us to:
1. **Start simple** - basic facilities with minimal upgrades
2. **Scale complexity** - add more traits and upgrade types over time  
3. **Enforce constraints** - physical and economic limitations create meaningful choices
4. **Support emergent gameplay** - players can customize facilities in unexpected ways