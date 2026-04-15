interface StripProgressProps {
  current: number;
  total: number;
}

export function StripProgress({ current, total }: StripProgressProps) {
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 glass rounded-full px-6 py-2 flex items-center gap-3">
      <span className="text-sm font-medium text-foreground">Photo</span>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i < current
                ? "bg-accent neon-glow scale-100"
                : i === current
                ? "bg-primary animate-pulse-neon scale-110"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-mono text-primary">
        {current}/{total}
      </span>
    </div>
  );
}
