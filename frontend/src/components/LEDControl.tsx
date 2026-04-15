import { Lightbulb, Power, PowerOff, Zap, ZapOff, AlertTriangle } from "lucide-react";
import SectionCard from "./SectionCard";
import ControlButton from "./ControlButton";

interface LEDControlProps {
  onCommand: (cmd: string) => void;
}

const LEDControl = ({ onCommand }: LEDControlProps) => (
  <SectionCard title="Arduino LED Kontroll" icon={Lightbulb}>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <ControlButton icon={Power} label="LED PÅ" variant="success" onClick={() => onCommand("on")} />
      <ControlButton icon={PowerOff} label="LED AV" variant="destructive" onClick={() => onCommand("off")} />
      <ControlButton icon={Zap} label="Normal Blink" variant="warning" onClick={() => onCommand("blink")} />
      <ControlButton icon={ZapOff} label="Rask Blink" variant="warning" onClick={() => onCommand("blink_fast")} />
      <ControlButton icon={Zap} label="Sakte Blink" variant="info" onClick={() => onCommand("blink_slow")} />
      <ControlButton icon={AlertTriangle} label="SOS Signal" variant="destructive" onClick={() => onCommand("blink_sos")} />
    </div>
  </SectionCard>
);

export default LEDControl;
