'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, LeaderboardEntry } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import AuthGuard from '@/components/AuthGuard'
import BottomNav from '@/components/BottomNav'
import { Trophy, Medal } from 'lucide-react'

const medalColors = ['#F59E0B', '#9CA3AF', '#B45309']

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getLeaderboard().then(setEntries).finally(() => setLoading(false))
  }, [])

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-full pb-20 bg-page">
        <header className="px-4 pt-12 pb-6 flex items-center gap-3">
          <Trophy className="text-accent" size={24} />
          <h1 className="text-xl font-bold text-body">Classement du club</h1>
        </header>

        <div className="px-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 spinner" />
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl bg-surface border border-theme p-10 text-center text-muted">
              Aucun joueur
            </div>
          ) : (
            entries.map((entry, i) => {
              const isMe = entry.userId === user?.id
              const href = isMe ? '/profile' : `/profile/${entry.userId}`
              return (
                <Link
                  key={entry.userId}
                  href={href}
                  className={`flex items-center gap-4 rounded-2xl px-4 py-4 border transition active:scale-[0.98] ${
                    isMe ? 'bg-primary-subtle border-primary-subtle' : 'bg-surface border-theme hover:border-primary/40'
                  }`}
                >
                  <div className="w-8 flex items-center justify-center shrink-0">
                    {i < 3 ? (
                      <Medal size={22} style={{ color: medalColors[i] }} strokeWidth={1.75} />
                    ) : (
                      <span className="text-muted font-bold text-sm">{i + 1}</span>
                    )}
                  </div>

                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isMe ? 'bg-primary-subtle text-primary' : 'bg-surface-2 text-muted'
                  }`}>
                    {entry.username[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isMe ? 'text-primary' : 'text-body'}`}>
                      {entry.username}
                      {isMe && <span className="text-xs ml-2 opacity-60">moi</span>}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {entry.total} match{entry.total !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-body">
                      <span className="text-primary">{entry.wins}</span>
                      <span className="text-muted mx-1">/</span>
                      <span className="text-red-400">{entry.losses}</span>
                    </p>
                    <p className="text-xs text-muted">{entry.winRate}%</p>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        <BottomNav />
      </div>
    </AuthGuard>
  )
}
