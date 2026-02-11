import { motion } from "framer-motion";
import {
  Zap, Palette, Layers, Search, Share2, AudioLines,
  Eye, ShieldCheck, MousePointerClick, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getToolById } from "@/components/tools/toolsData";
import { toolsRegistry } from "@/components/tools/toolsRegistry";
import { BrandKitToggle } from "@/components/tools/BrandKitToggle";
import { CreditEstimator } from "@/components/tools/CreditEstimator";
import type { StudioSection } from "./StudioLayout";

interface StudioContextPanelProps {
  toolId: string | null;
  activeSection: StudioSection;
  creditBalance: number;
  isLoadingCredits?: boolean;
}

export function StudioContextPanel({ toolId, activeSection, creditBalance, isLoadingCredits }: StudioContextPanelProps) {
  const tool = toolId ? getToolById(toolId) : null;
  const registryEntry = toolId ? toolsRegistry.find(t => t.id === toolId) : null;
  const creditCost = registryEntry?.creditCost ?? 0;

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="h-full border-l border-white/[0.06] bg-card/60 backdrop-blur-xl overflow-y-auto custom-scrollbar"
    >
      <div className="p-5 space-y-5">
        {/* Tool info (when tool active) */}
        {tool && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center",
                `bg-gradient-to-br ${tool.gradient}`
              )}>
                <tool.icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{tool.title}</p>
                <p className="text-[10px] text-muted-foreground">{tool.tagline}</p>
              </div>
            </div>
            <div className="h-px bg-border/30" />
          </div>
        )}

        {/* Section-aware context (when no tool active) */}
        {!toolId && activeSection === "listings" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-foreground">Store Health</span>
            </div>
            <div className="space-y-2">
              {[
                { label: "SEO Score", value: 78, icon: Search, color: "bg-cyan-400" },
                { label: "Trust Score", value: 85, icon: ShieldCheck, color: "bg-teal-400" },
                { label: "CTA Strength", value: 88, icon: MousePointerClick, color: "bg-green-400" },
                { label: "Clarity", value: 91, icon: Eye, color: "bg-emerald-400" },
              ].map(s => (
                <div key={s.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{s.label}</span>
                    <span className="text-xs font-bold text-foreground">{s.value}</span>
                  </div>
                  <div className="h-1 rounded-full bg-border/30">
                    <div className={cn("h-full rounded-full", s.color)} style={{ width: `${s.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-px bg-border/30" />
          </div>
        )}

        {!toolId && activeSection === "social" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Share2 className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-foreground">Platform</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["TikTok", "Reels", "Shorts", "Twitter"].map(p => (
                <button key={p} className="px-3 py-2 rounded-lg text-[11px] font-semibold border border-border/20 bg-background/30 text-muted-foreground hover:text-foreground hover:border-indigo-500/20 transition-colors">
                  {p}
                </button>
              ))}
            </div>
            <div className="h-px bg-border/30" />
          </div>
        )}

        {!toolId && activeSection === "media" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AudioLines className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-foreground">Output Settings</span>
            </div>
            <div className="space-y-2">
              <div className="rounded-lg border border-border/20 bg-background/30 p-3">
                <p className="text-[11px] text-muted-foreground mb-1">Format</p>
                <div className="flex gap-1.5">
                  {["WAV", "MP3", "FLAC", "OGG"].map(f => (
                    <span key={f} className="px-2.5 py-1 rounded text-[10px] font-semibold border border-border/20 text-muted-foreground hover:text-foreground hover:border-violet-500/20 cursor-pointer transition-colors">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border/20 bg-background/30 p-3">
                <p className="text-[11px] text-muted-foreground mb-1">Quality</p>
                <div className="flex gap-1.5">
                  {["Standard", "High", "Lossless"].map(q => (
                    <span key={q} className="px-2.5 py-1 rounded text-[10px] font-semibold border border-border/20 text-muted-foreground hover:text-foreground hover:border-violet-500/20 cursor-pointer transition-colors">
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="h-px bg-border/30" />
          </div>
        )}

        {/* Creative Controls */}
        {toolId && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Creative Controls</span>
              </div>
              <div className="rounded-lg border border-border/20 bg-background/30 p-4">
                <p className="text-[11px] text-muted-foreground text-center">
                  Controls appear based on the active tool
                </p>
              </div>
            </div>
            <div className="h-px bg-border/30" />
          </>
        )}

        {/* Brand Kit */}
        <BrandKitToggle
          enabled={false}
          onToggle={() => {}}
          onBrandKitLoaded={() => {}}
        />

        <div className="h-px bg-border/30" />

        {/* Credit Estimator */}
        <CreditEstimator
          baseCost={creditCost}
          creditBalance={creditBalance}
          isLoading={isLoadingCredits}
        />
      </div>
    </motion.aside>
  );
}
