import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Download, X } from "lucide-react";
import { SocialShare } from "./SocialShare";

interface ResultScreenProps {
  photoDataUrl: string;
  gifDataUrl: string | null;
  generatingGif: boolean;
  onClose: () => void;
}

export function ResultScreen({ photoDataUrl, gifDataUrl, generatingGif, onClose }: ResultScreenProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [showGif, setShowGif] = useState(false);
  const displayUrl = showGif && gifDataUrl ? gifDataUrl : photoDataUrl;

  // Generate QR code
  useEffect(() => {
    if (!qrRef.current || !photoDataUrl) return;
    const loadQR = async () => {
      if (!document.querySelector('script[src*="qrcode"]')) {
        await new Promise<void>((resolve) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js";
          s.onload = () => resolve();
          document.head.appendChild(s);
        });
      }
      if (qrRef.current) {
        qrRef.current.innerHTML = "";
        // Use the photo data URL for QR - in production this would be a hosted URL
        new (window as any).QRCode(qrRef.current, {
          text: photoDataUrl.substring(0, 2000), // QR has data limit
          width: 120,
          height: 120,
          colorDark: "#0ff5c4",
          colorLight: "#0a0a0f",
        });
      }
    };
    loadQR().catch(console.error);
  }, [photoDataUrl]);

  const download = () => {
    const a = document.createElement("a");
    a.href = displayUrl;
    a.download = showGif ? "photobooth.gif" : "photobooth.png";
    a.click();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
      <div className="glass rounded-2xl p-6 max-w-lg w-full mx-4 flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl font-bold neon-text" style={{ color: "hsl(var(--primary))" }}>
            📸 Your Photo
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="rounded-xl overflow-hidden border border-border neon-glow w-full">
          <img src={displayUrl} alt="Captured" className="w-full" />
        </div>

        {/* Toggle photo/gif */}
        {gifDataUrl && (
          <div className="flex gap-2">
            <Button
              variant={!showGif ? "effectActive" : "effect"}
              size="sm"
              onClick={() => setShowGif(false)}
            >
              📷 Photo
            </Button>
            <Button
              variant={showGif ? "effectActive" : "effect"}
              size="sm"
              onClick={() => setShowGif(true)}
            >
              🎞️ GIF
            </Button>
          </div>
        )}
        {generatingGif && !gifDataUrl && (
          <p className="text-sm text-muted-foreground animate-pulse">Generating GIF...</p>
        )}

        <SocialShare imageDataUrl={displayUrl} />

        <div className="flex items-center gap-6 w-full">
          <div ref={qrRef} className="shrink-0 rounded-lg overflow-hidden" />
          <div className="flex flex-col gap-2 flex-1">
            <p className="text-xs text-muted-foreground">
              Scan QR code to save to your device
            </p>
            <Button variant="capture" onClick={download} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="effect" onClick={onClose} className="w-full">
              <Camera className="h-4 w-4 mr-2" />
              Take Another
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
