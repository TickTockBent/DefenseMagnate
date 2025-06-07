# Materials & Contracts System V1

## Implementation Status: ✅ COMPLETE

Both the Market and Contract systems have been fully implemented, providing the economic foundation for Defense Magnate's gameplay.

## Overview

Introduction of Market and Contracts tabs to create a functional economic loop where players source materials and fulfill customer contracts. This establishes the buy-manufacture-sell cycle that drives the core game progression.

## Tab Structure

### Market Tab
Central hub for all material acquisition:
- **Open Market** - Spot purchases from various suppliers
- **Suppliers** - Regular vendor relationships and bulk purchasing
- **Auctions** - Salvage lots, mystery containers, competitive bidding
- **Price Tracking** - Historical data and market trends (future)

### Contracts Tab  
Management of ongoing business relationships:
- **Incoming Contracts** - Long-term material supply agreements
- **Outgoing Contracts** - Customer orders for finished products
- **Active Contracts** - Progress tracking for current agreements
- **Contract History** - Past performance and reputation building (future)

## Market Tab Systems

### Open Market System

### Material Lot Generation
- **Random Suppliers**: Generated entities with procedural names (e.g., "Proxima Steel Works", "Vega Salvage Co.")
- **Material Lots**: Randomized quantities and types of materials for sale
- **Dynamic Pricing**: Fluctuating prices based on supply/demand simulation
- **Lot Variety**: Mix of bulk materials, salvaged components, and specialty items

### Purchase Mechanics
- **Lot Selection**: Click to purchase entire material lot
- **Delivery System**: Countdown timer representing shipping time (placeholder for future logistics)
- **Payment**: Immediate credit deduction upon purchase
- **Inventory Integration**: Materials added to facility storage upon delivery

### Market Examples
```
Open Market Listings:

Titan Mining Corp
├─ 500kg Steel Ingots - 2,450 credits
├─ Delivery: 2 days, 6 hours
└─ Quality: Standard grade

Battlefield Salvage LLC  
├─ Mixed Electronics (Damaged) - 890 credits
├─ Delivery: 4 days, 2 hours  
└─ Quality: Salvage grade, repair required

Proxima Precision Parts
├─ 50x Machined Components - 8,750 credits
├─ Delivery: 1 day, 12 hours
└─ Quality: Precision grade

[YOUR LISTINGS]
Player Manufacturing Co.
├─ 25x Basic Sidearms - 3,750 credits
├─ Available: Immediate pickup
└─ Quality: Standard grade (65% avg)
```

## Contracts Tab Systems

### Incoming Contracts (Material Supply)

### Contract Types
- **Regular Delivery**: Recurring shipments of specific materials
- **Bulk Discount**: Large quantity deliveries at reduced per-unit cost
- **Premium Supply**: High-quality materials at premium pricing
- **Emergency Supply**: Rush delivery options with higher costs

### Contract Structure
- **Material Type**: What's being delivered (steel, electronics, components)
- **Quantity**: Amount per delivery
- **Frequency**: Delivery interval (weekly, bi-weekly, monthly)
- **Duration**: Contract length (6 months, 1 year, indefinite)
- **Pricing**: Credits per unit or total shipment cost

### Contract Examples
```
Available Material Contracts:

Standard Steel Supply - Helios Industrial
├─ 100kg Steel per week
├─ 350 credits per shipment  
├─ 52 week contract
├─ Guaranteed delivery within 24 hours
└─ [Accept Contract] [Negotiate Terms]

Premium Electronics - Quantum Systems Ltd
├─ 25x Military Grade Circuits per month
├─ 12,500 credits per shipment
├─ 6 month contract  
├─ Quality guarantee with replacement policy
└─ [Accept Contract] [Negotiate Terms]
```

## Outgoing Contracts (Product Sales)

### Customer Orders
- **Product Requirements**: Specific items needed (weapons, components, equipment)
- **Quality Specifications**: Minimum quality thresholds
- **Quantity**: Total items required
- **Payment Terms**: Total contract value and payment schedule
- **Delivery Requirements**: Deadlines and partial fulfillment policies

### Contract Fulfillment System

#### Step 1: Packing
- **Item Selection**: Choose which manufactured items to include in shipment
- **Quality Control**: System automatically selects items meeting contract specs
- **Manual Override**: (Future V2) Allow player to manually select specific items
- **Batch Composition**: Multiple items packed together for single shipment

#### Step 2: Shipping  
- **Delivery Time**: Variable shipping duration based on distance/method
- **Tracking**: Progress indicator showing shipment en route
- **Shipping Costs**: Deducted from final payment
- **Rush Options**: (Future) Express delivery for time-critical contracts

#### Step 3: Verification
- **Quality Inspection**: Customer verifies items meet specifications
- **Payment Processing**: Credits transferred upon successful verification
- **Dispute Resolution**: Failed verification results in penalties or partial payment
- **Reputation Impact**: Successful fulfillment improves standing with customer type

### Contract Examples
```
Available Customer Contracts:

Rebel Coalition Weapon Order
├─ 45x Basic Sidearms (Any quality acceptable)
├─ Payment: 6,750 credits (150 per unit)
├─ Deadline: 3 weeks
├─ Partial fulfillment: Accepted (minimum 20 units)
└─ [Accept Contract] [View Details]

Vega Military Precision Contract  
├─ 12x Military Grade Plasma Rifles
├─ Payment: 28,800 credits (2,400 per unit)
├─ Quality Requirement: 85% minimum
├─ Deadline: 8 weeks
├─ Partial fulfillment: Not accepted
└─ [Accept Contract] [View Details]

Corporate Security Order
├─ 100x Standard Sidearms
├─ Payment: 22,500 credits (225 per unit)  
├─ Quality Requirement: 60% minimum
├─ Deadline: 6 weeks
├─ Partial fulfillment: Accepted (minimum 50 units)
└─ [Accept Contract] [View Details]
```

### Tab Progression
- **Early Game**: Market tab for immediate material needs
- **Growth Phase**: Contracts tab unlocks as reputation builds and customers approach
- **Advanced**: Both tabs working together for sophisticated supply chain management

## User Interface Benefits

### Clear Mental Models
- **Market Tab**: Immediate transactions, price shopping, opportunistic purchases
- **Contracts Tab**: Long-term relationships, ongoing commitments, strategic planning

### Focused Workflows
- **Market**: Optimized for browsing, comparing prices, quick purchases
- **Contracts**: Designed for relationship management, progress tracking, performance monitoring

## Economic Integration

### Cash Flow Management
- **Material Costs**: Immediate expenditure for market purchases
- **Contract Payments**: Steady income from completed orders
- **Working Capital**: Balance between material investment and production capacity
- **Profit Margins**: Difference between material costs and contract payments

### Strategic Decision Making
- **Supply Chain Planning**: Balance spot market purchases vs contract commitments
- **Production Scheduling**: Align manufacturing with contract deadlines
- **Quality Investment**: Higher quality materials enable premium contracts
- **Market Timing**: Buy materials during price dips, sell during demand peaks

## Future Integration Points

### V2 Enhancements
- **Manual Item Selection**: Choose specific items for contract fulfillment
- **Quality Manipulation**: Attempt to fulfill contracts with sub-spec items
- **Negotiation System**: Modify contract terms before acceptance
- **Reputation System**: Customer relationships affect available contracts

### Economic Simulation
- **Market Dynamics**: Supply/demand affecting material prices
- **Regional Markets**: Different pricing and availability by location
- **Economic Events**: Wars, trade disruptions, technological breakthroughs
- **Competitive Pressure**: Other manufacturers affecting contract availability

### Logistics System
- **Shipping Routes**: Replace delivery timers with actual transportation
- **Warehouse Management**: Multiple storage locations and transfer costs
- **Supply Chain Optimization**: Efficient material flow and inventory management

## Technical Implementation

### Systems Architecture
- **MarketGenerator** (`systems/marketGenerator.ts`): Handles lot generation and market dynamics
- **ContractGenerator** (`systems/contractGenerator.ts`): Creates customer contracts
- **MarketState** (`types/market.ts`): Tracks lots, orders, and listings
- **ContractState** (`types/contracts.ts`): Manages contract lifecycle

### Integration Points
- **Inventory System**: Market deliveries add items with quality/tags
- **Manufacturing**: Contract fulfillment consumes tagged inventory items
- **UI Components**: MarketContent and ContractsContent handle display
- **Game Store**: Centralized state management for all transactions

## Implementation Status Details

### ✅ Completed Features

#### Market System
- **MarketGenerator**: Procedural generation of material lots with varied suppliers
- **Dynamic Pricing**: Supply/demand simulation with market forces
- **Purchase Orders**: Full purchase tracking with delivery timers
- **Player Listings**: Sell manufactured products on the open market
- **Auto-Delivery**: Materials automatically added to inventory on delivery
- **Material Quality**: Integration with new inventory system tags

#### Contract System  
- **ContractGenerator**: Procedural customer contract generation
- **Contract Types**: Customer orders with quality requirements and deadlines
- **Fulfillment**: Automatic matching of inventory items to contract specs
- **Payment Processing**: Credits awarded on successful completion
- **Deadline Tracking**: Time-based contract expiration
- **Early Delivery Bonus**: Extra payment for beating deadlines

#### Economic Integration
- **Unified Currency**: Credits used for all transactions
- **Market Dynamics**: Prices fluctuate based on simulated supply/demand
- **Contract Variety**: Different customer types with unique requirements
- **Quality Standards**: Contracts specify minimum quality levels

### 🚧 Future Enhancements

#### Phase 2: Supply Contracts
1. Incoming material contracts with recurring deliveries
2. Negotiation system for contract terms
3. Reputation system affecting available contracts

#### Phase 3: Advanced Features
1. Manual item selection for contract fulfillment
2. Regional markets with location-based pricing
3. Competitive pressure from other manufacturers

## Player Experience Goals

### Economic Engagement
- Create meaningful choices between immediate purchases and contract commitments
- Balance cash flow between material investment and equipment upgrades
- Provide clear feedback on profitability and business growth

### Strategic Depth  
- Multiple paths to material acquisition with different trade-offs
- Contract selection based on production capabilities and market positioning
- Risk/reward decisions in quality standards and delivery commitments

### Progression Driver
- Successful contract fulfillment funds facility expansion
- Higher quality production unlocks premium contracts
- Efficient supply chain management enables larger operations