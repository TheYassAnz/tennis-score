// Returns the display label for a point count within a game
const POINT_LABELS = ['0', '15', '30', '40']

function computeMatchState(points, sets) {
  const completedSets = sets.map((s) => ({
    setNumber: s.setNumber,
    home: s.homeGames,
    away: s.awayGames,
    tiebreak: s.homeTiebreak != null ? { home: s.homeTiebreak, away: s.awayTiebreak } : null,
  }))

  const currentSetNumber = completedSets.length + 1
  const currentSetPoints = points.filter((p) => p.setNumber === currentSetNumber)

  let homeGames = 0
  let awayGames = 0
  let gameNumber = 1

  const gameNums = [...new Set(currentSetPoints.map((p) => p.gameNumber))].sort((a, b) => a - b)

  for (const gn of gameNums) {
    const gpts = currentSetPoints.filter((p) => p.gameNumber === gn)
    const winner = getGameWinner(gpts, homeGames, awayGames)
    if (winner === 'HOME') {
      homeGames++
      gameNumber = gn + 1
    } else if (winner === 'AWAY') {
      awayGames++
      gameNumber = gn + 1
    } else {
      gameNumber = gn
      break
    }
  }

  const isTiebreak = homeGames === 6 && awayGames === 6

  const currentGamePoints = currentSetPoints.filter((p) => p.gameNumber === gameNumber)
  const homePoints = currentGamePoints.filter((p) => p.scorer === 'HOME').length
  const awayPoints = currentGamePoints.filter((p) => p.scorer === 'AWAY').length

  let homeLabel, awayLabel
  if (isTiebreak) {
    homeLabel = String(homePoints)
    awayLabel = String(awayPoints)
  } else {
    const { homeLabel: hl, awayLabel: al } = getGameLabels(homePoints, awayPoints)
    homeLabel = hl
    awayLabel = al
  }

  return {
    completedSets,
    currentSet: { setNumber: currentSetNumber, homeGames, awayGames, isTiebreak },
    currentGame: { gameNumber, homePoints, awayPoints, homeLabel, awayLabel },
  }
}

function getGameLabels(home, away) {
  if (home < 3 && away < 3) {
    return { homeLabel: POINT_LABELS[home], awayLabel: POINT_LABELS[away] }
  }
  if (home >= 3 && away >= 3) {
    if (home === away) return { homeLabel: '40', awayLabel: '40' }
    if (home > away) return { homeLabel: 'AD', awayLabel: '40' }
    return { homeLabel: '40', awayLabel: 'AD' }
  }
  return {
    homeLabel: home < 3 ? POINT_LABELS[home] : '40',
    awayLabel: away < 3 ? POINT_LABELS[away] : '40',
  }
}

// Returns 'HOME' | 'AWAY' | null if game is still in progress
function getGameWinner(gamePoints, homeGames, awayGames) {
  const isTiebreak = homeGames === 6 && awayGames === 6
  const home = gamePoints.filter((p) => p.scorer === 'HOME').length
  const away = gamePoints.filter((p) => p.scorer === 'AWAY').length

  if (isTiebreak) {
    if (home >= 7 && home - away >= 2) return 'HOME'
    if (away >= 7 && away - home >= 2) return 'AWAY'
    return null
  }

  // Normal game with advantage
  if (home >= 4 && home - away >= 2) return 'HOME'
  if (away >= 4 && away - home >= 2) return 'AWAY'
  return null
}

// After adding a point, determine if set/match is over
function resolvePoint(points, sets, scorer) {
  const state = computeMatchState(points, sets)
  const { currentSet, currentGame } = state

  const newHomePoints = currentGame.homePoints + (scorer === 'HOME' ? 1 : 0)
  const newAwayPoints = currentGame.awayPoints + (scorer === 'AWAY' ? 1 : 0)

  const newGamePoints = [
    ...points.filter(
      (p) => p.setNumber === currentSet.setNumber && p.gameNumber === currentGame.gameNumber
    ),
    { scorer },
  ]

  const gameWinner = getGameWinner(newGamePoints, currentSet.homeGames, currentSet.awayGames)

  let setWinner = null
  let matchWinner = null
  let newHomeGames = currentSet.homeGames
  let newAwayGames = currentSet.awayGames

  if (gameWinner) {
    if (gameWinner === 'HOME') newHomeGames++
    else newAwayGames++

    setWinner = getSetWinner(newHomeGames, newAwayGames, currentSet.isTiebreak)
  }

  if (setWinner) {
    const allSets = [
      ...sets,
      { homeGames: newHomeGames, awayGames: newAwayGames },
    ]
    matchWinner = getMatchWinner(allSets)
  }

  return { gameWinner, setWinner, matchWinner, newHomeGames, newAwayGames }
}

function getSetWinner(homeGames, awayGames, wasTiebreak) {
  if (wasTiebreak) {
    // Tiebreak just ended
    if (homeGames > awayGames) return 'HOME'
    return 'AWAY'
  }
  if (homeGames >= 6 && homeGames - awayGames >= 2) return 'HOME'
  if (awayGames >= 6 && awayGames - homeGames >= 2) return 'AWAY'
  // 7-5
  if (homeGames === 7 && awayGames === 5) return 'HOME'
  if (awayGames === 7 && homeGames === 5) return 'AWAY'
  return null
}

function getMatchWinner(allSets) {
  let homeSets = 0
  let awaySets = 0
  for (const s of allSets) {
    if (s.homeGames > s.awayGames) homeSets++
    else awaySets++
  }
  // Best of 3
  if (homeSets === 2) return 'HOME'
  if (awaySets === 2) return 'AWAY'
  return null
}

module.exports = { computeMatchState, resolvePoint, getSetWinner, getMatchWinner }
