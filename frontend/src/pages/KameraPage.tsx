import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Video, ArrowLeft, Sparkles, Palette, User, Frame, Type, Clock, Lightbulb } from "lucide-react";
import SectionCard from "@/components/SectionCard";
import ControlButton from "@/components/ControlButton";
import StatusBanner from "@/components/StatusBanner";

type Mode = "choose" | "live" | "photo";

const filterOptions = [
  { value: "none", label: "Ingen filter" },
  { value: "grayscale", label: "Gråskala" },
  { value: "blur", label: "Uskarphet" },
  { value: "sepia", label: "Sepia" },
  { value: "vintage", label: "Vintage" },
  { value: "cool", label: "Kjølig tone" },
];

const faceEffects = [
  { value: "none", label: "Ingen AR" },
  { value: "glasses", label: "Briller" },
  { value: "hat", label: "Hatt" },
  { value: "mustache", label: "Bart" },
];

const frames = [
  { value: "none", label: "Ingen ramme" },
  { value: "polaroid", label: "Polaroid" },
  { value: "vintage", label: "Vintage" },
];

const selectClasses =
  "w-full rounded-lg border border-border bg-secondary px-3 py-2.5 font-mono text-sm text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-accent";

const API_BASE = "";

const KameraPage = () => {
  const [mode, setMode] = useState<Mode>("choose");
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // AR settings
  const [filter, setFilter] = useState("none");
  const [arFaceEffect, setArFaceEffect] = useState("none");
  const [frameStyle, setFrameStyle] = useState("none");
  const [customText, setCustomText] = useState("");
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [triggerLed, setTriggerLed] = useState(false);

  // Photos taken
  const [photos, setPhotos] = useState<string[]>([]);

  const takePhoto = async () => {
    try {
      const formData = new FormData();
      formData.append("action", "ar_photo");
      formData.append("filter", filter);
      formData.append("ar_face_effect", arFaceEffect);
      formData.append("frame_style", frameStyle);
      formData.append("custom_text", customText);
      formData.append("show_timestamp", showTimestamp ? "on" : "");
      formData.append("trigger_led", triggerLed ? "on" : "");

      const res = await fetch(`${API_BASE}/`, { method: "POST", body: formData });

      // Get latest photo from status
      const statusRes = await fetch(`${API_BASE}/status`);
      if (statusRes.ok) {
        const data = await statusRes.json();
        if (data.latest_ar_photo) {
          const filename = data.latest_ar_photo.split("/").pop();
          setPhotos((prev) => [filename, ...prev]);
        }
      }
      setStatus({ message: "Bilde tatt med effekter!", type: "success" });
    } catch {
      setStatus({ message: "Kunne ikke koble til serveren", type: "error" });
    }
  };

  return (
    <div className="bg-grid min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Back button when not on choose */}
        {mode !== "choose" && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setMode("choose")}
            className="mb-6 inline-flex items-center gap-2 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbake
          </motion.button>
        )}

        <AnimatePresence mode="wait">
          {/* Choose mode */}
          {mode === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center"
            >
              <h1 className="text-gradient-primary mb-2 text-center text-3xl font-bold sm:text-4xl">
                Kamera
              </h1>
              <p className="mb-10 text-center font-mono text-sm text-muted-foreground">
                Velg hva du vil gjøre
              </p>

              <div className="grid w-full max-w-lg gap-5 sm:grid-cols-2">
                <motion.button
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMode("live")}
                  className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-border bg-card p-8 transition-colors hover:border-info/40 hover:bg-info/5"
                >
                  <div className="rounded-xl border border-info/20 bg-info/10 p-4 transition-colors group-hover:bg-info/20">
                    <Video className="h-10 w-10 text-info" />
                  </div>
                  <div>
                    <h2 className="font-mono text-lg font-semibold text-foreground">Live Stream</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Se live video fra kameraet</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMode("photo")}
                  className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-border bg-card p-8 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                    <Camera className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-mono text-lg font-semibold text-foreground">Ta Bilde</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Ta bilde med AR-effekter</p>
                  </div>
                </motion.button>
              </div>

              {/* Link back to control panel */}
              <a
                href="/"
                className="mt-10 inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" />
                Tilbake til kontrollpanel
              </a>
            </motion.div>
          )}

          {/* Live stream */}
          {mode === "live" && (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SectionCard title="Live Kamera Stream" icon={Video}>
                <div className="overflow-hidden rounded-lg border border-border bg-muted">
                  <img
                    src="/video_feed"
                    alt="Live kamera stream"
                    className="w-full"
                  />
                </div>
                <p className="mt-3 text-center font-mono text-xs text-muted-foreground">
                  MJPEG stream fra Raspberry Pi kamera
                </p>
              </SectionCard>
            </motion.div>
          )}

          {/* Photo with effects */}
          {mode === "photo" && (
            <motion.div
              key="photo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {status && <StatusBanner message={status.message} type={status.type} />}

              <SectionCard title="Ta Bilde med Effekter" icon={Sparkles} gradient>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Palette className="h-3.5 w-3.5" /> Bildefilter
                      </label>
                      <select value={filter} onChange={(e) => setFilter(e.target.value)} className={selectClasses}>
                        {filterOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <User className="h-3.5 w-3.5" /> AR Ansikts-effekter
                      </label>
                      <select value={arFaceEffect} onChange={(e) => setArFaceEffect(e.target.value)} className={selectClasses}>
                        {faceEffects.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Frame className="h-3.5 w-3.5" /> Bilderamme
                      </label>
                      <select value={frameStyle} onChange={(e) => setFrameStyle(e.target.value)} className={selectClasses}>
                        {frames.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Type className="h-3.5 w-3.5" /> Tilpasset tekst
                      </label>
                      <input
                        type="text"
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Skriv tekst her..."
                        className={selectClasses}
                      />
                    </div>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3">
                      <input type="checkbox" checked={showTimestamp} onChange={(e) => setShowTimestamp(e.target.checked)} className="h-4 w-4 rounded accent-accent" />
                      <span className="inline-flex items-center gap-1.5 text-sm text-secondary-foreground">
                        <Clock className="h-3.5 w-3.5" /> Vis tidsstempel
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3">
                      <input type="checkbox" checked={triggerLed} onChange={(e) => setTriggerLed(e.target.checked)} className="h-4 w-4 rounded accent-accent" />
                      <span className="inline-flex items-center gap-1.5 text-sm text-secondary-foreground">
                        <Lightbulb className="h-3.5 w-3.5" /> Blink LED ved fotografering
                      </span>
                    </label>
                  </div>
                </div>
                <ControlButton icon={Camera} label="Ta Bilde!" variant="ar" onClick={takePhoto} className="mt-5 w-full text-base" />
              </SectionCard>

              {/* Photo gallery */}
              {photos.length > 0 && (
                <SectionCard title={`Bilder tatt (${photos.length})`} icon={Camera}>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {photos.map((photo, i) => (
                      <motion.div
                        key={`${photo}-${i}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="overflow-hidden rounded-lg border border-border"
                      >
                        <img src={`/photo/${photo}`} alt={`Bilde ${i + 1}`} className="aspect-video w-full object-cover" />
                        <p className="bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">{photo}</p>
                      </motion.div>
                    ))}
                  </div>
                </SectionCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KameraPage;
