import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '@/store/gameStore';
import type { GameStateDTO } from '@/lib/api';

const GAME: GameStateDTO = {
  id: 'g1', phase: 'SETUP', dayNumber: 0, players: [], winner: null, events: [],
};

describe('useGameStore', () => {
  it('initializes with null game', () => {
    const { result } = renderHook(() => useGameStore());
    expect(result.current.game).toBeNull();
  });

  it('setGame updates the game state', () => {
    const { result } = renderHook(() => useGameStore());
    act(() => result.current.setGame(GAME));
    expect(result.current.game?.id).toBe('g1');
  });

  it('setGame resets selectedTargetId', () => {
    const { result } = renderHook(() => useGameStore());
    act(() => result.current.selectTarget('p1'));
    act(() => result.current.setGame(GAME));
    expect(result.current.selectedTargetId).toBeNull();
  });

  it('selectTarget stores the target id', () => {
    const { result } = renderHook(() => useGameStore());
    act(() => result.current.selectTarget('p2'));
    expect(result.current.selectedTargetId).toBe('p2');
  });

  it('selectTarget can be cleared with null', () => {
    const { result } = renderHook(() => useGameStore());
    act(() => result.current.selectTarget('p3'));
    act(() => result.current.selectTarget(null));
    expect(result.current.selectedTargetId).toBeNull();
  });

  it('setNarratorText updates narrator text', () => {
    const { result } = renderHook(() => useGameStore());
    act(() => result.current.setNarratorText('La oscuridad cae.'));
    expect(result.current.narratorText).toBe('La oscuridad cae.');
  });
});
