import { AudioProcessingView } from "@/components/tools/AudioProcessingView";

export default function MusicSplitter() {
  return (
    <AudioProcessingView
      title="Music Splitter"
      description="Split music into individual stems with AI-powered separation"
      mode="full"
      toolId="music-splitter"
      trackConfig={[
        {
          stemKey: "vocals",
          name: "Vocals",
          color: "#ec4899",
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
          stemKey: "guitar",
          name: "Guitar",
          color: "#22c55e",
        },
        {
          stemKey: "piano",
          name: "Piano",
          color: "#3b82f6",
        },
        {
          stemKey: "other",
          name: "Other",
          color: "#a855f7",
        },
      ]}
    />
  );
}
