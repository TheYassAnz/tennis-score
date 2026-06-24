const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const prisma = require('../lib/prisma')
const { sendPasswordReset } = require('../lib/mailer')

router.get('/check', async (req, res) => {
  const { field, value } = req.query
  if (!['username', 'email'].includes(field) || !value || typeof value !== 'string') {
    return res.status(400).json({ error: 'Paramètres invalides' })
  }
  const where = field === 'username' ? { username: value.toLowerCase() } : { email: value }
  const user = await prisma.user.findUnique({ where, select: { id: true } })
  res.json({ available: !user })
})

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

router.patch('/me', require('../middleware/auth'), async (req, res) => {
  const { firstName, lastName, username, email, currentPassword, newPassword } = req.body
  const userId = req.user.id

  const updateData = {}

  // Infos générales — pas de mot de passe requis
  if (firstName) updateData.firstName = firstName
  if (lastName) updateData.lastName = lastName
  if (username) {
    const normalized = username.toLowerCase()
    const conflict = await prisma.user.findFirst({
      where: { username: normalized, NOT: { id: userId } },
    })
    if (conflict) return res.status(409).json({ error: 'Ce pseudo est déjà utilisé' })
    updateData.username = normalized
  }

  // Infos sensibles — mot de passe actuel requis
  if (email || newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel requis' })
    }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' })
    }
    if (email) {
      const conflict = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      })
      if (conflict) return res.status(409).json({ error: 'Cet email est déjà utilisé' })
      updateData.email = email
    }
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' })
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10)
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, username: true, email: true, firstName: true, lastName: true },
  })

  res.json({ user: updated })
})

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  // Réponse identique que l'email existe ou non (pas de user enumeration)
  const genericResponse = res.json({ message: 'Si cet email existe, un lien a été envoyé.' })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return genericResponse

  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expiry = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: tokenHash, resetTokenExpiry: expiry },
  })

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`
  await sendPasswordReset({ to: user.email, firstName: user.firstName, resetUrl })

  return genericResponse
})

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body
  if (!token || !password) {
    return res.status(400).json({ error: 'Token et mot de passe requis' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' })
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const user = await prisma.user.findFirst({
    where: {
      resetToken: tokenHash,
      resetTokenExpiry: { gt: new Date() },
    },
  })

  if (!user) {
    return res.status(400).json({ error: 'Lien invalide ou expiré' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  })

  res.json({ message: 'Mot de passe réinitialisé avec succès' })
})

module.exports = router
