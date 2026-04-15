import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Camera, X } from "lucide-react";
import { SocialShare } from "./SocialShare";

interface StripResultScreenProps {
  photos: string[];
  stripDataUrl: string | null;
  generating: boolean;
  onClose: () => void;
}

function generateStrip(photos: string[]): Promise<string> {
  return new Promise((resolve) => {
    const images: HTMLImageElement[] = [];
    let loaded = 0;

    photos.forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (loaded === photos.length) {
          // Classic photo strip: vertical layout with border and branding
          const photoW = images[0].naturalWidth;
          const photoH = images[0].naturalHeight;
          const padding = 40;
          const gap = 20;
          const stripW = photoW + padding * 2;
          const stripH = (photoH + gap) * 4 - gap + padding * 2 + 80; // extra for branding

          const canvas = document.createElement("canvas");
          canvas.width = stripW;
          canvas.height = stripH;
          const ctx = canvas.getContext("2d")!;

          // Background
          const grad = ctx.createLinearGradient(0, 0, 0, stripH);
          grad.addColorStop(0, "#0a0a0f");
          grad.addColorStop(1, "#12121a");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, stripW, stripH);

          // Decorative border
          ctx.strokeStyle = "#0ff5c4";
          ctx.lineWidth = 3;
          ctx.strokeRect(15, 15, stripW - 30, stripH - 30);

          // Corner accents
          const cornerSize = 20;
          ctx.fillStyle = "#0ff5c4";
          [[15, 15], [stripW - 15, 15], [15, stripH - 15], [stripW - 15, stripH - 15]].forEach(([cx, cy]) => {
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fill();
          });

          // Photos with rounded corners (simulated with clip)
          images.forEach((img, idx) => {
            const x = padding;
            const y = padding + idx * (photoH + gap);
            const r = 12;

            ctx.save();
            ctx.beginPath();
            ctx.roundRect(x, y, photoW, photoH, r);
            ctx.clip();
            ctx.drawImage(img, x, y, photoW, photoH);

            // Subtle vignette per photo
            const vignette = ctx.createRadialGradient(
              x + photoW / 2, y + photoH / 2, photoW * 0.3,
              x + photoW / 2, y + photoH / 2, photoW * 0.7
            );
            vignette.addColorStop(0, "rgba(0,0,0,0)");
            vignette.addColorStop(1, "rgba(0,0,0,0.15)");
            ctx.fillStyle = vignette;
            ctx.fillRect(x, y, photoW, photoH);
            ctx.restore();

            // Photo border glow
            ctx.strokeStyle = "rgba(15, 245, 196, 0.3)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x, y, photoW, photoH, r);
            ctx.stroke();

            // Photo number
            ctx.fillStyle = "rgba(15, 245, 196, 0.5)";
            ctx.font = "bold 16px 'Space Grotesk', sans-serif";
            ctx.fillText(`${idx + 1}/4`, x + 12, y + 24);
          });

          // Branding at bottom
          const brandY = stripH - padding - 30;
          ctx.fillStyle = "#0ff5c4";
          ctx.font = "bold 22px 'Space Grotesk', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("✦ PHOTOBOOTH", stripW / 2, brandY);

          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "14px 'Space Grotesk', sans-serif";
          const date = new Date().toLocaleDateString("en-US", { 
            month: "short", day: "numeric", year: "numeric" 
          });
          ctx.fillText(date, stripW / 2, brandY + 25);

          resolve(canvas.toDataURL("image/png"));
        }
      };
      img.src = src;
      images[i] = img;
    });
  });
}

export function StripResultScreen({ photos, stripDataUrl, generating, onClose }: StripResultScreenProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!qrRef.current || !stripDataUrl) return;
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
        new (window as any).QRCode(qrRef.current, {
          text: stripDataUrl.substring(0, 2000),
          width: 100,
          height: 100,
          colorDark: "#0ff5c4",
          colorLight: "#0a0a0f",
        });
      }
    };
    loadQR().catch(console.error);
  }, [stripDataUrl]);

  const download = () => {
    if (!stripDataUrl) return;
    const a = document.createElement("a");
    a.href = stripDataUrl;
    a.download = "photobooth-strip.png";
    a.click();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md overflow-y-auto py-4">
      <div className="glass rounded-2xl p-5 max-w-md w-full mx-4 flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl font-bold neon-text" style={{ color: "hsl(var(--accent))" }}>
            🎞️ Photo Strip
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {generating && (
          <div className="flex flex-col items-center gap-2 py-8">
            <p className="text-3xl animate-pulse-neon">🎞️</p>
            <p className="text-sm text-muted-foreground animate-pulse">Generating strip...</p>
          </div>
        )}

        {stripDataUrl && (
          <div className="rounded-xl overflow-hidden border border-border neon-glow w-full max-h-[50vh] overflow-y-auto">
            <img src={stripDataUrl} alt="Photo Strip" className="w-full" />
          </div>
        )}

        {/* Individual photos preview */}
        <div className="grid grid-cols-4 gap-1.5 w-full">
          {photos.map((p, i) => (
            <div key={i} className="rounded-md overflow-hidden border border-border/50 aspect-video">
              <img src={p} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {stripDataUrl && <SocialShare imageDataUrl={stripDataUrl} />}

        <div className="flex items-center gap-4 w-full">
          <div ref={qrRef} className="shrink-0 rounded-lg overflow-hidden" />
          <div className="flex flex-col gap-2 flex-1">
            <p className="text-xs text-muted-foreground">Scan to save your strip</p>
            <Button variant="capture" onClick={download} className="w-full" disabled={!stripDataUrl}>
              <Download className="h-4 w-4 mr-2" />
              Download Strip
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

export { generateStrip };
