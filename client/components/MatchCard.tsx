'use client'

import { Match } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { formatDistanceToNow } from '@/lib/utils'

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

  const score = match.sets
    .map((s) => `${s.homeGames}-${s.awayGames}`)
    .join('  ')

  return (
    <Link
      href={`/match/${match.id}`}
      className="block rounded-2xl bg-gray-900 border border-gray-800 p-4 active:scale-95 transition-transform"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              match.status === 'IN_PROGRESS'
                ? 'bg-yellow-500/20 text-yellow-400'
                : isWin
                ? 'bg-green-500/20 text-green-400'
                : isLoss
                ? 'bg-red-500/20 text-red-400'
                : 'bg-gray-700 text-gray-400'
            }`}>
              {match.status === 'IN_PROGRESS' ? 'En cours' : isWin ? 'Victoire' : isLoss ? 'Défaite' : 'Terminé'}
            </span>
            <span className="text-xs text-gray-600">
              {match.type === 'DOUBLE' ? 'Double' : 'Simple'}
            </span>
          </div>

          <div className="space-y-1">
            <p className={`font-semibold text-sm truncate ${mySide === 'HOME' ? 'text-white' : 'text-gray-400'}`}>
              {homePlayers.join(' / ')}
            </p>
            <p className="text-xs text-gray-600">vs</p>
            <p className={`font-semibold text-sm truncate ${mySide === 'AWAY' ? 'text-white' : 'text-gray-400'}`}>
              {awayPlayers.join(' / ')}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          {score ? (
            <p className="font-mono text-sm text-white whitespace-pre">{score}</p>
          ) : (
            <p className="text-xs text-gray-600">—</p>
          )}
          <p className="text-xs text-gray-600 mt-1">
            {formatDistanceToNow(match.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  )
}
