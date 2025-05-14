/**
 * Base interface for domain events
 * All events must extend this interface
 */
export interface DomainEvent {
  eventType: string;
  timestamp: number;
  constructor: { name: string };
}

/**
 * Domain event emitter interface for implementing the event bus pattern
 * Allows components to publish and subscribe to events
 */
export interface IDomainEventEmitter {
  /**
   * Emit an event to all subscribers
   * @param event The event to emit
   */
  emit<T extends DomainEvent>(event: T): void;

  /**
   * Subscribe to events of a specific type
   * @param eventType The event type constructor
   * @param handler The handler function to call when events of this type are emitted
   */
  subscribe<T>(eventType: new (...args: unknown[]) => T, handler: (event: T) => void): void;
}
