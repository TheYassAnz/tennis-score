'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api, Match } from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'
import { Plus, LogOut } from 'lucide-react'
import MatchCard from '@/components/MatchCard'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMatches()
      .then(setMatches)
      .finally(() => setLoading(false))
  }, [])

  const inProgress = matches.filter((m) => m.status === 'IN_PROGRESS')
  const recent = matches.filter((m) => m.status === 'COMPLETED').slice(0, 5)

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-full pb-20">
        {/* Header */}
        <header className="flex items-center justify-between px-4 pt-12 pb-6">
          <div>
            <p className="text-sm text-gray-400">Bonjour,</p>
            <h1 className="text-xl font-bold text-white">{user?.username} 👋</h1>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <LogOut size={18} />
          </button>
        </header>

        <div className="px-4 space-y-6 flex-1">
          {/* CTA */}
          <Link
            href="/match/new"
            className="flex items-center justify-center gap-3 rounded-2xl bg-green-600 py-5 text-white font-semibold text-lg shadow-lg shadow-green-900/30 active:scale-95 transition-transform"
          >
            <Plus size={24} />
            Nouveau match
          </Link>

          {/* Matchs en cours */}
          {inProgress.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                En cours
              </h2>
              <div className="space-y-3">
                {inProgress.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          )}

          {/* Matchs récents */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Récents
            </h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
              </div>
            ) : recent.length === 0 ? (
              <div className="rounded-2xl bg-gray-900 border border-gray-800 p-8 text-center text-gray-500 text-sm">
                Aucun match enregistré
              </div>
            ) : (
              <div className="space-y-3">
                {recent.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            )}
          </section>
        </div>

        <BottomNav />
      </div>
    </AuthGuard>
  )
}
