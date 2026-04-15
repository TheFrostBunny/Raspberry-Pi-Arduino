import { useRef, useEffect, useCallback } from "react";
import { drawEffect } from "@/lib/arEffects";

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  landmarks: { x: number; y: number }[];
  activeEffect: string;
}

export function CameraView({ videoRef, landmarks, activeEffect }: CameraViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d")!;
    // Mirror + draw video
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.restore();

    // Draw AR effect
    if (landmarks.length > 0 && activeEffect !== "none") {
      drawEffect(ctx, landmarks, activeEffect, canvas.width, canvas.height, Date.now());
    }

    animRef.current = requestAnimationFrame(render);
  }, [videoRef, landmarks, activeEffect]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-0"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
