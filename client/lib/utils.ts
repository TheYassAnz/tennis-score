import { SetResult } from './api'

function isValidSetScore(home: number, away: number): boolean {
  const w = Math.max(home, away)
  const l = Math.min(home, away)
  return (w === 6 && l <= 4) || (w === 7 && l === 5) || (w === 7 && l === 6)
}

export function validateMatchSets(sets: SetResult[]): string | null {
  for (let i = 0; i < sets.length; i++) {
    const { homeGames, awayGames } = sets[i]
    if (!isValidSetScore(homeGames, awayGames)) {
      return `Set ${i + 1} invalide (${homeGames}–${awayGames}). Scores valides : 6-0 à 6-4, 7-5, 7-6.`
    }
  }

  let homeSets = 0
  let awaySets = 0
  for (const s of sets) {
    if (s.homeGames > s.awayGames) homeSets++
    else awaySets++
  }

  const winner = Math.max(homeSets, awaySets)
  const loser = Math.min(homeSets, awaySets)

  const validBo3 = winner === 2 && loser <= 1
  const validBo5 = winner === 3 && loser <= 2

  if (!validBo3 && !validBo5) {
    if (winner < 2) {
      return 'Score incomplet : un joueur doit remporter 2 sets (Bo3) ou 3 sets (Bo5).'
    }
    return `Score incohérent (${homeSets}–${awaySets} sets). Résultats valides : 2-0, 2-1, 3-0, 3-1, 3-2.`
  }

  // Vérifie qu'aucun set n'a été joué après la victoire
  const setsToWin = validBo3 ? 2 : 3
  let h = 0
  let a = 0
  for (let i = 0; i < sets.length; i++) {
    if (sets[i].homeGames > sets[i].awayGames) h++
    else a++
    if (i < sets.length - 1 && (h >= setsToWin || a >= setsToWin)) {
      return `Le match était déjà terminé au set ${i + 1}, le set ${i + 2} est superflu.`
    }
  }

  return null
}

export function formatDistanceToNow(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'À l\'instant'
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
