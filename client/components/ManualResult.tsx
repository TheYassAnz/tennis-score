'use client'

import { useState } from 'react'
import { api, SetResult } from '@/lib/api'
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

  function addSet() {
    if (sets.length < 5) setSets((prev) => [...prev, emptySet()])
  }

  function removeSet(index: number) {
    if (sets.length > 2) setSets((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Saisir le résultat
      </h2>

      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center px-2">
        <p className="text-xs font-semibold text-blue-400 text-center">Équipe A</p>
        <div className="w-4" />
        <p className="text-xs font-semibold text-orange-400 text-center">Équipe B</p>
        <div className="w-8" />
      </div>

      {sets.map((set, i) => (
        <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
          <input
            type="number"
            min={0}
            max={7}
            value={set.homeGames}
            onChange={(e) => updateSet(i, 'homeGames', parseInt(e.target.value) || 0)}
            className="w-full rounded-xl bg-gray-800 border border-gray-700 px-3 py-4 text-white text-center text-xl font-bold focus:border-green-500 focus:outline-none"
          />
          <span className="text-gray-600 font-bold">—</span>
          <input
            type="number"
            min={0}
            max={7}
            value={set.awayGames}
            onChange={(e) => updateSet(i, 'awayGames', parseInt(e.target.value) || 0)}
            className="w-full rounded-xl bg-gray-800 border border-gray-700 px-3 py-4 text-white text-center text-xl font-bold focus:border-green-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => removeSet(i)}
            disabled={sets.length <= 2}
            className="p-2 rounded-lg text-gray-600 hover:text-red-400 disabled:opacity-20"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      {sets.length < 5 && (
        <button
          type="button"
          onClick={addSet}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 transition"
        >
          <Plus size={16} /> Ajouter un set
        </button>
      )}

      {/* Score summary */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 px-4 py-3 flex justify-center gap-6">
        <span className="text-2xl font-bold text-blue-400">{homeWins}</span>
        <span className="text-gray-600 font-bold self-center">sets</span>
        <span className="text-2xl font-bold text-orange-400">{awayWins}</span>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-green-600 py-4 font-semibold text-white transition hover:bg-green-500 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Check size={20} />
        {loading ? 'Enregistrement...' : 'Enregistrer le résultat'}
      </button>
    </form>
  )
}
