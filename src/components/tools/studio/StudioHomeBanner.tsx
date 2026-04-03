import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Sparkles, Zap, ArrowRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toolsRegistry, SUBCATEGORY_LABELS, type ToolSubcategory } from "@/components/tools/toolsRegistry";

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
  const quickTools = toolsRegistry.filter(t => t.category === "quick_tool" && t.isActive);
  const featuredTools = quickTools.filter(t => FEATURED_TOOLS.includes(t.id));

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto"
    >
      {/* Hero Section */}
      <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.3),transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-[11px] font-bold text-primary-foreground/80 uppercase tracking-widest">AI Studio</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary-foreground tracking-tight leading-[1.1] max-w-lg">
            Your Creative Command Center
          </h1>
          <p className="text-sm text-primary-foreground/60 mt-3 max-w-md leading-relaxed">
            Generate audio, images, marketing copy, and more — all powered by AI. Select a tool to get started.
          </p>

          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10">
              <Wallet className="h-4 w-4 text-primary-foreground/70" />
              <span className="text-sm font-bold text-primary-foreground tabular-nums">
                {isLoadingCredits ? "…" : creditBalance.toLocaleString()}
              </span>
              <span className="text-xs text-primary-foreground/50">credits</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Featured Tools */}
      <motion.div variants={fadeUp} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Quick Start</h2>
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Popular tools</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {featuredTools.map(tool => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onToolSelect(tool.id)}
                className={cn(
                  "group relative p-4 rounded-xl border border-border bg-background text-left",
                  "hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30",
                  "transition-all duration-200"
                )}
              >
                <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <p className="text-xs font-semibold text-foreground leading-tight">{tool.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>
                {tool.creditCost > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Zap className="h-2.5 w-2.5 text-primary/60" />
                    <span className="text-[9px] text-muted-foreground/60">{tool.creditCost} credits</span>
                  </div>
                )}
                {tool.comingSoon && (
                  <span className="absolute top-2 right-2 text-[7px] font-bold text-muted-foreground/40 uppercase">Soon</span>
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
              <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
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
                        "group flex items-center gap-3 p-3 rounded-xl border border-border bg-background text-left",
                        "hover:bg-muted/30 hover:border-primary/20 transition-all duration-150"
                      )}
                    >
                      <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                        <Icon className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-foreground truncate">{tool.name}</p>
                          {tool.isPro && <Sparkles className="h-3 w-3 text-primary/60 shrink-0" />}
                          {tool.comingSoon && <span className="text-[7px] font-bold text-muted-foreground/40 uppercase shrink-0">Soon</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{tool.description}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary/50 shrink-0 transition-colors" />
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
