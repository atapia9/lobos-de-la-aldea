import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '@/lib/api';

const MOCK_GAME = { id: 'g1', phase: 'SETUP', dayNumber: 0, players: [], winner: null, events: [] };

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response);
}

describe('api client', () => {
  afterEach(() => vi.restoreAllMocks());

  it('createGame POSTs to /games', async () => {
    const spy = mockFetch(MOCK_GAME);
    await api.createGame({ playerNames: ['A', 'B'] });
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/games'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('getGame GETs /games/:id', async () => {
    const spy = mockFetch(MOCK_GAME);
    await api.getGame('g1');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/games/g1'), expect.anything());
  });

  it('startNight POSTs to /games/:id/night/start', async () => {
    const spy = mockFetch(MOCK_GAME);
    await api.startNight('g1');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/night/start'), expect.anything());
  });

  it('castVote POSTs to /games/:id/votes', async () => {
    const spy = mockFetch(MOCK_GAME);
    await api.castVote('g1', { voterId: 'v1', targetId: 'v2' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/votes'), expect.objectContaining({ method: 'POST' }));
  });

  it('throws on non-ok response', async () => {
    mockFetch('Not Found', false, 404);
    await expect(api.getGame('bad')).rejects.toThrow('API 404');
  });
});
