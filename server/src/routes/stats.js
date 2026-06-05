const router = require('express').Router()
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')

router.get('/:userId', auth, async (req, res) => {
  const { userId } = req.params

  const matches = await prisma.match.findMany({
    where: {
      status: 'COMPLETED',
      players: { some: { userId } },
    },
    include: {
      players: { include: { user: { select: { id: true, username: true } } } },
      sets: true,
    },
  })

  let wins = 0
  let losses = 0
  let setsWon = 0
  let setsLost = 0
  let gamesWon = 0
  let gamesLost = 0
  const opponentStats = {}

  for (const match of matches) {
    const myPlayer = match.players.find((p) => p.userId === userId)
    if (!myPlayer) continue

    const mySide = myPlayer.side
    const isWin = match.winnerSide === mySide

    if (isWin) wins++
    else losses++

    for (const set of match.sets) {
      const myGames = mySide === 'HOME' ? set.homeGames : set.awayGames
      const oppGames = mySide === 'HOME' ? set.awayGames : set.homeGames
      gamesWon += myGames
      gamesLost += oppGames
      if (myGames > oppGames) setsWon++
      else setsLost++
    }

    // Per-opponent stats
    const opponents = match.players.filter((p) => p.userId !== userId)
    for (const opp of opponents) {
      if (!opponentStats[opp.userId]) {
        opponentStats[opp.userId] = {
          username: opp.user.username,
          wins: 0,
          losses: 0,
        }
      }
      if (isWin) opponentStats[opp.userId].wins++
      else opponentStats[opp.userId].losses++
    }
  }

  res.json({
    userId,
    totalMatches: matches.length,
    wins,
    losses,
    winRate: matches.length ? Math.round((wins / matches.length) * 100) : 0,
    setsWon,
    setsLost,
    gamesWon,
    gamesLost,
    opponents: Object.values(opponentStats),
  })
})

module.exports = router
