import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Mic, Package, Palette, Target, Zap, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandKitToggle } from "@/components/tools/BrandKitToggle";
import type { CampaignState } from "./CampaignCanvas";
import { CAMPAIGN_TEMPLATES } from "./CampaignCanvas";

interface CampaignControlPanelProps {
  creditBalance: number;
  isLoadingCredits?: boolean;
  onGenerate: () => void;
  campaignState?: CampaignState;
}

const OUTPUT_OPTIONS = [
  { id: "promo-video", label: "Promo Video" },
  { id: "carousel", label: "Carousel" },
  { id: "hooks", label: "Hooks" },
  { id: "captions", label: "Captions" },
  { id: "listing-rewrite", label: "Listing Rewrite" },
  { id: "email-draft", label: "Email Draft" },
];

const PLATFORMS = ["TikTok", "Reels", "Shorts"];
const DURATIONS = [6, 10, 15, 30];

export function CampaignControlPanel({ creditBalance, isLoadingCredits, onGenerate, campaignState }: CampaignControlPanelProps) {
  const [brandKitEnabled, setBrandKitEnabled] = useState(false);
  const [enabledOutputs, setEnabledOutputs] = useState<Set<string>>(
    new Set(OUTPUT_OPTIONS.map(o => o.id))
  );
  const [platform, setPlatform] = useState("TikTok");
  const [duration, setDuration] = useState(15);
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(false);

  const toggleOutput = (id: string) => {
    setEnabledOutputs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const estimatedCredits = enabledOutputs.size * 3;
  const step = campaignState?.currentStep ?? 1;
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
        {/* Campaign Readiness Panel */}
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
          {/* Product */}
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

          {/* Goal */}
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

          {/* Style / Template */}
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

          {/* Outputs summary */}
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-white/[0.02]">
            <Zap className="h-3.5 w-3.5 text-muted-foreground/30" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Outputs</p>
              <p className="text-xs text-foreground">{enabledOutputs.size} outputs selected</p>
            </div>
          </div>

          {/* Platform */}
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-white/[0.02]">
            <div className="h-3.5 w-3.5 text-muted-foreground/30 flex items-center justify-center text-[8px] font-bold">▶</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Platform</p>
              <p className="text-xs text-foreground">{platform}</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-border/30" />

        {/* Credits Estimate */}
        <div className="rounded-lg bg-white/[0.02] p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/60">Estimated cost</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">{estimatedCredits} credits</span>
          </div>
          <p className="text-[10px] text-muted-foreground/30">Based on {enabledOutputs.size} outputs</p>
        </div>

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
          {isReady ? "Generate Campaign Pack" : step === 1 ? "Select a product first" : "Choose a style first"}
        </button>

        <div className="h-px bg-border/30" />

        {/* Full controls — only visible when template is selected */}
        {hasTemplate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-5"
          >
            {/* Brand Kit */}
            <BrandKitToggle
              enabled={brandKitEnabled}
              onToggle={() => setBrandKitEnabled(v => !v)}
              onBrandKitLoaded={() => {}}
            />

            <div className="h-px bg-border/30" />

            {/* Outputs Selector */}
            <div className="space-y-2.5">
              <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Outputs</p>
              <div className="space-y-1">
                {OUTPUT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => toggleOutput(opt.id)}
                    className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <div className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                      enabledOutputs.has(opt.id)
                        ? "bg-gradient-to-b from-[#FF7A1A] to-[#E85C00] border-transparent"
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

            {/* Platform */}
            <div className="space-y-2.5">
              <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Platform</p>
              <div className="flex rounded-lg border border-white/[0.08] overflow-hidden">
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={cn(
                      "flex-1 px-3 py-1.5 text-[11px] font-medium transition-colors",
                      platform === p
                        ? "bg-gradient-to-b from-[#FF7A1A] to-[#E85C00] text-white"
                        : "text-muted-foreground/50 hover:text-foreground"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2.5">
              <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Duration</p>
              <div className="flex gap-2">
                {DURATIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors",
                      duration === d
                        ? "bg-white/[0.08] text-foreground"
                        : "text-muted-foreground/40 hover:text-muted-foreground"
                    )}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-border/30" />

            {/* Voiceover */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Voiceover</p>
                <button
                  onClick={() => setVoiceoverEnabled(v => !v)}
                  className={cn(
                    "h-5 w-9 rounded-full transition-colors relative",
                    voiceoverEnabled ? "bg-gradient-to-r from-[#FF7A1A] to-[#E85C00]" : "bg-white/[0.08]"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                    voiceoverEnabled ? "translate-x-[18px]" : "translate-x-0.5"
                  )} />
                </button>
              </div>
              {voiceoverEnabled && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03]">
                  <Mic className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-[11px] text-muted-foreground/60">Default voice</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
}
