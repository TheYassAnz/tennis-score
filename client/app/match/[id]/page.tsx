'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, MatchWithState } from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeft, RotateCcw, CheckCircle, Pencil, Trash2 } from 'lucide-react'
import ManualResult from '@/components/ManualResult'
import Avatar from '@/components/Avatar'
import { PageTransition } from '@/components/PageTransition'
import { motion } from 'framer-motion'

export default function MatchPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [match, setMatch] = useState<MatchWithState | null>(null)
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.deleteMatch(id)
      router.push('/dashboard')
    } catch {
      setDeleting(false)
      setShowDeleteModal(false)
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
        <div className="flex h-full items-center justify-center bg-page">
          <div className="h-8 w-8 animate-spin rounded-full border-2 spinner" />
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
  const isCreator = match.creatorId === user?.id

  return (
    <AuthGuard>
      <PageTransition>
      <div className="flex flex-col min-h-full bg-page">
        <header className="flex items-center gap-3 px-4 pt-12 pb-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 rounded-full bg-surface-2 border border-theme text-muted">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <p className="text-xs text-muted">
              {match.type === 'DOUBLE' ? 'Double' : 'Simple'} •{' '}
              {match.mode === 'LIVE' ? 'En direct' : 'Résultat manuel'}
            </p>
          </div>
          {match.status === 'IN_PROGRESS' && match.mode === 'LIVE' && (
            <button
              onClick={undoPoint}
              disabled={scoring || !match.points?.length}
              className="p-2 rounded-full bg-surface-2 border border-theme text-muted disabled:opacity-30"
            >
              <RotateCcw size={18} />
            </button>
          )}
          {isCreator && (
            <>
              <button
                onClick={() => router.push(`/match/${id}/edit`)}
                className="p-2 rounded-full bg-surface-2 border border-theme text-muted"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 rounded-full bg-surface-2 border border-theme text-muted"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </header>

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
            <div className="glass-card rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold text-body mb-2">Supprimer le match</h3>
              <p className="text-sm text-muted mb-6">
                Cette action est irréversible. Le match et tout son historique seront définitivement supprimés.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-xl py-3 border border-theme text-muted font-semibold"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 rounded-xl py-3 bg-red-500 text-white font-semibold disabled:opacity-50"
                >
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {match.status === 'COMPLETED' && (
          <div className={`mx-4 rounded-2xl py-4 px-6 mb-2 flex items-center gap-3 ${
            isWin ? 'bg-primary-subtle border border-primary/30' : 'glass-card'
          }`}>
            <CheckCircle size={20} className={isWin ? 'text-primary' : 'text-muted'} />
            <div>
              <p className={`font-semibold ${isWin ? 'text-primary' : 'text-body'}`}>
                {isWin ? 'Victoire !' : mySide ? 'Défaite' : 'Match terminé'}
              </p>
              <p className="text-xs text-muted">
                {match.winnerSide === 'HOME' ? homeNames : awayNames} remporte le match
              </p>
            </div>
          </div>
        )}

        {match.mode === 'MANUAL' && match.status === 'IN_PROGRESS' ? (
          <ManualResult matchId={match.id} onDone={fetchMatch} />
        ) : (
          <>
            {/* Scoreboard */}
            <div className="mx-4 mt-2 rounded-3xl glass-card overflow-hidden">
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-stretch gap-0">
                  {/* Noms */}
                  <div className="flex-1 space-y-4 mr-4">
                    <div className="flex items-center gap-2 h-10">
                      <Avatar user={homePlayers[0]?.user ?? {}} size={32} />
                      <span className={`font-semibold text-sm truncate ${match.winnerSide === 'HOME' ? 'text-primary' : 'text-body'}`}>
                        {homeNames}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 h-10">
                      <Avatar user={awayPlayers[0]?.user ?? {}} size={32} />
                      <span className={`font-semibold text-sm truncate ${match.winnerSide === 'AWAY' ? 'text-primary' : 'text-body'}`}>
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
                          <span className={`text-lg font-bold h-10 flex items-center ${home > away ? 'text-body' : 'text-muted'}`}>{home}</span>
                          <span className={`text-lg font-bold h-10 flex items-center ${away > home ? 'text-body' : 'text-muted'}`}>{away}</span>
                        </div>
                      )
                    })}

                    {match.state && (
                      <div className="flex flex-col items-center gap-4 w-10 border-l border-theme pl-2">
                        <span className="text-xl font-bold text-primary h-10 flex items-center">
                          {match.state.currentSet.homeGames}
                        </span>
                        <span className="text-xl font-bold text-primary h-10 flex items-center">
                          {match.state.currentSet.awayGames}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Score du jeu */}
                  {match.state && (
                    <div className="flex flex-col items-center gap-4 w-14 border-l border-theme pl-2">
                      <span className={`text-2xl font-bold h-10 flex items-center ${match.state.currentGame.homeLabel === 'AD' ? 'text-accent' : 'text-body'}`}>
                        {match.state.currentGame.homeLabel}
                      </span>
                      <span className={`text-2xl font-bold h-10 flex items-center ${match.state.currentGame.awayLabel === 'AD' ? 'text-accent' : 'text-body'}`}>
                        {match.state.currentGame.awayLabel}
                      </span>
                    </div>
                  )}
                </div>

                {match.state?.currentSet.isTiebreak && (
                  <p className="text-center text-xs text-accent mt-3">Tie-break</p>
                )}
              </div>
            </div>

            {match.mode === 'LIVE' && match.status === 'IN_PROGRESS' && (
              <div className="flex gap-3 px-4 mt-6 flex-1 items-stretch">
                <ScoreButton label={homeNames} side="home" onPress={() => addPoint('HOME')} disabled={scoring} />
                <ScoreButton label={awayNames} side="away" onPress={() => addPoint('AWAY')} disabled={scoring} />
              </div>
            )}
          </>
        )}
      </div>
      </PageTransition>
    </AuthGuard>
  )
}

function ScoreButton({ label, side, onPress, disabled }: {
  label: string; side: 'home' | 'away'; onPress: () => void; disabled: boolean
}) {
  return (
    <motion.button
      onClick={onPress}
      disabled={disabled}
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
      className={`flex-1 rounded-3xl min-h-50 flex flex-col items-center justify-center gap-3 disabled:opacity-50 select-none border-2 ${
        side === 'home'
          ? 'bg-primary-subtle border-primary'
          : 'glass-card border-0'
      }`}
    >
      <span className={`text-4xl font-bold ${side === 'home' ? 'text-primary' : 'text-body'}`}>+1</span>
      <span className={`text-sm font-medium px-4 text-center truncate w-full ${side === 'home' ? 'text-primary' : 'text-muted'}`}>
        {label}
      </span>
    </motion.button>
  )
}
