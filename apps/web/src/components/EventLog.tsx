'use client';
import type { GameEventDTO } from '@/lib/api';

const EVENT_ICONS: Record<string, string> = {
  GAME_CREATED:    '🎮',
  ROLE_ASSIGNED:   '🎭',
  NIGHT_STARTED:   '🌙',
  PLAYER_KILLED:   '💀',
  PLAYER_PROTECTED:'🛡',
  DAY_STARTED:     '☀️',
  VOTE_CAST:       '🗳',
  PLAYER_EXECUTED: '⚖️',
  GAME_ENDED:      '🏆',
  PHASE_STARTED:   '▶',
  PHASE_ENDED:     '⏹',
};

export function EventLog({ events }: { events: GameEventDTO[] }) {
  return (
    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto text-xs text-gray-300 pr-1">
      {[...events].reverse().map((e) => (
        <div key={e.id} className="flex gap-2 items-start">
          <span>{EVENT_ICONS[e.type] ?? '•'}</span>
          <span className="font-mono text-gray-500">{e.type}</span>
        </div>
      ))}
    </div>
  );
}
