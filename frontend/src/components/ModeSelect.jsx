export default function ModeSelect({ onSelect }) {
  return (
    <div className="w-full flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Choose Your Mode</h2>
        <p className="text-muted-foreground text-sm mt-1">How would you like to practice today?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Practice Mode */}
        <button
          onClick={() => onSelect('practice')}
          className="group bg-card border-2 border-border hover:border-primary rounded-2xl p-6 text-left transition-all duration-200 hover:shadow-lg cursor-pointer"
        >
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="text-foreground font-bold text-base mb-2">Practice Mode</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Answer each question and get <strong className="text-foreground">detailed AI feedback</strong> immediately. Try again to improve your score.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-primary text-sm font-semibold">
            Start Practice
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Interview Simulation */}
        <button
          onClick={() => onSelect('simulation')}
          className="group bg-card border-2 border-border hover:border-secondary rounded-2xl p-6 text-left transition-all duration-200 hover:shadow-lg cursor-pointer"
        >
          <div className="text-3xl mb-3">🎤</div>
          <h3 className="text-foreground font-bold text-base mb-2">Interview Simulation</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Experience a <strong className="text-foreground">real interview</strong>. No feedback between questions. Full report only at the end.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-secondary text-sm font-semibold">
            Start Interview
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Tip */}
      <p className="text-center text-xs text-muted-foreground/60">
        💡 New to this? Start with Practice Mode first.
      </p>
    </div>
  )
}
