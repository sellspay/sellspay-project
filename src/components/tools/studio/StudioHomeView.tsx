import { useState } from "react";
import { motion } from "framer-motion";
import {
  Flame, TrendingUp, Share2, AudioLines, Play, Sparkles,
  Package, Layers, Zap, Rocket, Clapperboard, FileText,
  LayoutTemplate, PackagePlus, Hash, GalleryHorizontal, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MyAssetsDrawer } from "@/components/tools/MyAssetsDrawer";
import { RecentCreations } from "./RecentCreations";
import type { StudioSection } from "./StudioLayout";
import type { ToolRegistryEntry } from "@/components/tools/toolsRegistry";

interface StudioHomeViewProps {
  activeSection: StudioSection;
  productCount: number;
  assetCount: number;
  generationCount: number;
  creditBalance: number;
  isLoadingCredits: boolean;
  recentAssets: any[];
  onLaunchPromo: () => void;
  onLaunchTool: (id: string) => void;
  onSectionChange?: (section: StudioSection) => void;
  sectionTools: ToolRegistryEntry[];
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// Quick-launch cards for the home canvas
const QUICK_LAUNCH = [
  { id: "campaign", label: "Launch Campaign", desc: "Create scroll-stopping promos", icon: Flame, gradient: "from-orange-500/20 to-red-500/10" },
  { id: "listings", label: "Upgrade Listings", desc: "AI-optimized product pages", icon: TrendingUp, gradient: "from-emerald-500/20 to-teal-500/10" },
  { id: "social", label: "Social Factory", desc: "Content for every platform", icon: Share2, gradient: "from-blue-500/20 to-indigo-500/10" },
  { id: "media", label: "Media Lab", desc: "Audio & media utilities", icon: AudioLines, gradient: "from-purple-500/20 to-pink-500/10" },
];

export function StudioHomeView({
  activeSection, productCount, assetCount, generationCount,
  creditBalance, isLoadingCredits, recentAssets,
  onLaunchPromo, onLaunchTool, onSectionChange, sectionTools,
}: StudioHomeViewProps) {
  const [quickPrompt, setQuickPrompt] = useState("");

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto"
    >
      {/* Stat bar */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
        {[
          { icon: Package, label: "Products", value: productCount },
          { icon: Layers, label: "Assets", value: assetCount },
          { icon: Sparkles, label: "Generated", value: generationCount },
          { icon: Zap, label: "Credits", value: isLoadingCredits ? "…" : creditBalance },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-card/60 border border-border/30 backdrop-blur-sm">
            <s.icon className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground tabular-nums">{s.value}</span>
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
        <div className="ml-auto">
          <MyAssetsDrawer />
        </div>
      </motion.div>

      {/* Hero Campaign Card */}
      <motion.div
        variants={fadeUp}
        className="relative rounded-2xl overflow-hidden border border-border/20 bg-card/30 backdrop-blur-xl"
      >
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        <div className="relative z-10 grid lg:grid-cols-[1fr_260px] gap-8 p-8 lg:p-10">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clapperboard className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Flagship</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Short-Form Promo Generator
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Turn any product into a scroll-stopping promo in seconds. Script, storyboard, and frame visuals — all deployed by AI.
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

          {/* Video preview mock */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-[180px] h-[320px] rounded-2xl border border-border/20 bg-gradient-to-b from-card to-background overflow-hidden flex flex-col items-center justify-center gap-3">
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/10" />
              <Play className="h-10 w-10 text-primary/30" />
              <span className="text-[10px] text-muted-foreground">Preview</span>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-primary/5 to-transparent" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick-launch grid */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_LAUNCH.map(q => (
            <button
              key={q.id}
              onClick={() => {
                if (q.id === "campaign") onLaunchPromo();
                else onSectionChange?.(q.id as StudioSection);
              }}
              className={cn(
                "group relative p-4 rounded-xl border border-border/20 bg-card/20 backdrop-blur-sm text-left",
                "hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20",
                "transition-all duration-200"
              )}
            >
              <div className={cn("absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity", q.gradient)} />
              <div className="relative z-10">
                <q.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm font-semibold text-foreground">{q.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{q.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Section-specific tool cards (when section has active tools) */}
      {sectionTools.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-4">
          <h3 className="text-lg font-bold text-foreground">Available Tools</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sectionTools.map(tool => (
              <button
                key={tool.id}
                onClick={() => onLaunchTool(tool.id)}
                className={cn(
                  "group p-4 rounded-xl border border-border/20 bg-card/20 backdrop-blur-sm text-left",
                  "hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20",
                  "transition-all duration-200"
                )}
              >
                <tool.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{tool.description}</p>
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
      )}

      {/* Recent Creations */}
      <motion.div variants={fadeUp}>
        <RecentCreations assets={recentAssets} />
      </motion.div>
    </motion.div>
  );
}
