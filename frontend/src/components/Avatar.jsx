export default function Avatar({ scenario, questionNumber, isSpeaking = false }) {
  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-8">
      {/* Left: Avatar + details */}
      <div className="flex flex-col items-center gap-3 shrink-0">
        {/* Avatar circle — pulses while speaking */}
        <div className="relative">
          {isSpeaking && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-primary opacity-40 animate-pulse-ring" />
              <div className="absolute inset-[-6px] rounded-full border-4 border-primary opacity-20 animate-pulse-ring" style={{ animationDelay: '0.4s' }} />
            </>
          )}
          <div className={`w-24 h-24 rounded-full bg-accent border-4 flex items-center justify-center overflow-hidden shadow-lg transition-all duration-300 ${
            isSpeaking ? 'border-primary shadow-primary/30 shadow-xl' : 'border-primary/50'
          }`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-14 h-14 text-muted-foreground"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Interviewer</p>
          <p className="text-base font-semibold text-foreground mt-0.5">Priya Sharma</p>
          <p className="text-xs text-muted-foreground">HR Manager · TechCorp India</p>
          {isSpeaking && (
            <p className="text-xs text-primary font-medium mt-1 animate-pulse">Speaking…</p>
          )}
        </div>
      </div>

      {/* Right: Question card */}
      <div className="bg-card border border-border rounded-2xl px-6 py-5 shadow-sm flex-1 w-full md:w-auto">
        <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-2">
          Question {questionNumber}
        </p>
        <p className="text-foreground text-base font-medium leading-relaxed">{scenario}</p>
      </div>
    </div>
  )
}
