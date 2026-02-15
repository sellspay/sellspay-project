import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Sparkles, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toolsRegistry, SUBCATEGORY_LABELS, type ToolSubcategory } from "@/components/tools/toolsRegistry";
import studioHeroVideo from "@/assets/studio-hero-video.mp4";

interface StudioHomeBannerProps {
  creditBalance: number;
  isLoadingCredits: boolean;
  onToolSelect: (toolId: string) => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const FEATURED_TOOLS = ["sfx-generator", "voice-isolator", "music-splitter", "thumbnail-generator", "social-posts-pack", "short-form-script"];

const SUBCATEGORY_ORDER: ToolSubcategory[] = ["media_creation", "store_growth", "social_content", "utility"];

export function StudioHomeBanner({ creditBalance, isLoadingCredits, onToolSelect }: StudioHomeBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const quickTools = toolsRegistry.filter(t => t.category === "quick_tool" && t.isActive);
  const featuredTools = quickTools.filter(t => FEATURED_TOOLS.includes(t.id));

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="p-6 lg:p-8 space-y-10 max-w-6xl mx-auto"
    >
      {/* Hero Video Banner */}
      <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden">
        <div className="relative aspect-video max-h-[420px] w-full bg-[#0A0A0A]">
          <video
            ref={videoRef}
            src={studioHeroVideo}
            className="w-full h-full object-cover"
            muted={isMuted}
            loop
            playsInline
            onEnded={() => setIsPlaying(false)}
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F1115]/80 to-transparent" />

          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#FF7A1A] to-[#E85C00] flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[11px] font-bold text-[#FF7A1A] uppercase tracking-widest">AI Studio</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-[1.1] max-w-lg">
              Your Creative Command Center
            </h1>
            <p className="text-sm text-white/50 mt-2 max-w-md leading-relaxed">
              Generate videos, audio, images, marketing copy, and more — all powered by AI. Pick a tool from the sidebar to get started.
            </p>

            <div className="flex items-center gap-3 mt-5">
              <Button
                onClick={togglePlay}
                variant="outline"
                size="sm"
                className="rounded-full gap-2 border-white/20 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isPlaying ? "Pause" : "Watch Overview"}
              </Button>
              <button
                onClick={toggleMute}
                className="h-8 w-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/60 transition-colors"
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>

            </div>
          </div>
        </div>
      </motion.div>

      {/* Featured Tools */}
      <motion.div variants={fadeUp} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Quick Start</h2>
          <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Select a tool from the sidebar</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {featuredTools.map(tool => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onToolSelect(tool.id)}
                className={cn(
                  "group relative p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-left",
                  "hover:-translate-y-1 hover:shadow-xl hover:shadow-[#FF7A1A]/5 hover:border-[#FF7A1A]/20",
                  "transition-all duration-200"
                )}
              >
                <Icon className="h-5 w-5 text-[#FF7A1A]/70 mb-2.5" />
                <p className="text-xs font-semibold text-foreground leading-tight">{tool.name}</p>
                <p className="text-[10px] text-muted-foreground/40 mt-1 line-clamp-2">{tool.description}</p>
                {tool.creditCost > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Zap className="h-2.5 w-2.5 text-[#FF7A1A]/50" />
                    <span className="text-[9px] text-muted-foreground/30">{tool.creditCost} credits</span>
                  </div>
                )}
                {tool.comingSoon && (
                  <span className="absolute top-2 right-2 text-[7px] font-bold text-muted-foreground/20 uppercase">Soon</span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* All Tools by Category */}
      <motion.div variants={fadeUp} className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">All Tools</h2>

        {SUBCATEGORY_ORDER.map(subcat => {
          const tools = quickTools
            .filter(t => t.subcategory === subcat)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          if (!tools.length) return null;

          return (
            <div key={subcat} className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wider">
                {SUBCATEGORY_LABELS[subcat]}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {tools.map(tool => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => onToolSelect(tool.id)}
                      className={cn(
                        "group flex items-center gap-3 p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] text-left",
                        "hover:bg-white/[0.03] hover:border-[#FF7A1A]/15 transition-all duration-150"
                      )}
                    >
                      <div className="h-9 w-9 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 group-hover:bg-[#FF7A1A]/10 transition-colors">
                        <Icon className="h-4 w-4 text-muted-foreground/50 group-hover:text-[#FF7A1A]/70 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-foreground/80 truncate">{tool.name}</p>
                          {tool.isPro && <Sparkles className="h-3 w-3 text-[#FF7A1A]/50 shrink-0" />}
                          {tool.comingSoon && <span className="text-[7px] font-bold text-muted-foreground/25 uppercase shrink-0">Soon</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground/35 truncate">{tool.description}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/15 group-hover:text-muted-foreground/40 shrink-0 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
