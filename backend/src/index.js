import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import feedbackRouter from './routes/feedback.js'
import transcribeRouter from './routes/transcribe.js'
import summaryRouter from './routes/summary.js'
import { log, err, logFrontend, LOGS_PATH } from './logger.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '10mb' }))

app.use('/api/feedback', feedbackRouter)
app.use('/api/transcribe', transcribeRouter)
app.use('/api/summary', summaryRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Frontend log receiver
app.post('/api/log', (req, res) => {
  const { level = 'INFO', message = '' } = req.body
  logFrontend(level, message)
  res.json({ ok: true })
})

app.listen(PORT, () => {
  log(`SpeakSmart backend running on http://localhost:${PORT}`)
  log(`Backend log → ${LOGS_PATH.backend}`)
  log(`Frontend log → ${LOGS_PATH.frontend}`)
})

process.on('unhandledRejection', (e) => {
  err('Unhandled rejection:', e)
})
