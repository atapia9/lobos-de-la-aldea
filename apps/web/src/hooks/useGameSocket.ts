'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface GameSocketEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  gameId: string;
}

export function useGameSocket(
  gameId: string | null,
  playerId: string | null,
  onEvent: (event: GameSocketEvent) => void,
) {
  const socketRef = useRef<Socket | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!gameId || !playerId) return;

    const socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000');
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_game', { gameId, playerId });
    });

    socket.on('game_event', (event: GameSocketEvent) => {
      onEventRef.current(event);
    });

    return () => {
      socket.emit('leave_game', { gameId });
      socket.disconnect();
    };
  }, [gameId, playerId]);

  const send = useCallback((event: string, payload: unknown) => {
    socketRef.current?.emit(event, payload);
  }, []);

  return { send };
}
