import { useState } from "react";
import { Palette, User, Frame, Type, Clock, Lightbulb, Sparkles } from "lucide-react";
import SectionCard from "./SectionCard";
import ControlButton from "./ControlButton";
import { photoUrl } from "@/lib/api";

interface ARControlsProps {
  onTakeARPhoto: (params: ARPhotoParams) => void;
  latestARPhoto: string | null;
}

export interface ARPhotoParams {
  filter: string;
  arFaceEffect: string;
  frameStyle: string;
  customText: string;
  showTimestamp: boolean;
  triggerLed: boolean;
}

const selectClasses =
  "w-full rounded-lg border border-border bg-secondary px-3 py-2.5 font-mono text-sm text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-accent";

const ARControls = ({ onTakeARPhoto, latestARPhoto }: ARControlsProps) => {
  const [filter, setFilter] = useState("none");
  const [arFaceEffect, setArFaceEffect] = useState("none");
  const [frameStyle, setFrameStyle] = useState("none");
  const [customText, setCustomText] = useState("");
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [triggerLed, setTriggerLed] = useState(false);

  const handleSubmit = () => {
    onTakeARPhoto({ filter, arFaceEffect, frameStyle, customText, showTimestamp, triggerLed });
  };

  return (
    <>
      <SectionCard title="AR Kamera — Augmented Reality" icon={Sparkles} gradient>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Palette className="h-3.5 w-3.5" /> Bildefilter
              </label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className={selectClasses}>
                <option value="none">Ingen filter</option>
                <option value="grayscale">Gråskala</option>
                <option value="blur">Uskarphet</option>
                <option value="sepia">Sepia</option>
                <option value="vintage">Vintage</option>
                <option value="cool">Kjølig tone</option>
              </select>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <User className="h-3.5 w-3.5" /> AR Ansikts-effekter
              </label>
              <select value={arFaceEffect} onChange={(e) => setArFaceEffect(e.target.value)} className={selectClasses}>
                <option value="none">Ingen AR</option>
                <option value="glasses">Briller</option>
                <option value="hat">Hatt</option>
                <option value="mustache">Bart</option>
              </select>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Frame className="h-3.5 w-3.5" /> Bilderamme
              </label>
              <select value={frameStyle} onChange={(e) => setFrameStyle(e.target.value)} className={selectClasses}>
                <option value="none">Ingen ramme</option>
                <option value="polaroid">Polaroid</option>
                <option value="vintage">Vintage</option>
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
              <input
                type="checkbox"
                checked={showTimestamp}
                onChange={(e) => setShowTimestamp(e.target.checked)}
                className="h-4 w-4 rounded accent-accent"
              />
              <span className="inline-flex items-center gap-1.5 text-sm text-secondary-foreground">
                <Clock className="h-3.5 w-3.5" /> Vis tidsstempel
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3">
              <input
                type="checkbox"
                checked={triggerLed}
                onChange={(e) => setTriggerLed(e.target.checked)}
                className="h-4 w-4 rounded accent-accent"
              />
              <span className="inline-flex items-center gap-1.5 text-sm text-secondary-foreground">
                <Lightbulb className="h-3.5 w-3.5" /> Blink LED ved fotografering
              </span>
            </label>
          </div>
        </div>
        <ControlButton icon={Sparkles} label="Ta AR Foto!" variant="ar" onClick={handleSubmit} className="mt-5 w-full text-base" />
      </SectionCard>

      {latestARPhoto && (
        <SectionCard title="Siste AR Bilde" icon={Sparkles}>
          <div className="overflow-hidden rounded-lg border border-border">
            <img src={photoUrl(latestARPhoto)} alt="Siste AR bilde" className="w-full object-cover" />
            <p className="bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">{latestARPhoto}</p>
          </div>
        </SectionCard>
      )}
    </>
  );
};

export default ARControls;
