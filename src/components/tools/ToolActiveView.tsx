import { Suspense, lazy, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Loader2, 
  Crown, 
  Sparkles,
  Zap,
  X,
  ChevronDown
} from "lucide-react";
import { getToolById, ToolData } from "./toolsData";
import { ProToolsGate } from "./ProToolsGate";
import { useCredits } from "@/hooks/useCredits";

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

interface ToolActiveViewProps {
  toolId: string;
  onClose: () => void;
  creditBalance?: number;
  isLoadingCredits?: boolean;
}

export function ToolActiveView({ 
  toolId, 
  onClose,
  creditBalance = 0,
  isLoadingCredits 
}: ToolActiveViewProps) {
  const [showIntro, setShowIntro] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const { isProTool, goToPricing } = useCredits();
  
  const tool = getToolById(toolId);

  useEffect(() => {
    // Show intro animation then reveal tool
    const timer = setTimeout(() => {
      setShowIntro(false);
      setTimeout(() => setIsReady(true), 500);
    }, 1500);
    return () => clearTimeout(timer);
  }, [toolId]);

  if (!tool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Tool not found</p>
      </div>
    );
  }

  const Icon = tool.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Intro Animation Overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              {/* Animated icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={cn(
                  "w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center",
                  `bg-gradient-to-br ${tool.gradient}`,
                  "shadow-2xl"
                )}
              >
                <Icon className="w-12 h-12 text-white" />
              </motion.div>

              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-3xl font-bold mb-2"
              >
                {tool.title}
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="text-muted-foreground"
              >
                Activating premium experience...
              </motion.p>

              {/* Loading bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, delay: 0.3 }}
                className={cn(
                  "h-1 mt-8 mx-auto max-w-[200px] rounded-full",
                  `bg-gradient-to-r ${tool.gradient}`
                )}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tool Interface */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isReady ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen"
      >
        {/* Hero Banner */}
        <div className={cn(
          "relative h-48 md:h-64 overflow-hidden",
          `bg-gradient-to-br ${tool.gradient}`
        )}>
          {/* Animated background pattern */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[length:100px_100px] animate-[slide_20s_linear_infinite]" />
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

          {/* Back button */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute top-4 left-4 z-10 text-white/80 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tools
          </Button>

          {/* Credit balance */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/20 backdrop-blur-sm text-white">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isLoadingCredits ? "..." : creditBalance} credits
            </span>
          </div>

          {/* Tool info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="container mx-auto flex items-end gap-6">
              <div className={cn(
                "w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center",
                "bg-white/20 backdrop-blur-sm shadow-xl"
              )}>
                <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-4xl font-bold text-white">
                    {tool.title}
                  </h1>
                  {tool.badge && (
                    <Badge className={cn(
                      "border-0",
                      tool.badge === "Pro" && "bg-white/20 text-white",
                      tool.badge === "Free" && "bg-green-500/80 text-white"
                    )}>
                      {tool.badge === "Pro" && <Crown className="w-3 h-3 mr-1" />}
                      {tool.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-white/80 text-sm md:text-base max-w-2xl">
                  {tool.tagline}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tool Content */}
        <div className="container mx-auto px-4 py-8">
          <Suspense fallback={<ToolLoadingState tool={tool} />}>
            <ProToolsGate
              isProTool={isProTool(toolId)}
              creditBalance={creditBalance}
              onTopUp={goToPricing}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card rounded-2xl border border-border/50 p-6 md:p-8"
              >
                <ToolComponent toolId={toolId} />
              </motion.div>
            </ProToolsGate>
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}

function ToolLoadingState({ tool }: { tool: ToolData }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center mb-6",
        `bg-gradient-to-br ${tool.gradient}`
      )}>
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
      <p className="text-muted-foreground">Loading {tool.title}...</p>
    </div>
  );
}

function ToolComponent({ toolId }: { toolId: string }) {
  switch (toolId) {
    case "voice-isolator":
      return <VoiceIsolator />;
    case "sfx-isolator":
      return <SFXIsolator />;
    case "music-splitter":
      return <MusicSplitter />;
    case "audio-cutter":
      return <AudioCutter />;
    case "audio-recorder":
      return <AudioRecorder />;
    case "audio-joiner":
      return <AudioJoiner />;
    case "video-to-audio":
      return <VideoToAudio />;
    case "audio-converter":
      return <AudioConverter />;
    case "waveform-generator":
      return <WaveformGenerator />;
    case "sfx-generator":
      return <SFXGenerator />;
    default:
      return <div>Tool not implemented</div>;
  }
}
