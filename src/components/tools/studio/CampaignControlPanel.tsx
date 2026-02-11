import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandKitToggle } from "@/components/tools/BrandKitToggle";
import { CreditEstimator } from "@/components/tools/CreditEstimator";

interface CampaignControlPanelProps {
  creditBalance: number;
  isLoadingCredits?: boolean;
  onGenerate: () => void;
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

export function CampaignControlPanel({ creditBalance, isLoadingCredits, onGenerate }: CampaignControlPanelProps) {
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

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="h-full border-l border-white/[0.06] bg-card/60 backdrop-blur-xl overflow-y-auto custom-scrollbar"
    >
      <div className="p-5 space-y-5">
        {/* Panel title */}
        <div>
          <p className="text-sm font-semibold text-foreground">Campaign Controls</p>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">Configure your marketing pack</p>
        </div>

        <div className="h-px bg-border/30" />

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

        <div className="h-px bg-border/30" />

        {/* Credits Estimate */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Credits Estimate</p>
          <div className="rounded-lg bg-white/[0.02] p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground/60">Estimated cost</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">{estimatedCredits} credits</span>
            </div>
            <p className="text-[10px] text-muted-foreground/30">Based on {enabledOutputs.size} selected outputs</p>
          </div>
        </div>

        {/* Generate CTA */}
        <button
          onClick={onGenerate}
          className="w-full py-3 text-sm font-semibold text-white rounded-[10px] shadow-sm transition-all hover:shadow-md"
          style={{ background: "linear-gradient(180deg, #FF7A1A 0%, #E85C00 100%)" }}
        >
          Generate Pack
        </button>
      </div>
    </motion.aside>
  );
}
