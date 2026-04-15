import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
  }
}

export function useFaceMesh(
  videoRef: React.RefObject<HTMLVideoElement>,
  ready: boolean
) {
  const [landmarks, setLandmarks] = useState<{ x: number; y: number }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const faceMeshRef = useRef<any>(null);

  useEffect(() => {
    if (!ready || !videoRef.current) return;

    const loadScripts = async () => {
      // Load MediaPipe scripts
      const scripts = [
        "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
        "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js",
      ];

      for (const src of scripts) {
        if (document.querySelector(`script[src="${src}"]`)) continue;
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = src;
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      // Init FaceMesh
      const fm = new window.FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      fm.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      fm.onResults((results: any) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          setLandmarks(results.multiFaceLandmarks[0]);
        } else {
          setLandmarks([]);
        }
      });

      faceMeshRef.current = fm;
      setLoaded(true);

      // Start camera loop
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (faceMeshRef.current && videoRef.current) {
            await faceMeshRef.current.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720,
      });
      camera.start();
    };

    loadScripts().catch(console.error);
  }, [ready, videoRef]);

  return { landmarks, loaded };
}
