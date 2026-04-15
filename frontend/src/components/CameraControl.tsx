import { Camera, CameraIcon } from "lucide-react";
import SectionCard from "./SectionCard";
import ControlButton from "./ControlButton";

interface CameraControlProps {
  onTakePhoto: () => void;
  latestPhoto: string | null;
}

const CameraControl = ({ onTakePhoto, latestPhoto }: CameraControlProps) => (
  <SectionCard title="Vanlig Kamera" icon={Camera}>
    <ControlButton icon={CameraIcon} label="Ta vanlig bilde" variant="primary" onClick={onTakePhoto} className="w-full" />
    {latestPhoto && (
      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <img src={`/photo/${latestPhoto}`} alt="Siste bilde" className="w-full object-cover" />
        <p className="bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">{latestPhoto}</p>
      </div>
    )}
  </SectionCard>
);

export default CameraControl;
