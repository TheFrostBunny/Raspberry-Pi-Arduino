import { useEffect, useRef } from "react";

export function useClapDetection(onClap: () => void, enabled: boolean) {
  const lastClap = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let ctx: AudioContext | null = null;
    let stream: MediaStream | null = null;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const check = () => {
          if (!ctx) return;
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          const now = Date.now();
          if (avg > 80 && now - lastClap.current > 2000) {
            lastClap.current = now;
            onClap();
          }
          requestAnimationFrame(check);
        };
        check();
      } catch { /* audio not available */ }
    })();

    return () => {
      stream?.getTracks().forEach(t => t.stop());
      ctx?.close();
    };
  }, [onClap, enabled]);
}
