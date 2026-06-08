const router = require('express').Router()
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const { computeMatchState, resolvePoint } = require('../lib/tennis')

// Create a match
router.post('/', auth, async (req, res) => {
  const { type, mode, players } = req.body
  // players: [{ userId, side, position }]
  if (!type || !mode || !players?.length) {
    return res.status(400).json({ error: 'Données manquantes' })
  }

  const match = await prisma.match.create({
    data: {
      type,
      mode,
      creatorId: req.user.id,
      players: { create: players },
    },
    include: { players: { include: { user: { select: { id: true, username: true } } } } },
  })

  res.status(201).json(match)
})

// Get a match with full state
router.get('/:id', auth, async (req, res) => {
  const match = await prisma.match.findUnique({
    where: { id: req.params.id },
    include: {
      players: { include: { user: { select: { id: true, username: true } } } },
      sets: { orderBy: { setNumber: 'asc' } },
      points: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!match) return res.status(404).json({ error: 'Match introuvable' })

  let state = null
  if (match.mode === 'LIVE' && match.status === 'IN_PROGRESS') {
    state = computeMatchState(match.points, match.sets)
  }

  res.json({ ...match, state })
})

// Delete a match
router.delete('/:id', auth, async (req, res) => {
  const match = await prisma.match.findUnique({ where: { id: req.params.id } })
  if (!match) return res.status(404).json({ error: 'Match introuvable' })
  if (match.creatorId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' })

  await prisma.match.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// Update a match
router.patch('/:id', auth, async (req, res) => {
  const { type, mode, players, sets, createdAt } = req.body

  const match = await prisma.match.findUnique({ where: { id: req.params.id } })
  if (!match) return res.status(404).json({ error: 'Match introuvable' })
  if (match.creatorId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' })

  const updateData = {}
  if (type) updateData.type = type
  if (mode) updateData.mode = mode
  if (createdAt) updateData.createdAt = new Date(createdAt)

  if (sets?.length) {
    await prisma.set.deleteMany({ where: { matchId: match.id } })
    await prisma.point.deleteMany({ where: { matchId: match.id } })

    let homeSets = 0
    let awaySets = 0
    for (const s of sets) {
      if (s.homeGames > s.awayGames) homeSets++
      else awaySets++
    }

    await prisma.set.createMany({
      data: sets.map((s, i) => ({ matchId: match.id, setNumber: i + 1, ...s })),
    })

    updateData.status = 'COMPLETED'
    updateData.winnerSide = homeSets > awaySets ? 'HOME' : 'AWAY'
    updateData.completedAt = match.completedAt || new Date()
  }

  if (players?.length) {
    await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } })
    await prisma.matchPlayer.createMany({
      data: players.map((p) => ({ matchId: match.id, ...p })),
    })
  }

  const updated = await prisma.match.update({
    where: { id: match.id },
    data: updateData,
    include: {
      players: { include: { user: { select: { id: true, username: true } } } },
      sets: { orderBy: { setNumber: 'asc' } },
    },
  })

  res.json(updated)
})

// Add a live point
router.post('/:id/point', auth, async (req, res) => {
  const { scorer } = req.body // 'HOME' | 'AWAY'
  if (!scorer) return res.status(400).json({ error: 'scorer requis' })

  const match = await prisma.match.findUnique({
    where: { id: req.params.id },
    include: {
      sets: { orderBy: { setNumber: 'asc' } },
      points: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!match) return res.status(404).json({ error: 'Match introuvable' })
  if (match.status !== 'IN_PROGRESS') return res.status(400).json({ error: 'Match terminé' })
  if (match.mode !== 'LIVE') return res.status(400).json({ error: 'Mode manuel' })

  const state = computeMatchState(match.points, match.sets)
  const { currentSet, currentGame } = state
  const { gameWinner, setWinner, matchWinner, newHomeGames, newAwayGames } = resolvePoint(
    match.points,
    match.sets,
    scorer
  )

  // Persist point
  await prisma.point.create({
    data: {
      matchId: match.id,
      setNumber: currentSet.setNumber,
      gameNumber: currentGame.gameNumber,
      scorer,
    },
  })

  // If game is won, handle set/match completion
  if (gameWinner) {
    if (setWinner) {
      const tiebreakData =
        currentSet.isTiebreak
          ? {
              homeTiebreak: newHomeGames,
              awayTiebreak: newAwayGames,
            }
          : {}

      await prisma.set.create({
        data: {
          matchId: match.id,
          setNumber: currentSet.setNumber,
          homeGames: newHomeGames,
          awayGames: newAwayGames,
          ...tiebreakData,
        },
      })

      if (matchWinner) {
        await prisma.match.update({
          where: { id: match.id },
          data: { status: 'COMPLETED', winnerSide: matchWinner, completedAt: new Date() },
        })
      }
    }
  }

  const updated = await prisma.match.findUnique({
    where: { id: match.id },
    include: {
      players: { include: { user: { select: { id: true, username: true } } } },
      sets: { orderBy: { setNumber: 'asc' } },
      points: { orderBy: { createdAt: 'asc' } },
    },
  })

  const newState = updated.status === 'IN_PROGRESS'
    ? computeMatchState(updated.points, updated.sets)
    : null

  res.json({ ...updated, state: newState })
})

// Undo last point
router.delete('/:id/point', auth, async (req, res) => {
  const match = await prisma.match.findUnique({
    where: { id: req.params.id },
    include: {
      sets: { orderBy: { setNumber: 'asc' } },
      points: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!match) return res.status(404).json({ error: 'Match introuvable' })
  if (match.mode !== 'LIVE') return res.status(400).json({ error: 'Mode manuel' })

  const lastPoint = match.points[0]
  if (!lastPoint) return res.status(400).json({ error: 'Aucun point à annuler' })

  await prisma.point.delete({ where: { id: lastPoint.id } })

  // If match was completed, reopen it
  if (match.status === 'COMPLETED') {
    await prisma.match.update({
      where: { id: match.id },
      data: { status: 'IN_PROGRESS', winnerSide: null, completedAt: null },
    })
  }

  // If last point was in a set that's now saved, remove that set
  const lastSet = match.sets[match.sets.length - 1]
  if (lastSet && lastSet.setNumber === lastPoint.setNumber) {
    await prisma.set.delete({ where: { id: lastSet.id } })
  }

  const updated = await prisma.match.findUnique({
    where: { id: match.id },
    include: {
      players: { include: { user: { select: { id: true, username: true } } } },
      sets: { orderBy: { setNumber: 'asc' } },
      points: { orderBy: { createdAt: 'asc' } },
    },
  })

  res.json({ ...updated, state: computeMatchState(updated.points, updated.sets) })
})

// Submit manual result
router.post('/:id/result', auth, async (req, res) => {
  const { sets } = req.body
  // sets: [{ homeGames, awayGames, homeTiebreak?, awayTiebreak? }]
  if (!sets?.length) return res.status(400).json({ error: 'Sets requis' })

  const match = await prisma.match.findUnique({ where: { id: req.params.id } })
  if (!match) return res.status(404).json({ error: 'Match introuvable' })
  if (match.mode !== 'MANUAL') return res.status(400).json({ error: 'Mode live' })

  // Compute winner
  let homeSets = 0
  let awaySets = 0
  for (const s of sets) {
    if (s.homeGames > s.awayGames) homeSets++
    else awaySets++
  }
  const winnerSide = homeSets > awaySets ? 'HOME' : 'AWAY'

  await prisma.set.deleteMany({ where: { matchId: match.id } })
  await prisma.set.createMany({
    data: sets.map((s, i) => ({ matchId: match.id, setNumber: i + 1, ...s })),
  })

  const updated = await prisma.match.update({
    where: { id: match.id },
    data: { status: 'COMPLETED', winnerSide, completedAt: new Date() },
    include: {
      players: { include: { user: { select: { id: true, username: true } } } },
      sets: { orderBy: { setNumber: 'asc' } },
    },
  })

  res.json(updated)
})

// List matches for a user
router.get('/', auth, async (req, res) => {
  const { userId, status } = req.query

  const matches = await prisma.match.findMany({
    where: {
      ...(status && { status }),
      players: { some: { userId: userId || req.user.id } },
    },
    include: {
      players: { include: { user: { select: { id: true, username: true } } } },
      sets: { orderBy: { setNumber: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  res.json(matches)
})

module.exports = router
