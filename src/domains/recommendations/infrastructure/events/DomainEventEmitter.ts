import type { IDomainEventEmitter, DomainEvent } from "../../domain/interfaces/IDomainEventEmitter";

type EventHandler<T> = (event: T) => void;

/**
 * Implementation of the domain event emitter
 * Manages event subscriptions and handles event publishing
 */
export class DomainEventEmitter implements IDomainEventEmitter {
  private readonly handlers = new Map<string, EventHandler<unknown>[]>();

  /**
   * Emit an event to all registered handlers
   * Uses event constructor name to identify event type
   * @param event The event to emit
   */
  emit<T extends DomainEvent>(event: T): void {
    // Ensure the event has the required properties
    if (!event.eventType) {
      event.eventType = event.constructor.name;
    }

    if (!event.timestamp) {
      event.timestamp = Date.now();
    }

    const eventType = event.constructor.name;
    const eventHandlers = this.handlers.get(eventType) || [];

    for (const handler of eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        // Log error but prevent event propagation failure
        console.error(
          `Error in event handler for ${eventType}:`,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  }

  /**
   * Subscribe to a specific event type
   * @param eventType The event type constructor
   * @param handler The handler function
   */
  subscribe<T>(eventType: new (...args: unknown[]) => T, handler: (event: T) => void): void {
    const eventName = eventType.name;
    const handlers = this.handlers.get(eventName) || [];

    handlers.push(handler as EventHandler<unknown>);
    this.handlers.set(eventName, handlers);
  }
}
