import { GameEvent, GameState, Player } from '@lobos/game-engine';

export interface NarratorContext {
  event: GameEvent;
  gameState: GameState;
  resolvedVars: Record<string, string | number>;
}

export function buildContext(event: GameEvent, state: GameState): NarratorContext {
  const vars: Record<string, string | number> = {
    dayNumber: state.dayNumber,
    playerCount: state.players.length,
    aliveCount: state.players.filter((p) => p.alive).length,
  };

  const resolvePlayer = (id: unknown): Player | undefined =>
    state.players.find((p) => p.id === id);

  // Enrich common payload fields
  const p = event.payload;

  if (typeof p['playerId'] === 'string') {
    const player = resolvePlayer(p['playerId']);
    if (player) {
      vars['playerName'] = player.name;
      vars['roleDisplay'] = player.role.id;
    }
  }

  if (typeof p['actorId'] === 'string') {
    const actor = resolvePlayer(p['actorId']);
    if (actor) vars['actorName'] = actor.name;
  }

  if (typeof p['targetId'] === 'string') {
    const target = resolvePlayer(p['targetId']);
    if (target) vars['targetName'] = target.name;
  }

  if (typeof p['voterId'] === 'string') {
    const voter = resolvePlayer(p['voterId']);
    if (voter) vars['voterName'] = voter.name;
  }

  if (typeof p['winner'] === 'string') {
    vars['winner'] = p['winner'] as string;
  }

  return { event, gameState: state, resolvedVars: vars };
}
