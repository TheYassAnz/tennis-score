# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **client/** — Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **server/** — Node.js + Express + Prisma ORM + PostgreSQL (Railway)
- **Auth** — JWT (30d expiry) stored in `localStorage`, bcryptjs for passwords

## Commands

**Client** (in `client/`):
```
npm run dev       # localhost:3000
npm run build
```

**Server** (in `server/`):
```
npm run dev       # nodemon, port 4000
npm run start
npm run db:migrate   # prisma migrate dev
npm run db:push      # push schema without migration history
npm run db:generate  # regenerate Prisma client after schema changes
```

## Environment variables

**server/.env** (copy from `.env.example`):
- `DATABASE_URL` — PostgreSQL connection string from Railway
- `JWT_SECRET` — random secret
- `PORT` — default 4000
- `CLIENT_URL` — CORS origin (default `http://localhost:3000`)

**client/.env.local**:
- `NEXT_PUBLIC_API_URL` — e.g. `http://localhost:4000/api`

## Architecture

### Server (`server/`)

```
server.js                   # Express entry point
src/
  lib/
    prisma.js               # Shared PrismaClient singleton
    tennis.js               # Pure tennis scoring logic (no DB)
  middleware/
    auth.js                 # JWT Bearer token verification → req.user
  routes/
    auth.js                 # POST /auth/register, /auth/login, GET /auth/me
    matches.js              # CRUD + point scoring + result submission
    stats.js                # GET /stats/:userId — win/loss/sets/games/per-opponent
    leaderboard.js          # GET /leaderboard — all users sorted by wins
    users.js                # GET /users — club user list for match creation
```

**Tennis logic** (`src/lib/tennis.js`): stateless functions that take `points[]` and `sets[]` arrays and return the current game/set/match state. No DB calls. Used by the `/point` route after each point is added.

**Scoring flow** (live mode):
1. Client calls `POST /matches/:id/point { scorer: 'HOME'|'AWAY' }`
2. Server fetches all existing points + completed sets
3. Calls `resolvePoint()` to check if game/set/match is over
4. Persists the point, conditionally persists a new Set row and/or closes the match
5. Returns full match + recomputed `state` object

### Client (`client/`)

```
app/
  page.tsx                  # Redirect → /login or /dashboard
  layout.tsx                # Wraps everything in <AuthProvider>
  login/page.tsx
  register/page.tsx
  dashboard/page.tsx        # Recent matches + new match CTA
  match/
    new/page.tsx            # Match creation (type, mode, player picker)
    [id]/page.tsx           # Live scoreboard OR completed match view
  history/page.tsx          # Completed matches with V/D filter
  stats/page.tsx            # Personal stats + per-opponent breakdown
  leaderboard/page.tsx      # Club ranking

context/
  AuthContext.tsx           # useAuth() — user, login, register, logout

lib/
  api.ts                    # All API calls + TypeScript types
  utils.ts                  # formatDistanceToNow()

components/
  AuthGuard.tsx             # Redirects unauthenticated users to /login
  BottomNav.tsx             # Fixed bottom navigation (4 tabs)
  MatchCard.tsx             # Match summary card used in dashboard/history
  ManualResult.tsx          # Set score input form for MANUAL mode matches
```

**Auth pattern**: `AuthGuard` wraps every protected page. `AuthProvider` checks `localStorage` for a token on mount and calls `/auth/me` to hydrate the user.

**Scoring UI** (`match/[id]/page.tsx`): two large `ScoreButton` components occupying 90% of the screen. Each tap calls `addPoint()` which hits the API and updates state. The undo button calls `DELETE /matches/:id/point`.

## Data model (key relationships)

- `Match` has many `MatchPlayer` (links users to a side HOME/AWAY + position 1/2)
- `Match` has many `Set` (only completed sets are stored; current set is derived live)
- `Match` has many `Point` (only in LIVE mode; MANUAL mode uses Set rows directly)
- Match winner is best-of-3 sets; set winner is first to 6 with 2-game lead or 7-5; tie-break at 6-6 (first to 7 with 2-point lead)
