import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Video, Play, Loader2, ArrowRight, ArrowLeft, CheckCircle2,
  Clapperboard, Film, Download, Copy, Hash, Music, Clock, Eye,
  ImageIcon, Sparkles, AlertCircle, X, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { SourceSelector, type SourceMode, type ProductContext } from "./SourceSelector";
import { ProductContextCard } from "./ProductContextCard";

// ── Types ──

interface VideoFrame {
  frame_number: number;
  duration_seconds: number;
  visual_description: string;
  text_overlay: string;
  voiceover_text: string;
  transition: string;
}

interface VideoScript {
  title: string;
  hook: string;
  cta: string;
  hashtags: string[];
  music_mood: string;
  total_duration: number;
  frames: VideoFrame[];
}

interface GeneratedFrame {
  frame_number: number;
  image_url: string;
}

type VideoStyle = "cinematic" | "ugc" | "tutorial" | "hype" | "minimal";

interface TemplateOption {
  id: VideoStyle;
  label: string;
  description: string;
  icon: React.ElementType;
}

const TEMPLATES: TemplateOption[] = [
  { id: "cinematic", label: "Cinematic", description: "Dramatic shots, smooth transitions, premium feel", icon: Film },
  { id: "ugc", label: "UGC", description: "Raw, authentic, phone-recorded style", icon: Video },
  { id: "tutorial", label: "Tutorial", description: "Step-by-step walkthrough with text overlays", icon: Eye },
  { id: "hype", label: "Hype", description: "Fast cuts, bold text, energetic music", icon: Play },
  { id: "minimal", label: "Minimal", description: "Clean, elegant, lots of white space", icon: Clapperboard },
];

const DURATIONS = [6, 10, 15, 30, 60];
const ASPECT_RATIOS = ["9:16", "16:9", "1:1", "4:5"];

const STEP_LABELS = [
  { label: "Product", icon: Package },
  { label: "Style", icon: Film },
  { label: "Script", icon: Clapperboard },
  { label: "Frames", icon: ImageIcon },
  { label: "Export", icon: Download },
];

// ── Component ──

interface PromoVideoBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Render inline in the canvas instead of a dialog */
  inline?: boolean;
}

export function PromoVideoBuilder({ open, onOpenChange, inline = false }: PromoVideoBuilderProps) {
  const { user } = useAuth();

  // Wizard step (1-5 now: 1=product, 2=config, 3=script, 4=frames, 5=export)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1
  const [sourceMode, setSourceMode] = useState<SourceMode>("blank");
  const [selectedProduct, setSelectedProduct] = useState<ProductContext | null>(null);
  const [manualDescription, setManualDescription] = useState("");

  // Step 2
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle>("cinematic");
  const [duration, setDuration] = useState(15);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [includeVoiceover, setIncludeVoiceover] = useState(true);

  // Step 3
  const [script, setScript] = useState<VideoScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFrame, setActiveFrame] = useState(0);

  // Step 4: Generated frame images
  const [generatedFrames, setGeneratedFrames] = useState<GeneratedFrame[]>([]);
  const [isGeneratingFrames, setIsGeneratingFrames] = useState(false);
  const [frameProgress, setFrameProgress] = useState(0);

  const resetWizard = useCallback(() => {
    setStep(1);
    setSourceMode("blank");
    setSelectedProduct(null);
    setManualDescription("");
    setSelectedStyle("cinematic");
    setDuration(15);
    setAspectRatio("9:16");
    setIncludeVoiceover(true);
    setScript(null);
    setIsGenerating(false);
    setActiveFrame(0);
    setGeneratedFrames([]);
    setIsGeneratingFrames(false);
    setFrameProgress(0);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) resetWizard();
    onOpenChange(open);
  };

  // Generate script (Step 2 → 3)
  const generateScript = useCallback(async () => {
    setIsGenerating(true);
    try {
      const productName = selectedProduct?.name || "My Product";
      const productDescription = selectedProduct?.description || selectedProduct?.excerpt || manualDescription || "A great digital product";
      const productTags = selectedProduct?.tags || [];
      const productPrice = selectedProduct?.price_cents
        ? `$${(selectedProduct.price_cents / 100).toFixed(2)}`
        : undefined;

      const { data, error } = await supabase.functions.invoke("generate-video-script", {
        body: {
          productName,
          productDescription,
          productTags,
          productPrice,
          duration,
          style: selectedStyle,
          includeVoiceover,
          aspectRatio,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setScript(data as VideoScript);
      setStep(3);
    } catch (err) {
      console.error("Script generation error:", err);
      toast.error("Failed to generate script. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedProduct, manualDescription, duration, selectedStyle, includeVoiceover, aspectRatio]);

  // Generate frame images (Step 3 → 4)
  const generateFrameImages = useCallback(async () => {
    if (!script) return;
    setIsGeneratingFrames(true);
    setFrameProgress(0);
    setGeneratedFrames([]);

    try {
      const { data, error } = await supabase.functions.invoke("generate-video-frames", {
        body: {
          frames: script.frames.map((f) => ({
            frame_number: f.frame_number,
            visual_description: f.visual_description,
            text_overlay: f.text_overlay,
          })),
          style: selectedStyle,
          aspectRatio,
          productName: selectedProduct?.name || "Product",
        },
      });

      if (error) throw error;
      if (data?.error) {
        if (data.error === "INSUFFICIENT_CREDITS") {
          toast.error(`Not enough credits. Need ${data.required}, have ${data.available}.`);
          return;
        }
        if (data.partial_frames?.length) {
          setGeneratedFrames(data.partial_frames);
          toast.error(`Partially generated: ${data.partial_frames.length}/${script.frames.length} frames`);
        }
        throw new Error(data.error);
      }

      setGeneratedFrames(data.frames || []);
      setStep(4);
      toast.success(`${data.frames?.length || 0} frame images generated!`);
    } catch (err) {
      console.error("Frame generation error:", err);
      toast.error("Failed to generate frame images.");
    } finally {
      setIsGeneratingFrames(false);
    }
  }, [script, selectedStyle, aspectRatio, selectedProduct]);

  // Copy script
  const copyScript = () => {
    if (!script) return;
    const text = script.frames
      .map((f) => `[Frame ${f.frame_number} - ${f.duration_seconds}s]\nVisual: ${f.visual_description}\nText: ${f.text_overlay}\nVO: ${f.voiceover_text}\nTransition: ${f.transition}`)
      .join("\n\n");
    const full = `${script.title}\n\nHook: ${script.hook}\nCTA: ${script.cta}\nMusic: ${script.music_mood}\nHashtags: ${script.hashtags.join(" ")}\n\n${text}`;
    navigator.clipboard.writeText(full);
    toast.success("Script copied!");
  };

  const canNavigateToStep = (targetStep: number): boolean => {
    if (targetStep <= step) return true;
    if (targetStep === 2) return sourceMode === "product" ? !!selectedProduct : !!manualDescription.trim();
    if (targetStep === 3) return !!script;
    if (targetStep === 4) return !!script && generatedFrames.length > 0;
    if (targetStep === 5) return !!script;
    return false;
  };

  // ── Step Nav Bar ──
  const StepNavBar = () => (
    <div className="flex items-center gap-1 px-1 py-3">
      {STEP_LABELS.map((s, i) => {
        const stepNum = i + 1;
        const Icon = s.icon;
        const isActive = step === stepNum;
        const isCompleted = step > stepNum;
        const isClickable = canNavigateToStep(stepNum);

        return (
          <div key={s.label} className="flex items-center flex-1">
            <button
              onClick={() => isClickable && setStep(stepNum as 1 | 2 | 3 | 4 | 5)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all w-full",
                isActive
                  ? "bg-[#FF7A1A]/10 text-[#FF7A1A] ring-1 ring-[#FF7A1A]/20"
                  : isCompleted
                    ? "bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                    : "text-muted-foreground/40",
                isClickable && !isActive && "cursor-pointer hover:text-foreground",
                !isClickable && "cursor-not-allowed"
              )}
            >
              <div className={cn(
                "flex items-center justify-center h-6 w-6 rounded-full shrink-0 text-[10px] font-bold transition-colors",
                isActive
                  ? "bg-[#FF7A1A] text-white"
                  : isCompleted
                    ? "bg-white/[0.1] text-foreground"
                    : "bg-white/[0.04] text-muted-foreground/40"
              )}>
                {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : stepNum}
              </div>
              <span className="text-xs font-medium whitespace-nowrap hidden sm:inline">{s.label}</span>
            </button>
            {i < STEP_LABELS.length - 1 && (
              <div className={cn(
                "h-px w-4 shrink-0 mx-0.5",
                step > stepNum ? "bg-white/[0.15]" : "bg-white/[0.04]"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Wizard Content ──
  const WizardContent = () => (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto px-6 py-6">
        {/* ── Step 1: Select Product ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">Choose your product</h3>
              <p className="text-sm text-muted-foreground">Select a product or describe it manually.</p>
            </div>
            <SourceSelector
              mode={sourceMode}
              onModeChange={setSourceMode}
              selectedProduct={selectedProduct}
              onProductSelect={setSelectedProduct}
            />
            {sourceMode === "product" && selectedProduct && (
              <ProductContextCard
                products={[selectedProduct]}
                onRemove={() => { setSelectedProduct(null); setSourceMode("blank"); }}
              />
            )}
            {sourceMode === "blank" && (
              <Textarea
                placeholder="Describe your product… (name, what it includes, who it's for)"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                className="min-h-[100px] text-sm"
              />
            )}
            <Button
              className="w-full"
              onClick={() => setStep(2)}
              disabled={sourceMode === "blank" && !manualDescription.trim()}
            >
              Next: Choose Template <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Template & Config ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">Choose style & settings</h3>
              <p className="text-sm text-muted-foreground">Pick a visual style and configure your video.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedStyle(tmpl.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all",
                      selectedStyle === tmpl.id
                        ? "border-[#FF7A1A]/50 bg-[#FF7A1A]/5 ring-1 ring-[#FF7A1A]/20"
                        : "border-white/[0.06] hover:border-white/[0.15] bg-white/[0.02]"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", selectedStyle === tmpl.id ? "text-[#FF7A1A]" : "text-muted-foreground")} />
                    <span className="text-xs font-medium text-foreground">{tmpl.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{tmpl.description}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium text-foreground">Duration</span>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      duration === d
                        ? "bg-[#FF7A1A]/10 text-[#FF7A1A] ring-1 ring-[#FF7A1A]/20"
                        : "bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]"
                    )}
                  >
                    <Clock className="h-3 w-3" /> {d}s
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium text-foreground">Aspect Ratio</span>
              <div className="flex flex-wrap gap-2">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar}
                    onClick={() => setAspectRatio(ar)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      aspectRatio === ar
                        ? "bg-[#FF7A1A]/10 text-[#FF7A1A] ring-1 ring-[#FF7A1A]/20"
                        : "bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]"
                    )}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <span className="text-xs font-medium text-foreground">Include AI Voiceover</span>
              <button
                onClick={() => setIncludeVoiceover(!includeVoiceover)}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-medium transition-colors",
                  includeVoiceover ? "bg-[#FF7A1A] text-white" : "bg-white/[0.06] text-muted-foreground"
                )}
              >
                {includeVoiceover ? "Yes" : "No"}
              </button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button onClick={generateScript} disabled={isGenerating} className="flex-1 gap-2">
                {isGenerating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                ) : (
                  <>Generate Script <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Storyboard Preview ── */}
        {step === 3 && script && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">{script.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {script.frames.length} frames · {script.total_duration}s · {selectedStyle}
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={copyScript}>
                <Copy className="h-3 w-3" /> Copy
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-[#FF7A1A]/5 border border-[#FF7A1A]/20">
              <span className="text-[10px] font-semibold text-[#FF7A1A] uppercase tracking-wider">Hook</span>
              <p className="text-sm text-foreground mt-1">{script.hook}</p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Storyboard</span>
              {script.frames.map((frame, i) => (
                <button
                  key={frame.frame_number}
                  onClick={() => setActiveFrame(i)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all",
                    activeFrame === i ? "border-[#FF7A1A]/30 bg-[#FF7A1A]/5 ring-1 ring-[#FF7A1A]/20" : "border-white/[0.06] hover:border-white/[0.12]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold">{frame.frame_number}</span>
                      <span className="text-[10px] text-muted-foreground">{frame.duration_seconds}s</span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs text-foreground leading-relaxed">{frame.visual_description}</p>
                      {frame.text_overlay && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">Text: {frame.text_overlay}</Badge>
                      )}
                      {frame.voiceover_text && (
                        <p className="text-[11px] text-muted-foreground italic">🎙 "{frame.voiceover_text}"</p>
                      )}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">→ {frame.transition}</Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Call to Action</span>
              <p className="text-sm text-foreground mt-1">{script.cta}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Music className="h-3 w-3" /> {script.music_mood}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Hash className="h-3 w-3" /> {script.hashtags.join(" ")}
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Generating frame images costs <span className="font-semibold text-amber-500">{script.frames.length * 10} credits</span> ({script.frames.length} frames × 10 credits each).
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" /> Reconfigure
              </Button>
              <Button onClick={generateFrameImages} disabled={isGeneratingFrames} className="flex-1 gap-2">
                {isGeneratingFrames ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating Frames…</>
                ) : (
                  <><ImageIcon className="h-4 w-4" /> Generate Frame Images</>
                )}
              </Button>
            </div>
            <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setStep(5)}>
              Skip to Export (script only)
            </Button>
          </div>
        )}

        {/* ── Step 4: Generated Frame Images ── */}
        {step === 4 && script && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Generated Frames</h3>
              <p className="text-sm text-muted-foreground">
                {generatedFrames.length} of {script.frames.length} frames rendered
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {script.frames.map((frame) => {
                const generated = generatedFrames.find((g) => g.frame_number === frame.frame_number);
                return (
                  <div key={frame.frame_number} className="rounded-lg border border-white/[0.06] overflow-hidden">
                    {generated ? (
                      <div className="relative aspect-video bg-muted">
                        <img
                          src={generated.image_url}
                          alt={`Frame ${frame.frame_number}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1">
                          <Badge className="text-[10px] bg-black/60 text-white border-0">
                            F{frame.frame_number} · {frame.duration_seconds}s
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-white/[0.02] flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Not generated</span>
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{frame.visual_description}</p>
                      {frame.text_overlay && (
                        <p className="text-[10px] font-medium text-foreground mt-1">"{frame.text_overlay}"</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Script
              </Button>
              <Button onClick={() => setStep(5)} className="flex-1 gap-2">
                Export Assets <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 5: Export ── */}
        {step === 5 && script && (
          <div className="space-y-4 text-center py-8">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-[#FF7A1A]/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-[#FF7A1A]" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {generatedFrames.length > 0 ? "Video Assets Ready!" : "Script Ready!"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {generatedFrames.length > 0
                  ? `${generatedFrames.length} frame images + storyboard for "${script.title}"`
                  : `${script.frames.length}-frame storyboard for "${script.title}"`}
              </p>
            </div>

            <div className="space-y-2 max-w-sm mx-auto">
              <Button className="w-full gap-2" onClick={copyScript}>
                <Copy className="h-4 w-4" /> Copy Full Script
              </Button>

              {generatedFrames.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    generatedFrames.forEach((f) => {
                      const a = document.createElement("a");
                      a.href = f.image_url;
                      a.download = `${script.title.replace(/\s+/g, "-").toLowerCase()}-frame-${f.frame_number}.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    });
                    toast.success(`${generatedFrames.length} frame images downloading!`);
                  }}
                >
                  <Download className="h-4 w-4" /> Download All Frames
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(script, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${script.title.replace(/\s+/g, "-").toLowerCase()}-script.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success("Script downloaded!");
                }}
              >
                <Download className="h-4 w-4" /> Download Script (JSON)
              </Button>

              <Button variant="outline" className="w-full gap-2" onClick={() => { setStep(2); setScript(null); setGeneratedFrames([]); }}>
                <Clapperboard className="h-4 w-4" /> Generate Another
              </Button>
            </div>

            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {generatedFrames.length > 0
                ? "Import these frames into your video editor (CapCut, Premiere, DaVinci) and assemble with the script timing."
                : "Use this script in your favorite video editor to create the final video."}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ── Inline mode: render directly in canvas ──
  if (inline) {
    if (!open) return null;
    return (
      <div className="flex flex-col h-full">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-[#FF7A1A]" />
            <span className="text-sm font-semibold text-foreground">Promo Video Builder</span>
          </div>
          <button
            onClick={() => handleOpenChange(false)}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Step nav bar */}
        <div className="px-6 border-b border-white/[0.06] bg-white/[0.01]">
          <StepNavBar />
        </div>

        {/* Wizard content */}
        <WizardContent />
      </div>
    );
  }

  // ── Dialog mode (legacy fallback) ──
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-[#FF7A1A]" />
            Promo Video Builder
          </DialogTitle>
        </DialogHeader>

        <div className="border-b border-white/[0.06] -mx-6 px-6">
          <StepNavBar />
        </div>

        <ScrollArea className="flex-1 pr-2">
          <WizardContent />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
