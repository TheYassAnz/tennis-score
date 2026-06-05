'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, MatchWithState } from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeft, RotateCcw, CheckCircle } from 'lucide-react'
import ManualResult from '@/components/ManualResult'

export default function MatchPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [match, setMatch] = useState<MatchWithState | null>(null)
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(false)

  const fetchMatch = useCallback(async () => {
    const data = await api.getMatch(id)
    setMatch(data)
  }, [id])

  useEffect(() => {
    fetchMatch().finally(() => setLoading(false))
  }, [fetchMatch])

  async function addPoint(scorer: 'HOME' | 'AWAY') {
    if (scoring || !match || match.status !== 'IN_PROGRESS') return
    setScoring(true)
    try {
      const updated = await api.addPoint(id, scorer)
      setMatch(updated)
    } finally {
      setScoring(false)
    }
  }

  async function undoPoint() {
    if (scoring || !match) return
    setScoring(true)
    try {
      const updated = await api.undoPoint(id)
      setMatch(updated)
    } finally {
      setScoring(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
        </div>
      </AuthGuard>
    )
  }

  if (!match) return null

  const homePlayers = match.players.filter((p) => p.side === 'HOME')
  const awayPlayers = match.players.filter((p) => p.side === 'AWAY')
  const homeNames = homePlayers.map((p) => p.user.username).join(' / ')
  const awayNames = awayPlayers.map((p) => p.user.username).join(' / ')

  const myPlayer = match.players.find((p) => p.userId === user?.id)
  const mySide = myPlayer?.side
  const isWin = match.status === 'COMPLETED' && match.winnerSide === mySide

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-full bg-gray-950">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 pt-12 pb-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 rounded-full bg-gray-800 text-gray-400">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <p className="text-xs text-gray-400">
              {match.type === 'DOUBLE' ? 'Double' : 'Simple'} •{' '}
              {match.mode === 'LIVE' ? 'En direct' : 'Résultat manuel'}
            </p>
          </div>
          {match.status === 'IN_PROGRESS' && match.mode === 'LIVE' && (
            <button
              onClick={undoPoint}
              disabled={scoring || !match.points?.length}
              className="p-2 rounded-full bg-gray-800 text-gray-400 disabled:opacity-30"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </header>

        {/* Match terminé */}
        {match.status === 'COMPLETED' && (
          <div className={`mx-4 rounded-2xl py-4 px-6 mb-2 flex items-center gap-3 ${
            isWin ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-800 border border-gray-700'
          }`}>
            <CheckCircle size={20} className={isWin ? 'text-green-400' : 'text-gray-400'} />
            <div>
              <p className={`font-semibold ${isWin ? 'text-green-400' : 'text-gray-300'}`}>
                {isWin ? 'Victoire !' : mySide ? 'Défaite' : 'Match terminé'}
              </p>
              <p className="text-xs text-gray-500">
                {match.winnerSide === 'HOME' ? homeNames : awayNames} remporte le match
              </p>
            </div>
          </div>
        )}

        {/* Mode MANUAL: saisie du résultat */}
        {match.mode === 'MANUAL' && match.status === 'IN_PROGRESS' ? (
          <ManualResult matchId={match.id} onDone={fetchMatch} />
        ) : (
          <>
            {/* Scoreboard */}
            <div className="mx-4 mt-2 rounded-3xl bg-gray-900 border border-gray-800 overflow-hidden">
              {/* Sets */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-stretch gap-0">
                  {/* Noms */}
                  <div className="flex-1 space-y-4 mr-4">
                    <div className="flex items-center gap-2 h-10">
                      <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold shrink-0">
                        {homeNames[0]?.toUpperCase()}
                      </div>
                      <span className={`font-semibold text-sm truncate ${
                        match.winnerSide === 'HOME' ? 'text-green-400' : 'text-white'
                      }`}>
                        {homeNames}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 h-10">
                      <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-sm font-bold shrink-0">
                        {awayNames[0]?.toUpperCase()}
                      </div>
                      <span className={`font-semibold text-sm truncate ${
                        match.winnerSide === 'AWAY' ? 'text-green-400' : 'text-white'
                      }`}>
                        {awayNames}
                      </span>
                    </div>
                  </div>

                  {/* Sets complétés */}
                  <div className="flex gap-2">
                    {(match.state?.completedSets || match.sets).map((set, i) => {
                      const home = 'home' in set ? set.home : set.homeGames
                      const away = 'away' in set ? set.away : set.awayGames
                      return (
                        <div key={i} className="flex flex-col items-center gap-4 w-8">
                          <span className={`text-lg font-bold h-10 flex items-center ${
                            home > away ? 'text-white' : 'text-gray-500'
                          }`}>{home}</span>
                          <span className={`text-lg font-bold h-10 flex items-center ${
                            away > home ? 'text-white' : 'text-gray-500'
                          }`}>{away}</span>
                        </div>
                      )
                    })}

                    {/* Set en cours */}
                    {match.state && (
                      <div className="flex flex-col items-center gap-4 w-10 border-l border-gray-700 pl-2">
                        <span className="text-xl font-bold text-green-400 h-10 flex items-center">
                          {match.state.currentSet.homeGames}
                        </span>
                        <span className="text-xl font-bold text-green-400 h-10 flex items-center">
                          {match.state.currentSet.awayGames}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Score du jeu en cours */}
                  {match.state && (
                    <div className="flex flex-col items-center gap-4 w-14 border-l border-gray-700 pl-2">
                      <span className={`text-2xl font-bold h-10 flex items-center ${
                        match.state.currentGame.homeLabel === 'AD' ? 'text-yellow-400' : 'text-white'
                      }`}>
                        {match.state.currentGame.homeLabel}
                      </span>
                      <span className={`text-2xl font-bold h-10 flex items-center ${
                        match.state.currentGame.awayLabel === 'AD' ? 'text-yellow-400' : 'text-white'
                      }`}>
                        {match.state.currentGame.awayLabel}
                      </span>
                    </div>
                  )}
                </div>

                {match.state?.currentSet.isTiebreak && (
                  <p className="text-center text-xs text-yellow-400 mt-3">Tie-break</p>
                )}
              </div>
            </div>

            {/* Boutons de score (mode live, match en cours) */}
            {match.mode === 'LIVE' && match.status === 'IN_PROGRESS' && (
              <div className="flex gap-3 px-4 mt-6 flex-1 items-stretch">
                <ScoreButton
                  label={homeNames}
                  color="blue"
                  onPress={() => addPoint('HOME')}
                  disabled={scoring}
                />
                <ScoreButton
                  label={awayNames}
                  color="orange"
                  onPress={() => addPoint('AWAY')}
                  disabled={scoring}
                />
              </div>
            )}
          </>
        )}
      </div>
    </AuthGuard>
  )
}

function ScoreButton({
  label,
  color,
  onPress,
  disabled,
}: {
  label: string
  color: 'blue' | 'orange'
  onPress: () => void
  disabled: boolean
}) {
  const colors = {
    blue: 'bg-blue-600 active:bg-blue-500 shadow-blue-900/40',
    orange: 'bg-orange-600 active:bg-orange-500 shadow-orange-900/40',
  }

  return (
    <button
      onClick={onPress}
      disabled={disabled}
      className={`flex-1 rounded-3xl ${colors[color]} shadow-xl min-h-[200px] flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50 select-none`}
    >
      <span className="text-4xl font-bold text-white">+1</span>
      <span className="text-sm text-white/70 font-medium px-2 text-center truncate w-full px-4">
        {label}
      </span>
    </button>
  )
}
