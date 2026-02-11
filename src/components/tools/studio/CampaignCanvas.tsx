import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Package, Layers, Zap, Rocket, Clapperboard, Image, FileText,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RecentCreations } from "./RecentCreations";
import type { StudioSection } from "./StudioLayout";

interface CampaignCanvasProps {
  productCount: number;
  assetCount: number;
  generationCount: number;
  creditBalance: number;
  isLoadingCredits: boolean;
  recentAssets: any[];
  onLaunchPromo: () => void;
  onLaunchTool: (id: string) => void;
  onSectionChange?: (section: StudioSection) => void;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

const HOOKS = [
  "Stop scrolling — this changes everything.",
  "You're losing money if you skip this.",
  "This hack doubled my sales overnight.",
  "Nobody talks about this creator secret.",
  "I tested 100 hooks — this one won.",
  "Your competitors already know this.",
];

const FEATURED_ACTIONS = [
  { id: "campaign", label: "Launch Promo", desc: "Scroll-stopping vertical video", icon: Clapperboard, accent: "from-orange-500/20 to-transparent" },
  { id: "social", label: "Create Carousel", desc: "Swipe-based storytelling", icon: Layers, accent: "from-blue-500/20 to-transparent" },
  { id: "listings", label: "Upgrade Image", desc: "Before/after transformation", icon: Image, accent: "from-emerald-500/20 to-transparent" },
  { id: "listings-opt", label: "Optimize Listing", desc: "AI-powered conversion boost", icon: FileText, accent: "from-violet-500/20 to-transparent" },
];

export function CampaignCanvas({
  productCount, assetCount, generationCount,
  creditBalance, isLoadingCredits, recentAssets,
  onLaunchPromo, onLaunchTool, onSectionChange,
}: CampaignCanvasProps) {
  const [quickPrompt, setQuickPrompt] = useState("");
  const [hookIdx, setHookIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHookIdx(i => (i + 1) % HOOKS.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-5 lg:p-6 space-y-6">
      {/* Warm orange glow */}
      <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-orange-500/[0.03] blur-[140px]" />

      {/* Stat strip — minimal */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
        {[
          { icon: Package, label: "Products", value: productCount },
          { icon: Layers, label: "Assets", value: assetCount },
          { icon: Zap, label: "Generated", value: generationCount },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <s.icon className="h-3 w-3 text-muted-foreground/40" />
            <span className="text-xs font-semibold text-foreground tabular-nums">{String(s.value)}</span>
            <span className="text-[10px] text-muted-foreground/50">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Hero strip — full bleed, no container */}
      <motion.div variants={fadeUp} className="grid lg:grid-cols-[1fr_280px] gap-6 min-h-[240px]">
        <div className="space-y-5 flex flex-col justify-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.1]">
            Launch. Create.<br />Optimize.
          </h2>
          <p className="text-sm text-muted-foreground/70 max-w-md">
            Turn any product into scroll-stopping content — deployed by AI.
          </p>
          <div className="flex gap-2 max-w-lg">
            <Input
              value={quickPrompt}
              onChange={e => setQuickPrompt(e.target.value)}
              placeholder="Describe your campaign…"
              className="flex-1 bg-white/[0.03] border-border/20"
            />
            <button
              onClick={onLaunchPromo}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold shadow-sm transition-colors shrink-0 flex items-center gap-2"
            >
              <Rocket className="h-3.5 w-3.5" /> Deploy
            </button>
          </div>
        </div>

        {/* Animated preview stack */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="relative w-[160px] h-[285px] rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden">
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.06]" />
            <div className="absolute inset-x-4 top-1/3 space-y-2">
              <AnimatePresence mode="wait">
                <motion.p
                  key={hookIdx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                  className="text-xs font-bold text-foreground leading-snug"
                >
                  {HOOKS[hookIdx]}
                </motion.p>
              </AnimatePresence>
              <div className="h-1 w-12 rounded-full bg-primary/20" />
            </div>
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/40 to-transparent">
              <div className="h-2 w-20 rounded-full bg-white/15" />
              <div className="h-2 w-14 rounded-full bg-white/8 mt-1" />
            </div>
            <div className="absolute top-3 right-3">
              <Play className="h-5 w-5 text-white/20" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Featured Actions — 2x2, no section title */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-2 gap-3">
          {FEATURED_ACTIONS.map(a => (
            <button
              key={a.id}
              onClick={() => {
                if (a.id === "campaign") onLaunchPromo();
                else if (a.id === "listings-opt") onSectionChange?.("listings");
                else onSectionChange?.(a.id as StudioSection);
              }}
              className={cn(
                "group relative p-5 rounded-xl text-left overflow-hidden min-h-[140px]",
                "hover:bg-white/[0.03] transition-colors duration-200"
              )}
            >
              <div className={cn("absolute inset-0 rounded-xl bg-gradient-to-br opacity-40", a.accent)} />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <a.icon className="h-6 w-6 text-foreground/30 mb-4" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{a.label}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">{a.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Trending shelf */}
      <motion.div variants={fadeUp}>
        <p className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wider mb-3">Trending</p>
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          {HOOKS.map((hook, i) => (
            <div key={i} className="shrink-0 w-[260px] p-4 rounded-xl hover:bg-white/[0.03] transition-colors">
              <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-2">Trending</p>
              <p className="text-sm font-semibold text-foreground/90 leading-snug">{hook}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Creations */}
      <motion.div variants={fadeUp}>
        <RecentCreations assets={recentAssets} />
      </motion.div>

      {/* Recommended — inline, no section title */}
      {(productCount === 0 || generationCount === 0 || (assetCount > 0 && generationCount < 5)) && (
        <motion.div variants={fadeUp} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {productCount === 0 && (
            <div className="p-4 rounded-xl hover:bg-white/[0.03] transition-colors">
              <p className="text-sm font-semibold text-foreground">Add your first product</p>
              <p className="text-[11px] text-muted-foreground/50 mt-1">Unlock all AI tools by adding a product.</p>
            </div>
          )}
          {generationCount === 0 && (
            <button onClick={onLaunchPromo} className="p-4 rounded-xl text-left hover:bg-white/[0.03] transition-colors group">
              <p className="text-sm font-semibold text-foreground">Create your first promo</p>
              <p className="text-[11px] text-muted-foreground/50 mt-1">It only takes 30 seconds.</p>
              <ArrowRight className="h-3 w-3 text-muted-foreground/30 mt-2 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
          {assetCount > 0 && generationCount < 5 && (
            <button onClick={() => onSectionChange?.("social")} className="p-4 rounded-xl text-left hover:bg-white/[0.03] transition-colors group">
              <p className="text-sm font-semibold text-foreground">Try a carousel</p>
              <p className="text-[11px] text-muted-foreground/50 mt-1">Turn your assets into swipeable content.</p>
              <ArrowRight className="h-3 w-3 text-muted-foreground/30 mt-2 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
