import { motion } from "framer-motion";
import { Check, Package, Palette, Target, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignState } from "./CampaignCanvas";

interface CampaignControlPanelProps {
  creditBalance: number;
  isLoadingCredits?: boolean;
  onGenerate: () => void;
  campaignState?: CampaignState;
}

export function CampaignControlPanel({ creditBalance, isLoadingCredits, onGenerate, campaignState }: CampaignControlPanelProps) {
  const hasProduct = !!campaignState?.selectedProduct;
  const hasTemplate = !!campaignState?.selectedTemplate;
  const hasGoal = !!campaignState?.selectedGoal;

  const missingItems: string[] = [];
  if (!hasProduct) missingItems.push("Product");
  if (!hasTemplate) missingItems.push("Style");
  const isReady = hasProduct && hasTemplate;

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="h-full border-l border-white/[0.06] bg-card/60 backdrop-blur-xl overflow-y-auto custom-scrollbar"
    >
      <div className="p-5 space-y-5">
        {/* Campaign Readiness Header */}
        <div>
          <p className="text-sm font-semibold text-foreground">Campaign Readiness</p>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            {isReady ? "All set — ready to generate" : `Complete ${missingItems.length} more step${missingItems.length > 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Status indicator */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
          isReady
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-amber-500/10 text-amber-400"
        )}>
          {isReady ? (
            <>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ready to generate
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5" />
              Missing: {missingItems.join(", ")}
            </>
          )}
        </div>

        <div className="h-px bg-border/30" />

        {/* Readiness checklist */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-white/[0.02]">
            <Package className={cn("h-3.5 w-3.5", hasProduct ? "text-emerald-400" : "text-muted-foreground/30")} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Product</p>
              <p className={cn("text-xs truncate", hasProduct ? "text-foreground" : "text-muted-foreground/40")}>
                {campaignState?.selectedProduct?.name || "Not selected"}
              </p>
            </div>
            {hasProduct && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
          </div>

          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-white/[0.02]">
            <Target className={cn("h-3.5 w-3.5", hasGoal ? "text-emerald-400" : "text-muted-foreground/30")} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Goal</p>
              <p className={cn("text-xs truncate", hasGoal ? "text-foreground" : "text-muted-foreground/40")}>
                {campaignState?.selectedGoal
                  ? campaignState.selectedGoal.charAt(0).toUpperCase() + campaignState.selectedGoal.slice(1)
                  : "Not selected"}
              </p>
            </div>
            {hasGoal && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
          </div>

          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-white/[0.02]">
            <Palette className={cn("h-3.5 w-3.5", hasTemplate ? "text-emerald-400" : "text-muted-foreground/30")} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Style</p>
              <p className={cn("text-xs truncate", hasTemplate ? "text-foreground" : "text-muted-foreground/40")}>
                {campaignState?.selectedTemplate?.name || "Not selected"}
              </p>
            </div>
            {hasTemplate && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
          </div>
        </div>

        <div className="h-px bg-border/30" />

        {/* Generate CTA */}
        <button
          onClick={onGenerate}
          disabled={!isReady}
          className={cn(
            "w-full py-3 text-sm font-semibold rounded-[10px] shadow-sm transition-all",
            isReady
              ? "text-white hover:shadow-md cursor-pointer"
              : "text-white/40 cursor-not-allowed opacity-50"
          )}
          style={{ background: "linear-gradient(180deg, #FF7A1A 0%, #E85C00 100%)" }}
        >
          {isReady ? "Generate Campaign Pack" : !hasProduct ? "Select a product first" : "Choose a style first"}
        </button>
      </div>
    </motion.aside>
  );
}
