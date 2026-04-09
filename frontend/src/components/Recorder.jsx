import { useState, useRef, useEffect } from 'react'
import { MicVAD } from '@ricky0123/vad-web'
import { flog, fwarn, ferr } from '../logger.js'

// Mirror errors to browser alert so they are never silent
function loudError(msg) {
  ferr(msg)
  console.error('[VAD ERROR]', msg)
}

// Encode a Float32Array (16 kHz mono PCM from VAD) as a WAV blob
function encodeWAV(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)) }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)   // PCM
  view.setUint16(22, 1, true)   // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    offset += 2
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

// vadState: idle | loading | listening | speaking | processing | error
export default function Recorder({ onAudioReady, autoStart }) {
  const [vadState, setVadState] = useState('idle')
  const [vadError, setVadError] = useState('')
  const [seconds, setSeconds] = useState(0)
  const vadRef = useRef(null)
  const timerRef = useRef(null)
  const autoStarted = useRef(false)

  // Auto-start VAD when parent signals question is ready
  useEffect(() => {
    if (autoStart && !autoStarted.current && vadState === 'idle') {
      autoStarted.current = true
      flog('VAD: autoStart triggered, calling initVAD()')
      initVAD()
    }
  }, [autoStart])

  // Cleanup on unmount
  useEffect(() => {
    return () => { destroyVAD() }
  }, [])

  async function initVAD() {
    try {
      flog('VAD: loading ONNX model…')
      setVadState('loading')

      flog('VAD: calling MicVAD.new()…')

      const vad = await MicVAD.new({
        baseAssetPath: '/',
        onnxWASMBasePath: '/',
        model: 'legacy',
        positiveSpeechThreshold: 0.6,
        negativeSpeechThreshold: 0.35,
        minSpeechFrames: 4,
        redemptionFrames: 12,
        onSpeechStart: () => {
          window.speechSynthesis?.cancel()   // barge-in: stop question if still speaking
          flog('VAD: speech started (TTS cancelled if it was active)')
          setVadState('speaking')
          setSeconds(0)
          timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
        },
        onSpeechEnd: (audio) => {
          flog(`VAD: speech ended — ${audio.length} samples (${(audio.length / 16000).toFixed(1)}s)`)
          clearInterval(timerRef.current)
          setVadState('processing')
          destroyVAD()
          const blob = encodeWAV(audio)
          flog(`VAD: WAV encoded — ${blob.size} bytes, sending to backend`)
          onAudioReady(blob)
        },
        onVADMisfire: () => {
          fwarn('VAD: misfire (too short), still listening')
          clearInterval(timerRef.current)
          setVadState('listening')
        },
      })

      vadRef.current = vad
      vad.start()
      flog('VAD: mic is live — listening for speech')
      setVadState('listening')
    } catch (e) {
      const msg = e?.message || String(e)
      loudError(`VAD: init failed — ${msg}`)
      setVadError(msg)
      setVadState('error')
    }
  }

  function destroyVAD() {
    if (vadRef.current) {
      try { vadRef.current.destroy() } catch (_) {}
      vadRef.current = null
    }
    clearInterval(timerRef.current)
  }

  function handleRetry() {
    setVadError('')
    setVadState('idle')
    autoStarted.current = false
    initVAD()
  }

  // Manual stop fallback when speaking
  function handleManualStop() {
    flog('VAD: manual stop triggered')
    if (vadRef.current) {
      try { vadRef.current.pause() } catch (_) {}
    }
    clearInterval(timerRef.current)
    setVadState('idle')
    destroyVAD()
  }

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // ── Loading state — ONNX model downloading/initializing ──────────────────
  if (vadState === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center shadow">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
        <p className="text-primary text-sm font-medium animate-pulse">Loading mic model…</p>
        <p className="text-xs text-muted-foreground/60">First load takes a few seconds</p>
      </div>
    )
  }

  // ── Listening state — mic is active, waiting for speech ──────────────────
  if (vadState === 'listening') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary opacity-20 animate-pulse-ring" />
          <div className="w-24 h-24 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2zm7 8a1 1 0 0 1 1 1 8 8 0 0 1-7 7.94V22h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.06A8 8 0 0 1 4 12a1 1 0 1 1 2 0 6 6 0 1 0 12 0 1 1 0 0 1 1-1z" />
            </svg>
          </div>
        </div>
        <p className="text-primary text-sm font-medium animate-pulse">Listening… start speaking</p>
        <p className="text-xs text-muted-foreground/60">Mic is active — speak naturally</p>
      </div>
    )
  }

  // ── Speaking state — VAD detected voice, recording in progress ───────────
  if (vadState === 'speaking') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full gradient-primary opacity-30 animate-pulse-ring" />
          <div className="absolute inset-[-8px] rounded-full gradient-primary opacity-15 animate-pulse-ring" style={{ animationDelay: '0.4s' }} />
          <button
            onClick={handleManualStop}
            className="relative w-24 h-24 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-xl scale-110 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-destructive text-sm font-medium">● Recording… stop speaking to submit</p>
          <p className="text-muted-foreground text-xs font-mono">{formatTime(seconds)}</p>
        </div>
        <p className="text-xs text-muted-foreground/60">Or tap the button to stop manually</p>
      </div>
    )
  }

  // ── Processing state ──────────────────────────────────────────────────────
  if (vadState === 'processing') {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-primary text-sm font-medium">Processing…</p>
      </div>
    )
  }

  // ── Error state — VAD failed, show message + retry ───────────────────────
  if (vadState === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 w-full text-center">
          <p className="text-red-600 dark:text-red-400 text-sm font-semibold mb-1">Mic failed to start</p>
          <p className="text-red-500 text-xs font-mono break-all">{vadError}</p>
        </div>
        <button
          onClick={handleRetry}
          className="px-5 py-2 gradient-primary text-primary-foreground rounded-xl text-sm font-medium cursor-pointer"
        >
          Retry
        </button>
      </div>
    )
  }

  // ── Idle state — waiting for autoStart ───────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center shadow">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2zm7 8a1 1 0 0 1 1 1 8 8 0 0 1-7 7.94V22h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.06A8 8 0 0 1 4 12a1 1 0 1 1 2 0 6 6 0 1 0 12 0 1 1 0 0 1 1-1z" />
        </svg>
      </div>
      <p className="text-muted-foreground text-sm font-medium">Waiting for question to finish…</p>
    </div>
  )
}
