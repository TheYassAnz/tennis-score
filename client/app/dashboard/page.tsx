'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api, Match } from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import MatchCard from '@/components/MatchCard'
import { PageTransition } from '@/components/PageTransition'
import { motion } from 'framer-motion'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

export default function DashboardPage() {
  const { user } = useAuth()
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
      <PageTransition>
        <div className="flex flex-col min-h-full pb-20 bg-page">
          <header className="flex items-center justify-between px-4 pt-12 pb-6">
            <div>
              <p className="text-sm text-muted">Bonjour,</p>
              <h1 className="text-xl font-bold text-body">{user?.username}</h1>
            </div>
          </header>

          <div className="px-4 space-y-6 flex-1">
            <motion.div
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Link
                href="/match/new"
                className="flex items-center justify-center gap-3 rounded-2xl bg-primary py-5 text-white font-semibold text-lg shadow-lg active:scale-95 transition-transform"
              >
                <Plus size={24} />
                Nouveau match
              </Link>
            </motion.div>

            {inProgress.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">En cours</h2>
                <motion.div
                  className="space-y-3"
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                >
                  {inProgress.map((m) => <MatchCard key={m.id} match={m} />)}
                </motion.div>
              </section>
            )}

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Récents</h2>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 spinner" />
                </div>
              ) : recent.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center text-muted text-sm">
                  Aucun match enregistré
                </div>
              ) : (
                <motion.div
                  className="space-y-3"
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                >
                  {recent.map((m) => <MatchCard key={m.id} match={m} />)}
                </motion.div>
              )}
            </section>
          </div>

          <BottomNav />
        </div>
      </PageTransition>
    </AuthGuard>
  )
}
