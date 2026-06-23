const BASE = process.env.NEXT_PUBLIC_API_URL

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Erreur ${res.status}`)
  }

  return res.json()
}

export const api = {
  // Auth
  register: (data: { username: string; email: string; password: string; firstName?: string; lastName?: string }) =>
    request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { identifier: string; password: string }) =>
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<User>('/auth/me'),

  // Users
  getUsers: () => request<User[]>('/users'),

  // Matches
  createMatch: (data: CreateMatchPayload) =>
    request<Match>('/matches', { method: 'POST', body: JSON.stringify(data) }),

  getMatch: (id: string) => request<MatchWithState>(`/matches/${id}`),

  getMatches: (params?: { userId?: string; status?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Match[]>(`/matches${qs}`)
  },

  addPoint: (matchId: string, scorer: 'HOME' | 'AWAY') =>
    request<MatchWithState>(`/matches/${matchId}/point`, {
      method: 'POST',
      body: JSON.stringify({ scorer }),
    }),

  undoPoint: (matchId: string) =>
    request<MatchWithState>(`/matches/${matchId}/point`, { method: 'DELETE' }),

  submitResult: (matchId: string, sets: SetResult[]) =>
    request<Match>(`/matches/${matchId}/result`, {
      method: 'POST',
      body: JSON.stringify({ sets }),
    }),

  deleteMatch: (id: string) =>
    request<{ success: boolean }>(`/matches/${id}`, { method: 'DELETE' }),

  updateMatch: (id: string, data: UpdateMatchPayload) =>
    request<Match>(`/matches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Auth — update profile
  updateProfile: (data: UpdateProfilePayload) =>
    request<{ user: User }>('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),

  // Auth — reset password
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  // Stats
  getStats: (userId: string) => request<UserStats>(`/stats/${userId}`),

  // Leaderboard
  getLeaderboard: () => request<LeaderboardEntry[]>('/leaderboard'),
}

// Types
export interface User {
  id: string
  username: string
  email: string
  firstName?: string | null
  lastName?: string | null
  createdAt?: string
}

export interface MatchPlayer {
  id: string
  matchId: string
  userId: string
  side: 'HOME' | 'AWAY'
  position: number
  user: { id: string; username: string }
}

export interface Set {
  id: string
  matchId: string
  setNumber: number
  homeGames: number
  awayGames: number
  homeTiebreak?: number
  awayTiebreak?: number
}

export interface Point {
  id: string
  matchId: string
  setNumber: number
  gameNumber: number
  scorer: 'HOME' | 'AWAY'
  createdAt: string
}

export interface Match {
  id: string
  type: 'SINGLE' | 'DOUBLE'
  mode: 'LIVE' | 'MANUAL'
  status: 'IN_PROGRESS' | 'COMPLETED'
  winnerSide?: 'HOME' | 'AWAY'
  createdAt: string
  completedAt?: string
  creatorId?: string
  players: MatchPlayer[]
  sets: Set[]
}

export interface GameState {
  gameNumber: number
  homePoints: number
  awayPoints: number
  homeLabel: string
  awayLabel: string
}

export interface SetState {
  setNumber: number
  homeGames: number
  awayGames: number
  isTiebreak: boolean
}

export interface MatchState {
  completedSets: { setNumber: number; home: number; away: number; tiebreak?: { home: number; away: number } | null }[]
  currentSet: SetState
  currentGame: GameState
}

export interface MatchWithState extends Match {
  points: Point[]
  state: MatchState | null
}

export interface CreateMatchPayload {
  type: 'SINGLE' | 'DOUBLE'
  mode: 'LIVE' | 'MANUAL'
  players: { userId: string; side: 'HOME' | 'AWAY'; position: number }[]
}

export interface SetResult {
  homeGames: number
  awayGames: number
  homeTiebreak?: number
  awayTiebreak?: number
}

export interface UpdateMatchPayload {
  type?: 'SINGLE' | 'DOUBLE'
  mode?: 'LIVE' | 'MANUAL'
  players?: { userId: string; side: 'HOME' | 'AWAY'; position: number }[]
  sets?: SetResult[]
  createdAt?: string
}

export interface UpdateProfilePayload {
  firstName?: string
  lastName?: string
  username?: string
  email?: string
  currentPassword?: string
  newPassword?: string
}

export interface UserStats {
  userId: string
  totalMatches: number
  wins: number
  losses: number
  winRate: number
  setsWon: number
  setsLost: number
  gamesWon: number
  gamesLost: number
  opponents: { username: string; wins: number; losses: number }[]
}

export interface LeaderboardEntry {
  userId: string
  username: string
  firstName: string
  lastName: string
  wins: number
  losses: number
  total: number
  winRate: number
}
