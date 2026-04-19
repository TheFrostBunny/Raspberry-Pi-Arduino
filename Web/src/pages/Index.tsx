import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Terminal, Zap, Cpu, Wrench, Image } from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusBanner from "@/components/StatusBanner";
import LEDControl from "@/components/LEDControl";
import CameraControl from "@/components/CameraControl";
import ARControls, { ARPhotoParams } from "@/components/ARControls";
import ThemeToggle from "@/components/ThemeToggle";

import { postAction, fetchStatus } from "@/lib/api";

const Index = () => {
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" | "info" }>({ message: "Klar for kommandoer", type: "info" });
  const [ledOn, setLedOn] = useState(false);
  const [photosTaken, setPhotosTaken] = useState(0);
  const [commandsSent, setCommandsSent] = useState(0);
  const [latestPhoto, setLatestPhoto] = useState<string | null>(null);
  const [latestARPhoto, setLatestARPhoto] = useState<string | null>(null);

  const sendCommand = async (action: string, body?: Record<string, string>) => {
    setCommandsSent((c) => c + 1);
    try {
      await postAction(action, body);

      if (action === "on") { setLedOn(true); setStatus({ message: "LED er nå slått PÅ", type: "success" }); }
      else if (action === "off") { setLedOn(false); setStatus({ message: "LED er nå slått AV", type: "info" }); }
      else if (action === "photo") { setPhotosTaken((p) => p + 1); setStatus({ message: "Bilde tatt!", type: "success" }); }
      else setStatus({ message: `Kommando '${action}' sendt`, type: "success" });

      const data = await fetchStatus();
      if (data) {
        setPhotosTaken(data.photos_taken);
        setCommandsSent(data.commands_sent);
        setLedOn(data.led_status);
        if (data.latest_ar_photo) setLatestARPhoto(data.latest_ar_photo.split("/").pop() ?? null);
      }
    } catch {
      setStatus({ message: "Kunne ikke koble til serveren", type: "error" });
    }
  };

  const handleARPhoto = async (params: ARPhotoParams) => {
    const body: Record<string, string> = {
      filter: params.filter,
      ar_face_effect: params.arFaceEffect,
      frame_style: params.frameStyle,
      custom_text: params.customText,
      show_timestamp: params.showTimestamp ? "on" : "",
      trigger_led: params.triggerLed ? "on" : "",
    };
    await sendCommand("ar_photo", body);
    setPhotosTaken((p) => p + 1);
  };

  return (
    <div className="bg-mesh min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top bar with theme toggle */}
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="mb-3 inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/10 p-3">
            <Cpu className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-gradient-primary text-4xl font-bold tracking-tight sm:text-5xl">
            RPi Arduino Kontroll
          </h1>
          <p className="mt-2 flex items-center justify-center gap-3 font-mono text-sm text-muted-foreground">
            <Camera className="h-4 w-4" /> AR Kamera
            <span>&bull;</span>
            <Zap className="h-4 w-4" /> LED Kontroll
          </p>
        </motion.header>

        {/* Status */}
        <StatusBanner message={status.message} type={status.type} />

        {/* Stats */}
        <div className="my-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard icon={Camera} value={photosTaken} label="Bilder tatt" color="info" />
          <StatCard icon={Terminal} value={commandsSent} label="Kommandoer sendt" color="accent" />
          <StatCard
            icon={Zap}
            value={ledOn ? "ON" : "OFF"}
            label="LED Status"
            color={ledOn ? "primary" : "destructive"}
          />
        </div>

        {/* Controls grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <LEDControl onCommand={(cmd) => sendCommand(cmd)} />
          <CameraControl onTakePhoto={() => sendCommand("photo")} latestPhoto={latestPhoto} />
        </div>

        {/* AR Section */}
        <div className="mt-6 space-y-6">
          <ARControls onTakeARPhoto={handleARPhoto} latestARPhoto={latestARPhoto} />
        </div>

        {/* Navigation */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="/kamera"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
          >
            <Camera className="h-4 w-4" />
            Åpne Kamera
          </a>
          <a
            href="/visning"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-card-foreground shadow-soft transition-colors hover:bg-secondary"
          >
            <Image className="h-4 w-4" />
            Bildegalleri
          </a>
        </motion.div>

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center gap-2 border-t border-border pt-6 text-center font-mono text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5" />
            Raspberry Pi + Arduino + OpenCV AR Kamera System
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5" />
            Med ansiktsgjenkjenning, bildefiltre og AR effekter
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
