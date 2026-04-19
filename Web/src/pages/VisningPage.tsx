import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Sparkles, ArrowLeft, Image as ImageIcon, RefreshCw } from "lucide-react";
import Lightbox from "@/components/Lightbox";
import ThemeToggle from "@/components/ThemeToggle";
import { fetchStatus, photoUrl } from "@/lib/api";

interface ARPhoto {
  filename: string;
  created?: string;
  size?: number;
}

const VisningPage = () => {
  const [photos, setPhotos] = useState<ARPhoto[]>([]);
  const [latest, setLatest] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const data = await fetchStatus();
      if (data?.latest_ar_photo) {
        const filename = data.latest_ar_photo.split("/").pop();
        if (filename) {
          setLatest(filename);
          setPhotos((prev) => {
            if (prev.some((p) => p.filename === filename)) return prev;
            return [{ filename }, ...prev];
          });
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
    const interval = setInterval(fetchPhotos, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-mesh min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>
        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Live galleri
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Dine bilder
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Trykk på et bilde for å se det i full størrelse og laste det ned.
          </p>
        </motion.header>

        {/* Latest hero photo */}
        {latest && (
          <motion.button
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setLightbox(photoUrl(latest))}
            className="group mb-10 block w-full overflow-hidden rounded-3xl border border-border bg-card shadow-elevated transition-transform hover:scale-[1.005]"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
              <img
                src={photoUrl(latest)}
                alt="Siste bilde"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-foreground/80 px-3 py-1 text-xs font-medium text-background backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                Nyeste
              </div>
            </div>
          </motion.button>
        )}

        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Alle bilder {photos.length > 0 && <span className="text-muted-foreground">· {photos.length}</span>}
          </h2>
          <button
            onClick={fetchPhotos}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-soft transition-colors hover:bg-secondary"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Oppdater
          </button>
        </div>

        {/* Grid */}
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
            </div>
            <p className="text-base font-medium text-foreground">Ingen bilder ennå</p>
            <p className="mt-1 text-sm text-muted-foreground">Bilder du tar dukker opp her automatisk.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, i) => (
              <motion.button
                key={`${photo.filename}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setLightbox(photoUrl(photo.filename))}
                className="group overflow-hidden rounded-2xl border border-border bg-card text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="aspect-square w-full overflow-hidden bg-muted">
                  <img
                    src={photoUrl(photo.filename)}
                    alt={photo.filename}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="px-4 py-3">
                  <p className="truncate font-mono text-xs text-muted-foreground">{photo.filename}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/kamera"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
          >
            <Camera className="h-4 w-4" />
            Ta nytt bilde
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-card-foreground shadow-soft transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Til kontrollpanel
          </a>
        </div>
      </div>

      <Lightbox src={lightbox} filename={lightbox?.split("/").pop()} onClose={() => setLightbox(null)} />
    </div>
  );
};

export default VisningPage;
