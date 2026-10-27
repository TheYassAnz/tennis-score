'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, LeaderboardEntry } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import AuthGuard from '@/components/AuthGuard'
import BottomNav from '@/components/BottomNav'
import Avatar from '@/components/Avatar'
import { Trophy, Medal } from 'lucide-react'
import { PageTransition } from '@/components/PageTransition'
import { motion } from 'framer-motion'

const medalColors = ['#F59E0B', '#9CA3AF', '#B45309']

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getLeaderboard().then(setEntries).finally(() => setLoading(false))
  }, [])

  return (
    <AuthGuard>
      <PageTransition>
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
              <div className="glass-card rounded-2xl p-10 text-center text-muted">
                Aucun joueur
              </div>
            ) : (
              <motion.div
                className="space-y-3"
                variants={listVariants}
                initial="hidden"
                animate="show"
              >
                {entries.map((entry, i) => {
                  const isMe = entry.userId === user?.id
                  const href = isMe ? '/profile' : `/profile/${entry.userId}`
                  return (
                    <motion.div key={entry.userId} variants={itemVariants}>
                      <Link
                        href={href}
                        className={`flex items-center gap-4 glass-card rounded-2xl px-4 py-4 transition active:scale-[0.98] ${
                          isMe ? 'border-primary/40' : ''
                        }`}
                      >
                        <div className="w-8 flex items-center justify-center shrink-0">
                          {i < 3 ? (
                            <Medal size={22} style={{ color: medalColors[i] }} strokeWidth={1.75} />
                          ) : (
                            <span className="text-muted font-bold text-sm">{i + 1}</span>
                          )}
                        </div>

                        <Avatar
                          user={entry}
                          size={40}
                          className={isMe ? 'ring-2 ring-primary' : ''}
                        />

                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate ${isMe ? 'text-primary' : 'text-body'}`}>
                            {entry.firstName} {entry.lastName}
                            {isMe && <span className="text-xs ml-2 opacity-60">moi</span>}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            @{entry.username} · {entry.total} match{entry.total !== 1 ? 's' : ''}
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
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </div>

          <BottomNav />
        </div>
      </PageTransition>
    </AuthGuard>
  )
}
