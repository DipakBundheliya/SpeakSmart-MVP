const PARAM_LABELS = {
  fluency: { label: 'Fluency', icon: '🗣️' },
  grammar: { label: 'Grammar', icon: '📝' },
  filler_words: { label: 'Filler Words', icon: '🔇' },
  confidence: { label: 'Confidence', icon: '💪' },
}

function scoreColor(score) {
  if (score >= 71) return { text: 'text-emerald-500', bg: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' }
  if (score >= 41) return { text: 'text-amber-500', bg: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' }
  return { text: 'text-red-500', bg: 'bg-red-500', light: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800' }
}

function overallLabel(score) {
  if (score >= 80) return "Excellent — Interview Ready! 🏆"
  if (score >= 60) return "Good — A little more practice needed 💪"
  if (score >= 40) return "Average — Focus on the weak areas below 📈"
  return "Needs Work — Daily practice will help you improve fast 🎯"
}

export default function Dashboard({ dashboard, questionResults, onRestart }) {
  // Simulation mode: per-question feedback comes from dashboard.questions[]
  // Practice mode: per-question feedback comes from questionResults[].feedback
  const perQuestionFeedback = dashboard?.questions
    ? dashboard.questions
    : questionResults.map(r => r.feedback)

  const overallScore = dashboard?.overall_score ?? Math.round(
    perQuestionFeedback.filter(Boolean).reduce((sum, f) => sum + f.overall_score, 0) /
    (perQuestionFeedback.filter(Boolean).length || 1)
  )

  const oc = scoreColor(overallScore)

  const handleShare = () => {
    const text = `I scored ${overallScore}/100 in my AI mock interview on SpeakSmart! 🎯 Try it free: ${window.location.href}`
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div className="w-full max-w-xl flex flex-col gap-5">
      {/* Overall score */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center">
        <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-4">Interview Complete</p>
        <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full border-4 ${oc.border} ${oc.light} mb-3`}>
          <span className={`text-4xl font-bold ${oc.text}`}>{overallScore}</span>
        </div>
        <p className="text-muted-foreground text-sm mb-2">Overall Score out of 100</p>
        <p className="text-foreground font-semibold text-base">{overallLabel(overallScore)}</p>
      </div>

      {/* Per-question scores */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-4">Per Question Score</p>
        <div className="grid grid-cols-5 gap-2">
          {questionResults.map((r, i) => {
            const s = perQuestionFeedback[i]?.overall_score ?? null
            const c = s !== null ? scoreColor(s) : null
            return (
              <div key={i} className={`rounded-xl p-2 text-center border ${c ? `${c.light} ${c.border}` : 'bg-muted/50 border-border'}`}>
                <p className="text-xs text-muted-foreground mb-1">Q{i + 1}</p>
                <p className={`text-lg font-bold ${c ? c.text : 'text-muted-foreground'}`}>
                  {s !== null ? s : '—'}
                </p>
                {r.skipped && <p className="text-xs text-muted-foreground/60">skip</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Strongest / Weakest */}
      {dashboard && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-widest mb-1">Strongest</p>
            <p className="text-foreground font-semibold text-sm">
              {PARAM_LABELS[dashboard.strongest_parameter]?.icon} {PARAM_LABELS[dashboard.strongest_parameter]?.label}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4">
            <p className="text-xs text-red-500 font-semibold uppercase tracking-widest mb-1">Needs Work</p>
            <p className="text-foreground font-semibold text-sm">
              {PARAM_LABELS[dashboard.weakest_parameter]?.icon} {PARAM_LABELS[dashboard.weakest_parameter]?.label}
            </p>
            {dashboard.weakest_tip && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{dashboard.weakest_tip}</p>
            )}
          </div>
        </div>
      )}

      {/* AI Summary */}
      {dashboard?.summary_paragraph && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-3">AI Assessment</p>
          <p className="text-foreground text-sm leading-relaxed">{dashboard.summary_paragraph}</p>
        </div>
      )}

      {/* Practice sentence */}
      {dashboard?.one_sentence_to_practice && (
        <div className="bg-card border border-primary/20 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-3">Sentence to Practice Today</p>
          <p className="text-foreground text-base font-medium leading-relaxed italic">
            "{dashboard.one_sentence_to_practice}"
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleShare}
          className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
        >
          📲 Share on WhatsApp
        </button>
        <a
          href="https://forms.gle/your-form-link"
          target="_blank"
          rel="noreferrer"
          className="w-full px-6 py-3 bg-muted hover:bg-muted/70 text-foreground rounded-xl text-sm font-medium transition-colors cursor-pointer text-center"
        >
          Help us improve — 3 quick questions ✍️
        </a>
        <button
          onClick={onRestart}
          className="w-full px-6 py-2.5 gradient-primary text-primary-foreground rounded-xl text-sm font-medium transition-all hover:shadow-lg cursor-pointer"
        >
          🔄 Practice Again
        </button>
      </div>
    </div>
  )
}
