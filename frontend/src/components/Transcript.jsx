export default function Transcript({ text }) {
  const isEmpty = !text || text.trim().length === 0

  return (
    <div className="w-full bg-card border border-border rounded-2xl p-5 min-h-[120px] shadow-sm">
      <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-3">Live Transcript</p>
      {isEmpty ? (
        <p className="text-muted-foreground/50 italic text-sm">
          Your speech will appear here as you speak…
        </p>
      ) : (
        <p className="text-foreground text-base leading-relaxed">{text}</p>
      )}
    </div>
  )
}
