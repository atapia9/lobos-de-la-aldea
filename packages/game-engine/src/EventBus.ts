import { GameEvent } from './models.js';
import { EventType } from './types.js';

type EventHandler = (event: GameEvent) => void;

export class EventBus {
  private handlers = new Map<EventType, EventHandler[]>();

  subscribe(type: EventType, handler: EventHandler): void {
    const existing = this.handlers.get(type) ?? [];
    this.handlers.set(type, [...existing, handler]);
  }

  publish(event: GameEvent): void {
    const handlers = this.handlers.get(event.type) ?? [];
    for (const handler of handlers) {
      handler(event);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
