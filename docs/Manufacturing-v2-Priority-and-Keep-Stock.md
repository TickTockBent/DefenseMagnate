# Manufacturing V2 - Priority & Keep Stock System Design

## Overview

The Priority & Keep Stock System transforms Defense Magnate from manual job queueing to intelligent production management. Players set inventory policies and job priorities while the system automatically maintains stock levels and optimizes equipment utilization based on business priorities.

## Core Concepts

### **From Manual to Policy-Driven Manufacturing**
- **Current System**: Player manually queues every job
- **New System**: Player sets policies, system executes automatically
- **Benefits**: Strategic focus on business growth vs micro-management

### **Priority-Based Resource Allocation**
Jobs compete for equipment and materials based on priority levels, ensuring critical work always takes precedence over routine maintenance tasks.

### **Intelligent Stock Management**
Automated inventory monitoring with configurable reorder points and keep levels eliminates stockouts while minimizing working capital investment.

## Job Priority System

### **Priority Levels (1-5 Scale)**

#### **🔥 URGENT (Priority 1)**
- **Use Cases**: Rush orders, emergency repairs, critical path items for contracts
- **Behavior**: Preempts all lower priority work immediately
- **Resource Access**: First claim on all materials and equipment
- **Player Control**: Manually assigned for time-critical situations

#### **⚡ HIGH (Priority 2)**  
- **Use Cases**: Active customer contracts, player-initiated manufacturing jobs
- **Behavior**: Interrupts Normal and lower priority work
- **Resource Access**: Priority access after Urgent jobs
- **Player Control**: Default for contract fulfillment and direct player requests

#### **📋 NORMAL (Priority 3)**
- **Use Cases**: Standard production jobs, inventory replenishment above reorder points
- **Behavior**: Executes when higher priority work unavailable
- **Resource Access**: Standard resource allocation
- **Player Control**: Default for most routine manufacturing

#### **🔄 STOCKPILE (Priority 4)**
- **Use Cases**: Maintain inventory levels, build component buffers
- **Behavior**: Background production when equipment available
- **Resource Access**: Uses surplus materials and idle equipment
- **Player Control**: Automatic via keep stock policies

#### **💤 BACKGROUND (Priority 5)**
- **Use Cases**: Efficiency improvements, non-critical prep work, material preparation
- **Behavior**: Lowest priority, easily interrupted
- **Resource Access**: Only uses completely idle resources
- **Player Control**: Long-term efficiency projects

### **Dynamic Priority Adjustment**
The system automatically adjusts priorities based on changing conditions:

#### **Time-Sensitive Priority Escalation**
- Contract jobs increase priority as deadlines approach
- Stockpile jobs increase priority when inventory critically low
- Background jobs remain low priority regardless of age

#### **Dependency-Based Priority Inheritance**
- Component jobs inherit priority from products that need them
- Material preparation gets elevated priority for urgent product jobs
- Sub-assembly work matches final assembly priority

## Priority Execution Engine

### **Equipment Allocation Algorithm**
The system assigns equipment based on job priority levels, with higher priority work always taking precedence. When new urgent work arrives, lower priority jobs are gracefully preempted and can resume later.

### **Preemption Handling**
When higher priority work interrupts lower priority jobs:

#### **Graceful Job Interruption**
- **Save Progress**: Current operation progress preserved
- **Material Safety**: Consumed materials tracked, reserved materials returned
- **Restart Capability**: Job can resume from interruption point
- **State Preservation**: Intermediate products and job inventory maintained

#### **Resource Reallocation**
- **Equipment Release**: Machine immediately available for higher priority work
- **Material Transfer**: Reserved materials can be reallocated if needed
- **Worker Assignment**: Labor resources switch to urgent tasks

### **Queue Management**
Each priority level maintains its own job queue with different behaviors:

#### **Priority 1-2 Queues (URGENT/HIGH)**
- **FIFO Processing**: First in, first out within priority level
- **Deadline Sorting**: Contract jobs ordered by deadline proximity
- **Resource Priority**: Always get first access to materials

#### **Priority 3 Queue (NORMAL)**
- **Efficiency Optimization**: Jobs may be reordered for equipment efficiency
- **Batch Processing**: Similar jobs grouped when beneficial
- **Resource Sharing**: Standard allocation with other normal jobs

#### **Priority 4-5 Queues (STOCKPILE/BACKGROUND)**
- **Efficiency Focused**: Heavy optimization for equipment utilization
- **Interruptible**: Designed for frequent preemption
- **Resource Sensitive**: Only uses surplus materials and idle equipment

## Keep Stock System

### **Stock Level Configuration**

#### **Per-Item Stock Policies**
Each item in the facility can have its own stock management policy defining target inventory levels, reorder triggers, and replenishment priority.

#### **Stock Policy Examples**
```
Steel Billet Stock Policy:
├─ Keep Level: 50 units
├─ Reorder Point: 40 units  
├─ Max Level: 60 units
├─ Priority: BACKGROUND
└─ Rationale: Cheap to make, used frequently, non-urgent

Mechanical Assembly Stock Policy:
├─ Keep Level: 5 units
├─ Reorder Point: 3 units
├─ Max Level: 8 units  
├─ Priority: STOCKPILE
└─ Rationale: Expensive to make, critical for sidearms, moderate urgency

Precision Components Stock Policy:
├─ Keep Level: 25 units
├─ Reorder Point: 15 units
├─ Max Level: 40 units
├─ Priority: NORMAL
└─ Rationale: Time-consuming to make, high demand, moderate cost
```

### **Automatic Stock Monitoring**

#### **Continuous Inventory Tracking**
- **Real-Time Monitoring**: Check inventory levels after every job completion
- **Consumption Tracking**: Monitor usage rates and patterns
- **Predictive Analysis**: Forecast future needs based on contract pipeline
- **Alert Generation**: Warn when consumption exceeds production capacity

#### **Replenishment Job Creation**
The stock monitoring system continuously checks inventory levels and automatically generates manufacturing jobs when items fall below their reorder points. It calculates the optimal production quantity to reach keep levels while accounting for jobs already in progress.

### **Intelligent Stock Management**

#### **Usage Pattern Analysis**
```typescript
interface UsageAnalytics {
  itemId: string;
  dailyAverageUsage: number;
  peakUsage: number;
  usageTrend: 'increasing' | 'decreasing' | 'stable';
  seasonality: SeasonalPattern[];
  leadTime: number; // Average production time
}
```

#### **Dynamic Stock Level Adjustment**
- **Trend Analysis**: Increase keep levels for items with growing usage
- **Seasonal Adjustments**: Higher stock before busy periods
- **Lead Time Consideration**: Longer production time = higher reorder points
- **Cost Optimization**: Balance carrying costs vs stockout risks

#### **Smart Recommendations**
```
📊 STOCK ANALYSIS RECOMMENDATIONS

Steel Billets:
├─ Current Policy: Keep 50, Reorder 40
├─ Analysis: Usage increased 30% last month
├─ Recommendation: Increase to Keep 65, Reorder 50
└─ Reason: Avoid stockouts during peak demand

Mechanical Components:
├─ Current Policy: Keep 25, Reorder 15  
├─ Analysis: 94% produced on-demand, rarely from stock
├─ Recommendation: Reduce to Keep 15, Reorder 10
└─ Reason: Lower inventory carrying costs

Precision Components:
├─ Current Policy: Keep 25, Reorder 15
├─ Analysis: 2.1hr average production time, 8.3/day usage
├─ Recommendation: Increase reorder point to 20
└─ Reason: Production time risk during demand spikes
```

## User Interface Integration

### **Stock Management Dashboard**
```
📦 INVENTORY MANAGEMENT

🔍 OVERVIEW
├─ Total Items Under Management: 12
├─ Active Replenishment Jobs: 8  
├─ Items Below Reorder Point: 2 ⚠️
└─ Estimated Stock Value: 2,450 credits

📊 CRITICAL ITEMS
├─ Mechanical Assembly: 2/5 (BELOW REORDER) 🔴
├─ Precision Components: 14/25 (IN PRODUCTION) 🟡  
└─ Steel Billets: 47/50 (ADEQUATE) 🟢

⚙️ QUICK ACTIONS
├─ [🔧 Adjust All Policies] - Bulk policy changes
├─ [📈 View Analytics] - Usage trends and recommendations
├─ [⏸️ Pause All Stock Jobs] - Temporarily disable auto-replenishment
└─ [🚀 Rush Critical Items] - Elevate below-reorder items to HIGH priority
```

### **Individual Item Management**
```
🧱 STEEL BILLET MANAGEMENT

📊 STATUS
├─ Current Stock: 47 units
├─ Queued Production: 3 units (ETA: 45 minutes)
├─ Weekly Usage: 34 units average
└─ Last Restock: 2 days ago

⚙️ POLICY SETTINGS
├─ Keep Level: 50 ⚙️ [Edit]
├─ Reorder Point: 40 ⚙️ [Edit]
├─ Max Level: 60 ⚙️ [Edit]
├─ Priority: Background 💤 [Change]
└─ Auto-Replenish: ✅ Enabled

📈 ANALYTICS (Last 30 Days)
├─ Average Daily Usage: 4.9 units
├─ Peak Daily Usage: 12 units  
├─ Stockouts: 0 incidents
├─ Efficiency: 94% (good)
└─ Carrying Cost: 78 credits/month

💡 RECOMMENDATIONS
└─ Policy optimal for current usage patterns
```

### **Priority Management Interface**
```
🎯 JOB PRIORITY MANAGEMENT

🔥 URGENT QUEUE (2 jobs)
├─ Rush Contract #47 - 5 Sidearms (Due: 6 hours)
└─ Emergency Equipment Repair - Manual Lathe

⚡ HIGH PRIORITY (12 jobs)  
├─ Contract #45 - 20 Tactical Knives (Due: 2 days)
├─ Contract #46 - 15 Sidearms (Due: 3 days)
└─ + 10 more jobs [Expand]

📋 NORMAL QUEUE (8 jobs)
├─ Mechanical Assembly Replenishment (Keep Stock)
├─ Component Manufacturing (Various)
└─ + 6 more jobs [Expand]

🔄 STOCKPILE QUEUE (15 jobs)
├─ Steel Billet Preparation (45 units)  
├─ Mechanical Component Stock (18 units)
└─ + 13 more jobs [Expand]

💤 BACKGROUND QUEUE (6 jobs)
├─ Equipment Maintenance Prep
├─ Material Preparation Efficiency  
└─ + 4 more jobs [Expand]

⚙️ QUEUE CONTROLS
├─ [⏸️ Pause Background Jobs] - Stop lowest priority work
├─ [🔄 Rebalance Queues] - Optimize job distribution  
├─ [📊 Priority Analytics] - Queue performance metrics
└─ [⚙️ Default Priorities] - Configure automatic priority assignment
```

## Technical Implementation

### **Core System Architecture**

The Priority & Keep Stock System requires several integrated components working together to provide automated production management while maintaining the flexibility for manual override when needed.

#### **Job Priority Manager**
Manages the priority-based job queue system, handling job assignment, preemption, and queue rebalancing to ensure optimal resource utilization.

#### **Stock Policy Engine**  
Monitors inventory levels against configured policies, generates replenishment jobs, and provides analytics-driven recommendations for policy optimization.

#### **Priority-Aware Equipment Allocation**
Allocates equipment to jobs based on priority levels, handles graceful preemption of lower priority work, and manages job resumption after interruption.

### **Database Schema Extensions**

The system requires extensions to existing data structures to track job priorities, stock policies, and usage analytics.

#### **Job Priority Data**
Jobs need additional fields to track priority level, preemption capability, and timing data for interrupted jobs.

#### **Stock Policy Storage**
Stock policies require persistent storage with configuration data, analytics history, and modification tracking for policy optimization.

### **Integration Points**

#### **Manufacturing V2 Integration**
- **Workflow Generation**: Stock replenishment uses dynamic workflow generation
- **Component Dependencies**: Multi-level stock policies for component hierarchies
- **Enhancement Consideration**: Stock policies can specify enhancement requirements

#### **Machine Workspace Integration**
- **Priority-Aware Scheduling**: Equipment allocator respects job priorities
- **Preemption Handling**: Graceful job interruption and resumption
- **Progress Preservation**: Interrupted jobs resume from interruption point

#### **Market Integration**
- **Material Procurement**: Auto-purchase materials when needed for stock replenishment
- **Dynamic Pricing**: Adjust stock levels based on material cost fluctuations
- **Demand Forecasting**: Contract pipeline influences stock level recommendations

## Performance Considerations

### **Computational Efficiency**
- **Incremental Updates**: Only recalculate priorities when jobs change
- **Batch Processing**: Group similar replenishment jobs for efficiency
- **Caching**: Store calculated priorities and usage analytics
- **Background Processing**: Run analytics during idle periods

### **Memory Management**
- **Queue Size Limits**: Prevent excessive job accumulation
- **Historical Data Pruning**: Limit analytics data retention
- **Lazy Loading**: Load detailed analytics only when requested

### **Scalability**
- **Multiple Facilities**: Stock policies per facility with global oversight
- **Bulk Operations**: Batch policy updates across multiple items
- **Export/Import**: Policy backup and template sharing

## Success Metrics

### **Player Experience Goals**
- **Reduced Micro-Management**: 80% fewer manual job queueing actions
- **Improved Efficiency**: Higher equipment utilization through intelligent scheduling
- **Strategic Focus**: Players spend more time on business strategy vs job management
- **Inventory Optimization**: Fewer stockouts with lower average inventory levels

### **System Performance Goals**
- **Response Time**: Priority changes take effect within 1 game minute
- **Accuracy**: Stock level maintenance within 10% of target levels
- **Reliability**: Zero lost jobs during priority preemption
- **Scalability**: Handle 100+ active stock policies without performance degradation

## Future Expansion

### **Advanced Priority Features**
- **Custom Priority Rules**: Player-defined priority calculation formulas
- **Time-Based Priorities**: Automatic priority escalation based on age
- **Resource-Based Priorities**: Higher priority when specific materials available

### **Intelligent Analytics**
- **Machine Learning**: Predictive usage modeling based on contract patterns
- **Optimization Algorithms**: Automatic policy tuning for cost/service optimization  
- **Scenario Planning**: "What-if" analysis for policy changes

### **Multi-Facility Operations**
- **Global Stock Policies**: Coordinate inventory across multiple facilities
- **Transfer Orders**: Automatic inter-facility material movement
- **Centralized Planning**: Enterprise-level production and inventory management

This Priority & Keep Stock System transforms Defense Magnate from a tactical manufacturing game into a strategic production management simulation, enabling players to operate like real factory managers while maintaining the engaging complexity of the underlying manufacturing systems.