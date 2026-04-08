import { Router } from 'express'
import multer from 'multer'
import Groq from 'groq-sdk'
import { log, err as logErr } from '../logger.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

router.post('/', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Audio file is required' })
  }

  log(`[transcribe] received audio size=${req.file.size} bytes mimetype=${req.file.mimetype}`)
  try {
    const audioFile = new File([req.file.buffer], 'audio.wav', {
      type: req.file.mimetype || 'audio/wav',
    })

    const result = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      language: 'en',
      response_format: 'json',
    })

    log(`[transcribe] transcript="${result.text.slice(0, 80)}"`)
    res.json({ transcript: result.text })
  } catch (e) {
    logErr('[transcribe] error:', e.message)
    res.status(500).json({ error: 'Transcription failed. Try again.' })
  }
})

export default router
