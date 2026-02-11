import { useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { toolsRegistry } from "@/components/tools/toolsRegistry";

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
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-5 lg:p-6 space-y-6">
      {/* Purple glow */}
      <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-violet-500/[0.03] blur-[140px]" />

      {/* Waveform Hero — no container */}
      <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-10">
        {/* Animated waveform bars */}
        <div className="flex items-end gap-[3px] h-20 mb-6">
          {Array.from({ length: 48 }).map((_, i) => {
            const height = 20 + Math.sin(i * 0.4) * 30 + Math.cos(i * 0.7) * 20;
            return (
              <motion.div
                key={i}
                className="w-[4px] rounded-full bg-violet-500/25"
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
        <p className="text-sm text-muted-foreground/50">Audio tools, stem separation, and sound design</p>
        <div className="flex items-center gap-2 mt-4">
          <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center">
            <Play className="h-4 w-4 text-violet-400/50 ml-0.5" />
          </div>
          <span className="text-xs text-muted-foreground/40">Drop audio to begin</span>
        </div>
      </motion.div>

      {/* AI-Powered Tools */}
      <motion.div variants={fadeUp} className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wider">AI-Powered</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {aiTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onLaunchTool(tool.id)}
              className="group relative p-6 rounded-xl text-left hover:bg-white/[0.03] transition-colors min-h-[130px] overflow-hidden"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <tool.icon className="h-5 w-5 text-violet-400/40 mb-3" />
                <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                <p className="text-xs text-muted-foreground/50 mt-1">{tool.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  {tool.creditCost > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                      <Zap className="h-3 w-3 text-primary/40" /> {tool.creditCost} credit
                    </span>
                  )}
                  <span className="ml-auto text-xs text-violet-400/40 group-hover:text-violet-400/60 transition-colors">
                    Launch
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Utility Tools */}
      <motion.div variants={fadeUp} className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wider">Utilities</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {utilityTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onLaunchTool(tool.id)}
              className="group p-4 rounded-xl text-center hover:bg-white/[0.03] transition-colors"
            >
              <tool.icon className="h-5 w-5 text-violet-400/30 mx-auto mb-2" />
              <p className="text-xs font-semibold text-foreground/80">{tool.name}</p>
              {tool.creditCost === 0 && (
                <span className="text-[9px] text-emerald-400/50 font-medium mt-1 block">Free</span>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
