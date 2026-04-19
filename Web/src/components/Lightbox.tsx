import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2 } from "lucide-react";
import { useEffect } from "react";

interface LightboxProps {
  src: string | null;
  filename?: string;
  onClose: () => void;
}

const Lightbox = ({ src, filename, onClose }: LightboxProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleDownload = async () => {
    if (!src) return;
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "bilde.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, "_blank");
    }
  };

  const handleShare = async () => {
    if (!src) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: filename || "Bilde", url: src });
      } catch {
        /* cancelled */
      }
    } else {
      navigator.clipboard.writeText(window.location.origin + src);
    }
  };

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl"
          >
            <div className="overflow-hidden rounded-3xl bg-card shadow-elevated">
              <img src={src} alt={filename || "Bilde"} className="max-h-[75vh] w-full object-contain" />
              <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-5 py-4">
                <p className="truncate font-mono text-xs text-muted-foreground">{filename}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-muted"
                  >
                    <Share2 className="h-4 w-4" /> Del
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Download className="h-4 w-4" /> Last ned
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Lukk"
              className="absolute -top-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-elevated transition-transform hover:scale-110"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Lightbox;
