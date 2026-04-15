import { useState, useCallback, useRef } from "react";
import { useCameraFeed } from "@/hooks/useCameraFeed";
import { useFaceMesh } from "@/hooks/useFaceMesh";
import { useClapDetection } from "@/hooks/useClapDetection";
import { CameraView } from "./CameraView";
import { EffectSelector } from "./EffectSelector";
import { CaptureButton, type CaptureMode } from "./CaptureButton";
import { CountdownOverlay } from "./CountdownOverlay";
import { FlashOverlay } from "./FlashOverlay";
import { ResultScreen } from "./ResultScreen";
import { StripResultScreen, generateStrip } from "./StripResultScreen";
import { StripProgress } from "./StripProgress";

export function PhotoBooth() {
  const { videoRef, error, ready } = useCameraFeed();
  const { landmarks } = useFaceMesh(videoRef, ready);

  const [activeEffect, setActiveEffect] = useState("none");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>("single");

  // Single photo state
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [gifDataUrl, setGifDataUrl] = useState<string | null>(null);
  const [generatingGif, setGeneratingGif] = useState(false);

  // Strip state
  const [stripPhotos, setStripPhotos] = useState<string[]>([]);
  const [stripCurrentIndex, setStripCurrentIndex] = useState(0);
  const [stripInProgress, setStripInProgress] = useState(false);
  const [stripDataUrl, setStripDataUrl] = useState<string | null>(null);
  const [generatingStrip, setGeneratingStrip] = useState(false);
  const [showStripResult, setShowStripResult] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(false);
  const capturing = useRef(false);
  const framesRef = useRef<HTMLCanvasElement[]>([]);

  const collectFrame = useCallback(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const clone = document.createElement("canvas");
    clone.width = canvas.width;
    clone.height = canvas.height;
    clone.getContext("2d")!.drawImage(canvas, 0, 0);
    framesRef.current.push(clone);
    if (framesRef.current.length > 3) framesRef.current.shift();
  }, []);

  const generateGif = useCallback(async (frames: HTMLCanvasElement[]) => {
    if (frames.length < 2) return;
    setGeneratingGif(true);
    try {
      if (!document.querySelector('script[src*="gif.js"]')) {
        await new Promise<void>((resolve) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js";
          s.onload = () => resolve();
          document.head.appendChild(s);
        });
      }
      const GIF = (window as any).GIF;
      const gif = new GIF({
        workers: 2, quality: 10,
        width: frames[0].width, height: frames[0].height,
        workerScript: "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js",
      });
      frames.forEach((frame) => gif.addFrame(frame, { delay: 300 }));
      gif.on("finished", (blob: Blob) => {
        setGifDataUrl(URL.createObjectURL(blob));
        setGeneratingGif(false);
      });
      gif.render();
    } catch (e) {
      console.error("GIF generation failed:", e);
      setGeneratingGif(false);
    }
  }, []);

  // Countdown helper that resolves when done
  const runCountdown = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      let count = 3;
      setCountdown(count);
      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
        } else {
          clearInterval(timer);
          setCountdown(null);
          resolve();
        }
      }, 1000);
    });
  }, []);

  const captureCurrentFrame = useCallback((): string | null => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);
    return canvas.toDataURL("image/png");
  }, []);

  // Single capture
  const startSingleCapture = useCallback(async () => {
    if (capturing.current) return;
    capturing.current = true;
    framesRef.current = [];
    const frameInterval = setInterval(collectFrame, 400);

    await runCountdown();
    clearInterval(frameInterval);
    collectFrame();

    const dataUrl = captureCurrentFrame();
    if (dataUrl) setPhotoDataUrl(dataUrl);
    generateGif([...framesRef.current]);
    capturing.current = false;
  }, [collectFrame, generateGif, runCountdown, captureCurrentFrame]);

  // Strip capture (4 photos in sequence)
  const startStripCapture = useCallback(async () => {
    if (capturing.current) return;
    capturing.current = true;
    setStripInProgress(true);
    setStripPhotos([]);
    setStripCurrentIndex(0);
    setStripDataUrl(null);

    const photos: string[] = [];

    for (let i = 0; i < 4; i++) {
      setStripCurrentIndex(i);
      await runCountdown();
      const dataUrl = captureCurrentFrame();
      if (dataUrl) photos.push(dataUrl);
      setStripPhotos([...photos]);

      // Brief pause between shots
      if (i < 3) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    // Generate strip
    setGeneratingStrip(true);
    setShowStripResult(true);
    setStripInProgress(false);
    capturing.current = false;

    try {
      const strip = await generateStrip(photos);
      setStripDataUrl(strip);
    } catch (e) {
      console.error("Strip generation failed:", e);
    }
    setGeneratingStrip(false);
  }, [runCountdown, captureCurrentFrame]);

  const startCapture = useCallback(() => {
    if (captureMode === "strip") {
      startStripCapture();
    } else {
      startSingleCapture();
    }
  }, [captureMode, startSingleCapture, startStripCapture]);

  useClapDetection(startCapture, soundEnabled);

  const showingResult = photoDataUrl || showStripResult;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="glass rounded-2xl p-8 text-center max-w-md mx-4">
          <p className="text-4xl mb-4">📷</p>
          <h2 className="text-xl font-bold mb-2 text-foreground">Camera Required</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      <CameraView videoRef={videoRef} landmarks={landmarks} activeEffect={activeEffect} />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-4xl mb-4 animate-pulse-neon">📸</p>
            <p className="text-foreground font-medium">Starting camera...</p>
          </div>
        </div>
      )}

      {countdown !== null && <CountdownOverlay count={countdown} />}
      {showFlash && <FlashOverlay />}

      {/* Strip progress indicator */}
      {stripInProgress && (
        <StripProgress current={stripPhotos.length} total={4} />
      )}

      {/* Bottom overlay UI */}
      {ready && !showingResult && !stripInProgress && (
        <div
          className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-4 pb-8 pt-16"
          style={{ background: "linear-gradient(transparent, hsl(var(--background) / 0.7))" }}
        >
          {/* Mode indicator */}
          <div className="glass rounded-full px-4 py-1 text-xs font-medium text-muted-foreground">
            {captureMode === "strip" ? "🎞️ Photo Strip (4 shots)" : "📷 Single Photo"}
          </div>
          <EffectSelector activeEffect={activeEffect} onSelect={setActiveEffect} />
          <CaptureButton
            onCapture={startCapture}
            capturing={capturing.current}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((v) => !v)}
            mode={captureMode}
            onToggleMode={() => setCaptureMode((m) => (m === "single" ? "strip" : "single"))}
          />
        </div>
      )}

      {/* Single result */}
      {photoDataUrl && (
        <ResultScreen
          photoDataUrl={photoDataUrl}
          gifDataUrl={gifDataUrl}
          generatingGif={generatingGif}
          onClose={() => {
            setPhotoDataUrl(null);
            setGifDataUrl(null);
            setGeneratingGif(false);
          }}
        />
      )}

      {/* Strip result */}
      {showStripResult && (
        <StripResultScreen
          photos={stripPhotos}
          stripDataUrl={stripDataUrl}
          generating={generatingStrip}
          onClose={() => {
            setShowStripResult(false);
            setStripPhotos([]);
            setStripDataUrl(null);
          }}
        />
      )}

      {/* Top bar */}
      <div className="absolute top-4 left-4 z-20">
        <h1 className="text-lg font-bold neon-text tracking-wider" style={{ color: "hsl(var(--primary))" }}>
          ✦ PHOTOBOOTH
        </h1>
      </div>
    </div>
  );
}
