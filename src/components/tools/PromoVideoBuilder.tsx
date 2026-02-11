import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Video, Play, Loader2, ArrowRight, ArrowLeft, CheckCircle2,
  Clapperboard, Film, Download, Copy, Hash, Music, Clock, Eye
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

// ── Component ──

interface PromoVideoBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromoVideoBuilder({ open, onOpenChange }: PromoVideoBuilderProps) {
  const { user } = useAuth();
  
  // Wizard step
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Product selection
  const [sourceMode, setSourceMode] = useState<SourceMode>("blank");
  const [selectedProduct, setSelectedProduct] = useState<ProductContext | null>(null);
  const [manualDescription, setManualDescription] = useState("");

  // Step 2: Template config
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle>("cinematic");
  const [duration, setDuration] = useState(15);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [includeVoiceover, setIncludeVoiceover] = useState(true);

  // Step 3: Generated script
  const [script, setScript] = useState<VideoScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFrame, setActiveFrame] = useState(0);

  // Reset on open
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
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) resetWizard();
    onOpenChange(open);
  };

  // Generate script
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

  // Copy script to clipboard
  const copyScript = () => {
    if (!script) return;
    const text = script.frames
      .map((f) => `[Frame ${f.frame_number} - ${f.duration_seconds}s]\nVisual: ${f.visual_description}\nText: ${f.text_overlay}\nVO: ${f.voiceover_text}\nTransition: ${f.transition}`)
      .join("\n\n");
    const full = `${script.title}\n\nHook: ${script.hook}\nCTA: ${script.cta}\nMusic: ${script.music_mood}\nHashtags: ${script.hashtags.join(" ")}\n\n${text}`;
    navigator.clipboard.writeText(full);
    toast.success("Script copied to clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Promo Video Builder
            <Badge variant="outline" className="text-[10px] ml-2">Step {step}/4</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Step progress */}
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <ScrollArea className="flex-1 pr-2">
          {/* ── Step 1: Select Product ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Choose your product</h3>
                <p className="text-xs text-muted-foreground">Select a product to generate a promo video script, or describe your product manually.</p>
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
                  className="min-h-[80px] text-sm"
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
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Choose style & settings</h3>
                <p className="text-xs text-muted-foreground">Pick a visual style and configure your video.</p>
              </div>

              {/* Style selector */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TEMPLATES.map((tmpl) => {
                  const Icon = tmpl.icon;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedStyle(tmpl.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all",
                        selectedStyle === tmpl.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", selectedStyle === tmpl.id ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-xs font-medium text-foreground">{tmpl.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{tmpl.description}</span>
                    </button>
                  );
                })}
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-foreground">Duration</span>
                <div className="flex flex-wrap gap-1.5">
                  {DURATIONS.map((d) => (
                    <Badge
                      key={d}
                      variant={duration === d ? "default" : "outline"}
                      className="cursor-pointer text-[11px] px-2.5 py-1"
                      onClick={() => setDuration(d)}
                    >
                      <Clock className="h-3 w-3 mr-1" /> {d}s
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Aspect ratio */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-foreground">Aspect Ratio</span>
                <div className="flex flex-wrap gap-1.5">
                  {ASPECT_RATIOS.map((ar) => (
                    <Badge
                      key={ar}
                      variant={aspectRatio === ar ? "default" : "outline"}
                      className="cursor-pointer text-[11px] px-2.5 py-1"
                      onClick={() => setAspectRatio(ar)}
                    >
                      {ar}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Voiceover toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <span className="text-xs font-medium text-foreground">Include AI Voiceover</span>
                <button
                  onClick={() => setIncludeVoiceover(!includeVoiceover)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-medium transition-colors",
                    includeVoiceover ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
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
                  <h3 className="text-sm font-semibold text-foreground">{script.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {script.frames.length} frames • {script.total_duration}s • {selectedStyle}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={copyScript}>
                  <Copy className="h-3 w-3" /> Copy Script
                </Button>
              </div>

              {/* Hook */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Hook</span>
                <p className="text-sm text-foreground mt-1">{script.hook}</p>
              </div>

              {/* Frames timeline */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Storyboard</span>
                {script.frames.map((frame, i) => (
                  <button
                    key={frame.frame_number}
                    onClick={() => setActiveFrame(i)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      activeFrame === i
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          {frame.frame_number}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{frame.duration_seconds}s</span>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs text-foreground leading-relaxed">{frame.visual_description}</p>
                        {frame.text_overlay && (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Text: {frame.text_overlay}
                            </Badge>
                          </div>
                        )}
                        {frame.voiceover_text && (
                          <p className="text-[11px] text-muted-foreground italic">
                            🎙 "{frame.voiceover_text}"
                          </p>
                        )}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                          → {frame.transition}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* CTA */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Call to Action</span>
                <p className="text-sm text-foreground mt-1">{script.cta}</p>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Music className="h-3 w-3" /> {script.music_mood}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Hash className="h-3 w-3" /> {script.hashtags.join(" ")}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Reconfigure
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1 gap-2">
                  Export Assets <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Export ── */}
          {step === 4 && script && (
            <div className="space-y-4 text-center py-4">
              <div className="flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Script Ready!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your {script.frames.length}-frame storyboard for "{script.title}" is ready.
                </p>
              </div>

              <div className="space-y-2">
                <Button className="w-full gap-2" onClick={copyScript}>
                  <Copy className="h-4 w-4" /> Copy Full Script
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    // Download as JSON
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
                <Button variant="outline" className="w-full gap-2" onClick={() => { setStep(2); setScript(null); }}>
                  <Clapperboard className="h-4 w-4" /> Generate Another
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Use this script in your favorite video editor (CapCut, Premiere, DaVinci) to create the final video.
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
