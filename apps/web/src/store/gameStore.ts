'use client';
import { useState, useCallback } from 'react';
import type { GameStateDTO } from '@/lib/api';

export interface GameStore {
  game: GameStateDTO | null;
  selectedTargetId: string | null;
  narratorText: string;
  setGame: (g: GameStateDTO) => void;
  selectTarget: (id: string | null) => void;
  setNarratorText: (text: string) => void;
}

export function useGameStore(): GameStore {
  const [game, setGameState] = useState<GameStateDTO | null>(null);
  const [selectedTargetId, selectTarget] = useState<string | null>(null);
  const [narratorText, setNarratorText] = useState('');

  const setGame = useCallback((g: GameStateDTO) => {
    setGameState(g);
    selectTarget(null);
  }, []);

  return { game, selectedTargetId, narratorText, setGame, selectTarget, setNarratorText };
}
