'use client'

import { useEffect, useState } from 'react'
import { api, UserStats } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import AuthGuard from '@/components/AuthGuard'
import BottomNav from '@/components/BottomNav'

export default function StatsPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    api.getStats(user.id)
      .then(setStats)
      .finally(() => setLoading(false))
  }, [user])

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-full pb-20">
        <header className="px-4 pt-12 pb-6">
          <h1 className="text-xl font-bold text-white">Mes statistiques</h1>
          <p className="text-sm text-gray-400">{user?.username}</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
          </div>
        ) : stats ? (
          <div className="px-4 space-y-4">
            {/* Win rate */}
            <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Taux de victoire</p>
                  <p className="text-5xl font-bold text-white">{stats.winRate}%</p>
                </div>
                <p className="text-sm text-gray-500">{stats.totalMatches} matchs</p>
              </div>
              {/* Progress bar */}
              <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${stats.winRate}%` }}
                />
              </div>
            </div>

            {/* V/D */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-5 text-center">
                <p className="text-4xl font-bold text-green-400">{stats.wins}</p>
                <p className="text-sm text-green-500/70 mt-1">Victoires</p>
              </div>
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-5 text-center">
                <p className="text-4xl font-bold text-red-400">{stats.losses}</p>
                <p className="text-sm text-red-500/70 mt-1">Défaites</p>
              </div>
            </div>

            {/* Sets & Jeux */}
            <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Sets & Jeux</p>
              <div className="space-y-3">
                <StatRow
                  label="Sets gagnés"
                  value={stats.setsWon}
                  total={stats.setsWon + stats.setsLost}
                  color="bg-blue-500"
                />
                <StatRow
                  label="Jeux gagnés"
                  value={stats.gamesWon}
                  total={stats.gamesWon + stats.gamesLost}
                  color="bg-purple-500"
                />
              </div>
            </div>

            {/* Par adversaire */}
            {stats.opponents.length > 0 && (
              <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Par adversaire
                </p>
                <div className="space-y-3">
                  {stats.opponents.map((opp) => (
                    <div key={opp.username} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
                          {opp.username[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-white">{opp.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-400 font-semibold">{opp.wins}V</span>
                        <span className="text-gray-600">/</span>
                        <span className="text-sm text-red-400 font-semibold">{opp.losses}D</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <BottomNav />
      </div>
    </AuthGuard>
  )
}

function StatRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-semibold">{value} / {total}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
