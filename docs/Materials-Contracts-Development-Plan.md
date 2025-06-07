# Materials & Contracts V1 Development Plan

## Overview
Implement Market and Contracts tabs to create complete buy-manufacture-sell economic loop. Replace current Supply tab with dedicated Market tab and add new Contracts tab.

## Development Phases

### Phase 1: Core Market System (Priority: High)
**Goal**: Basic material purchasing through open market

#### 1.1 Data Layer Setup
- [ ] Create market system types (`types/market.ts`)
  - MaterialLot interface (supplier, material, quantity, price, delivery time)
  - MarketSupplier interface (name, reputation, reliability)
  - PurchaseOrder interface (lot, status, delivery countdown)
- [ ] Create contracts system types (`types/contracts.ts`)  
  - CustomerContract interface (customer, product requirements, payment)
  - ContractProgress interface (items packed, shipped, verified)
  - Customer interface (name, payment terms, quality requirements)
- [ ] Add market state to game store
  - availableMarketLots: MaterialLot[]
  - activePurchaseOrders: PurchaseOrder[]
  - availableContracts: CustomerContract[]
  - activeContracts: ContractProgress[]

#### 1.2 Market Lot Generation
- [ ] Create market lot generator (`systems/marketGenerator.ts`)
  - Random supplier name generation
  - Material lot generation with varied quantities/prices
  - Delivery time calculation
  - Quality grade assignment
- [ ] Implement lot refresh mechanics
  - Time-based lot expiration and replacement
  - Market dynamics placeholder (static for now)

#### 1.3 Market Tab UI
- [ ] Replace SupplyContent with MarketContent component
  - Open Market section with available lots
  - Purchase order tracking section
  - Credit balance and spending display
- [ ] Create MaterialLot display component
  - Supplier name and reputation
  - Material details and quantity
  - Price and delivery time
  - Purchase button with immediate feedback

#### 1.4 Purchase System
- [ ] Implement market purchasing (`gameStore.purchaseMarketLot()`)
  - Credit validation and deduction
  - Purchase order creation
  - Delivery countdown integration with game clock
- [ ] Create delivery system
  - Time-based material delivery to facility storage
  - Purchase order completion notification
  - Storage capacity validation

### Phase 2: Basic Contracts System (Priority: High)
**Goal**: Simple outgoing contracts for selling manufactured products

#### 2.1 Contract Generation
- [ ] Create customer contract generator (`systems/contractGenerator.ts`)
  - Random customer name generation
  - Product requirement specification
  - Quality threshold and payment calculation
  - Deadline assignment
- [ ] Implement contract refresh mechanics
  - New contracts appearing over time
  - Contract expiration system

#### 2.2 Contracts Tab UI
- [ ] Create ContractsContent component
  - Available contracts section
  - Active contracts progress tracking
  - Contract history (completed/failed)
- [ ] Create CustomerContract display component
  - Customer details and requirements
  - Payment terms and deadlines
  - Accept/decline contract actions

#### 2.3 Contract Fulfillment
- [ ] Implement contract acceptance (`gameStore.acceptContract()`)
  - Contract validation against current capabilities
  - Active contract tracking
- [ ] Create automatic fulfillment system
  - Scan facility storage for qualifying products
  - Pack items meeting quality requirements
  - Ship packed items with delivery countdown
  - Process payment upon delivery completion

### Phase 3: Enhanced Market Features (Priority: Medium)
**Goal**: Player product sales and improved market dynamics

#### 3.1 Product Sales
- [ ] Add player listing system to market
  - List manufactured products for sale
  - Set pricing and availability
  - Track sales progress over time
- [ ] Implement product sale mechanics
  - Gradual sales with market-driven pricing
  - Revenue processing and notifications

#### 3.2 UI Polish
- [ ] Market tab enhancements
  - Price history and trends (placeholder)
  - Bulk purchase options
  - Supplier relationship tracking
- [ ] Contracts tab enhancements
  - Contract performance metrics
  - Customer satisfaction indicators
  - Partial fulfillment options

### Phase 4: Advanced Contract Features (Priority: Low)
**Goal**: Incoming material contracts and multi-step fulfillment

#### 4.1 Incoming Contracts
- [ ] Material supply contracts
  - Recurring delivery agreements
  - Bulk discount contracts
  - Premium material sources
- [ ] Contract management system
  - Accept/decline incoming contracts
  - Track delivery schedules
  - Payment processing for recurring orders

#### 4.2 Advanced Fulfillment
- [ ] Multi-step fulfillment process
  - Manual item selection for contracts
  - Quality control validation
  - Shipping progress tracking
- [ ] Reputation system foundation
  - Customer satisfaction scoring
  - Contract success/failure tracking
  - Reputation impact on available contracts

## Implementation Strategy

### Development Order
1. **Market System First**: Build complete market purchasing flow
2. **Basic Contracts**: Simple auto-fulfillment for selling products  
3. **Enhanced Features**: Player sales and contract improvements
4. **Advanced Systems**: Incoming contracts and reputation

### Tab Structure Changes
- **Current**: Research | Manufacturing | Equipment | Contracts | Supply
- **New**: Research | Manufacturing | Equipment | Market | Contracts

### Integration Points
- **Materials**: Purchase through market, delivered to facility storage
- **Products**: Manufactured items automatically qualify for contracts
- **Credits**: All transactions flow through existing credit system
- **Time**: Delivery and contract timers use existing game clock

## Testing Strategy

### Phase 1 Testing
- [ ] Purchase materials and verify delivery
- [ ] Confirm credit deduction and storage updates
- [ ] Test delivery timer progression
- [ ] Validate material availability for manufacturing

### Phase 2 Testing  
- [ ] Accept contracts and verify requirements
- [ ] Complete manufacturing to fulfill contracts
- [ ] Test automatic fulfillment and payment
- [ ] Confirm deadline tracking

### Phase 3 Testing
- [ ] List player products for sale
- [ ] Verify gradual sales and revenue
- [ ] Test market price dynamics
- [ ] Validate end-to-end economic loop

## Success Metrics
- [ ] Complete buy-manufacture-sell cycle functional
- [ ] Market provides reliable material acquisition
- [ ] Contracts offer profitable product sales
- [ ] Economic progression drives facility growth
- [ ] UI clearly separates market vs contract workflows

## File Structure
```
src/
├── components/
│   ├── MarketContent.tsx          # Replace SupplyContent
│   ├── ContractsContent.tsx       # Enhanced from stub
│   └── MarketLotCard.tsx          # Material lot display
├── systems/
│   ├── marketGenerator.ts         # Market lot generation
│   ├── contractGenerator.ts       # Customer contract generation
│   └── fulfillmentSystem.ts       # Contract fulfillment logic
├── types/
│   ├── market.ts                  # Market system types
│   └── contracts.ts               # Contract system types
└── data/
    ├── marketSuppliers.ts         # Supplier name/data
    └── customerTypes.ts           # Customer archetypes
```

## Notes
- Keep existing manufacturing system untouched
- Maintain compatibility with current material/product definitions
- Use placeholder logistics (simple timers) for now
- Focus on core economic loop before advanced features
- Ensure all market/contract actions integrate with game clock