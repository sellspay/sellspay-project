import { motion } from "framer-motion";
import { Palette } from "lucide-react";
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
        {/* Tool info */}
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
