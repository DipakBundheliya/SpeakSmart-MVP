export default function ProgressBar({ current, total = 5 }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">Mock Interview Progress</span>
        <span className="text-xs text-muted-foreground">{current + 1} / {total}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`h-2 w-full rounded-full transition-all duration-500 ${
                i < current
                  ? 'bg-primary'
                  : i === current
                  ? 'gradient-primary'
                  : 'bg-muted'
              }`}
            />
            <span className={`text-xs font-medium ${
              i === current ? 'text-primary' : i < current ? 'text-muted-foreground' : 'text-muted-foreground/40'
            }`}>
              Q{i + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
