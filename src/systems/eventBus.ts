// Event Bus System
// Decoupled communication for scalable job processing

// Core event types
export enum EventType {
  // Job lifecycle events
  JOB_CREATED = 'JOB_CREATED',
  JOB_STARTED = 'JOB_STARTED', 
  JOB_PROGRESS_UPDATED = 'JOB_PROGRESS_UPDATED',
  JOB_COMPLETED = 'JOB_COMPLETED',
  JOB_FAILED = 'JOB_FAILED',
  JOB_CANCELLED = 'JOB_CANCELLED',
  
  // Operation lifecycle events
  OPERATION_STARTED = 'OPERATION_STARTED',
  OPERATION_COMPLETED = 'OPERATION_COMPLETED',
  OPERATION_FAILED = 'OPERATION_FAILED',
  
  // Resource availability events
  MACHINE_AVAILABLE = 'MACHINE_AVAILABLE',
  MACHINE_OCCUPIED = 'MACHINE_OCCUPIED',
  MATERIAL_ADDED = 'MATERIAL_ADDED',
  MATERIAL_CONSUMED = 'MATERIAL_CONSUMED',
  
  // Facility state events
  FACILITY_STATE_CHANGED = 'FACILITY_STATE_CHANGED',
  INVENTORY_CHANGED = 'INVENTORY_CHANGED',
  
  // System events
  GAME_TIME_UPDATED = 'GAME_TIME_UPDATED',
  SYSTEM_INITIALIZED = 'SYSTEM_INITIALIZED'
}

// Base event interface
export interface GameEvent<T = any> {
  readonly type: EventType;
  readonly timestamp: number;
  readonly data: T;
  readonly sourceId?: string;
}

// Specific event data structures
export interface JobCreatedEvent {
  jobId: string;
  facilityId: string;
  productId: string;
  method: any; // MachineBasedMethod
  quantity: number;
}

export interface JobCompletedEvent {
  jobId: string;
  facilityId: string;
  operationIndex: number;
  duration: number;
  success: boolean;
}

export interface OperationCompletedEvent {
  jobId: string;
  operationIndex: number;
  facilityId: string;
  machineId: string;
  outputs?: Array<{itemId: string; quantity: number; quality: number}>;
}

export interface MachineAvailableEvent {
  facilityId: string;
  machineId: string;
  capabilities: string[];
}

export interface MaterialAddedEvent {
  facilityId: string;
  itemId: string;
  quantity: number;
  quality: number;
  tags: string[];
}

export interface InventoryChangedEvent {
  facilityId: string;
  changes: Array<{
    itemId: string;
    quantityDelta: number;
    operation: 'added' | 'removed' | 'consumed';
  }>;
}

// Event handler function type
export type EventHandler<T = any> = (event: GameEvent<T>) => void;
export type Unsubscribe = () => void;

// Main event bus implementation
export class EventBus {
  private subscribers: Map<EventType, Set<EventHandler>> = new Map();
  private eventHistory: GameEvent[] = [];
  private maxHistorySize = 1000; // Keep last 1000 events for debugging

  /**
   * Emit an event to all subscribers
   */
  emit<T>(type: EventType, data: T, sourceId?: string): void {
    const event: GameEvent<T> = {
      type,
      timestamp: Date.now(),
      data,
      sourceId
    };

    // Store in history for debugging
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify all subscribers
    const handlers = this.subscribers.get(type);
    if (handlers) {
      // Create array to avoid modification during iteration
      const handlersArray = Array.from(handlers);
      handlersArray.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${type}:`, error);
          // Don't let one handler error break others
        }
      });
    }

    // Debug logging for development
    if (this.isDebugEnabled()) {
      console.log(`📡 Event: ${type}`, data);
    }
  }

  /**
   * Subscribe to events of a specific type
   */
  subscribe<T>(eventType: EventType, handler: EventHandler<T>): Unsubscribe {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }

    const handlers = this.subscribers.get(eventType)!;
    handlers.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.subscribers.delete(eventType);
      }
    };
  }

  /**
   * Subscribe to multiple event types with the same handler
   */
  subscribeToMany<T>(eventTypes: EventType[], handler: EventHandler<T>): Unsubscribe {
    const unsubscribeFunctions = eventTypes.map(type => 
      this.subscribe(type, handler)
    );

    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }

  /**
   * Get recent events for debugging
   */
  getRecentEvents(count: number = 50): GameEvent[] {
    return this.eventHistory.slice(-count);
  }

  /**
   * Get events of a specific type from history
   */
  getEventHistory(eventType: EventType, count: number = 50): GameEvent[] {
    return this.eventHistory
      .filter(event => event.type === eventType)
      .slice(-count);
  }

  /**
   * Clear event history (useful for testing)
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get subscription stats for debugging
   */
  getSubscriptionStats(): Map<EventType, number> {
    const stats = new Map<EventType, number>();
    for (const [eventType, handlers] of this.subscribers) {
      stats.set(eventType, handlers.size);
    }
    return stats;
  }

  private isDebugEnabled(): boolean {
    // Enable debug logging in development
    return process.env.NODE_ENV === 'development' || 
           typeof window !== 'undefined' && (window as any).DEBUG_EVENTS;
  }
}

// Global event bus instance
// This will be the single source of truth for all events
export const globalEventBus = new EventBus();

// Utility functions for common event patterns
export const EventUtils = {
  /**
   * Create a job lifecycle event emitter
   */
  createJobEventEmitter(jobId: string, facilityId: string) {
    return {
      created: (data: Omit<JobCreatedEvent, 'jobId' | 'facilityId'>) => 
        globalEventBus.emit(EventType.JOB_CREATED, { jobId, facilityId, ...data }),
      
      started: () => 
        globalEventBus.emit(EventType.JOB_STARTED, { jobId, facilityId }),
      
      progressUpdated: (progress: number, estimatedCompletion?: number) => 
        globalEventBus.emit(EventType.JOB_PROGRESS_UPDATED, { 
          jobId, facilityId, progress, estimatedCompletion 
        }),
      
      completed: (success: boolean, duration: number) => 
        globalEventBus.emit(EventType.JOB_COMPLETED, { 
          jobId, facilityId, success, duration 
        }),
      
      failed: (reason: string) => 
        globalEventBus.emit(EventType.JOB_FAILED, { jobId, facilityId, reason }),
      
      cancelled: (reason?: string) => 
        globalEventBus.emit(EventType.JOB_CANCELLED, { jobId, facilityId, reason })
    };
  },

  /**
   * Create a machine event emitter
   */
  createMachineEventEmitter(machineId: string, facilityId: string) {
    return {
      becameAvailable: (capabilities: string[]) => 
        globalEventBus.emit(EventType.MACHINE_AVAILABLE, { 
          machineId, facilityId, capabilities 
        }),
      
      becameOccupied: (jobId: string) => 
        globalEventBus.emit(EventType.MACHINE_OCCUPIED, { 
          machineId, facilityId, jobId 
        })
    };
  },

  /**
   * Create an inventory event emitter  
   */
  createInventoryEventEmitter(facilityId: string) {
    return {
      materialAdded: (itemId: string, quantity: number, quality: number, tags: string[] = []) => 
        globalEventBus.emit(EventType.MATERIAL_ADDED, { 
          facilityId, itemId, quantity, quality, tags 
        }),
      
      materialConsumed: (itemId: string, quantity: number) => 
        globalEventBus.emit(EventType.MATERIAL_CONSUMED, { 
          facilityId, itemId, quantity 
        }),
      
      inventoryChanged: (changes: InventoryChangedEvent['changes']) => 
        globalEventBus.emit(EventType.INVENTORY_CHANGED, { facilityId, changes })
    };
  }
};