import { Video } from "lucide-react";
import SectionCard from "./SectionCard";
import { videoFeedUrl } from "@/lib/api";

const LiveStream = () => (
  <SectionCard title="Live Kamera Stream" icon={Video}>
    <div className="overflow-hidden rounded-lg border border-border bg-muted">
      <img src={videoFeedUrl()} alt="Live kamera stream" className="w-full" />
    </div>
    <p className="mt-2 text-center font-mono text-xs text-muted-foreground">
      MJPEG stream fra Raspberry Pi kamera
    </p>
  </SectionCard>
);

export default LiveStream;
