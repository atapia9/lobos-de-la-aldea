'use client';

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  SETUP:      { label: 'Preparación', color: 'bg-gray-700' },
  NIGHT:      { label: 'Noche',       color: 'bg-indigo-900' },
  DAWN:       { label: 'Amanecer',    color: 'bg-orange-900' },
  DISCUSSION: { label: 'Discusión',   color: 'bg-blue-900' },
  VOTING:     { label: 'Votación',    color: 'bg-yellow-800' },
  RESOLUTION: { label: 'Resolución',  color: 'bg-gray-800' },
  GAME_OVER:  { label: 'Fin',         color: 'bg-red-900' },
};

export function PhaseTag({ phase }: { phase: string }) {
  const meta = PHASE_LABELS[phase] ?? { label: phase, color: 'bg-gray-700' };
  return (
    <span className={`${meta.color} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider`}>
      {meta.label}
    </span>
  );
}
