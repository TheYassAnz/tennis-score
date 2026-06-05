'use client'

import { useEffect, useState } from 'react'
import { api, LeaderboardEntry } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import AuthGuard from '@/components/AuthGuard'
import BottomNav from '@/components/BottomNav'
import { Trophy } from 'lucide-react'

const medals = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getLeaderboard()
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-full pb-20">
        <header className="px-4 pt-12 pb-6 flex items-center gap-3">
          <Trophy className="text-yellow-400" size={24} />
          <h1 className="text-xl font-bold text-white">Classement du club</h1>
        </header>

        <div className="px-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl bg-gray-900 border border-gray-800 p-10 text-center text-gray-500">
              Aucun joueur
            </div>
          ) : (
            entries.map((entry, i) => {
              const isMe = entry.userId === user?.id
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 rounded-2xl px-4 py-4 border transition ${
                    isMe
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-gray-900 border-gray-800'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center shrink-0">
                    {i < 3 ? (
                      <span className="text-xl">{medals[i]}</span>
                    ) : (
                      <span className="text-gray-500 font-bold">{i + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isMe ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {entry.username[0].toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isMe ? 'text-green-400' : 'text-white'}`}>
                      {entry.username}
                      {isMe && <span className="text-xs ml-2 text-green-500/70">moi</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{entry.total} match{entry.total !== 1 ? 's' : ''}</p>
                  </div>

                  {/* Stats */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-white">
                      <span className="text-green-400">{entry.wins}</span>
                      <span className="text-gray-600 mx-1">/</span>
                      <span className="text-red-400">{entry.losses}</span>
                    </p>
                    <p className="text-xs text-gray-500">{entry.winRate}%</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <BottomNav />
      </div>
    </AuthGuard>
  )
}
