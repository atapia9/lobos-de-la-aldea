import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhaseTag } from '@/components/PhaseTag';

describe('PhaseTag', () => {
  it.each([
    ['SETUP', 'Preparación'],
    ['NIGHT', 'Noche'],
    ['DAWN', 'Amanecer'],
    ['DISCUSSION', 'Discusión'],
    ['VOTING', 'Votación'],
    ['RESOLUTION', 'Resolución'],
    ['GAME_OVER', 'Fin'],
  ])('renders Spanish label for %s phase', (phase, label) => {
    render(<PhaseTag phase={phase} />);
    expect(screen.getByText(label)).toBeDefined();
  });

  it('renders unknown phase as-is', () => {
    render(<PhaseTag phase="MYSTERY" />);
    expect(screen.getByText('MYSTERY')).toBeDefined();
  });
});
