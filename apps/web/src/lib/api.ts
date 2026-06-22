const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export interface GameStateDTO {
  id: string;
  phase: string;
  dayNumber: number;
  players: PlayerDTO[];
  winner: string | null;
  events: GameEventDTO[];
}

export interface PlayerDTO {
  id: string;
  name: string;
  alive: boolean;
  role: { id: string; team: string };
}

export interface GameEventDTO {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export const api = {
  createGame: (body: { playerNames: string[]; seed?: number; roleIds?: string[] }) =>
    request<GameStateDTO>('/games', { method: 'POST', body: JSON.stringify(body) }),

  getGame: (id: string) =>
    request<GameStateDTO>(`/games/${id}`),

  startNight: (id: string) =>
    request<GameStateDTO>(`/games/${id}/night/start`, { method: 'POST' }),

  queueAction: (id: string, body: { actorId: string; targetId: string; actionType: string; priority: number }) =>
    request<void>(`/games/${id}/night/actions`, { method: 'POST', body: JSON.stringify(body) }),

  resolveNight: (id: string) =>
    request<GameStateDTO>(`/games/${id}/night/resolve`, { method: 'POST' }),

  startDay: (id: string) =>
    request<GameStateDTO>(`/games/${id}/day/start`, { method: 'POST' }),

  startVoting: (id: string) =>
    request<GameStateDTO>(`/games/${id}/voting/start`, { method: 'POST' }),

  castVote: (id: string, body: { voterId: string; targetId: string }) =>
    request<GameStateDTO>(`/games/${id}/votes`, { method: 'POST', body: JSON.stringify(body) }),

  executePlayer: (id: string) =>
    request<GameStateDTO>(`/games/${id}/execute`, { method: 'POST' }),
};
