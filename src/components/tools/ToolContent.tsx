import { Suspense, lazy } from "react";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { tools, Tool } from "./ToolsSidebar";
import { Button } from "@/components/ui/button";

// Lazy load tool components
const AudioCutter = lazy(() => import("@/pages/tools/AudioCutter"));
const AudioRecorder = lazy(() => import("@/pages/tools/AudioRecorder"));
const AudioJoiner = lazy(() => import("@/pages/tools/AudioJoiner"));
const VideoToAudio = lazy(() => import("@/pages/tools/VideoToAudio"));
const AudioConverter = lazy(() => import("@/pages/tools/AudioConverter"));
const WaveformGenerator = lazy(() => import("@/pages/tools/WaveformGenerator"));
const VoiceIsolator = lazy(() => import("@/pages/tools/VoiceIsolator"));
const SFXIsolator = lazy(() => import("@/pages/tools/SFXIsolator"));
const MusicSplitter = lazy(() => import("@/pages/tools/MusicSplitter"));
const SFXGenerator = lazy(() => import("@/pages/tools/SFXGenerator"));

interface ToolContentProps {
  toolId: string | null;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading tool...</p>
      </div>
    </div>
  );
}

function ComingSoonContent({ tool }: { tool: Tool }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center mb-6 border border-border/50">
        <Lock className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-3">{tool.title}</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        {tool.description}. This feature is coming soon!
      </p>
      <Button variant="outline" disabled className="px-8">
        Coming Soon
      </Button>
    </div>
  );
}

function WelcomeContent() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
        <Sparkles className="w-10 h-10 text-primary-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-3">Select a Tool</h2>
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
      <div className="p-6 md:p-8">
        {toolId === "voice-isolator" && <VoiceIsolator />}
        {toolId === "sfx-isolator" && <SFXIsolator />}
        {toolId === "music-splitter" && <MusicSplitter />}
        {toolId === "audio-cutter" && <AudioCutterInline />}
        {toolId === "audio-recorder" && <AudioRecorderInline />}
        {toolId === "audio-joiner" && <AudioJoinerInline />}
        {toolId === "video-to-audio" && <VideoToAudioInline />}
        {toolId === "audio-converter" && <AudioConverterInline />}
        {toolId === "waveform-generator" && <WaveformGeneratorInline />}
        {toolId === "sfx-generator" && <SFXGenerator />}
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
