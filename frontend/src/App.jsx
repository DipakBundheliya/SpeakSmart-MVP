import { useState, useEffect, useRef } from 'react'
import { flog } from './logger.js'
import Avatar from './components/Avatar'
import Recorder from './components/Recorder'
import Transcript from './components/Transcript'
import FeedbackCard from './components/FeedbackCard'
import ProgressBar from './components/ProgressBar'
import Dashboard from './components/Dashboard'
import ModeSelect from './components/ModeSelect'
import ThemeToggle from './components/ThemeToggle'
import './index.css'

const QUESTIONS = [
  "Please introduce yourself and tell me about your background.",
  "Tell me about your best project or biggest achievement so far.",
  "What is your biggest weakness, and how are you working on it?",
  "Why should we hire you over other candidates?",
  "Where do you see yourself five years from now?",
]

// status: idle | transcribing | analyzing | feedback | recorded | summary_loading | dashboard

// ── Voice utility ──────────────────────────────────────────────────────────
const speakText = (text, onStart, onEnd) => {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9
  utterance.pitch = 1.0
  utterance.volume = 1.0
  // Prefer a clear English voice
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('google'))
  if (preferred) utterance.voice = preferred
  utterance.onstart = onStart
  utterance.onend = onEnd
  utterance.onerror = onEnd
  window.speechSynthesis.speak(utterance)
}

export default function App() {
  const [mode, setMode] = useState(null)            // null | 'practice' | 'simulation'
  const [currentQ, setCurrentQ] = useState(0)
  const [status, setStatus] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [lastAttemptScore, setLastAttemptScore] = useState(null)
  const [questionResults, setQuestionResults] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [questionReady, setQuestionReady] = useState(false)
  const [recorderError, setRecorderError] = useState('')
  const lastSpokenQ = useRef(-1)

  // ── Speak question when it becomes active (once per question) ──────────────
  useEffect(() => {
    if (mode && status === 'idle' && lastSpokenQ.current !== currentQ) {
      lastSpokenQ.current = currentQ
      setQuestionReady(true)   // start VAD loading immediately, parallel with TTS
      setRecorderError('')
      flog(`TTS: speaking Q${currentQ + 1}`)
      speakText(
        QUESTIONS[currentQ],
        () => { setIsSpeaking(true); flog('TTS: started') },
        () => { setIsSpeaking(false); flog('TTS: finished') },
      )
    }
  }, [currentQ, mode, status])

  // ── Stop speech on unmount / mode reset ───────────────────────────────────
  useEffect(() => {
    return () => window.speechSynthesis?.cancel()
  }, [])

  // ── Generate final dashboard ───────────────────────────────────────────────
  const generateDashboard = async (results) => {
    setStatus('summary_loading')
    // Simulation mode: one combined Claude call for all 5 answers
    // Practice mode: quick summary call (per-question scores already exist)
    const endpoint = mode === 'simulation' ? '/api/summary/simulation' : '/api/summary'
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      })
      const data = await res.json()
      setDashboard(data)
    } catch (err) {
      console.error('Summary error:', err)
    }
    setStatus('dashboard')
  }

  // ── Audio ready → transcribe → analyze ────────────────────────────────────
  const handleAudioReady = async (audioBlob) => {
    setStatus('transcribing')
    let finalTranscript = ''

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.wav')
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      finalTranscript = data.transcript
      if (mode === 'practice') setTranscript(finalTranscript)
    } catch (err) {
      console.error('Transcription error:', err)
      setRecorderError('Transcription failed — Groq API error. Speak again.')
      setQuestionReady(false)
      setStatus('idle')
      return
    }

    if (mode === 'simulation') {
      // Simulation: NO Claude call here — just store transcript, move on immediately
      const result = { question: QUESTIONS[currentQ], transcript: finalTranscript, feedback: null, skipped: false }
      const newResults = [...questionResults, result]
      setQuestionResults(newResults)
      setStatus('recorded')

      setTimeout(() => {
        if (currentQ === QUESTIONS.length - 1) {
          generateDashboard(newResults)
        } else {
          setCurrentQ(q => q + 1)
          setTranscript('')
          setQuestionReady(false)
          setStatus('idle')
        }
      }, 1800)
      return
    }

    // Practice mode — call Claude per question
    setStatus('analyzing')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: finalTranscript, scenario: QUESTIONS[currentQ] }),
      })
      const data = await res.json()
      setFeedback(data)
      setStatus('feedback')
    } catch (err) {
      console.error('Feedback error:', err)
      setRecorderError('AI feedback failed. Speak again.')
      setQuestionReady(false)
      setStatus('idle')
    }
  }

  // ── Practice mode: Try Again ───────────────────────────────────────────────
  const handleTryAgain = () => {
    setLastAttemptScore(feedback.overall_score)
    setTranscript('')
    setFeedback(null)
    setStatus('idle')
  }

  // ── Practice mode: advance (next question or dashboard) ───────────────────
  const advanceQuestion = async (skipped = false) => {
    const result = {
      question: QUESTIONS[currentQ],
      transcript: skipped ? '' : transcript,
      feedback: skipped ? null : feedback,
      skipped,
    }
    const newResults = [...questionResults, result]
    setQuestionResults(newResults)

    if (currentQ === QUESTIONS.length - 1) {
      generateDashboard(newResults)
    } else {
      setCurrentQ(q => q + 1)
      setTranscript('')
      setFeedback(null)
      setLastAttemptScore(null)
      setQuestionReady(false)
      setStatus('idle')
    }
  }

  // ── Restart everything ─────────────────────────────────────────────────────
  const handleRestart = () => {
    window.speechSynthesis?.cancel()
    setMode(null)
    setCurrentQ(0)
    setStatus('idle')
    setTranscript('')
    setFeedback(null)
    setLastAttemptScore(null)
    setQuestionResults([])
    setDashboard(null)
    setIsSpeaking(false)
    setQuestionReady(false)
    lastSpokenQ.current = -1
  }

  // ── Header (shared) ────────────────────────────────────────────────────────
  const Header = () => (
    <div className="w-full max-w-xl flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Speak<span className="gradient-text">Smart</span>
        </h1>
        {mode && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {mode === 'practice' ? '🎯 Practice Mode' : '🎤 Interview Simulation'}
          </p>
        )}
      </div>
      <ThemeToggle />
    </div>
  )

  // ── Mode selection screen ──────────────────────────────────────────────────
  if (!mode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center px-4 py-10 gap-8">
        <Header />
        <div className="w-full max-w-xl">
          <ModeSelect onSelect={(m) => { setMode(m); lastSpokenQ.current = -1 }} />
        </div>
        <p className="text-muted-foreground/50 text-xs mt-auto">Open in Chrome on a laptop for best experience</p>
      </div>
    )
  }

  // ── Final dashboard ────────────────────────────────────────────────────────
  if (status === 'dashboard') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center px-4 py-10 gap-8">
        <Header />
        <Dashboard dashboard={dashboard} questionResults={questionResults} onRestart={handleRestart} />
      </div>
    )
  }

  // ── Simulation mode: brief intro screen ───────────────────────────────────
  if (mode === 'simulation' && status === 'idle' && currentQ === 0 && questionResults.length === 0 && lastSpokenQ.current === -1) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center px-4 py-10 gap-8">
        <Header />
        <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-8 shadow-sm text-center flex flex-col gap-5">
          <div className="text-4xl">🎤</div>
          <h2 className="text-xl font-bold text-foreground">Interview Simulation</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            This is a real interview simulation. Answer each of the 5 questions naturally.
            <strong className="text-foreground"> No feedback will appear between questions.</strong>
            {' '}Your full report will be ready at the end.
          </p>
          <button
            onClick={() => { lastSpokenQ.current = -1; setStatus('idle') }}
            className="gradient-primary text-primary-foreground rounded-xl px-8 py-3 font-semibold text-sm hover:shadow-lg transition-all cursor-pointer mx-auto"
          >
            I'm Ready — Start Interview
          </button>
        </div>
        <p className="text-muted-foreground/50 text-xs mt-auto">Open in Chrome on a laptop for best experience</p>
      </div>
    )
  }

  // ── Main interview screen ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-10 gap-6">
      <Header />

      <div className="w-full max-w-xl flex flex-col gap-5">
        <ProgressBar current={currentQ} total={QUESTIONS.length} />

        <Avatar scenario={QUESTIONS[currentQ]} questionNumber={currentQ + 1} isSpeaking={isSpeaking} />

        {/* Try Again banner (practice only) */}
        {mode === 'practice' && status === 'idle' && lastAttemptScore !== null && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-amber-700 dark:text-amber-300 text-sm font-medium">
              Last attempt: <strong>{lastAttemptScore}/100</strong> — Can you beat it?
            </span>
            <span className="text-lg">🎯</span>
          </div>
        )}

        {/* Transcript (practice only) */}
        {mode === 'practice' && transcript && <Transcript text={transcript} />}

        {/* Recorder */}
        {status === 'idle' && (
          <div className="flex flex-col items-center gap-2">
            {recorderError && (
              <div className="w-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-red-600 dark:text-red-400 text-sm">{recorderError}</p>
                <button
                  onClick={() => { setRecorderError(''); setQuestionReady(true) }}
                  className="text-xs font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg px-3 py-1 hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer shrink-0"
                >
                  Speak Again
                </button>
              </div>
            )}
            <Recorder onAudioReady={handleAudioReady} autoStart={questionReady} />
            {mode === 'practice' && (
              <button
                onClick={() => advanceQuestion(true)}
                className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline-offset-2 hover:underline transition-colors cursor-pointer mt-1"
              >
                Skip this question →
              </button>
            )}
          </div>
        )}

        {/* Spinners */}
        {status === 'transcribing' && (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-primary text-sm font-medium">Transcribing your speech…</p>
          </div>
        )}
        {status === 'analyzing' && (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
            <p className="text-secondary text-sm font-medium">Analyzing with AI…</p>
          </div>
        )}
        {status === 'summary_loading' && (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
            <p className="text-secondary text-sm font-medium">Generating your interview report…</p>
          </div>
        )}

        {/* Simulation: answer recorded confirmation */}
        {status === 'recorded' && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-4 text-center">
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">✓ Answer recorded</p>
            <p className="text-muted-foreground text-xs mt-1">Moving to next question…</p>
          </div>
        )}

        {/* Practice: feedback + action buttons */}
        {mode === 'practice' && status === 'feedback' && feedback && (
          <>
            {lastAttemptScore !== null && (
              <div className={`rounded-xl px-4 py-3 flex items-center justify-between border ${
                feedback.overall_score > lastAttemptScore
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
              }`}>
                <span className={`text-sm font-medium ${
                  feedback.overall_score > lastAttemptScore
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {lastAttemptScore} → {feedback.overall_score} —{' '}
                  {feedback.overall_score > lastAttemptScore ? 'Improved! 🎯' : 'Try once more 💪'}
                </span>
              </div>
            )}

            <FeedbackCard feedback={feedback} />

            <div className="flex items-center gap-3">
              <button
                onClick={handleTryAgain}
                className="flex-1 px-4 py-2.5 bg-muted hover:bg-muted/70 text-foreground rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => advanceQuestion(false)}
                className="flex-1 px-4 py-2.5 gradient-primary text-primary-foreground rounded-xl text-sm font-medium transition-all hover:shadow-lg cursor-pointer"
              >
                {currentQ === QUESTIONS.length - 1 ? 'See Full Report →' : 'Next Question →'}
              </button>
            </div>
          </>
        )}
      </div>

      <p className="text-muted-foreground/50 text-xs mt-auto">Open in Chrome on a laptop for best experience</p>
    </div>
  )
}
