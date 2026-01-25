import { AudioProcessingView } from "@/components/tools/AudioProcessingView";

export default function VoiceIsolator() {
  return (
    <AudioProcessingView
      title="Voice Isolator"
      description="Remove vocals to create karaoke tracks or isolate vocals for acapella"
      mode="voice"
      toolId="voice-isolator"
      trackConfig={[
        {
          stemKey: "no_vocals",
          name: "Music",
          color: "#22c55e",
          fallbackKeys: ["instrumental"],
        },
        {
          stemKey: "vocals",
          name: "Vocal",
          color: "#a855f7",
        },
      ]}
    />
  );
}
