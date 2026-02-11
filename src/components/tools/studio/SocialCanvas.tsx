import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2, Heart, MessageCircle, Repeat2, Send, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toolsRegistry } from "@/components/tools/toolsRegistry";

interface SocialCanvasProps {
  onLaunchTool: (id: string) => void;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const PLATFORMS = [
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube" },
  { id: "twitter", label: "Twitter/X" },
];

const CONTENT_TYPES = [
  { id: "carousel-generator", label: "Carousel", desc: "Multi-slide swipe posts" },
  { id: "caption-hashtags", label: "Caption Pack", desc: "Optimized captions & hashtags" },
  { id: "social-posts-pack", label: "10 Posts", desc: "Full post pack from product" },
  { id: "short-form-script", label: "Short-Form Script", desc: "TikTok/Reels/Shorts" },
];

function isComingSoon(id: string) {
  const entry = toolsRegistry.find(t => t.id === id);
  return entry?.comingSoon ?? false;
}

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

  useEffect(() => {
    const t = setInterval(() => setAssemblyStep(s => (s + 1) % 5), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-4 lg:p-5 space-y-5">
      {/* Blue/indigo glow */}
      <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-indigo-500/[0.03] blur-[140px]" />

      {/* Platform Strip — text weight only, no bg on active */}
      <motion.div variants={fadeUp} className="flex gap-1">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePlatform(p.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm transition-colors",
              activePlatform === p.id
                ? "text-foreground font-semibold"
                : "text-muted-foreground/50 hover:text-foreground/70"
            )}
          >
            {p.label}
          </button>
        ))}
      </motion.div>

      {/* Content Type Shelf — no icons, no min-h */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CONTENT_TYPES.map(ct => {
            const comingSoon = isComingSoon(ct.id);
            return (
              <button
                key={ct.id}
                onClick={() => !comingSoon && onLaunchTool(ct.id)}
                disabled={comingSoon}
                className="group relative p-5 rounded-xl text-left hover:bg-white/[0.03] transition-colors disabled:opacity-50 disabled:cursor-default"
              >
                {comingSoon && (
                  <span className="absolute top-3 right-3 text-[9px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase tracking-wider">Soon</span>
                )}
                <p className="text-sm font-semibold text-foreground">{ct.label}</p>
                <p className="text-[11px] text-muted-foreground/50 mt-1">{ct.desc}</p>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Animated Post Assembly — no container bg */}
      <motion.div variants={fadeUp} className="overflow-hidden">
        <div className="p-6">
          <p className="text-[10px] font-semibold text-indigo-400/40 uppercase tracking-wider mb-4">Live Preview</p>
          <div className="max-w-sm mx-auto">
            <div className="p-4 space-y-3">
              {/* Author */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/[0.05]" />
                <div>
                  <div className="h-2.5 w-20 rounded bg-white/[0.08]" />
                  <div className="h-2 w-14 rounded bg-white/[0.04] mt-1" />
                </div>
              </div>
              {/* Caption */}
              <AnimatePresence mode="wait">
                {assemblyStep >= 1 && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-sm text-foreground/80 leading-relaxed"
                  >
                    {MOCK_CAPTION}
                  </motion.p>
                )}
              </AnimatePresence>
              {/* Image */}
              {assemblyStep >= 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-48 rounded-lg bg-gradient-to-br from-indigo-500/[0.06] to-purple-500/[0.04] flex items-center justify-center"
                >
                  <Share2 className="h-8 w-8 text-indigo-400/15" />
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
                      className="text-xs text-indigo-400/50"
                    >
                      {tag}
                    </motion.span>
                  ))}
                </motion.div>
              )}
              {/* Engagement */}
              {assemblyStep >= 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 pt-2 border-t border-white/[0.04]">
                  {[
                    { icon: Heart, val: "2.4K" },
                    { icon: MessageCircle, val: "189" },
                    { icon: Repeat2, val: "542" },
                    { icon: Send, val: "98" },
                  ].map(e => (
                    <div key={e.val} className="flex items-center gap-1">
                      <e.icon className="h-3.5 w-3.5 text-muted-foreground/30" />
                      <span className="text-[11px] text-muted-foreground/40">{e.val}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tools Grid — no icons */}
      <motion.div variants={fadeUp} className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wider">Social Tools</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tools.map(tool => {
            const comingSoon = tool.comingSoon;
            return (
              <button
                key={tool.id}
                onClick={() => !comingSoon && onLaunchTool(tool.id)}
                disabled={comingSoon}
                className="group relative p-5 rounded-xl text-left hover:bg-white/[0.03] transition-colors disabled:opacity-50 disabled:cursor-default"
              >
                {comingSoon && (
                  <span className="absolute top-3 right-3 text-[9px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase tracking-wider">Soon</span>
                )}
                <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                <p className="text-[11px] text-muted-foreground/50 mt-1 line-clamp-2">{tool.description}</p>
                {tool.creditCost > 0 && (
                  <span className="text-[10px] text-muted-foreground/40 mt-2 block">{tool.creditCost} credits</span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
