import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, TrendingUp, Share2, AudioLines, Play, Sparkles,
  Package, Layers, Zap, Rocket, Clapperboard, Image, FileText,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  { id: "campaign", label: "Launch Promo", desc: "Scroll-stopping vertical video", icon: Clapperboard, accent: "from-orange-500/30 via-red-500/15 to-transparent", border: "border-orange-500/20" },
  { id: "social", label: "Create Carousel", desc: "Swipe-based storytelling", icon: Layers, accent: "from-blue-500/30 via-indigo-500/15 to-transparent", border: "border-blue-500/20" },
  { id: "listings", label: "Upgrade Image", desc: "Before/after transformation", icon: Image, accent: "from-emerald-500/30 via-teal-500/15 to-transparent", border: "border-emerald-500/20" },
  { id: "listings-opt", label: "Optimize Listing", desc: "AI-powered conversion boost", icon: FileText, accent: "from-violet-500/30 via-purple-500/15 to-transparent", border: "border-violet-500/20" },
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
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-6 lg:p-8 space-y-8 max-w-[1200px] mx-auto">
      {/* Warm orange glow */}
      <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-orange-500/[0.04] blur-[140px]" />

      {/* Stat strip */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
        {[
          { icon: Package, label: "Products", value: productCount },
          { icon: Layers, label: "Assets", value: assetCount },
          { icon: Sparkles, label: "Generated", value: generationCount },
          { icon: Zap, label: "Credits", value: isLoadingCredits ? "…" : creditBalance },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-card/60 border border-border/30 backdrop-blur-sm">
            <s.icon className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground tabular-nums">{String(s.value)}</span>
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Hero strip — 260px */}
      <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden border border-border/20 bg-card/30 backdrop-blur-xl min-h-[260px]">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        <div className="relative z-10 grid lg:grid-cols-[1fr_280px] gap-6 p-8 lg:p-10">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clapperboard className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Studio</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
              Launch. Create.<br />Optimize.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Turn any product into scroll-stopping promos, optimized listings, and social content — all deployed by AI.
            </p>
            <div className="flex gap-2">
              <Input
                value={quickPrompt}
                onChange={e => setQuickPrompt(e.target.value)}
                placeholder="Describe your campaign…"
                className="flex-1 bg-background/50 border-border/40"
              />
              <Button onClick={onLaunchPromo} className="btn-premium rounded-xl gap-2 px-5 shrink-0">
                <Rocket className="h-4 w-4" /> Deploy
              </Button>
            </div>
          </div>

          {/* Animated preview stack */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-[160px] h-[285px] rounded-2xl border border-border/20 bg-gradient-to-b from-card to-background overflow-hidden">
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/10" />
              {/* Animated hook text */}
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
                <div className="h-1 w-12 rounded-full bg-primary/30" />
              </div>
              {/* Caption bar */}
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                <div className="h-2 w-20 rounded-full bg-white/20" />
                <div className="h-2 w-14 rounded-full bg-white/10 mt-1" />
              </div>
              <div className="absolute top-3 right-3">
                <Play className="h-5 w-5 text-primary/40" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Featured Actions — 2x2 */}
      <motion.div variants={fadeUp}>
        <h3 className="text-lg font-bold text-foreground mb-4">Featured Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          {FEATURED_ACTIONS.map(a => (
            <button
              key={a.id}
              onClick={() => {
                if (a.id === "campaign") onLaunchPromo();
                else if (a.id === "listings-opt") onSectionChange?.("listings");
                else onSectionChange?.(a.id as StudioSection);
              }}
              className={cn(
                "group relative p-6 rounded-2xl border bg-card/20 backdrop-blur-sm text-left",
                "hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10",
                "transition-all duration-200 min-h-[180px] overflow-hidden",
                a.border
              )}
            >
              <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br opacity-60 group-hover:opacity-100 transition-opacity", a.accent)} />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <a.icon className="h-8 w-8 text-primary mb-4" />
                <div>
                  <p className="text-base font-bold text-foreground">{a.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Trending Hooks shelf */}
      <motion.div variants={fadeUp}>
        <h3 className="text-lg font-bold text-foreground mb-4">Trending Hooks</h3>
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          {HOOKS.map((hook, i) => (
            <div
              key={i}
              className="shrink-0 w-[220px] p-4 rounded-xl border border-border/20 bg-card/20 backdrop-blur-sm hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Flame className="h-3 w-3 text-orange-400" />
                <span className="text-[10px] text-orange-400 font-semibold uppercase">Trending</span>
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug">{hook}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Creations */}
      <motion.div variants={fadeUp}>
        <RecentCreations assets={recentAssets} />
      </motion.div>

      {/* Recommended Next Steps — intelligence layer */}
      <motion.div variants={fadeUp} className="space-y-3">
        <h3 className="text-lg font-bold text-foreground">Recommended Next</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {productCount === 0 && (
            <div className="p-4 rounded-xl border border-border/20 bg-card/20 backdrop-blur-sm">
              <Package className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-semibold text-foreground">Add your first product</p>
              <p className="text-[11px] text-muted-foreground mt-1">Unlock all AI tools by adding a product.</p>
            </div>
          )}
          {generationCount === 0 && (
            <button onClick={onLaunchPromo} className="p-4 rounded-xl border border-border/20 bg-card/20 backdrop-blur-sm text-left hover:border-primary/20 transition-colors group">
              <Rocket className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-semibold text-foreground">Create your first promo</p>
              <p className="text-[11px] text-muted-foreground mt-1">It only takes 30 seconds.</p>
              <ArrowRight className="h-3.5 w-3.5 text-primary mt-2 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
          {assetCount > 0 && generationCount < 5 && (
            <button onClick={() => onSectionChange?.("social")} className="p-4 rounded-xl border border-border/20 bg-card/20 backdrop-blur-sm text-left hover:border-primary/20 transition-colors group">
              <Share2 className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-semibold text-foreground">Try a carousel</p>
              <p className="text-[11px] text-muted-foreground mt-1">Turn your assets into swipeable content.</p>
              <ArrowRight className="h-3.5 w-3.5 text-primary mt-2 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
