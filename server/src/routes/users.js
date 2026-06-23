const router = require('express').Router()
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')

// List all club users (for match creation player picker)
router.get('/', auth, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, firstName: true, lastName: true },
    orderBy: { username: 'asc' },
  })
  res.json(users)
})

module.exports = router
