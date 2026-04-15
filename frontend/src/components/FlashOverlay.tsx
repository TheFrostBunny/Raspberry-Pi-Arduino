export function FlashOverlay() {
  return (
    <div className="absolute inset-0 z-40 pointer-events-none animate-flash"
      style={{ backgroundColor: "hsl(var(--foreground))" }}
    />
  );
}
