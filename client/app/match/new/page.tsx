'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api, User } from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Check, User as UserIcon, Users, Radio, ClipboardList } from 'lucide-react'

type MatchType = 'SINGLE' | 'DOUBLE'
type MatchMode = 'LIVE' | 'MANUAL'

interface PlayerSlot {
  side: 'HOME' | 'AWAY'
  position: number
  userId: string
}

export default function NewMatchPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [matchType, setMatchType] = useState<MatchType>('SINGLE')
  const [mode, setMode] = useState<MatchMode>('LIVE')
  const [users, setUsers] = useState<User[]>([])
  const [slots, setSlots] = useState<PlayerSlot[]>([
    { side: 'HOME', position: 1, userId: user?.id || '' },
    { side: 'AWAY', position: 1, userId: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getUsers().then(setUsers)
  }, [])

  useEffect(() => {
    if (matchType === 'SINGLE') {
      setSlots([
        { side: 'HOME', position: 1, userId: user?.id || '' },
        { side: 'AWAY', position: 1, userId: '' },
      ])
    } else {
      setSlots([
        { side: 'HOME', position: 1, userId: user?.id || '' },
        { side: 'HOME', position: 2, userId: '' },
        { side: 'AWAY', position: 1, userId: '' },
        { side: 'AWAY', position: 2, userId: '' },
      ])
    }
  }, [matchType, user?.id])

  function setSlotUser(index: number, userId: string) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, userId } : s)))
  }

  function getAvailableUsers(currentIndex: number): User[] {
    const used = slots.filter((_, i) => i !== currentIndex).map((s) => s.userId)
    return users.filter((u) => !used.includes(u.id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (slots.some((s) => !s.userId)) {
      setError('Veuillez sélectionner tous les joueurs')
      return
    }
    setLoading(true)
    setError('')
    try {
      const match = await api.createMatch({ type: matchType, mode, players: slots })
      router.push(`/match/${match.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setLoading(false)
    }
  }

  const homeSlots = slots.filter((s) => s.side === 'HOME')
  const awaySlots = slots.filter((s) => s.side === 'AWAY')

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-full pb-8 bg-page">
        <header className="flex items-center gap-3 px-4 pt-12 pb-6">
          <button onClick={() => router.back()} className="p-2 rounded-full bg-surface-2 border border-theme text-muted">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-body">Nouveau match</h1>
        </header>

        <form onSubmit={handleSubmit} className="px-4 space-y-6 flex-1">
          {/* Type */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Format</h2>
            <div className="grid grid-cols-2 gap-3">
              {(['SINGLE', 'DOUBLE'] as MatchType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMatchType(t)}
                  className={`flex flex-col items-center justify-center rounded-2xl py-5 border-2 transition ${
                    matchType === t ? 'border-primary bg-primary-subtle text-primary' : 'border-theme bg-surface text-muted'
                  }`}
                >
                  {t === 'SINGLE' ? <UserIcon size={28} className="mb-1" /> : <Users size={28} className="mb-1" />}
                  <span className="font-semibold text-sm">{t === 'SINGLE' ? 'Simple' : 'Double'}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Mode */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Mode de saisie</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'LIVE', label: 'En direct', desc: 'Point par point', Icon: Radio },
                { value: 'MANUAL', label: 'Résultat final', desc: 'Saisir le score', Icon: ClipboardList },
              ] as const).map(({ value, label, desc, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`flex flex-col items-center justify-center rounded-2xl py-5 border-2 transition ${
                    mode === value ? 'border-primary bg-primary-subtle text-primary' : 'border-theme bg-surface text-muted'
                  }`}
                >
                  <Icon size={28} className="mb-1" />
                  <span className="font-semibold text-sm">{label}</span>
                  <span className="text-xs mt-0.5 opacity-70">{desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Players */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Joueurs</h2>
            <div className="space-y-4">
              <div className="rounded-2xl bg-surface border border-theme p-4">
                <p className="text-xs font-semibold text-primary uppercase mb-3">Équipe A</p>
                <div className="space-y-2">
                  {homeSlots.map((slot, i) => {
                    const globalIdx = slots.indexOf(slot)
                    return (
                      <PlayerSelect
                        key={i}
                        label={matchType === 'DOUBLE' ? `Joueur ${i + 1}` : 'Joueur'}
                        value={slot.userId}
                        users={getAvailableUsers(globalIdx)}
                        allUsers={users}
                        onChange={(id) => setSlotUser(globalIdx, id)}
                        locked={slot.userId === user?.id}
                      />
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
                      <PlayerSelect
                        key={i}
                        label={matchType === 'DOUBLE' ? `Joueur ${i + 1}` : 'Joueur'}
                        value={slot.userId}
                        users={getAvailableUsers(globalIdx)}
                        allUsers={users}
                        onChange={(id) => setSlotUser(globalIdx, id)}
                        locked={false}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-4 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check size={20} />
            {loading ? 'Création...' : 'Démarrer le match'}
          </button>
        </form>
      </div>
    </AuthGuard>
  )
}

function PlayerSelect({
  label, value, users, allUsers, onChange, locked,
}: {
  label: string; value: string; users: User[]; allUsers: User[]; onChange: (id: string) => void; locked: boolean
}) {
  const currentUser = allUsers.find((u) => u.id === value)

  if (locked && currentUser) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-surface-2 border border-theme px-4 py-3">
        <div className="h-8 w-8 rounded-full bg-primary-subtle flex items-center justify-center text-primary text-sm font-bold shrink-0">
          {currentUser.username[0].toUpperCase()}
        </div>
        <span className="text-body text-sm font-medium">{currentUser.username}</span>
        <span className="ml-auto text-xs text-primary">Moi</span>
      </div>
    )
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-theme w-full rounded-xl px-4 py-3 text-sm"
    >
      <option value="">{label}...</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>{u.username}</option>
      ))}
    </select>
  )
}
