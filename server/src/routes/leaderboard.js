const router = require('express').Router()
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')

router.get('/', auth, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, firstName: true, lastName: true },
  })

  const leaderboard = await Promise.all(
    users.map(async (user) => {
      const matches = await prisma.match.findMany({
        where: {
          status: 'COMPLETED',
          players: { some: { userId: user.id } },
        },
        include: { players: true },
      })

      let wins = 0
      let losses = 0
      for (const match of matches) {
        const myPlayer = match.players.find((p) => p.userId === user.id)
        if (!myPlayer) continue
        if (match.winnerSide === myPlayer.side) wins++
        else losses++
      }

      return {
        userId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        wins,
        losses,
        total: matches.length,
        winRate: matches.length ? Math.round((wins / matches.length) * 100) : 0,
      }
    })
  )

  leaderboard.sort((a, b) => b.wins - a.wins || a.losses - b.losses)

  res.json(leaderboard)
})

module.exports = router
