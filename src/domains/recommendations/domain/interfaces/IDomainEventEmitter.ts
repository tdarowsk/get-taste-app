export interface IDomainEventEmitter {
  emit<T>(event: T): void;
  subscribe<T>(eventType: new (...args: any[]) => T, handler: (event: T) => void): void;
}
