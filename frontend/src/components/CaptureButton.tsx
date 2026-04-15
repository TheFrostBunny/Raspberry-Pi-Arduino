import { Camera, Mic, LayoutGrid } from "lucide-react";

export type CaptureMode = "single" | "strip";

interface CaptureButtonProps {
  onCapture: () => void;
  capturing: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  mode: CaptureMode;
  onToggleMode: () => void;
}

export function CaptureButton({ onCapture, capturing, soundEnabled, onToggleSound, mode, onToggleMode }: CaptureButtonProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onToggleSound}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all glass ${
          soundEnabled ? "text-primary neon-glow" : "text-muted-foreground"
        }`}
        title={soundEnabled ? "Sound trigger ON" : "Sound trigger OFF"}
      >
        <Mic className="h-4 w-4" />
      </button>

      <button
        onClick={onCapture}
        disabled={capturing}
        className="w-20 h-20 rounded-full flex items-center justify-center transition-all neon-glow-strong hover:scale-110 active:scale-95 disabled:opacity-50"
        style={{
          background: mode === "strip"
            ? "radial-gradient(circle, hsl(var(--neon-pink)), hsl(var(--neon-purple)))"
            : "radial-gradient(circle, hsl(var(--primary)), hsl(var(--neon-purple)))",
        }}
      >
        {mode === "strip" ? (
          <LayoutGrid className="h-8 w-8" style={{ color: "hsl(var(--primary-foreground))" }} />
        ) : (
          <Camera className="h-8 w-8" style={{ color: "hsl(var(--primary-foreground))" }} />
        )}
      </button>

      <button
        onClick={onToggleMode}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all glass ${
          mode === "strip" ? "text-accent neon-glow" : "text-muted-foreground"
        }`}
        title={mode === "strip" ? "Photo Strip mode" : "Single photo mode"}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );
}
