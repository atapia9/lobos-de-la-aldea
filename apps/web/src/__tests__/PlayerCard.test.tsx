import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerCard } from '@/components/PlayerCard';
import type { PlayerDTO } from '@/lib/api';

const makePlayer = (overrides: Partial<PlayerDTO> = {}): PlayerDTO => ({
  id: 'p1', name: 'Alice', alive: true,
  role: { id: 'villager', team: 'VILLAGE' },
  ...overrides,
});

describe('PlayerCard', () => {
  it('renders player name', () => {
    render(<PlayerCard player={makePlayer()} />);
    expect(screen.getByText('Alice')).toBeDefined();
  });

  it('shows skull icon for dead player', () => {
    render(<PlayerCard player={makePlayer({ alive: false })} />);
    expect(screen.getByText('☠')).toBeDefined();
  });

  it('shows role id when showRole is true', () => {
    render(<PlayerCard player={makePlayer()} showRole />);
    expect(screen.getByText('villager')).toBeDefined();
  });

  it('does not show role by default', () => {
    render(<PlayerCard player={makePlayer()} />);
    expect(screen.queryByText('villager')).toBeNull();
  });

  it('calls onClick when alive player clicked', () => {
    const onClick = vi.fn();
    render(<PlayerCard player={makePlayer()} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick for dead player', () => {
    const onClick = vi.fn();
    render(<PlayerCard player={makePlayer({ alive: false })} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies selected ring when selected is true', () => {
    const { container } = render(<PlayerCard player={makePlayer()} selected />);
    expect(container.innerHTML).toContain('ring-2');
  });
});
