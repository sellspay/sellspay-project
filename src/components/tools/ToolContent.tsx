import { Suspense, lazy } from "react";
import { Loader2, Lock } from "lucide-react";
import { tools, Tool } from "./ToolsSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Lazy load tool components
const AudioCutter = lazy(() => import("@/pages/tools/AudioCutter"));
const AudioRecorder = lazy(() => import("@/pages/tools/AudioRecorder"));
const AudioJoiner = lazy(() => import("@/pages/tools/AudioJoiner"));
const VideoToAudio = lazy(() => import("@/pages/tools/VideoToAudio"));
const AudioConverter = lazy(() => import("@/pages/tools/AudioConverter"));
const WaveformGenerator = lazy(() => import("@/pages/tools/WaveformGenerator"));

interface ToolContentProps {
  toolId: string | null;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function ComingSoonContent({ tool }: { tool: Tool }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{tool.title}</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        {tool.description}. This feature is coming soon!
      </p>
      <Button variant="outline" disabled>
        Coming Soon
      </Button>
    </div>
  );
}

function WelcomeContent() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
        <span className="text-4xl">🎛️</span>
      </div>
      <h2 className="text-2xl font-bold mb-2">Select a Tool</h2>
      <p className="text-muted-foreground max-w-md">
        Choose a tool from the sidebar to get started. All tools are free to use with no signup required.
      </p>
    </div>
  );
}

export function ToolContent({ toolId }: ToolContentProps) {
  if (!toolId) {
    return <WelcomeContent />;
  }

  const tool = tools.find(t => t.id === toolId);
  
  if (!tool) {
    return <WelcomeContent />;
  }

  if (!tool.available) {
    return <ComingSoonContent tool={tool} />;
  }

  // Render available tools
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="tool-content-wrapper">
        {toolId === "audio-cutter" && <AudioCutterInline />}
        {toolId === "audio-recorder" && <AudioRecorderInline />}
        {toolId === "audio-joiner" && <AudioJoinerInline />}
        {toolId === "video-to-audio" && <VideoToAudioInline />}
        {toolId === "audio-converter" && <AudioConverterInline />}
        {toolId === "waveform-generator" && <WaveformGeneratorInline />}
      </div>
    </Suspense>
  );
}

// Wrapper components to remove duplicate headers/containers
function AudioCutterInline() {
  return <AudioCutter />;
}

function AudioRecorderInline() {
  return <AudioRecorder />;
}

function AudioJoinerInline() {
  return <AudioJoiner />;
}

function VideoToAudioInline() {
  return <VideoToAudio />;
}

function AudioConverterInline() {
  return <AudioConverter />;
}

function WaveformGeneratorInline() {
  return <WaveformGenerator />;
}
