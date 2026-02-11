import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AudioLines, Mic, AudioWaveform, Split, Scissors,
  Merge, RefreshCw, CircleDot, FileAudio, Activity,
  Sparkles, Zap, Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toolsRegistry } from "@/components/tools/toolsRegistry";
import { Button } from "@/components/ui/button";

interface MediaCanvasProps {
  onLaunchTool: (id: string) => void;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const AI_TOOLS = ["sfx-generator", "voice-isolator", "sfx-isolator", "music-splitter"];
const UTILITY_TOOLS = ["audio-cutter", "audio-joiner", "audio-converter", "audio-recorder", "video-to-audio", "waveform-generator"];

export function MediaCanvas({ onLaunchTool }: MediaCanvasProps) {
  const aiTools = useMemo(() =>
    toolsRegistry.filter(t => AI_TOOLS.includes(t.id) && t.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  []);

  const utilityTools = useMemo(() =>
    toolsRegistry.filter(t => UTILITY_TOOLS.includes(t.id) && t.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  []);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-6 lg:p-8 space-y-8 max-w-[1200px] mx-auto">
      {/* Purple glow */}
      <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-violet-500/[0.04] blur-[140px]" />

      {/* Waveform Hero */}
      <motion.div variants={fadeUp} className="relative rounded-2xl border border-border/20 bg-card/30 backdrop-blur-xl overflow-hidden min-h-[200px] flex flex-col items-center justify-center p-8">
        {/* Animated waveform bars */}
        <div className="flex items-end gap-[3px] h-20 mb-6">
          {Array.from({ length: 48 }).map((_, i) => {
            const height = 20 + Math.sin(i * 0.4) * 30 + Math.cos(i * 0.7) * 20;
            return (
              <motion.div
                key={i}
                className="w-[4px] rounded-full bg-violet-500/40"
                initial={{ height: 4 }}
                animate={{ height: [4, height, 4] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: i * 0.04,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">Media Lab</h2>
        <p className="text-sm text-muted-foreground">Audio tools, stem separation, and sound design</p>
        <div className="flex items-center gap-2 mt-4">
          <div className="h-10 w-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Play className="h-4 w-4 text-violet-400 ml-0.5" />
          </div>
          <span className="text-xs text-muted-foreground">Drop audio to begin</span>
        </div>
      </motion.div>

      {/* AI-Powered Tools */}
      <motion.div variants={fadeUp} className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <h3 className="text-lg font-bold text-foreground">AI-Powered</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {aiTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onLaunchTool(tool.id)}
              className={cn(
                "group relative p-6 rounded-xl border border-border/20 bg-card/20 backdrop-blur-sm text-left",
                "hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10 hover:border-violet-500/20",
                "transition-all duration-200 min-h-[140px] overflow-hidden"
              )}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <tool.icon className="h-6 w-6 text-violet-400 mb-3" />
                <p className="text-base font-semibold text-foreground">{tool.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  {tool.creditCost > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Zap className="h-3 w-3 text-primary" /> {tool.creditCost} credit
                    </span>
                  )}
                  <Button size="sm" variant="ghost" className="ml-auto text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 h-7 px-3">
                    Launch
                  </Button>
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Utility Tools */}
      <motion.div variants={fadeUp} className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">Utilities</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {utilityTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onLaunchTool(tool.id)}
              className={cn(
                "group p-4 rounded-xl border border-border/20 bg-card/20 backdrop-blur-sm text-center",
                "hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/5 hover:border-violet-500/20",
                "transition-all duration-200"
              )}
            >
              <tool.icon className="h-5 w-5 text-violet-400/70 mx-auto mb-2" />
              <p className="text-xs font-semibold text-foreground">{tool.name}</p>
              {tool.creditCost === 0 && (
                <span className="text-[9px] text-emerald-400 font-semibold mt-1 block">Free</span>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
