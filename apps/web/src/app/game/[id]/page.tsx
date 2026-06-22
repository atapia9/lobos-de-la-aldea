'use client';
import { use, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useGameStore } from '@/store/gameStore';
import { useGameSocket } from '@/hooks/useGameSocket';
import { PlayerCard } from '@/components/PlayerCard';
import { PhaseTag } from '@/components/PhaseTag';
import { EventLog } from '@/components/EventLog';

const PHASE_ACTIONS: Record<string, string> = {
  SETUP: 'La partida está lista.',
  NIGHT: 'Es de noche. Los lobos actúan...',
  DAWN: 'El amanecer llega a la aldea...',
  DISCUSSION: 'Debatan y encuentren al traidor.',
  VOTING: 'Ha llegado la hora de votar.',
  RESOLUTION: 'Resolviendo...',
  GAME_OVER: '',
};

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const store = useGameStore();

  // Load initial state
  useEffect(() => {
    api.getGame(id).then(store.setGame).catch(console.error);
  }, [id]);

  // Sync WebSocket events
  const onEvent = useCallback(() => {
    api.getGame(id).then(store.setGame).catch(console.error);
  }, [id]);

  useGameSocket(id, 'host', onEvent);

  async function advance(action: () => Promise<typeof store.game>) {
    const updated = await action();
    if (updated) store.setGame(updated);
  }

  const { game, selectedTargetId, selectTarget } = store;
  if (!game) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;

  const phase = game.phase;
  const alive = game.players.filter((p) => p.alive);
  const dead = game.players.filter((p) => !p.alive);

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-yellow-500">Lobos de la Aldea</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Día {game.dayNumber}</span>
          <PhaseTag phase={phase} />
        </div>
      </div>

      {/* Narrator / phase description */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 italic min-h-12">
        {PHASE_ACTIONS[phase] ?? ''}
      </div>

      {/* Victory banner */}
      {phase === 'GAME_OVER' && (
        <div className="text-center py-6 bg-yellow-900 rounded-lg">
          <div className="text-3xl mb-2">{game.winner === 'VILLAGE' ? '🏡' : game.winner === 'WEREWOLF' ? '🐺' : '🃏'}</div>
          <div className="text-xl font-bold text-yellow-300">
            {game.winner === 'VILLAGE' && '¡La Aldea Triunfa!'}
            {game.winner === 'WEREWOLF' && '¡Los Lobos Ganan!'}
            {game.winner === 'NEUTRAL' && '¡El Bufón Ríe el Último!'}
          </div>
        </div>
      )}

      {/* Players grid */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Jugadores Vivos ({alive.length})</h2>
        <div className="grid grid-cols-3 gap-2">
          {alive.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              selected={selectedTargetId === p.id}
              onClick={phase === 'VOTING' ? () => selectTarget(p.id) : undefined}
            />
          ))}
        </div>
        {dead.length > 0 && (
          <>
            <h2 className="text-xs uppercase tracking-widest text-gray-600 mt-4 mb-2">Eliminados ({dead.length})</h2>
            <div className="grid grid-cols-3 gap-2">
              {dead.map((p) => (
                <PlayerCard key={p.id} player={p} showRole />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Phase action buttons */}
      {phase !== 'GAME_OVER' && (
        <section className="space-y-2">
          {phase === 'SETUP' && (
            <button
              onClick={() => advance(() => api.startNight(id))}
              className="w-full py-3 bg-indigo-900 hover:bg-indigo-800 rounded-lg font-semibold transition-colors"
            >
              🌙 Iniciar Noche
            </button>
          )}
          {phase === 'NIGHT' && (
            <button
              onClick={() => advance(() => api.resolveNight(id))}
              className="w-full py-3 bg-indigo-700 hover:bg-indigo-600 rounded-lg font-semibold transition-colors"
            >
              ☀️ Resolver Noche
            </button>
          )}
          {(phase === 'DAWN' || phase === 'RESOLUTION') && (
            <button
              onClick={() => advance(() => api.startDay(id))}
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 rounded-lg font-semibold transition-colors"
            >
              💬 Iniciar Discusión
            </button>
          )}
          {phase === 'DISCUSSION' && (
            <button
              onClick={() => advance(() => api.startVoting(id))}
              className="w-full py-3 bg-yellow-800 hover:bg-yellow-700 rounded-lg font-semibold transition-colors"
            >
              🗳 Abrir Votación
            </button>
          )}
          {phase === 'VOTING' && (
            <button
              onClick={() => advance(() => api.executePlayer(id))}
              className="w-full py-3 bg-red-900 hover:bg-red-800 rounded-lg font-semibold transition-colors"
            >
              ⚖️ Ejecutar Veredicto
            </button>
          )}
        </section>
      )}

      {/* Event log */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Registro de Eventos</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
          <EventLog events={game.events} />
        </div>
      </section>
    </main>
  );
}
