import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an expert English communication coach specializing in helping Indian professionals improve their spoken English for workplace settings.

A user has just spoken the following text in a practice session. Analyze it and return feedback in this exact JSON format only, no extra text:

{
  "overall_score": <number 0-100>,
  "fluency": {
    "score": <number 0-100>,
    "issue": "<one specific issue found>",
    "tip": "<one specific actionable tip>"
  },
  "grammar": {
    "score": <number 0-100>,
    "mistakes": ["<mistake 1 with correction>", "<mistake 2 with correction>"],
    "tip": "<one specific tip>"
  },
  "filler_words": {
    "score": <number 0-100>,
    "found": {"basically": 0, "you know": 0, "um": 0, "uh": 0, "like": 0, "so": 0},
    "tip": "<one specific tip>"
  },
  "confidence": {
    "score": <number 0-100>,
    "observation": "<one observation about confidence from sentence structure>",
    "tip": "<one actionable tip to sound more confident>"
  },
  "one_sentence_to_practice": "<give one specific sentence they should practice saying out loud>"
}

Rules:
- Always return valid JSON only, no markdown, no extra text
- Be specific with mistakes — never generic advice
- The one_sentence_to_practice should directly address their biggest weakness
- Scores should be honest — do not always give high scores`

const SUMMARY_PROMPT = `You are an expert English communication coach. A user just completed a full 5-question mock interview. Here are their results per question.

Return ONLY this JSON, no extra text:
{
  "overall_score": <weighted average 0-100>,
  "strongest_parameter": "<fluency|grammar|filler_words|confidence>",
  "weakest_parameter": "<fluency|grammar|filler_words|confidence>",
  "weakest_tip": "<one specific actionable tip for their weakest area>",
  "summary_paragraph": "<2-3 sentences honest overall assessment — be direct, name what needs improvement>",
  "one_sentence_to_practice": "<the single most important sentence targeting their biggest weakness>"
}

Rules:
- Return valid JSON only — no markdown, no extra text
- Be honest — do not inflate the score or give false encouragement
- The summary_paragraph must name one specific thing they do well AND one specific thing to fix`

const SIMULATION_REPORT_PROMPT = `You are an expert English communication coach evaluating a complete mock interview.
The user answered 5 questions. Score and analyze each answer fully, then provide an overall report.
Return ONLY this JSON, no extra text:

{
  "questions": [
    {
      "overall_score": <0-100>,
      "fluency":      { "score": <0-100>, "issue": "<specific issue>", "tip": "<specific tip>" },
      "grammar":      { "score": <0-100>, "mistakes": ["<wrong → correct>"], "tip": "<tip>" },
      "filler_words": { "score": <0-100>, "found": {"basically":0,"you know":0,"um":0,"uh":0,"like":0,"so":0}, "tip": "<tip>" },
      "confidence":   { "score": <0-100>, "observation": "<observation>", "tip": "<tip>" },
      "one_sentence_to_practice": "<sentence>"
    }
  ],
  "overall_score": <weighted average 0-100>,
  "strongest_parameter": "<fluency|grammar|filler_words|confidence>",
  "weakest_parameter": "<fluency|grammar|filler_words|confidence>",
  "weakest_tip": "<one specific tip>",
  "summary_paragraph": "<2-3 sentences honest overall assessment>",
  "one_sentence_to_practice": "<most important sentence targeting biggest weakness>"
}

Rules:
- Return valid JSON only — no markdown, no extra text
- The "questions" array must have exactly 5 entries in order
- Be honest with scores — do not inflate
- Be specific — never generic advice`

export async function getSimulationReport(results) {
  const lines = results.map((r, i) => {
    const label = `Q${i + 1} (${r.question})`
    if (r.skipped || !r.transcript) return `${label}: [Skipped — no answer given]`
    return `${label}: "${r.transcript}"`
  }).join('\n\n')

  console.log('Calling Claude for simulation report...')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: lines }],
    system: SIMULATION_REPORT_PROMPT,
  })

  const raw = message.content[0].text.trim()
  console.log('Claude simulation report raw (first 200 chars):', raw.slice(0, 200))

  // Strip any markdown code fences
  const jsonStr = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  return JSON.parse(jsonStr)
}

export async function getDashboardSummary(results) {
  const lines = results.map((r, i) => {
    const q = `Q${i + 1} (${r.question})`
    if (r.skipped || !r.feedback) return `${q}: Skipped`
    return `${q}: Score ${r.feedback.overall_score}, Answer: "${r.transcript}"`
  }).join('\n')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: lines }],
    system: SUMMARY_PROMPT,
  })

  const raw = message.content[0].text.trim()
  const jsonStr = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  return JSON.parse(jsonStr)
}

export async function getAIFeedback(transcript, scenario) {
  const userMessage = `User's spoken text:\n"${transcript}"\n\nContext: The user was practicing: ${scenario}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: userMessage }],
    system: SYSTEM_PROMPT,
  })

  const raw = message.content[0].text.trim()

  // Strip markdown code fences if present
  const jsonStr = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()

  return JSON.parse(jsonStr)
}
