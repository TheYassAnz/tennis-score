'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, MatchWithState, User, SetResult } from '@/lib/api'
import { validateMatchSets } from '@/lib/utils'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeft, Check, User as UserIcon, Users, Radio, ClipboardList, Plus, Trash2 } from 'lucide-react'

type MatchType = 'SINGLE' | 'DOUBLE'
type MatchMode = 'LIVE' | 'MANUAL'

interface PlayerSlot {
  side: 'HOME' | 'AWAY'
  position: number
  userId: string
}

export default function EditMatchPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [matchType, setMatchType] = useState<MatchType>('SINGLE')
  const [mode, setMode] = useState<MatchMode>('LIVE')
  const [slots, setSlots] = useState<PlayerSlot[]>([])
  const [sets, setSets] = useState<SetResult[]>([{ homeGames: 0, awayGames: 0 }, { homeGames: 0, awayGames: 0 }])
  const [matchDate, setMatchDate] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getMatch(id), api.getUsers()])
      .then(([matchData, usersData]: [MatchWithState, User[]]) => {
        if (matchData.creatorId !== user?.id) {
          router.push(`/match/${id}`)
          return
        }

        setMatchType(matchData.type)
        setMode(matchData.mode)

        const sorted = [...matchData.players].sort((a, b) => {
          if (a.side !== b.side) return a.side === 'HOME' ? -1 : 1
          return a.position - b.position
        })
        setSlots(sorted.map((p) => ({ side: p.side, position: p.position, userId: p.userId })))

        if (matchData.sets.length > 0) {
          setSets(matchData.sets.map((s) => ({
            homeGames: s.homeGames,
            awayGames: s.awayGames,
            homeTiebreak: s.homeTiebreak,
            awayTiebreak: s.awayTiebreak,
          })))
        }

        const d = new Date(matchData.createdAt)
        const offset = d.getTimezoneOffset() * 60000
        setMatchDate(new Date(d.getTime() - offset).toISOString().slice(0, 16))

        setUsers(usersData)
      })
      .finally(() => setLoading(false))
  }, [id, user?.id, router])

  function handleTypeChange(t: MatchType) {
    setMatchType(t)
    if (t === 'SINGLE') {
      setSlots((prev) => {
        const home = prev.find((s) => s.side === 'HOME')
        const away = prev.find((s) => s.side === 'AWAY')
        return [
          { side: 'HOME', position: 1, userId: home?.userId || '' },
          { side: 'AWAY', position: 1, userId: away?.userId || '' },
        ]
      })
    } else {
      setSlots((prev) => {
        const homeSlots = prev.filter((s) => s.side === 'HOME')
        const awaySlots = prev.filter((s) => s.side === 'AWAY')
        return [
          { side: 'HOME', position: 1, userId: homeSlots[0]?.userId || '' },
          { side: 'HOME', position: 2, userId: homeSlots[1]?.userId || '' },
          { side: 'AWAY', position: 1, userId: awaySlots[0]?.userId || '' },
          { side: 'AWAY', position: 2, userId: awaySlots[1]?.userId || '' },
        ]
      })
    }
  }

  function setSlotUser(index: number, userId: string) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, userId } : s)))
  }

  function getAvailableUsers(currentIndex: number): User[] {
    const used = slots.filter((_, i) => i !== currentIndex).map((s) => s.userId)
    return users.filter((u) => !used.includes(u.id))
  }

  function updateSet(index: number, field: keyof SetResult, value: number) {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  function adjust(index: number, field: 'homeGames' | 'awayGames', delta: number) {
    setSets((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s
        return { ...s, [field]: Math.max(0, Math.min(7, s[field] + delta)) }
      })
    )
  }

  function addSet() {
    if (sets.length < 5) setSets((prev) => [...prev, { homeGames: 0, awayGames: 0 }])
  }

  function removeSet(index: number) {
    if (sets.length > 2) setSets((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (slots.some((s) => !s.userId)) {
      setError('Veuillez sélectionner tous les joueurs')
      return
    }
    const validationError = validateMatchSets(sets)
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.updateMatch(id, {
        type: matchType,
        mode,
        players: slots,
        sets,
        createdAt: matchDate ? new Date(matchDate).toISOString() : undefined,
      })
      router.push(`/match/${id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setSaving(false)
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

  const homeSlots = slots.filter((s) => s.side === 'HOME')
  const awaySlots = slots.filter((s) => s.side === 'AWAY')
  const homeWins = sets.filter((s) => s.homeGames > s.awayGames).length
  const awayWins = sets.filter((s) => s.awayGames > s.homeGames).length

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-full pb-8 bg-page">
        <header className="flex items-center gap-3 px-4 pt-12 pb-6">
          <button onClick={() => router.back()} className="p-2 rounded-full bg-surface-2 border border-theme text-muted">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-body">Modifier le match</h1>
        </header>

        <form onSubmit={handleSubmit} className="px-4 space-y-6 flex-1">
          {/* Format */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Format</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {(['SINGLE', 'DOUBLE'] as MatchType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex flex-col items-center justify-center rounded-2xl py-5 border-2 transition ${
                    matchType === t ? 'border-primary bg-primary-subtle text-primary' : 'border-theme bg-surface text-muted'
                  }`}
                >
                  {t === 'SINGLE' ? <UserIcon size={28} className="mb-1" /> : <Users size={28} className="mb-1" />}
                  <span className="font-semibold text-sm">{t === 'SINGLE' ? 'Simple' : 'Double'}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'LIVE', label: 'En direct', Icon: Radio },
                { value: 'MANUAL', label: 'Résultat final', Icon: ClipboardList },
              ] as const).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`flex flex-col items-center justify-center rounded-2xl py-4 border-2 transition ${
                    mode === value ? 'border-primary bg-primary-subtle text-primary' : 'border-theme bg-surface text-muted'
                  }`}
                >
                  <Icon size={24} className="mb-1" />
                  <span className="font-semibold text-sm">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Players */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Joueurs</h2>
            <div className="space-y-3">
              <div className="rounded-2xl bg-surface border border-theme p-4">
                <p className="text-xs font-semibold text-primary uppercase mb-3">Équipe A</p>
                <div className="space-y-2">
                  {homeSlots.map((slot, i) => {
                    const globalIdx = slots.indexOf(slot)
                    return (
                      <select
                        key={i}
                        value={slot.userId}
                        onChange={(e) => setSlotUser(globalIdx, e.target.value)}
                        className="input-theme w-full rounded-xl px-4 py-3 text-sm"
                      >
                        <option value="">{matchType === 'DOUBLE' ? `Joueur ${i + 1}` : 'Joueur'}...</option>
                        {getAvailableUsers(globalIdx).map((u) => (
                          <option key={u.id} value={u.id}>{u.username}</option>
                        ))}
                      </select>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-surface border border-theme p-4">
                <p className="text-xs font-semibold text-accent uppercase mb-3">Équipe B</p>
                <div className="space-y-2">
                  {awaySlots.map((slot, i) => {
                    const globalIdx = slots.indexOf(slot)
                    return (
                      <select
                        key={i}
                        value={slot.userId}
                        onChange={(e) => setSlotUser(globalIdx, e.target.value)}
                        className="input-theme w-full rounded-xl px-4 py-3 text-sm"
                      >
                        <option value="">{matchType === 'DOUBLE' ? `Joueur ${i + 1}` : 'Joueur'}...</option>
                        {getAvailableUsers(globalIdx).map((u) => (
                          <option key={u.id} value={u.id}>{u.username}</option>
                        ))}
                      </select>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Score */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Score</h2>
            <div className="space-y-3">
              <div className="flex gap-2 items-center px-1">
                <p className="flex-1 text-xs font-semibold text-primary text-center">Équipe A</p>
                <div className="shrink-0 w-5" />
                <p className="flex-1 text-xs font-semibold text-accent text-center">Équipe B</p>
                <div className="shrink-0 w-8" />
              </div>

              {sets.map((set, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <EditScoreInput
                    value={set.homeGames}
                    onChange={(v) => updateSet(i, 'homeGames', v)}
                    onAdjust={(d) => adjust(i, 'homeGames', d)}
                  />
                  <span className="shrink-0 text-muted font-bold">—</span>
                  <EditScoreInput
                    value={set.awayGames}
                    onChange={(v) => updateSet(i, 'awayGames', v)}
                    onAdjust={(d) => adjust(i, 'awayGames', d)}
                  />
                  <button
                    type="button"
                    onClick={() => removeSet(i)}
                    disabled={sets.length <= 2}
                    className="shrink-0 p-2 rounded-lg text-muted hover:text-red-400 disabled:opacity-20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {sets.length < 5 && (
                <button
                  type="button"
                  onClick={addSet}
                  className="flex items-center gap-2 text-sm text-muted hover:text-primary transition"
                >
                  <Plus size={16} /> Ajouter un set
                </button>
              )}

              <div className="rounded-xl bg-surface border border-theme px-4 py-3 flex justify-center gap-6">
                <span className="text-2xl font-bold text-primary">{homeWins}</span>
                <span className="text-muted font-bold self-center">sets</span>
                <span className="text-2xl font-bold text-accent">{awayWins}</span>
              </div>
            </div>
          </section>

          {/* Date */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Date</h2>
            <input
              type="datetime-local"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="input-theme w-full rounded-xl px-4 py-3 text-sm"
            />
          </section>

          {error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-primary py-4 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check size={20} />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </AuthGuard>
  )
}

function EditScoreInput({
  value,
  onChange,
  onAdjust,
}: {
  value: number
  onChange: (v: number) => void
  onAdjust: (delta: number) => void
}) {
  return (
    <div className="flex flex-1 items-center rounded-xl border border-theme overflow-hidden bg-surface">
      <button
        type="button"
        onClick={() => onAdjust(-1)}
        className="px-3 py-3 text-muted text-lg font-bold active:bg-surface-2 transition select-none"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        max={7}
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => onChange(Math.max(0, Math.min(7, parseInt(e.target.value) || 0)))}
        className="w-0 flex-1 bg-transparent border-none outline-none text-center text-xl font-bold text-body"
      />
      <button
        type="button"
        onClick={() => onAdjust(1)}
        className="px-3 py-3 text-muted text-lg font-bold active:bg-surface-2 transition select-none"
      >
        +
      </button>
    </div>
  )
}
