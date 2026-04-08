import { Router } from 'express'
import { getAIFeedback } from '../services/claude.js'
import { log, err as logErr } from '../logger.js'

const router = Router()

router.post('/', async (req, res) => {
  const { transcript, scenario } = req.body

  if (!transcript || transcript.trim().length === 0) {
    return res.status(400).json({ error: 'Transcript is required' })
  }

  log(`[feedback] transcript length=${transcript.length} scenario="${scenario?.slice(0, 50)}"`)
  try {
    const feedback = await getAIFeedback(transcript, scenario)
    log(`[feedback] score=${feedback.overall_score}`)
    res.json(feedback)
  } catch (e) {
    logErr('[feedback] error:', e.message)
    res.status(500).json({ error: 'Failed to get feedback. Try again.' })
  }
})

export default router
