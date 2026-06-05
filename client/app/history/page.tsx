'use client'

import { useEffect, useState } from 'react'
import { api, Match } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import AuthGuard from '@/components/AuthGuard'
import BottomNav from '@/components/BottomNav'
import MatchCard from '@/components/MatchCard'

export default function HistoryPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'SINGLE' | 'DOUBLE'>('ALL')

  useEffect(() => {
    if (!user) return
    api.getMatches({ userId: user.id, status: 'COMPLETED' })
      .then(setMatches)
      .finally(() => setLoading(false))
  }, [user])

  const filtered = filter === 'ALL' ? matches : matches.filter((m) => m.type === filter)

  const wins = matches.filter((m) => {
    const my = m.players.find((p) => p.userId === user?.id)
    return my && m.winnerSide === my.side
  }).length

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-full pb-20">
        <header className="px-4 pt-12 pb-6">
          <h1 className="text-xl font-bold text-white">Historique</h1>
        </header>

        {/* Stats rapides */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <StatChip label="Matchs" value={matches.length} />
            <StatChip label="Victoires" value={wins} color="text-green-400" />
            <StatChip label="Défaites" value={matches.length - wins} color="text-red-400" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-4 mb-4">
          {(['ALL', 'SINGLE', 'DOUBLE'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filter === f
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {f === 'ALL' ? 'Tous' : f === 'SINGLE' ? 'Simple' : 'Double'}
            </button>
          ))}
        </div>

        <div className="px-4 space-y-3 flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-gray-900 border border-gray-800 p-10 text-center text-gray-500">
              Aucun match
            </div>
          ) : (
            filtered.map((m) => <MatchCard key={m.id} match={m} />)
          )}
        </div>

        <BottomNav />
      </div>
    </AuthGuard>
  )
}

function StatChip({ label, value, color = 'text-white' }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
