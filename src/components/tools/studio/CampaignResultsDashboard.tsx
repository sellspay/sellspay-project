import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ChevronDown, ChevronUp, Video, GalleryHorizontal, MessageSquare, Hash, FileText, Mail, ArrowLeft, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CampaignPackResult {
  hooks?: string[];
  captions?: { text: string; hashtags: string[] }[];
  carousel?: { slide_number: number; headline: string; body: string; visual: string }[];
  listing_rewrite?: { headline: string; description: string; benefits: string[] };
  email_draft?: { subject: string; preview_text: string; body: string };
  promo_video?: {
    hook: { text: string; visual: string; duration_seconds: number };
    body: { text: string; visual: string; duration_seconds: number }[];
    cta: { text: string; visual: string; duration_seconds: number };
    total_duration_seconds: number;
  };
  raw_text?: string;
}

interface CampaignResultsDashboardProps {
  result: CampaignPackResult;
  creditsUsed: number;
  onBack: () => void;
}

const OUTPUT_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  hooks: { label: "Hooks", icon: MessageSquare, color: "text-violet-400" },
  captions: { label: "Captions & Hashtags", icon: Hash, color: "text-blue-400" },
  carousel: { label: "Carousel Plan", icon: GalleryHorizontal, color: "text-emerald-400" },
  listing_rewrite: { label: "Listing Rewrite", icon: FileText, color: "text-amber-400" },
  email_draft: { label: "Email Draft", icon: Mail, color: "text-rose-400" },
  promo_video: { label: "Promo Video Script", icon: Video, color: "text-orange-400" },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground/40" />}
    </button>
  );
}

function ResultCard({ id, children }: { id: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const meta = OUTPUT_META[id];
  if (!meta) return null;
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl ring-1 ring-white/[0.06] bg-white/[0.02] overflow-hidden"
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <Icon className={cn("h-4 w-4", meta.color)} />
        <span className="text-sm font-semibold text-foreground flex-1 text-left">{meta.label}</span>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground/40" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/40" />}
      </button>
      {expanded && <div className="px-5 pb-5 space-y-3">{children}</div>}
    </motion.div>
  );
}

export function CampaignResultsDashboard({ result, creditsUsed, onBack }: CampaignResultsDashboardProps) {
  const downloadAll = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "campaign-pack.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Campaign pack downloaded");
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Campaign Pack</h2>
            <p className="text-xs text-muted-foreground/50 mt-0.5">{creditsUsed} credits used</p>
          </div>
        </div>
        <button
          onClick={downloadAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-xs font-medium text-foreground transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export JSON
        </button>
      </div>

      {/* Raw text fallback */}
      {result.raw_text && !result.hooks && !result.captions && (
        <div className="rounded-xl ring-1 ring-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-xs text-muted-foreground/60 whitespace-pre-wrap">{result.raw_text}</p>
        </div>
      )}

      {/* Hooks */}
      {result.hooks && (
        <ResultCard id="hooks">
          <div className="space-y-2">
            {result.hooks.map((hook, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.02]">
                <span className="text-[10px] text-muted-foreground/30 font-mono mt-0.5">{i + 1}</span>
                <p className="text-sm text-foreground/80 flex-1">{hook}</p>
                <CopyButton text={hook} />
              </div>
            ))}
          </div>
        </ResultCard>
      )}

      {/* Captions */}
      {result.captions && (
        <ResultCard id="captions">
          <div className="space-y-3">
            {result.captions.map((cap, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/[0.02] space-y-2">
                <div className="flex items-start gap-2">
                  <p className="text-sm text-foreground/80 flex-1">{cap.text}</p>
                  <CopyButton text={`${cap.text}\n\n${cap.hashtags.join(" ")}`} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cap.hashtags.map((tag, j) => (
                    <span key={j} className="text-[10px] text-blue-400/60 bg-blue-400/5 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ResultCard>
      )}

      {/* Carousel */}
      {result.carousel && (
        <ResultCard id="carousel">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.carousel.map((slide, i) => (
              <div key={i} className="p-4 rounded-lg bg-white/[0.02] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Slide {slide.slide_number || i + 1}</span>
                  <CopyButton text={`${slide.headline}\n${slide.body}`} />
                </div>
                <p className="text-xs font-semibold text-foreground/80">{slide.headline}</p>
                <p className="text-[11px] text-foreground/60 leading-snug">{slide.body}</p>
                <p className="text-[10px] text-muted-foreground/30 italic">Visual: {slide.visual}</p>
              </div>
            ))}
          </div>
        </ResultCard>
      )}

      {/* Listing Rewrite */}
      {result.listing_rewrite && (
        <ResultCard id="listing_rewrite">
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-white/[0.02]">
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Headline</span>
                <CopyButton text={result.listing_rewrite.headline} />
              </div>
              <p className="text-sm font-semibold text-foreground/90">{result.listing_rewrite.headline}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02]">
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Description</span>
                <CopyButton text={result.listing_rewrite.description} />
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed">{result.listing_rewrite.description}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02]">
              <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Benefits</span>
              <ul className="mt-2 space-y-1">
                {result.listing_rewrite.benefits.map((b, i) => (
                  <li key={i} className="text-xs text-foreground/70 flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ResultCard>
      )}

      {/* Email Draft */}
      {result.email_draft && (
        <ResultCard id="email_draft">
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-white/[0.02]">
              <div className="flex items-start justify-between mb-1">
                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Subject</span>
                <CopyButton text={result.email_draft.subject} />
              </div>
              <p className="text-sm font-semibold text-foreground/90">{result.email_draft.subject}</p>
              <p className="text-[11px] text-muted-foreground/50 mt-1">{result.email_draft.preview_text}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02]">
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Body</span>
                <CopyButton text={result.email_draft.body} />
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">{result.email_draft.body}</p>
            </div>
          </div>
        </ResultCard>
      )}

      {/* Promo Video Script */}
      {result.promo_video && (
        <ResultCard id="promo_video">
          <div className="space-y-3">
            {/* Hook */}
            <div className="p-3 rounded-lg bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full font-medium">HOOK</span>
                <span className="text-[10px] text-muted-foreground/30">{result.promo_video.hook.duration_seconds}s</span>
              </div>
              <p className="text-sm text-foreground/80">{result.promo_video.hook.text}</p>
              <p className="text-[10px] text-muted-foreground/30 mt-1 italic">Visual: {result.promo_video.hook.visual}</p>
            </div>

            {/* Body sections */}
            {result.promo_video.body.map((section, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] bg-white/[0.06] text-foreground/60 px-2 py-0.5 rounded-full font-medium">SCENE {i + 1}</span>
                  <span className="text-[10px] text-muted-foreground/30">{section.duration_seconds}s</span>
                </div>
                <p className="text-sm text-foreground/80">{section.text}</p>
                <p className="text-[10px] text-muted-foreground/30 mt-1 italic">Visual: {section.visual}</p>
              </div>
            ))}

            {/* CTA */}
            <div className="p-3 rounded-lg bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium">CTA</span>
                <span className="text-[10px] text-muted-foreground/30">{result.promo_video.cta.duration_seconds}s</span>
              </div>
              <p className="text-sm text-foreground/80">{result.promo_video.cta.text}</p>
              <p className="text-[10px] text-muted-foreground/30 mt-1 italic">Visual: {result.promo_video.cta.visual}</p>
            </div>

            <div className="text-[10px] text-muted-foreground/30 text-right">
              Total: {result.promo_video.total_duration_seconds}s
            </div>

            <CopyButton text={[
              `HOOK: ${result.promo_video.hook.text}`,
              ...result.promo_video.body.map((s, i) => `SCENE ${i + 1}: ${s.text}`),
              `CTA: ${result.promo_video.cta.text}`,
            ].join("\n\n")} />
          </div>
        </ResultCard>
      )}
    </div>
  );
}
