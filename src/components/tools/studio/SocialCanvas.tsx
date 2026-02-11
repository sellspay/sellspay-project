import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2, MessageSquare, Hash, GalleryHorizontal, Clapperboard,
  Zap, Heart, MessageCircle, Repeat2, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toolsRegistry } from "@/components/tools/toolsRegistry";

interface SocialCanvasProps {
  onLaunchTool: (id: string) => void;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const PLATFORMS = [
  { id: "tiktok", label: "TikTok", accent: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  { id: "instagram", label: "Instagram", accent: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { id: "youtube", label: "YouTube", accent: "bg-red-500/10 text-red-400 border-red-500/20" },
  { id: "twitter", label: "Twitter/X", accent: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
];

const CONTENT_TYPES = [
  { id: "carousel-generator", label: "Carousel", icon: GalleryHorizontal, desc: "Multi-slide swipe posts" },
  { id: "caption-hashtags", label: "Caption Pack", icon: Hash, desc: "Optimized captions & hashtags" },
  { id: "social-posts-pack", label: "10 Posts", icon: MessageSquare, desc: "Full post pack from product" },
  { id: "short-form-script", label: "Short-Form Script", icon: Clapperboard, desc: "TikTok/Reels/Shorts" },
];

const MOCK_HASHTAGS = ["#creator", "#digitalproducts", "#growthhack", "#sellonline", "#trending"];
const MOCK_CAPTION = "This tool changed how I create content forever. Here's why…";

const SOCIAL_TOOL_IDS = ["social-posts-pack", "short-form-script", "caption-hashtags", "carousel-generator"];

export function SocialCanvas({ onLaunchTool }: SocialCanvasProps) {
  const [activePlatform, setActivePlatform] = useState("tiktok");
  const [assemblyStep, setAssemblyStep] = useState(0);

  const tools = useMemo(() =>
    toolsRegistry.filter(t => SOCIAL_TOOL_IDS.includes(t.id) && t.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  []);

  // Post assembly animation
  useEffect(() => {
    const t = setInterval(() => setAssemblyStep(s => (s + 1) % 5), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-6 lg:p-8 space-y-8 max-w-[1200px] mx-auto">
      {/* Blue/indigo glow */}
      <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-indigo-500/[0.04] blur-[140px]" />

      {/* Platform Strip */}
      <motion.div variants={fadeUp} className="flex gap-2">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePlatform(p.id)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all",
              activePlatform === p.id ? p.accent : "border-border/20 text-muted-foreground hover:text-foreground hover:bg-card/30"
            )}
          >
            {p.label}
          </button>
        ))}
      </motion.div>

      {/* Content Type Shelf */}
      <motion.div variants={fadeUp}>
        <h3 className="text-lg font-bold text-foreground mb-4">Content Formats</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CONTENT_TYPES.map(ct => (
            <button
              key={ct.id}
              onClick={() => onLaunchTool(ct.id)}
              className={cn(
                "group relative p-5 rounded-xl border border-border/20 bg-card/20 backdrop-blur-sm text-left",
                "hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/20",
                "transition-all duration-200 min-h-[140px]"
              )}
            >
              <ct.icon className="h-6 w-6 text-indigo-400 mb-3" />
              <p className="text-sm font-semibold text-foreground">{ct.label}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{ct.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Animated Post Assembly */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-xl overflow-hidden">
        <div className="p-6">
          <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-4 block">Live Preview — Post Assembly</span>
          <div className="max-w-sm mx-auto">
            {/* Mock post card */}
            <div className="rounded-xl border border-border/20 bg-card/40 p-4 space-y-3">
              {/* Author */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-indigo-500/20" />
                <div>
                  <div className="h-2.5 w-20 rounded bg-foreground/20" />
                  <div className="h-2 w-14 rounded bg-muted-foreground/10 mt-1" />
                </div>
              </div>
              {/* Caption — animated typing */}
              <AnimatePresence mode="wait">
                {assemblyStep >= 1 && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-sm text-foreground leading-relaxed"
                  >
                    {MOCK_CAPTION}
                  </motion.p>
                )}
              </AnimatePresence>
              {/* Image placeholder */}
              {assemblyStep >= 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-48 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-border/10 flex items-center justify-center"
                >
                  <Share2 className="h-8 w-8 text-indigo-400/30" />
                </motion.div>
              )}
              {/* Hashtags */}
              {assemblyStep >= 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-1.5">
                  {MOCK_HASHTAGS.map((tag, i) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-xs text-indigo-400"
                    >
                      {tag}
                    </motion.span>
                  ))}
                </motion.div>
              )}
              {/* Engagement */}
              {assemblyStep >= 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 pt-2 border-t border-border/10">
                  {[
                    { icon: Heart, val: "2.4K" },
                    { icon: MessageCircle, val: "189" },
                    { icon: Repeat2, val: "542" },
                    { icon: Send, val: "98" },
                  ].map(e => (
                    <div key={e.val} className="flex items-center gap-1">
                      <e.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">{e.val}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tools Grid */}
      <motion.div variants={fadeUp} className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">Social Tools</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onLaunchTool(tool.id)}
              className={cn(
                "group p-5 rounded-xl border border-border/20 bg-card/20 backdrop-blur-sm text-left",
                "hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/20",
                "transition-all duration-200"
              )}
            >
              <tool.icon className="h-5 w-5 text-indigo-400 mb-2" />
              <p className="text-sm font-semibold text-foreground">{tool.name}</p>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>
              {tool.creditCost > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Zap className="h-3 w-3 text-primary" />
                  <span className="text-[10px] text-muted-foreground">{tool.creditCost} credits</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
