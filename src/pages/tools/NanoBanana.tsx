import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2, Download, Wand2, ImageIcon, Upload, Sparkles,
  SlidersHorizontal, Minus, Plus, CopyPlus, ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { uiSurfaces } from "@/components/tools/uiSurfaces";
import nanoBananaImage from "@/assets/logos/nano-banana.png";

type Mode = "create" | "variations";

const MODELS = ["Nano Banana 2", "Juggernaut Flux Pro", "SDXL Turbo", "Photo Real v2"];
const OUTPUTS = ["1:1 | 1024", "4:3 | 1K", "16:9 | 1K", "9:16 | 1K"];

export default function NanoBanana() {
  const [mode, setMode] = useState<Mode>("create");
  const [model, setModel] = useState("Nano Banana 2");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("4:3 | 1K");
  const [count, setCount] = useState(2);
  const [creativity, setCreativity] = useState(70);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { deductCredits, credits: creditBalance } = useSubscription();

  const canvasTitle = useMemo(
    () => (mode === "create" ? "AI Image Creation" : "Image Variations"),
    [mode]
  );

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (creditBalance < 1) { toast.error("Insufficient credits. Please top up."); return; }
    setIsGenerating(true);
    setGeneratedImage(null);
    try {
      const deductResult = await deductCredits("vibecoder_gen");
      if (!deductResult.success) { toast.error("Failed to deduct credit"); return; }
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: prompt.trim() },
      });
      if (error) throw error;
      if (data?.image_url) {
        setGeneratedImage(data.image_url);
        toast.success("Image generated successfully!");
      } else throw new Error("No image returned");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nano-banana-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch { toast.error("Failed to download image"); }
  };

  return (
    <div className="h-full overflow-hidden px-4 py-4">
      <div className="grid h-full min-h-0 grid-cols-[390px_minmax(0,1fr)] gap-4">
        {/* ── LEFT RAIL ── */}
        <aside className={`min-h-0 overflow-hidden ${uiSurfaces.toolPanel}`}>
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="px-6 pb-4 pt-5">
              <div className="mb-3 flex items-center gap-3">
                <img src={nanoBananaImage} alt="Nano Banana" className="h-8 w-8 rounded-lg object-cover" />
                <h1 className="text-xl font-semibold text-slate-900">
                  {mode === "create" ? "Create Image" : "Image Variations"}
                </h1>
              </div>
            </div>

            {/* Scrollable controls */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-3">
                {/* Mode tabs */}
                <ModeTabs mode={mode} setMode={setMode} />

                {/* Model select */}
                <SelectCard label="Model" value={model} options={MODELS} onChange={setModel} />

                {/* Upload zone (variations mode) */}
                {mode === "variations" && (
                  <SectionCard title="Start with an image" subtitle="We'll create new versions from it.">
                    <UploadDropzone title="Upload or choose an image" subtitle="Click or drag to upload · JPEG/PNG/WEBP" />
                  </SectionCard>
                )}

                {/* Prompt */}
                <SectionCard
                  title={mode === "create" ? "Describe your image" : "Describe your variation"}
                  rightIcon={<CopyPlus className="h-4 w-4 text-slate-500" />}
                >
                  {mode === "create" && <ReferenceBox />}
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      mode === "create"
                        ? 'What do you want to see? Example: "A cat on a table, warm morning light."'
                        : 'Example: "Make it sunset, cinematic lighting."'
                    }
                    className={`mt-3 min-h-[150px] w-full resize-none px-4 py-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 ${uiSurfaces.input}`}
                    disabled={isGenerating}
                  />
                  <div className="mt-1.5 text-right text-xs text-slate-400">{prompt.length}/500</div>

                  {mode === "variations" && (
                    <button className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                      <Sparkles className="h-4 w-4" /> Prompt from Image
                    </button>
                  )}
                </SectionCard>

                {/* Creativity slider (variations) */}
                {mode === "variations" && (
                  <SectionCard title="Creativity level" rightIcon={<span className="text-xs text-slate-500">{creativity}%</span>}>
                    <input type="range" min={0} max={100} value={creativity} onChange={(e) => setCreativity(Number(e.target.value))} className="mt-3 w-full accent-primary" />
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Closer to original</span><span>More different</span>
                    </div>
                  </SectionCard>
                )}

                {/* Output select */}
                <SelectCard label="Output" value={output} options={OUTPUTS} onChange={setOutput} icon={<SlidersHorizontal className="h-4 w-4 text-slate-500" />} />

                {/* Count + Generate */}
                <div className="grid grid-cols-[122px_minmax(0,1fr)] gap-3">
                  <CountStepper count={count} setCount={setCount} />
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-amber-500 to-orange-500 px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(245,158,11,0.24)] transition hover:translate-y-[-1px] hover:shadow-[0_14px_28px_rgba(245,158,11,0.30)] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Wand2 className="h-4 w-4" /> Generate (1 Credit)</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#cde0eb] bg-[#dfedf5] px-4 py-3">
              <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Powered by Gemini 2.5 Flash Image
              </p>
            </div>
          </div>
        </aside>

        {/* ── RIGHT CANVAS ── */}
        <main className="min-w-0 rounded-[28px] border border-[#d6eaf2] bg-gradient-to-br from-[#e8f6fb] to-[#dff1f7] shadow-[0_12px_40px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="flex h-full flex-col bg-gradient-to-br from-[#f4fbff] to-[#eaf6fb]">
            {/* Canvas header */}
            <div className="border-b border-[#d8e8f0] px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button className="rounded-full border border-[#d7e7ef] bg-white/80 px-4 py-2 text-sm font-medium text-slate-700">Creations</button>
                  <button className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">Collections</button>
                  <button className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">Templates</button>
                </div>
              </div>
            </div>

            {/* Canvas content */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="px-6 py-6">
                {/* Generated result */}
                {generatedImage ? (
                  <div className="space-y-4">
                    <div className={`overflow-hidden p-1 ${uiSurfaces.section}`}>
                      <img src={generatedImage} alt="Generated" className="w-full h-auto rounded-[16px]" />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleDownload} variant="outline" className="gap-2">
                        <Download className="w-4 h-4" /> Download Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Hero card */}
                    <div className={`p-6 ${uiSurfaces.toolPanel}`}>
                      <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
                        Free {canvasTitle}
                      </h2>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {["Nano Banana 2", "Gemini Flash", "Photo Real", "SDXL Turbo"].map((tag) => (
                          <span key={tag} className={`px-3 py-1 text-xs font-medium text-slate-700 ${uiSurfaces.chip}`}>{tag}</span>
                        ))}
                      </div>
                      <p className="mt-4 max-w-3xl text-lg text-slate-600">
                        {mode === "create"
                          ? "Generate stunning images from prompts using AI. Describe what you want and watch it come to life."
                          : "Create alternate versions from an uploaded image with different styling, composition, and creativity levels."}
                      </p>
                    </div>

                    {/* Preview cards */}
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      <CanvasPreviewCard />
                      <CanvasPreviewCard featured />
                      <CanvasPreviewCard />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function ModeTabs({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className={`grid grid-cols-2 gap-3 p-2 ${uiSurfaces.section}`}>
      {(["create", "variations"] as const).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`rounded-[16px] px-4 py-4 text-center text-sm font-semibold transition ${
            mode === m
              ? "bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-[0_10px_24px_rgba(245,158,11,0.25)]"
              : "bg-[#eef6fb] text-slate-700 hover:bg-[#e3eef6]"
          }`}
        >
          {m === "create" ? "Create Image" : "Image Variations"}
        </button>
      ))}
    </div>
  );
}

function SelectCard({ label, value, options, onChange, icon }: { label: string; value: string; options: string[]; onChange: (v: string) => void; icon?: React.ReactNode }) {
  return (
    <div className={`p-4 ${uiSurfaces.section}`}>
      <div className="mb-2 text-sm text-slate-500">{label}</div>
      <div className={`flex items-center justify-between gap-3 px-4 py-4 ${uiSurfaces.input}`}>
        <div className="flex items-center gap-3">
          {icon ?? <Wand2 className="h-4 w-4 text-slate-500" />}
          <span className="font-semibold text-slate-900">{value}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children, rightIcon }: { title: string; subtitle?: string; children: React.ReactNode; rightIcon?: React.ReactNode }) {
  return (
    <div className={`p-4 ${uiSurfaces.section}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {rightIcon}
      </div>
      {children}
    </div>
  );
}

function ReferenceBox() {
  return (
    <div className="mt-3 rounded-[18px] border border-amber-300/60 bg-gradient-to-b from-amber-50/40 to-orange-50/30 p-[1px] shadow-[0_0_0_1px_rgba(245,158,11,0.15)]">
      <div className={`rounded-[17px] px-4 py-3 ${uiSurfaces.input.replace('shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]', '')}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[uiSurfaces.chip, uiSurfaces.chip, uiSurfaces.chip].map((_, i) => (
                <div key={i} className="h-9 w-9 rounded-lg bg-[#dcecf7] border border-[#c6ddea]" />
              ))}
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">Add visual references</div>
              <div className="text-xs text-slate-500">JPEG/PNG/WEBP/GIF, 20 MB max</div>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold text-slate-700 ${uiSurfaces.chip}`}>0/14</span>
        </div>
      </div>
    </div>
  );
}

function UploadDropzone({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className={`mt-4 flex flex-col items-center justify-center text-center px-6 py-10 ${uiSurfaces.dropzone}`}>
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${uiSurfaces.chip}`}>
        <Upload className="h-6 w-6 text-slate-600" />
      </div>
      <div className="mt-4 text-lg font-semibold text-slate-900">{title}</div>
      <div className="mt-1 max-w-sm text-sm text-slate-500">{subtitle}</div>
    </div>
  );
}

function CountStepper({ count, setCount }: { count: number; setCount: (n: number) => void }) {
  return (
    <div className={`flex h-12 items-center justify-between px-4 ${uiSurfaces.input}`}>
      <button onClick={() => setCount(Math.max(1, count - 1))}><Minus className="h-4 w-4 text-slate-700" /></button>
      <span className="text-sm font-semibold text-slate-900">{count}/4</span>
      <button onClick={() => setCount(Math.min(4, count + 1))}><Plus className="h-4 w-4 text-slate-700" /></button>
    </div>
  );
}

function CanvasPreviewCard({ featured = false }: { featured?: boolean }) {
  return (
    <div className={`overflow-hidden h-[320px] ${uiSurfaces.sectionAlt} ${!featured ? "opacity-70" : ""}`}>
      <div className={`h-full w-full ${
        featured
          ? "bg-gradient-to-b from-amber-200/60 via-orange-200/40 to-[#eef7fb]"
          : "bg-gradient-to-b from-[#dcecf7] via-[#cfe6f1] to-[#eef7fb]"
      } flex items-center justify-center`}>
        <ImageIcon className={`h-12 w-12 ${featured ? "text-amber-400/60" : "text-slate-300"}`} />
      </div>
    </div>
  );
}
