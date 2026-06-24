const router = require('express').Router()
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const sharp = require('sharp')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont acceptées'))
    }
    cb(null, true)
  },
})

const AVATARS_DIR = path.join(__dirname, '../../uploads/avatars')

router.get('/', auth, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true },
    orderBy: { username: 'asc' },
  })
  res.json(users)
})

router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier envoyé' })
  }

  const filename = `${req.user.id}.webp`
  const filepath = path.join(AVATARS_DIR, filename)

  await sharp(req.file.buffer)
    .resize(200, 200, { fit: 'cover', position: 'centre' })
    .webp({ quality: 85 })
    .toFile(filepath)

  const avatarUrl = `/uploads/avatars/${filename}`

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl },
    select: { id: true, username: true, email: true, firstName: true, lastName: true, avatarUrl: true },
  })

  res.json({ user })
})

router.delete('/avatar', auth, async (req, res) => {
  const filepath = path.join(AVATARS_DIR, `${req.user.id}.webp`)
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath)

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl: null },
    select: { id: true, username: true, email: true, firstName: true, lastName: true, avatarUrl: true },
  })

  res.json({ user })
})

module.exports = router
