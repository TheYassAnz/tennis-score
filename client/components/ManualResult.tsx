'use client'

import { useState } from 'react'
import { api, SetResult } from '@/lib/api'
import { validateMatchSets } from '@/lib/utils'
import { Plus, Trash2, Check } from 'lucide-react'

interface Props {
  matchId: string
  onDone: () => void
}

const emptySet = (): SetResult => ({ homeGames: 0, awayGames: 0 })

export default function ManualResult({ matchId, onDone }: Props) {
  const [sets, setSets] = useState<SetResult[]>([emptySet(), emptySet()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    if (sets.length < 5) setSets((prev) => [...prev, emptySet()])
  }

  function removeSet(index: number) {
    if (sets.length > 2) setSets((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validateMatchSets(sets)
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.submitResult(matchId, sets)
      onDone()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setLoading(false)
    }
  }

  const homeWins = sets.filter((s) => s.homeGames > s.awayGames).length
  const awayWins = sets.filter((s) => s.awayGames > s.homeGames).length

  return (
    <form onSubmit={handleSubmit} className="px-4 space-y-4 mt-4">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
        Saisir le résultat
      </h2>

      <div className="flex gap-2 items-center px-1">
        <p className="flex-1 text-xs font-semibold text-primary text-center">Équipe A</p>
        <div className="shrink-0 w-5" />
        <p className="flex-1 text-xs font-semibold text-accent text-center">Équipe B</p>
        <div className="shrink-0 w-8" />
      </div>

      {sets.map((set, i) => (
        <div key={i} className="flex gap-2 items-center">
          <ScoreInput
            value={set.homeGames}
            onChange={(v) => updateSet(i, 'homeGames', v)}
            onAdjust={(d) => adjust(i, 'homeGames', d)}
          />
          <span className="shrink-0 text-muted font-bold">—</span>
          <ScoreInput
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
        {loading ? 'Enregistrement...' : 'Enregistrer le résultat'}
      </button>
    </form>
  )
}

function ScoreInput({
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
