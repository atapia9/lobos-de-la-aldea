import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../EventBus.js';
import { EventType } from '../types.js';
import { GameEvent } from '../models.js';

const makeEvent = (type: EventType): GameEvent => ({
  id: '1',
  type,
  payload: {},
  timestamp: 0,
  gameId: 'g1',
});

describe('EventBus', () => {
  it('calls subscribed handler when event published', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe(EventType.GAME_CREATED, handler);
    const event = makeEvent(EventType.GAME_CREATED);
    bus.publish(event);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('does not call handler for different event type', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe(EventType.GAME_CREATED, handler);
    bus.publish(makeEvent(EventType.GAME_ENDED));
    expect(handler).not.toHaveBeenCalled();
  });

  it('supports multiple handlers for same event', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.subscribe(EventType.PHASE_STARTED, h1);
    bus.subscribe(EventType.PHASE_STARTED, h2);
    bus.publish(makeEvent(EventType.PHASE_STARTED));
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('clear removes all handlers', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe(EventType.GAME_CREATED, handler);
    bus.clear();
    bus.publish(makeEvent(EventType.GAME_CREATED));
    expect(handler).not.toHaveBeenCalled();
  });
});
