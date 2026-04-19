// Sentral API-klient. Setter du VITE_API_BASE i .env (f.eks. http://192.168.1.42:5000)
// så snakker frontenden direkte med din Python Flask-server.
// Hvis tom: bruker samme origin (f.eks. når frontend serveres fra Flask).
export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") || "";

export const apiUrl = (path: string) => `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

/** POST et action med valgfritt form-body til Flask `/`-endepunktet. */
export const postAction = async (action: string, body?: Record<string, string>) => {
  const formData = new FormData();
  formData.append("action", action);
  if (body) Object.entries(body).forEach(([k, v]) => formData.append(k, v));
  return fetch(apiUrl("/"), { method: "POST", body: formData });
};

export interface StatusResponse {
  uptime: string;
  photos_taken: number;
  commands_sent: number;
  led_status: boolean;
  camera_active: boolean;
  ar_photos_count: number;
  latest_ar_photo: string | null;
}

export const fetchStatus = async (): Promise<StatusResponse | null> => {
  try {
    const res = await fetch(apiUrl("/status"));
    if (!res.ok) return null;
    return (await res.json()) as StatusResponse;
  } catch {
    return null;
  }
};

/** Returner full URL til et bilde lagret av Python-backenden. */
export const photoUrl = (filename: string) => apiUrl(`/photo/${filename}`);

/** Live MJPEG-stream URL fra Python-backenden. */
export const videoFeedUrl = () => apiUrl("/video_feed");
