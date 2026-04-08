import { Router } from 'express'
import { getDashboardSummary, getSimulationReport } from '../services/claude.js'
import { log, err as logErr } from '../logger.js'

const router = Router()

// Practice mode — has per-question scores already, just needs overall summary
router.post('/', async (req, res) => {
  const { results } = req.body
  if (!results || !Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ error: 'Results array is required' })
  }
  log(`[summary/practice] generating for ${results.length} questions`)
  try {
    const summary = await getDashboardSummary(results)
    log(`[summary/practice] done overall_score=${summary.overall_score}`)
    res.json(summary)
  } catch (e) {
    logErr('[summary/practice] error:', e.message)
    res.status(500).json({ error: 'Failed to generate summary.' })
  }
})

// Interview simulation mode — no per-question scores yet, Claude scores all 5 at once
router.post('/simulation', async (req, res) => {
  const { results } = req.body
  if (!results || !Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ error: 'Results array is required' })
  }
  log(`[summary/simulation] generating for ${results.length} questions`)
  try {
    const report = await getSimulationReport(results)
    log(`[summary/simulation] done overall_score=${report.overall_score}`)
    res.json(report)
  } catch (e) {
    logErr('[summary/simulation] error:', e.message)
    res.status(500).json({ error: 'Failed to generate report.' })
  }
})

export default router
