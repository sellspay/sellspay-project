import { AudioProcessingView } from "@/components/tools/AudioProcessingView";

export default function SFXIsolator() {
  return (
    <AudioProcessingView
      title="SFX Isolator"
      description="Extract sound effects and separate audio elements from your tracks"
      mode="sfx"
      trackConfig={[
        {
          stemKey: "vocals",
          name: "Vocals",
          color: "#a855f7",
        },
        {
          stemKey: "drums",
          name: "Drums",
          color: "#f97316",
        },
        {
          stemKey: "bass",
          name: "Bass",
          color: "#eab308",
        },
        {
          stemKey: "other",
          name: "SFX/Other",
          color: "#3b82f6",
        },
      ]}
    />
  );
}
