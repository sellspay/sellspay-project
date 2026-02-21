import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Package, Palette, Target, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignState } from "./CampaignCanvas";

interface CampaignControlPanelProps {
  creditBalance: number;
  isLoadingCredits?: boolean;
  onGenerate: (outputs: string[]) => void;
  campaignState?: CampaignState;
  isGenerating?: boolean;
}

const OUTPUT_OPTIONS = [
  { id: "promo-video", label: "Promo Video Script" },
  { id: "carousel", label: "Carousel Plan" },
  { id: "hooks", label: "Hooks" },
  { id: "captions", label: "Captions & Hashtags" },
  { id: "listing-rewrite", label: "Listing Rewrite" },
  { id: "email-draft", label: "Email Draft" },
];

export function CampaignControlPanel({ creditBalance, isLoadingCredits, onGenerate, campaignState, isGenerating }: CampaignControlPanelProps) {
  const [enabledOutputs, setEnabledOutputs] = useState<Set<string>>(
    new Set(OUTPUT_OPTIONS.map(o => o.id))
  );

  const toggleOutput = (id: string) => {
    setEnabledOutputs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasProduct = !!campaignState?.selectedProduct;
  const hasTemplate = !!campaignState?.selectedTemplate;
  const hasGoal = !!campaignState?.selectedGoal;

  const missingItems: string[] = [];
  if (!hasProduct) missingItems.push("Product");
  if (!hasTemplate) missingItems.push("Style");
  const isReady = hasProduct && hasTemplate && enabledOutputs.size > 0;

  const estimatedCredits = enabledOutputs.size;

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="h-full border-l border-white/[0.06] bg-card/60 backdrop-blur-xl overflow-y-auto custom-scrollbar"
    >
      <div className="p-5 space-y-5">
        {/* Header */}
        <div>
          <p className="text-sm font-semibold text-foreground">Campaign Readiness</p>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            {isReady ? "All set — ready to generate" : `Complete ${missingItems.length} more step${missingItems.length > 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Status */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
          isReady ? "bg-emerald-500/10 text-emerald-400" : "bg-primary/10 text-primary"
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

        {/* Checklist */}
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

        {/* Output Toggles */}
        <div className="space-y-2.5">
          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Outputs ({enabledOutputs.size})</p>
          <div className="space-y-1">
            {OUTPUT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => toggleOutput(opt.id)}
                disabled={isGenerating}
                className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-white/[0.03] disabled:opacity-50"
              >
                <div className={cn(
                  "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                  enabledOutputs.has(opt.id)
                    ? "bg-gradient-to-b from-[#4B8BF5] to-[#2563EB] border-transparent"
                    : "border-white/[0.12] bg-transparent"
                )}>
                  {enabledOutputs.has(opt.id) && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <span className={cn(
                  "text-xs transition-colors",
                  enabledOutputs.has(opt.id) ? "text-foreground" : "text-muted-foreground/50"
                )}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-border/30" />

        {/* Credits */}
        <div className="rounded-lg bg-white/[0.02] p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/60">Estimated cost</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">{estimatedCredits} credits</span>
          </div>
          <p className="text-[10px] text-muted-foreground/30">1 credit per output × {enabledOutputs.size} outputs</p>
        </div>

        {/* Generate */}
        <button
          onClick={() => onGenerate(Array.from(enabledOutputs))}
          disabled={!isReady || isGenerating}
          className={cn(
            "w-full py-3 text-sm font-semibold rounded-[10px] shadow-sm transition-all flex items-center justify-center gap-2",
            isReady && !isGenerating
              ? "text-white hover:shadow-md cursor-pointer"
              : "text-white/40 cursor-not-allowed opacity-50"
          )}
          style={{ background: "linear-gradient(180deg, #4B8BF5 0%, #2563EB 100%)" }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : isReady ? (
            "Generate Campaign Pack"
          ) : !hasProduct ? (
            "Select a product first"
          ) : (
            "Choose a style first"
          )}
        </button>
      </div>
    </motion.aside>
  );
}
