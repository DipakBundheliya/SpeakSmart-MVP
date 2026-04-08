function scoreColor(score) {
  if (score >= 71) return { text: 'text-emerald-500', bg: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' }
  if (score >= 41) return { text: 'text-amber-500', bg: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' }
  return { text: 'text-red-500', bg: 'bg-red-500', light: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800' }
}

function ScoreBar({ score }) {
  const c = scoreColor(score)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${c.bg} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-bold w-8 text-right ${c.text}`}>{score}</span>
    </div>
  )
}

function ParameterCard({ title, icon, score, primary, secondary, tip }) {
  const c = scoreColor(score)
  return (
    <div className={`rounded-2xl border p-4 ${c.light} ${c.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <span className={`text-lg font-bold ${c.text}`}>{score}</span>
      </div>
      <ScoreBar score={score} />
      {primary && (
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{primary}</p>
      )}
      {secondary && Array.isArray(secondary) && secondary.length > 0 && (
        <ul className="mt-2 space-y-1">
          {secondary.map((item, i) => (
            <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
              <span className="text-red-400 mt-0.5 shrink-0">✗</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      {tip && (
        <div className="mt-3 flex gap-1.5">
          <span className="text-primary text-xs mt-0.5 shrink-0">💡</span>
          <p className="text-xs text-primary font-medium leading-relaxed">{tip}</p>
        </div>
      )}
    </div>
  )
}

function FillerWordsCard({ score, found, tip }) {
  const c = scoreColor(score)
  const fillers = Object.entries(found).filter(([, count]) => count > 0)
  const totalFillers = Object.values(found).reduce((a, b) => a + b, 0)

  return (
    <div className={`rounded-2xl border p-4 ${c.light} ${c.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔇</span>
          <span className="text-sm font-semibold text-foreground">Filler Words</span>
        </div>
        <span className={`text-lg font-bold ${c.text}`}>{score}</span>
      </div>
      <ScoreBar score={score} />
      <div className="mt-3">
        {totalFillers === 0 ? (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ No filler words detected</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {fillers.map(([word, count]) => (
              <span key={word} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                "{word}" ×{count}
              </span>
            ))}
          </div>
        )}
      </div>
      {tip && (
        <div className="mt-3 flex gap-1.5">
          <span className="text-xs mt-0.5 shrink-0">💡</span>
          <p className="text-xs text-primary font-medium leading-relaxed">{tip}</p>
        </div>
      )}
    </div>
  )
}

export default function FeedbackCard({ feedback }) {
  if (!feedback) return null

  const overall = scoreColor(feedback.overall_score)

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Overall score */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center">
        <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-4">Overall Score</p>
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${overall.border} ${overall.light} mb-3`}>
          <span className={`text-4xl font-bold ${overall.text}`}>{feedback.overall_score}</span>
        </div>
        <p className="text-muted-foreground text-sm">out of 100</p>
        <div className="mt-4 w-full">
          <ScoreBar score={feedback.overall_score} />
        </div>
      </div>

      {/* 4 parameter cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ParameterCard
          title="Fluency"
          icon="🗣️"
          score={feedback.fluency.score}
          primary={feedback.fluency.issue}
          tip={feedback.fluency.tip}
        />
        <ParameterCard
          title="Grammar"
          icon="📝"
          score={feedback.grammar.score}
          secondary={feedback.grammar.mistakes}
          tip={feedback.grammar.tip}
        />
        <FillerWordsCard
          score={feedback.filler_words.score}
          found={feedback.filler_words.found}
          tip={feedback.filler_words.tip}
        />
        <ParameterCard
          title="Confidence"
          icon="💪"
          score={feedback.confidence.score}
          primary={feedback.confidence.observation}
          tip={feedback.confidence.tip}
        />
      </div>

      {/* Practice sentence */}
      <div className="bg-card border border-primary/20 rounded-2xl p-5 shadow-sm">
        <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-3">Sentence to Practice</p>
        <p className="text-foreground text-base font-medium leading-relaxed italic">
          "{feedback.one_sentence_to_practice}"
        </p>
      </div>
    </div>
  )
}
