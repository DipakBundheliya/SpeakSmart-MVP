# SKILL.md — English Communication Trainer (BoloAI)
> This file is the single source of truth for the BoloAI project.
> Load this file at the start of every Claude conversation related to this project.
> When requirements change, ask Claude to update the relevant section of this file.

---

## 1. PROJECT OVERVIEW

**Product Name:** BoloAI (working name: SpeakSmart)
**Tagline:** "Practice speaking English. Get instant AI feedback. Sound confident."
**Type:** Web-based SaaS product
**Core Problem Solved:** Young Indians (students, freshers, early employees) are technically skilled but struggle with spoken English in professional settings — interviews, client calls, manager conversations. This holds them back in career growth.
**Solution:** An AI-powered English communication trainer with two modes — Practice Mode for learning with detailed feedback, and Interview Simulation Mode for realistic uninterrupted interview experience. A virtual interviewer speaks questions aloud, user answers, AI evaluates.

---

## 2. TARGET AUDIENCE

### Primary (MVP Validation Phase)
- Final year engineering / BBA / MBA students in Ahmedabad and Gujarat
- Age: 20–24
- Pain: Placement season coming, weak spoken English, cannot afford expensive coaching
- Willingness to pay: ₹99–₹199/month

### Secondary (Post-Validation Growth)
- Working IT professionals aged 25–35 in tier 2 Indian cities
- Pain: Want promotion or job switch but spoken English holds them back
- Willingness to pay: ₹299–₹499/month

### Long Term B2B Opportunity
- Colleges and coaching institutes
- Pay annually per batch
- Note: Manage API cost carefully — set per-student usage limits to avoid cost exceeding revenue

---

## 3. CORE VALUE PROPOSITION

Two experiences in one product:

**Practice Mode** — User answers each question, gets detailed AI feedback immediately after each answer (score, grammar, fluency, filler words, confidence). Can retry same question and see improvement. Builds skill step by step.

**Interview Simulation Mode** — Feels exactly like a real interview. Virtual interviewer speaks each question aloud. User answers. No feedback between questions — interviewer immediately moves to next question. Full report only at the end. Tests real interview pressure.

This combination is what makes people say — *"I actually practiced a real interview, not just a tool."*

---

## 4. PRODUCT STAGES

### Stage 1 — MVP (Current Stage)
**Goal:** Validate that users find AI spoken English feedback valuable enough to pay for.
**Success Metric:** 15 out of 50 users say "Yes I would pay ₹99/month for this."

**MVP Features:**
- [x] Voice recording via Web Speech API (Chrome desktop only)
- [x] Live transcription shown on screen as user speaks
- [x] Send transcription to Claude API for structured feedback
- [x] Display feedback: Score + 4 parameters (fluency, grammar, fillers, confidence)
- [x] Static interviewer avatar (stock photo)
- [ ] Mode selection screen — Practice Mode vs Interview Simulation Mode
- [ ] 5-question mock interview flow (see Section 4A)
- [ ] Interviewer voice — speaks each question aloud via Web Speech Synthesis API (free, built into browser)
- [ ] Try Again with previous score comparison banner (Practice Mode only)
- [ ] Final Interview Dashboard after Q5 (see Section 4B)
- [ ] WhatsApp share button on dashboard
- [ ] Google Form embedded at end: 3 questions only
- [ ] Deploy free on Vercel — no login, no payment needed

**MVP Does NOT Include:**
- User login or accounts
- Payment integration
- Progress tracking across sessions
- Lip synced avatar (Stage 2)
- Mobile support
- Backend database

---

### 4A. THE TWO MODES — Core Product Logic

#### Mode Selection Screen
Before starting, user sees two clear options:

```
┌─────────────────────────────┐  ┌─────────────────────────────┐
│       🎯 Practice Mode       │  │    🎤 Interview Simulation   │
│                             │  │                             │
│  Answer each question.      │  │  Full interview experience. │
│  Get detailed feedback.     │  │  No feedback in between.    │
│  Try again to improve.      │  │  Report only at the end.    │
│                             │  │                             │
│       [Start Practice]      │  │     [Start Interview]       │
└─────────────────────────────┘  └─────────────────────────────┘
```

---

#### Practice Mode Flow
```
Mode selected: Practice
  ↓
Progress bar shown: Q1 | Q2 | Q3 | Q4 | Q5
  ↓
Interviewer photo visible on screen
Interviewer voice speaks Q1 aloud via Web Speech Synthesis
Question text also shown below avatar
  ↓
[🎤 Start Speaking] button appears
User speaks → stops → transcription sent to Claude API
  ↓
Feedback shown: Overall score + 4 parameters
  ↓
Two buttons:
  [🔄 Try Again]                    [Next Question →]
       ↓                                   ↓
Same Q shown                         Save Q1 result
Previous score banner:               Move to Q2
"Last attempt: 42 — beat it?"        Interviewer speaks Q2
       ↓
User speaks again
Comparison shown:
"42 → 67 — Improved! 🎯"
or "42 → 38 — Try once more"
  ↓
[Try Again] or [Next Question →]

... same for Q2, Q3, Q4, Q5 ...

After Q5 → [See Full Report]
  ↓
FINAL DASHBOARD (Section 4B)
```

**Try Again Rules (Practice Mode):**
- Final dashboard always uses LAST attempt score, not best score
- User can Try Again unlimited times per question
- Cannot go back to previous questions
- Can skip via small "Skip →" text link

---

#### Interview Simulation Mode Flow
```
Mode selected: Interview Simulation
  ↓
Brief instruction shown:
"This is a real interview simulation.
Answer each question naturally.
No feedback will appear between questions.
Your full report will be ready at the end."
  ↓
[I'm Ready — Start Interview] button
  ↓
Interviewer photo visible
Interviewer voice speaks Q1 aloud
Question text shown below avatar
  ↓
[🎤 Start Speaking] button
User speaks → stops
  ↓
NO FEEDBACK SHOWN
Small confirmation only: "✓ Answer recorded"
  ↓
Interviewer voice immediately speaks Q2
  ↓
... same for Q3, Q4, Q5 ...
  ↓
After Q5 answer recorded →
"Interview complete. Generating your report..."
  ↓
FINAL DASHBOARD (Section 4B)
  (all 5 answers evaluated together)
```

**Key difference from Practice Mode:**
- Zero feedback between questions — feels like a real interview
- No Try Again option
- No Claude/AI call during the interview — only Groq Whisper transcription per answer (fast, no delay)
- Interviewer moves immediately to next question after "✓ Answer recorded"
- ONE single Claude call at the very end with all 5 transcripts together
- Final report looks identical to Practice Mode report

---

#### The 5 Interview Questions (same for both modes, in order)
1. "Please introduce yourself and tell me about your background."
2. "Tell me about your best project or biggest achievement so far."
3. "What is your biggest weakness, and how are you working on it?"
4. "Why should we hire you over other candidates?"
5. "Where do you see yourself five years from now?"

These 5 cover a complete real placement interview. Every student in placement season finds all 5 directly relevant.

---

#### Interviewer Voice Implementation (MVP — Zero Cost)
Use browser's built-in **Web Speech Synthesis API** — completely free, no external API needed.

```javascript
const speakQuestion = (questionText) => {
  const utterance = new SpeechSynthesisUtterance(questionText);
  utterance.rate = 0.9;      // slightly slower — feels more natural
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'));
  if (preferred) utterance.voice = preferred;
  utterance.onend = () => startRecording(); // auto-start mic when question finishes
  window.speechSynthesis.speak(utterance);
};
```

Show a subtle animation on the interviewer photo while voice is speaking — a simple CSS border pulse is enough to indicate the interviewer is "talking." No lip sync needed for MVP.

**Stage 2 upgrade:** Replace Web Speech Synthesis with ElevenLabs for a much more natural, human-sounding voice (~$5/month).
**Stage 3 upgrade:** Full lip-synced avatar via HeyGen or Beyond Presence API.

#### Auto Mic Start + Auto Stop (VAD — Voice Activity Detection)

**Auto-start:** Mic starts automatically when the interviewer finishes speaking the question (`utterance.onend`). No manual button click needed.

**Auto-stop:** Uses `@ricky0123/vad-web` (Silero VAD model, ~1MB ONNX, runs locally in browser).
- Detects actual speech vs background noise (AC, fans, keyboard) accurately
- Stops recording automatically after ~2s of silence post-speech
- Much better than raw frequency/threshold detection for Indian office/hostel environments
- Works offline after initial model load — no API cost

**Flow:**
```
Avatar speaks question (Web Speech Synthesis)
  ↓ utterance.onend fires
Mic auto-starts (VAD initialized)
  ↓ VAD detects speech start → recording begins
User speaks answer
  ↓ VAD detects 2s silence after speech ends
Recording auto-stops → audio blob sent for transcription
```

**Package:** `@ricky0123/vad-web` (frontend only, zero backend change)
**Cost:** Free
**Stage 2 upgrade:** Tune VAD sensitivity per device, add visual silence countdown ("stopping in 3…2…1…")

---

### 4B. FINAL INTERVIEW DASHBOARD

Shown after all 5 questions are complete in either mode. This is the most shareable screen — design it carefully.

**Dashboard Elements:**

1. **Overall Interview Score** — weighted average of all 5 questions
   - 80–100: "Excellent — Interview Ready! 🏆"
   - 60–79: "Good — A little more practice needed 💪"
   - 40–59: "Average — Focus on the weak areas below 📈"
   - Below 40: "Needs Work — Daily practice will help you improve fast 🎯"

2. **Per Question Score Summary** — small score cards:
   Q1: 42 | Q2: 67 | Q3: 55 | Q4: 71 | Q5: 48

3. **Your Strongest Area** — whichever of 4 parameters scored highest across all questions

4. **Your Weakest Area** — whichever scored lowest, with one specific improvement tip

5. **AI Summary Paragraph** — 2-3 sentences honest overall assessment (generated by Claude — see Section 7 for prompt)

6. **One Sentence To Practice Today** — targets their single biggest weakness

7. **WhatsApp Share Button:**
   Generates this text:
   *"I scored 61/100 in my AI mock interview on BoloAI! 🎯 Try it free: [link]"*

8. **Google Form link** — "Help us improve — 30 seconds" → opens 3-question validation form

---

### Stage 2 — Post Validation (After 15+ positive responses)
- [ ] User login (Google OAuth)
- [ ] 10 practice scenarios (interview, client call, manager 1:1, presentation, self intro)
- [ ] Progress tracking — weekly score improvement graph across sessions
- [ ] Daily streak system (like Duolingo)
- [ ] Payment integration — Razorpay for Indian users
- [ ] ElevenLabs voice for interviewer (replaces Web Speech Synthesis)
- [ ] Basic talking avatar using D-ID free tier or HeyGen API
- [ ] Save interview history — compare today vs last week
- [ ] Custom JD interview — user pastes job description, AI generates 5 relevant questions

### Stage 3 — Full Product
- [ ] Fully lip-synced realistic avatar (HeyGen or Beyond Presence API)
- [ ] Avatar reacts with expressions based on answer quality
- [ ] Industry-specific scenarios (IT, banking, sales, healthcare)
- [ ] Difficulty levels (beginner, intermediate, advanced)
- [ ] Voice tone analysis (too fast, too slow, monotone detection)
- [ ] Mobile app (React Native)
- [ ] Referral system for organic growth

---

## 5. TECH STACK

### Developer Environment Note
Node.js is available as a portable installation (no global install due to company laptop restrictions).
- Node path: `C:\Users\DipakBundheliya\node-v24.14.1-win-x64\node-v24.14.1-win-x64`
- Use `run.bat` in project root to open a terminal with Node in PATH
- In Claude bash commands, prefix with: `export PATH="/c/Users/DipakBundheliya/node-v24.14.1-win-x64/node-v24.14.1-win-x64:$PATH" &&`

### MVP Stack (Zero to Minimal Cost)
| Layer | Tool | Cost |
|---|---|---|
| Frontend | React + Tailwind CSS | Free |
| Voice Input | Web Speech API (Chrome built-in) | Free |
| Transcription | Web Speech API | Free |
| Interviewer Voice | Web Speech Synthesis API (Chrome built-in) | Free |
| AI Feedback | Claude API (Sonnet) | Near free |
| State Management | React useState (all 5 results in memory) | Free |
| Hosting | Vercel | Free |
| Domain | GoDaddy or Namecheap | ₹800/year |
| Feedback Form | Google Forms | Free |

### Stage 2 Stack (Post Validation)
| Layer | Tool | Cost |
|---|---|---|
| Auth | Firebase Google OAuth | Free tier |
| Database | Firebase Firestore | Free tier to start |
| Payments | Razorpay | 2% per transaction |
| Interviewer Voice | ElevenLabs | ~$5/month |
| Avatar (basic) | D-ID API | Pay as you go |
| Hosting | Vercel | Free to start |

### Stage 3 Stack (Scale)
| Layer | Tool | Cost |
|---|---|---|
| Avatar (premium) | HeyGen API or Beyond Presence | $5+ pay as you go |
| Backend | Node.js + Express on Railway | ~$5/month |
| Database | PostgreSQL on Railway | ~$5/month |
| Voice Analysis | AssemblyAI (tone + filler detection) | Pay per use |

---

## 6. UNIT ECONOMICS

### MVP Phase
No revenue, near zero cost. Focus only on learning.

### Early Traction (50–100 users)
| Item | Amount |
|---|---|
| Revenue (100 users × ₹199) | ₹19,900/month |
| Claude API cost | ₹1,500–₹2,500 |
| ElevenLabs (Stage 2) | ₹800 |
| Hosting + misc | ₹500 |
| **Net** | **~₹16,000/month** |

### Pricing Strategy
- Early adopter price: ₹99/month (first 50 users)
- Standard price: ₹199/month
- Annual plan: ₹1,499/year (saves 3 months)
- Foreign users: $4.99/month

**Important:** Do not price below ₹99 — API costs make it unviable.

---

## 7. AI PROMPTS

### Per-Question Feedback Prompt (Practice Mode)
```
You are an expert English communication coach specializing in helping Indian professionals improve their spoken English for workplace settings.

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
    "mistakes": ["<mistake 1: wrong → correct>", "<mistake 2: wrong → correct>"],
    "tip": "<one specific tip>"
  },
  "filler_words": {
    "score": <number 0-100>,
    "found": {"basically": <count>, "you know": <count>, "um": <count>, "uh": <count>, "like": <count>, "so": <count>},
    "tip": "<one specific tip>"
  },
  "confidence": {
    "score": <number 0-100>,
    "observation": "<one observation about confidence from sentence structure>",
    "tip": "<one actionable tip to sound more confident>"
  },
  "one_sentence_to_practice": "<one specific sentence targeting their biggest weakness>"
}

User's spoken text: "<INSERT TRANSCRIPTION HERE>"
Context: The user was answering interview question: "<INSERT QUESTION TEXT HERE>"
```

### Practice Mode — Final Dashboard Summary Prompt
```
You are an expert English communication coach. A user just completed a full 5-question mock interview. Here are their per-question scores and transcripts:

Q1 (Introduce yourself): Score <X>, Transcription: "<text>"
Q2 (Best project): Score <X>, Transcription: "<text>"
Q3 (Biggest weakness): Score <X>, Transcription: "<text>"
Q4 (Why hire you): Score <X>, Transcription: "<text>"
Q5 (5 year plan): Score <X>, Transcription: "<text>"

Return only this JSON, no extra text:
{
  "overall_score": <weighted average 0-100>,
  "strongest_parameter": "<fluency|grammar|filler_words|confidence>",
  "weakest_parameter": "<fluency|grammar|filler_words|confidence>",
  "weakest_tip": "<one specific tip for their weakest area>",
  "summary_paragraph": "<2-3 sentences honest overall assessment>",
  "one_sentence_to_practice": "<most important sentence targeting their biggest weakness>"
}
```

### Interview Simulation Mode — Full Report Prompt (ONE call for all 5 answers)
```
You are an expert English communication coach evaluating a complete mock interview.
The user answered 5 questions. Score and analyze each answer, then provide an overall report.
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
    // repeat for all 5 questions
  ],
  "overall_score": <weighted average 0-100>,
  "strongest_parameter": "<fluency|grammar|filler_words|confidence>",
  "weakest_parameter": "<fluency|grammar|filler_words|confidence>",
  "weakest_tip": "<one specific tip>",
  "summary_paragraph": "<2-3 sentences honest overall assessment>",
  "one_sentence_to_practice": "<most important sentence targeting biggest weakness>"
}

Q1 (Introduce yourself): "<transcript>"
Q2 (Best project): "<transcript>"
Q3 (Biggest weakness): "<transcript>"
Q4 (Why hire you): "<transcript>"
Q5 (5 year plan): "<transcript>"
```

**Rules for both prompts:**
- Return valid JSON only — no text before or after
- Be specific — never give generic advice
- Scores must be honest — do not inflate
- Grammar mistakes must show exact wrong phrase AND exact correct phrase

---

## 8. MVP VALIDATION PLAN

### Goal
Share with 50 people. Get honest responses about willingness to pay.

### Target People
- Final year engineering students in Ahmedabad
- Specifically those in placement preparation phase
- Avoid employed people for MVP — students respond faster and more honestly

### Outreach Message (WhatsApp / LinkedIn)
```
Hey [Name], I built a free AI mock interview tool for placement prep.

It has 2 modes:
🎯 Practice Mode — answer 5 interview questions, get AI feedback after each
🎤 Interview Mode — full real interview simulation, no interruptions

Interviewer speaks questions aloud. Full report at the end.
Takes 10 minutes. No signup needed.

Try it → [LINK]
(Open in Chrome on laptop)

One question after: Would you pay ₹99/month for unlimited practice?
```

### Post-Demo Google Form (3 questions only)
1. Was the AI feedback useful and accurate? ⭐⭐⭐⭐⭐
2. Would you pay ₹99/month to practice daily? → Yes / No / Maybe
3. What would make you actually pay for it? (one line)

### Validation Success Criteria
- 15+ out of 50 say "Yes" → Proceed to Stage 2
- 5–14 say "Yes" → Read Q3 answers, make one change, re-validate
- Under 5 say "Yes" → Major pivot needed, Q3 tells you what to fix

### Outreach Channels
1. WhatsApp — personal contacts first, then placement groups
2. LinkedIn — post publicly asking for beta testers
3. College WhatsApp groups via one friend inside PDPU / GTU / LJ University

---

## 9. MVP BUILD PLAN

### Day-by-Day Schedule
| Day | Task | Done? |
|---|---|---|
| Day 1 | Voice recording with Web Speech API, live transcription | [x] |
| Day 2 | Connect Claude API, get feedback JSON | [x] |
| Day 3 | Display feedback — score card, 4 parameters, color coded | [x] |
| Day 4 | Static interviewer photo, scenario text, polish UI | [x] |
| Day 5 | Mode selection screen — Practice vs Interview Simulation | [ ] |
| Day 6 | Interviewer voice via Web Speech Synthesis API | [ ] |
| Day 7 | 5-question flow — Next Question + Try Again + progress bar (Practice Mode) | [ ] |
| Day 8 | Interview Simulation Mode — no feedback between questions, continuous flow | [ ] |
| Day 9 | Final Dashboard — overall score, summary paragraph, per-question cards | [ ] |
| Day 10 | WhatsApp share button on dashboard | [ ] |
| Day 11 | Full flow testing — both modes, 10 times each, fix bugs | [ ] |
| Day 12 | Deploy on Vercel, share with first 20 people | [ ] |
| Day 13 | Review feedback, fix top 2 issues, share with next 30 people | [ ] |

### State Management
```javascript
const questions = [
  "Please introduce yourself and tell me about your background.",
  "Tell me about your best project or biggest achievement so far.",
  "What is your biggest weakness, and how are you working on it?",
  "Why should we hire you over other candidates?",
  "Where do you see yourself five years from now?"
];

const [mode, setMode] = useState(null); // 'practice' | 'interview'
const [currentQuestion, setCurrentQuestion] = useState(0); // 0 to 4
const [lastAttemptScore, setLastAttemptScore] = useState(null); // Try Again banner
const [questionResults, setQuestionResults] = useState([]);
// Each entry: { question, transcription, feedback, finalScore }
```

### Important Technical Notes
- Web Speech API (input) + Web Speech Synthesis API (output) both work on Chrome desktop only
- Always include in outreach: *"Open in Chrome on your laptop"*
- Test voices available on user's browser — `window.speechSynthesis.getVoices()`
- Add a small pulsing CSS animation on interviewer photo while voice is speaking

---

## 10. COMPETITIVE LANDSCAPE

| Competitor | Weakness | Your Advantage |
|---|---|---|
| ELSA Speak | Accent focus, no interview scenarios | Full mock interview, Indian context |
| Duolingo | Not professional scenarios | Real placement interview questions |
| Speechify | Reading tool, not speaking | Speaking and feedback focused |
| ChatGPT | No structured UI, no interview flow | Purpose built, visual dashboard |
| Human coaches | ₹500–₹2,000/session, not scalable | 1/10th price, available 24/7 |

**Unique position:** Only tool with both Practice Mode (learn with feedback) and Interview Simulation Mode (feel real pressure). India-specific, affordable, instant. Interviewer speaks questions aloud.

---

## 11. FUTURE MONETIZATION IDEAS (Post 500 users)

- **Affiliate:** Recommend English courses, earn commission
- **Resume Review Add-on:** ₹99 one time per resume
- **Mock Interview Report PDF:** ₹49 per downloadable report
- **Corporate Plans:** Sell to IT companies for employee training
- **WhatsApp Bot Version:** Simpler version for tier 3 city users
- **Custom JD Interview:** User pastes job description, AI generates 5 relevant questions — ₹49/session premium

---

## 12. FOUNDER CONTEXT

**Builder:** John — AI/ML developer based in Ahmedabad, Gujarat
**Current Situation:** Full time job + building this on the side
**Available Time:** Evenings after work
**Budget:** ₹5,000–₹10,000 maximum initial investment
**Goal:** Recurring monthly revenue from individual subscribers
**Key Constraint:** Must validate before investing significant time or money

---

## 13. HOW TO USE THIS FILE WITH CLAUDE

At the start of any new Claude conversation about this project, paste:

```
Read this SKILL.md file for full project context before helping me:
[paste full contents of this file]

Today I need help with: [your specific task]
```

### To Update This File
Tell Claude exactly what to change:
- "Mark Day 5 as done in Section 9"
- "Change pricing to ₹299 in Section 6"
- "Add new feature to Stage 2 in Section 4"
- "Add new competitor in Section 10"

Claude updates the relevant section and you paste it back into this file.

---

*Last updated: April 2026*
*Current stage: MVP — Days 1–4 complete*
*Next action: Day 5 — Mode selection screen (Practice Mode vs Interview Simulation Mode)*