require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL || '*' }))
app.use(express.json())

app.use('/api/auth', require('./src/routes/auth'))
app.use('/api/matches', require('./src/routes/matches'))
app.use('/api/stats', require('./src/routes/stats'))
app.use('/api/leaderboard', require('./src/routes/leaderboard'))
app.use('/api/users', require('./src/routes/users'))

app.get('/api/health', (_, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
