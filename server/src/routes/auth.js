const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

router.post('/register', async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body
  if (!username || !email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Tous les champs sont requis' })
  }

  const normalizedUsername = username.toLowerCase()

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username: normalizedUsername }] },
  })
  if (existing) {
    return res.status(409).json({ error: 'Nom d\'utilisateur ou email déjà utilisé' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username: normalizedUsername, email, passwordHash, firstName, lastName },
    select: { id: true, username: true, email: true, firstName: true, lastName: true },
  })

  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  })

  res.status(201).json({ user, token })
})

router.post('/login', async (req, res) => {
  const { identifier, password } = req.body
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifiant et mot de passe requis' })
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
  })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Identifiants incorrects' })
  }

  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  })

  res.json({ user: { id: user.id, username: user.username, email: user.email }, token })
})

router.get('/me', require('../middleware/auth'), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, username: true, email: true, firstName: true, lastName: true, createdAt: true },
  })
  res.json(user)
})

module.exports = router
