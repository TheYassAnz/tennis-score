'use client'

import { Match } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { formatDistanceToNow } from '@/lib/utils'
import { motion } from 'framer-motion'

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

interface Props {
  match: Match
}

export default function MatchCard({ match }: Props) {
  const { user } = useAuth()

  const myPlayer = match.players.find((p) => p.userId === user?.id)
  const mySide = myPlayer?.side

  const homePlayers = match.players.filter((p) => p.side === 'HOME').map((p) => p.user.username)
  const awayPlayers = match.players.filter((p) => p.side === 'AWAY').map((p) => p.user.username)

  const isWin = match.status === 'COMPLETED' && match.winnerSide === mySide
  const isLoss = match.status === 'COMPLETED' && match.winnerSide !== mySide && mySide

  const score = match.sets.map((s) => `${s.homeGames}-${s.awayGames}`).join('  ')

  return (
    <motion.div variants={cardVariants}>
    <Link
      href={`/match/${match.id}`}
      className="block glass-card rounded-2xl p-4 active:scale-95 transition-transform"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              match.status === 'IN_PROGRESS'
                ? 'bg-yellow-500/20 text-yellow-400'
                : isWin
                ? 'bg-primary-subtle text-primary'
                : isLoss
                ? 'bg-red-500/20 text-red-400'
                : 'bg-surface-2 text-muted'
            }`}>
              {match.status === 'IN_PROGRESS' ? 'En cours' : isWin ? 'Victoire' : isLoss ? 'Défaite' : 'Terminé'}
            </span>
            <span className="text-xs text-muted">
              {match.type === 'DOUBLE' ? 'Double' : 'Simple'}
            </span>
          </div>

          <div className="space-y-1">
            <p className={`font-semibold text-sm truncate ${mySide === 'HOME' ? 'text-body' : 'text-muted'}`}>
              {homePlayers.join(' / ')}
            </p>
            <p className="text-xs text-muted">vs</p>
            <p className={`font-semibold text-sm truncate ${mySide === 'AWAY' ? 'text-body' : 'text-muted'}`}>
              {awayPlayers.join(' / ')}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          {score ? (
            <p className="font-mono text-sm text-body whitespace-pre">{score}</p>
          ) : (
            <p className="text-xs text-muted">—</p>
          )}
          <p className="text-xs text-muted mt-1">{formatDistanceToNow(match.createdAt)}</p>
        </div>
      </div>
    </Link>
    </motion.div>
  )
}
