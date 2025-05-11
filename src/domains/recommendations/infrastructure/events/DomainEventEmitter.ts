import { IDomainEventEmitter } from "../../domain/interfaces/IDomainEventEmitter";

type EventHandler<T> = (event: T) => void;

export class DomainEventEmitter implements IDomainEventEmitter {
  private readonly handlers = new Map<string, EventHandler<any>[]>();

  emit<T>(event: T): void {
    const eventType = event.constructor.name;
    const eventHandlers = this.handlers.get(eventType) || [];

    for (const handler of eventHandlers) {
      try {
        handler(event);
      } catch (error) {}
    }
  }

  subscribe<T>(eventType: new (...args: any[]) => T, handler: (event: T) => void): void {
    const eventName = eventType.name;
    const handlers = this.handlers.get(eventName) || [];

    handlers.push(handler);
    this.handlers.set(eventName, handlers);
  }
}
