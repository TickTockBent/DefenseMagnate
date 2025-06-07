# Defense Magnate Economic Systems Overview

## Recent Implementation Arc: Materials & Markets

This document provides a comprehensive overview of the economic systems implemented in Defense Magnate, focusing on the recent Material Standardization and Market/Contract systems.

## 🎯 Core Economic Loop

```
ACQUIRE MATERIALS → MANUFACTURE PRODUCTS → FULFILL CONTRACTS → EARN CREDITS
         ↑                                                         |
         └─────────────────────────────────────────────────────────┘
```

## 📦 Material Standardization System

### Overview
The material standardization system replaces separate item variants with a unified tag-based approach, enabling rich item differentiation through quality and condition modifiers.

### Key Components

#### Base Items (18 total)
- **Materials**: steel, aluminum, plastic, titanium, composites, chemicals
- **Components**: electronics, machined parts, spares
- **Products**: sidearm, knife, rifle, damaged variants

#### Tag System (16 tags)
- **Condition Tags**: [damaged], [junk], [restored], [forged], [refurbished]
- **Material Tags**: [standard], [premium], [salvaged], [titanium], [composite]
- **Special Tags**: [military-grade], [hand-forged], [prototype]

#### Quality System
- 0-100% quality scale per item
- Tag-based modifiers and caps
- Quality affects market value and contract eligibility

### Manufacturing Integration
```typescript
// Example: Forge New Method produces high-quality items
{
  outputTags: [ItemTag.FORGED],
  qualityRange: [80, 95],
  // Produces: "Basic Sidearm [forged]" @ 87% quality
}

// Example: Cobble Method produces low-quality items
{
  outputTags: [ItemTag.JUNK],
  qualityRange: [30, 45],
  qualityCap: 45, // Cannot exceed 45% quality
  // Produces: "Basic Sidearm [junk]" @ 42% quality
}
```

## 💰 Market System

### Dynamic Material Acquisition
The market provides immediate access to materials through procedurally generated lots from various suppliers.

#### Market Features
- **Procedural Suppliers**: "Titan Mining Corp", "Battlefield Salvage LLC"
- **Dynamic Pricing**: Supply/demand simulation affects prices
- **Delivery Timers**: 1-7 day delivery windows
- **Quality Variation**: Materials come with quality tags ([standard], [premium], [salvaged])

#### Player Sales
- List manufactured products for sale
- Set custom prices
- Automatic sales simulation
- Revenue directly to credits

### Market Example
```
Proxima Steel Works
├─ 200kg Steel [standard] - 1,800 credits
├─ Delivery: 2 days, 4 hours
└─ Quality: 80-95%

Your Listing
├─ 10x Basic Sidearm [restored] - 2,500 credits
├─ Quality: 65-75%
└─ Status: 3 sold, 7 remaining
```

## 📋 Contract System

### Customer Orders
Contracts provide structured demand for manufactured products with specific requirements.

#### Contract Components
- **Product Requirements**: Type and quantity needed
- **Quality Standards**: Minimum acceptable quality
- **Deadlines**: Time limits for fulfillment
- **Payment Terms**: Base payment + early delivery bonus

#### Contract Types
- **Rebel Orders**: Low quality requirements, quick turnaround
- **Military Contracts**: High quality standards, premium payment
- **Corporate Security**: Bulk orders, moderate requirements

### Contract Example
```
Vega Defense Force Contract
├─ Product: 20x Basic Sidearm
├─ Quality: Minimum 75%
├─ Deadline: 5 days
├─ Payment: 5,000 credits
└─ Early Bonus: +15% if delivered within 3 days
```

## 🔄 System Integration

### Inventory Flow
1. **Material Purchase**: Buy from market → Added to inventory with tags
2. **Manufacturing**: Consume best quality materials → Produce tagged items
3. **Contract Fulfillment**: Match inventory items to requirements → Ship products
4. **Payment**: Credits added on successful delivery

### Economic Balance
- **Material Costs**: 50-200 credits per unit
- **Manufacturing Time**: 11-135 minutes per product
- **Product Value**: 150-500 credits based on quality/tags
- **Profit Margins**: 20-80% depending on efficiency

## 🎮 Player Experience

### Early Game
- Focus on spot market purchases
- Simple manufacturing methods (cobble, restore)
- Low-requirement contracts
- Build initial capital

### Mid Game
- Balance market purchases with contract deadlines
- Invest in better equipment for quality
- Target higher-value contracts
- Optimize production efficiency

### Late Game
- Complex supply chain management
- Premium manufacturing methods
- Military and corporate contracts
- Market manipulation strategies

## 🛠️ Technical Architecture

### Core Systems
```
gameStore (Zustand)
├─ MarketState
│   ├─ availableLots[]
│   ├─ activePurchaseOrders[]
│   └─ playerListings[]
├─ ContractState
│   ├─ availableContracts[]
│   ├─ activeContracts[]
│   └─ completedContracts[]
└─ FacilityInventory
    ├─ groups[] (by category)
    └─ slots[] (by base item)
        └─ items[] (with tags/quality)
```

### Key Components
- **MarketGenerator**: Procedural lot generation
- **ContractGenerator**: Dynamic contract creation
- **InventoryManager**: Item CRUD operations
- **MachineWorkspace**: Manufacturing integration

## 📊 Metrics & Feedback

### Visual Indicators
- Quality percentages with color coding
- Tag badges on items
- Material availability in manufacturing UI
- Contract deadline countdowns

### Economic Feedback
- Profit/loss per transaction
- Contract completion bonuses
- Market price fluctuations
- Inventory value tracking

## 🚀 Future Expansions

### Planned Features
- Supply contracts (recurring material deliveries)
- Reputation system affecting contracts
- Regional markets with location-based pricing
- Competitive pressure from AI manufacturers
- Advanced logistics and shipping routes

### Potential Mechanics
- Material futures trading
- Contract negotiation
- Quality manipulation/fraud
- Market cornering strategies
- Economic warfare between factions

## Summary

The economic systems create a compelling gameplay loop where players must balance immediate needs with long-term planning. The tag-based inventory system provides depth without overwhelming complexity, while the market and contract systems offer multiple paths to profitability. Together, they form the foundation for Defense Magnate's strategic manufacturing gameplay.