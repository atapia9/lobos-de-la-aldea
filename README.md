# Lobos de la Aldea

Multiplayer social deduction game engine (Werewolf / Mafia style, 5–50 players). TypeScript monorepo with a NestJS REST API, Socket.IO real-time layer, Next.js 14 frontend, and an AI narrator powered by Claude.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | TypeScript · Node.js 22 · NestJS |
| Realtime | Socket.IO |
| Frontend | Next.js 14 · React 18 · Tailwind CSS |
| AI Narrator | Anthropic Claude (`claude-opus-4-8`) |
| Testing | Vitest (≥95% coverage) |
| Monorepo | Turborepo |

## Repository structure

```
lobos-de-la-aldea/
├── apps/
│   ├── api/          # NestJS REST API + WebSocket gateway
│   └── web/          # Next.js 14 frontend
└── packages/
    ├── game-engine/      # Core game loop, roles, event bus, night resolver
    ├── rules-engine/     # Voting logic, victory conditions
    ├── balance-engine/   # Monte Carlo simulation, auto-composition
    └── narrator-engine/  # Phrase bank + Claude AI narrator
```

## Game flow

```
GAME_CREATED → ROLE_ASSIGNED → NIGHT_STARTED
  → PLAYER_KILLED | PLAYER_PROTECTED
  → DAY_STARTED → VOTE_CAST
  → PLAYER_EXECUTED → GAME_ENDED
```

Every state change produces an immutable `GameEvent`. No component modifies state directly — all changes flow through the GameEngine pipeline.

> **Critical:** `PLAYER_EXECUTED` ≠ `PLAYER_KILLED`. The Jester (Bufón) wins only by village execution, never by werewolf attack.

## AI Narrator

Each game event is narrated in Spanish via Claude with a 2 000 ms timeout. If the API is unavailable or slow, the engine falls back to the phrase bank automatically.

```ts
const narrator = new NarratorEngine({
  aiNarrator: new AiNarrator({ apiKey: process.env.ANTHROPIC_API_KEY }),
});

const result = await narrator.narrateAsync(event, state);
// result.aiGenerated → true  (Claude)  or  false  (phrase bank fallback)
```

## Getting started

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Start the API (port 3001)
cd apps/api && npm run start:dev

# Start the frontend (port 3000)
cd apps/web && npm run dev
```

Set `ANTHROPIC_API_KEY` in your environment to enable the AI narrator.

## REST API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/games` | Create a game |
| `GET` | `/games/:id` | Get game state |
| `POST` | `/games/:id/night` | Start night phase |
| `POST` | `/games/:id/actions` | Queue a night action |
| `POST` | `/games/:id/resolve` | Resolve night |
| `POST` | `/games/:id/day` | Start day / discussion |
| `POST` | `/games/:id/voting` | Open voting |
| `POST` | `/games/:id/vote` | Cast a vote |
| `POST` | `/games/:id/execute` | Execute player (majority vote) |
| `POST` | `/games/:id/end` | Force end game |

## WebSocket events

Connect to the Socket.IO server and join a room:

```js
socket.emit('join_game', { gameId });
socket.on('game_event', (event) => { /* handle event */ });
```

## Roles

Roles are JSON-configured — add a new role by dropping a file in `packages/game-engine/roles/`. The engine loads them dynamically; no motor code changes needed.

Implemented roles: Villager, Werewolf, Seer, Guardian, Jester, Hunter.

## Sprints delivered

| # | Deliverable |
|---|------------|
| 1 | Game Engine — player, role, game loop, event bus |
| 2 | Rules Engine — voting, victory conditions |
| 3 | Balance Engine — Monte Carlo simulation |
| 4 | Narrator Engine — phrase bank, template engine |
| 5 | REST API — full game lifecycle |
| 6 | WebSocket — real-time event broadcast |
| 7 | Frontend — lobby, game board, event log |
| 8 | AI Narrator — Claude integration with fallback |

## License

MIT
