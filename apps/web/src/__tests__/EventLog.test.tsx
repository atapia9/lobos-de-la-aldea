import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventLog } from '@/components/EventLog';
import type { GameEventDTO } from '@/lib/api';

const makeEvent = (type: string, id = '1'): GameEventDTO => ({
  id, type, payload: {}, timestamp: Date.now(),
});

describe('EventLog', () => {
  it('renders no event rows when events is empty', () => {
    render(<EventLog events={[]} />);
    expect(document.querySelectorAll('.font-mono').length).toBe(0);
  });

  it('renders event types', () => {
    render(<EventLog events={[makeEvent('NIGHT_STARTED'), makeEvent('PLAYER_KILLED', '2')]} />);
    expect(screen.getByText('NIGHT_STARTED')).toBeDefined();
    expect(screen.getByText('PLAYER_KILLED')).toBeDefined();
  });

  it('shows known event icons', () => {
    render(<EventLog events={[makeEvent('PLAYER_KILLED')]} />);
    expect(screen.getByText('💀')).toBeDefined();
  });

  it('shows fallback bullet for unknown event type', () => {
    render(<EventLog events={[makeEvent('UNKNOWN_TYPE')]} />);
    expect(screen.getByText('•')).toBeDefined();
  });

  it('renders most recent events first (reversed)', () => {
    const events = [
      makeEvent('GAME_CREATED', '1'),
      makeEvent('NIGHT_STARTED', '2'),
      makeEvent('PLAYER_KILLED', '3'),
    ];
    render(<EventLog events={events} />);
    const types = screen.getAllByText(/GAME_CREATED|NIGHT_STARTED|PLAYER_KILLED/);
    expect(types[0].textContent).toBe('PLAYER_KILLED');
  });
});
