interface CountdownOverlayProps {
  count: number;
}

export function CountdownOverlay({ count }: CountdownOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
      <span
        key={count}
        className="text-9xl font-bold neon-text animate-countdown-pop"
        style={{ color: "hsl(var(--primary))" }}
      >
        {count}
      </span>
    </div>
  );
}
