'use client';
import type { PlayerDTO } from '@/lib/api';

interface Props {
  player: PlayerDTO;
  showRole?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const TEAM_COLORS: Record<string, string> = {
  VILLAGE: 'border-yellow-600',
  WEREWOLF: 'border-red-800',
  NEUTRAL: 'border-purple-600',
};

export function PlayerCard({ player, showRole = false, selected = false, onClick }: Props) {
  const teamColor = TEAM_COLORS[player.role.team] ?? 'border-gray-600';
  const deadStyle = !player.alive ? 'opacity-40 line-through' : '';
  const selectedStyle = selected ? 'ring-2 ring-yellow-400' : '';

  return (
    <button
      onClick={onClick}
      disabled={!player.alive || !onClick}
      className={`
        relative p-3 rounded-lg border-2 text-left transition-all
        bg-gray-900 ${teamColor} ${deadStyle} ${selectedStyle}
        disabled:cursor-default hover:enabled:brightness-125
      `}
      aria-label={`${player.name}${!player.alive ? ' (eliminado)' : ''}`}
    >
      <div className="font-semibold text-sm">{player.name}</div>
      {showRole && (
        <div className="text-xs text-gray-400 mt-1 capitalize">{player.role.id}</div>
      )}
      {!player.alive && (
        <span className="absolute top-1 right-1 text-xs">☠</span>
      )}
    </button>
  );
}
