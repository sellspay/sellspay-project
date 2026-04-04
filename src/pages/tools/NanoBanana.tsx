import { useMemo, useState } from "react";
import {
  Loader2,
  Download,
  Wand2,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Minus,
  Plus,
  CopyPlus,
  ChevronDown,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { uiSurfaces } from "@/components/tools/uiSurfaces";
import {
  IMAGE_MODELS,
  MODEL_CATEGORIES,
  getModelsByCategory,
  getModelById,
  type ModelCategory,
} from "@/models/imageModels";

type Mode = "create" | "variations";

const OUTPUT_OPTIONS = [
  { value: "1:1-1024", label: "1:1 | 1K", hint: "Square" },
  { value: "4:3-1k", label: "4:3 | 1K", hint: "Landscape" },
  { value: "16:9-1k", label: "16:9 | 1K", hint: "Wide" },
  { value: "9:16-1k", label: "9:16 | 1K", hint: "Vertical" },
];

export default function NanoBanana() {
  const [mode, setMode] = useState<Mode>("create");
  const [model, setModel] = useState("nano-banana-2");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("4:3-1k");
  const [count, setCount] = useState(1);
  const [creativity, setCreativity] = useState(70);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const { deductCredits, credits: creditBalance } = useSubscription();

  const currentModel = useMemo(() => getModelById(model) ?? IMAGE_MODELS[0], [model]);
  const grouped = useMemo(() => getModelsByCategory(), []);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (creditBalance < (currentModel.creditCost || 1)) { toast.error("Insufficient credits."); return; }
    setIsGenerating(true);
    setGeneratedImage(null);
    try {
      const deductResult = await deductCredits("vibecoder_gen");
      if (!deductResult.success) { toast.error("Failed to deduct credit"); return; }
      const { data, error } = await supabase.functions.invoke("generate-image", { body: { prompt: prompt.trim(), model } });
      if (error) throw error;
      if (data?.image_url) { setGeneratedImage(data.image_url); toast.success(`${currentModel.name} finished generating.`); }
      else throw new Error("No image returned");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate image");
    } finally { setIsGenerating(false); }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `image-generator-${Date.now()}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch { toast.error("Failed to download image"); }
  };

  return (
    <div className="h-full overflow-hidden bg-[#2e2e2e] px-4 py-4">
      <div className="grid h-full min-h-0 grid-cols-[390px_minmax(0,1fr)] gap-4">
        {/* ───── LEFT PANEL ───── */}
        <aside className="min-h-0 overflow-hidden rounded-[24px] bg-[#333333] border border-[#383838] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-[#383838] px-5 pb-4 pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-[#f5f5f5]">Image Generator</h1>
                  <p className="text-sm text-[#a3a3a3]">
                    {mode === "create" ? "Create Image" : "Image Variations"}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
              <div className="space-y-3">
                <ModeTabs mode={mode} setMode={setMode} />

                {/* Model selector */}
                <div className={`p-4 ${uiSurfaces.section}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-[#a3a3a3]">Model</span>
                    {currentModel.tag && <TagBadge tag={currentModel.tag} />}
                  </div>

                  <button
                    onClick={() => setModelSelectorOpen(!modelSelectorOpen)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition ${uiSurfaces.input}`}
                  >
                    <div>
                      <div className="font-semibold text-[#f5f5f5]">{currentModel.name}</div>
                      <div className="text-xs text-[#a3a3a3]">{currentModel.description}</div>
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-[#737373] transition-transform ${modelSelectorOpen ? "rotate-180" : ""}`} />
                  </button>

                  {modelSelectorOpen && (
                    <div className="mt-3 space-y-4 rounded-[14px] bg-[#2e2e2e] border border-[#474747] p-3">
                      {(Object.keys(MODEL_CATEGORIES) as ModelCategory[]).map((cat) => {
                        const models = grouped[cat];
                        if (!models?.length) return null;
                        const meta = MODEL_CATEGORIES[cat];
                        return (
                          <div key={cat}>
                            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#737373]">
                              <span>{meta.emoji}</span> {meta.label}
                            </div>
                            <div className="space-y-1.5">
                              {models.map((m) => {
                                const selected = model === m.id;
                                return (
                                  <button
                                    key={m.id}
                                    onClick={() => { setModel(m.id); setModelSelectorOpen(false); }}
                                    className={`flex w-full items-center gap-3 rounded-[12px] px-3.5 py-3 text-left transition-all ${
                                      selected
                                        ? "bg-[#1e3a8a]/20 border border-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                        : "bg-[#333333] border border-[#383838] hover:border-[#474747] hover:bg-[#383838]"
                                    }`}
                                  >
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                      selected ? "bg-[#2563eb] text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]" : "bg-[#383838] text-[#737373]"
                                    }`}>
                                      {selected ? <Check className="h-4 w-4" /> : <Wand2 className="h-3.5 w-3.5" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm font-semibold ${selected ? "text-[#3b82f6]" : "text-[#f5f5f5]"}`}>
                                          {m.name}
                                        </span>
                                        {m.tag && <TagBadge tag={m.tag} small />}
                                      </div>
                                      <p className="text-xs text-[#737373] truncate">{m.description}</p>
                                    </div>
                                    <span className="shrink-0 text-[10px] font-semibold text-[#737373]">
                                      {m.creditCost} cr
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Upload for variations mode */}
                {mode === "variations" && (
                  <div className={`p-4 ${uiSurfaces.section}`}>
                    <h3 className="text-lg font-semibold text-[#f5f5f5]">Start with an image</h3>
                    <p className="mt-1 text-sm text-[#a3a3a3]">Upload a reference, then generate new versions.</p>
                    <div className={`mt-4 flex flex-col items-center justify-center px-6 py-10 text-center ${uiSurfaces.dropzone}`}>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#383838] border border-[#474747]">
                        <Upload className="h-6 w-6 text-[#a3a3a3]" />
                      </div>
                      <div className="mt-4 text-lg font-semibold text-[#f5f5f5]">Upload or choose an image</div>
                      <div className="mt-1 max-w-sm text-sm text-[#737373]">Click or drag to upload · JPEG / PNG / WEBP</div>
                    </div>
                  </div>
                )}

                {/* Prompt section */}
                <div className={`p-4 ${uiSurfaces.section}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-[#f5f5f5]">
                      {mode === "create" ? "Describe your image" : "Describe your variation"}
                    </h3>
                    <CopyPlus className="h-4 w-4 text-[#737373]" />
                  </div>

                  {mode === "create" && <ReferenceBox />}

                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      mode === "create"
                        ? 'Example: "Luxury skincare bottle on wet stone, soft studio light, premium ecommerce photo"'
                        : 'Example: "Keep the subject, but make it sunset with cinematic lighting and richer color"'
                    }
                    className={`mt-3 min-h-[150px] w-full resize-none px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-[#3b82f6]/40 ${uiSurfaces.input}`}
                    disabled={isGenerating}
                  />
                  <div className="mt-1.5 text-right text-xs text-[#737373]">{prompt.length}/500</div>

                  {mode === "variations" && (
                    <button className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#a3a3a3] transition-colors hover:text-[#f5f5f5]">
                      <Sparkles className="h-4 w-4" /> Prompt from Image
                    </button>
                  )}
                </div>

                {/* Creativity (variations only) */}
                {mode === "variations" && (
                  <div className={`p-4 ${uiSurfaces.section}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-[#f5f5f5]">Creativity level</h3>
                      <span className="text-xs text-[#a3a3a3]">{creativity}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={creativity}
                      onChange={(e) => setCreativity(Number(e.target.value))}
                      className="mt-3 w-full accent-[#3b82f6]"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-[#737373]">
                      <span>Closer to original</span><span>More different</span>
                    </div>
                  </div>
                )}

                {/* Output selector */}
                <div className={`p-4 ${uiSurfaces.section}`}>
                  <div className="mb-2 text-sm text-[#a3a3a3]">Output</div>
                  <div className="grid grid-cols-2 gap-2">
                    {OUTPUT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setOutput(opt.value)}
                        className={`rounded-[12px] px-3 py-2.5 text-left text-sm transition ${
                          output === opt.value
                            ? "bg-[#1e3a8a]/20 border border-[#3b82f6] font-semibold text-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                            : "bg-[#333333] border border-[#474747] font-medium text-[#a3a3a3] hover:border-[#3b82f6]/40"
                        }`}
                      >
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-[10px] text-[#737373]">{opt.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Count + Generate */}
                <div className="grid grid-cols-[122px_minmax(0,1fr)] gap-3">
                  <div className={`flex h-12 items-center justify-between px-4 ${uiSurfaces.input}`}>
                    <button onClick={() => setCount(Math.max(1, count - 1))} type="button">
                      <Minus className="h-4 w-4 text-[#a3a3a3]" />
                    </button>
                    <span className="text-sm font-semibold text-[#f5f5f5]">{count}/4</span>
                    <button onClick={() => setCount(Math.min(4, count + 1))} type="button">
                      <Plus className="h-4 w-4 text-[#a3a3a3]" />
                    </button>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] btn-premium px-5 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                    ) : (
                      <><Wand2 className="h-4 w-4" /> Generate ({currentModel.creditCost} cr)</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#383838] bg-[#2e2e2e] px-4 py-3">
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-[#737373]">
                <Sparkles className="h-3.5 w-3.5 text-[#3b82f6]" />
                {currentModel.name} · {currentModel.creditCost} credit{currentModel.creditCost > 1 ? "s" : ""}/gen
              </p>
            </div>
          </div>
        </aside>

        {/* ───── RIGHT CANVAS ───── */}
        <main className="min-w-0 overflow-hidden rounded-[22px] bg-[#2e2e2e] border border-[#383838]">
          <div className="flex h-full flex-col">
            {/* Canvas header */}
            <div className="border-b border-[#383838] px-5 py-4">
              <div className="flex items-center gap-2">
                <button className="rounded-full bg-[#1e3a8a]/20 border border-[#3b82f6]/40 px-4 py-2 text-sm font-medium text-[#3b82f6]">
                  Creations
                </button>
                <button className="px-3 py-2 text-sm text-[#737373] transition-colors hover:text-[#a3a3a3]">
                  Collections
                </button>
                <button className="px-3 py-2 text-sm text-[#737373] transition-colors hover:text-[#a3a3a3]">
                  Templates
                </button>
              </div>
            </div>

            {/* Canvas body */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="px-6 py-6">
                {generatedImage ? (
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-[18px] bg-[#333333] border border-[#474747] p-1">
                      <img src={generatedImage} alt="Generated result" className="h-auto w-full rounded-[14px]" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setGeneratedImage(null)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#383838] border border-[#474747] px-4 py-2 text-sm font-medium text-[#a3a3a3] transition hover:border-[#3b82f6]/40 hover:text-[#f5f5f5]"
                      >
                        Generate another
                      </button>
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center gap-2 rounded-xl btn-premium px-4 py-2 text-sm font-medium"
                      >
                        <Download className="h-4 w-4" /> Download
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Hero card */}
                    <div className="rounded-[20px] bg-[#333333] border border-[#474747] p-6">
                      <h2 className="text-4xl font-semibold tracking-tight text-[#f5f5f5] sm:text-5xl">
                        AI Image Generator
                      </h2>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {IMAGE_MODELS.filter((m) => m.tag).slice(0, 6).map((m) => (
                          <span key={m.id} className={`px-3 py-1 text-xs font-medium text-[#a3a3a3] ${uiSurfaces.chip}`}>
                            {m.name}
                          </span>
                        ))}
                      </div>
                      <p className="mt-4 max-w-3xl text-lg text-[#a3a3a3]">
                        {IMAGE_MODELS.length} models across {Object.keys(MODEL_CATEGORIES).length} categories.
                        Select a model, write a prompt, and generate stunning images.
                      </p>
                    </div>

                    {/* Preview cards */}
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      <PreviewCard />
                      <PreviewCard featured />
                      <PreviewCard />
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

function TagBadge({ tag, small = false }: { tag: string; small?: boolean }) {
  const base = small ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]";
  const colors =
    tag === "Pro" || tag === "HD"
      ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
      : tag === "New"
      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
      : tag === "Fast"
      ? "text-sky-400 bg-sky-500/10 border border-sky-500/20"
      : "text-[#3b82f6] bg-[#3b82f6]/10 border border-[#3b82f6]/20";
  return <span className={`${base} ${colors} rounded-full font-bold uppercase tracking-wider`}>{tag}</span>;
}

function ModeTabs({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-[16px] bg-[#2e2e2e] border border-[#474747] p-1.5">
      {(["create", "variations"] as const).map((entry) => (
        <button
          key={entry}
          onClick={() => setMode(entry)}
          className={`rounded-[12px] px-4 py-3 text-center text-sm font-semibold transition ${
            mode === entry
              ? "bg-[#2563eb] text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              : "text-[#737373] hover:bg-[#383838] hover:text-[#a3a3a3]"
          }`}
        >
          {entry === "create" ? "Create Image" : "Image Variations"}
        </button>
      ))}
    </div>
  );
}

function ReferenceBox() {
  return (
    <div className="mt-3 rounded-[14px] bg-[#333333] border border-[#474747] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 w-9 rounded-lg bg-[#383838] border border-[#474747]" />
            ))}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#f5f5f5]">Add visual references</div>
            <div className="text-xs text-[#737373]">JPEG / PNG / WEBP / GIF, 20 MB max</div>
          </div>
        </div>
        <span className="rounded-full bg-[#383838] border border-[#474747] px-2 py-1 text-xs font-semibold text-[#a3a3a3]">0/14</span>
      </div>
    </div>
  );
}

function PreviewCard({ featured = false }: { featured?: boolean }) {
  return (
    <div className={`h-[320px] overflow-hidden rounded-[18px] border transition hover:scale-[1.02] hover:border-[#3b82f6] ${
      featured ? "bg-[#333333] border-[#474747]" : "bg-[#2e2e2e] border-[#383838] opacity-70"
    }`}>
      <div className={`flex h-full w-full items-center justify-center ${
        featured
          ? "bg-gradient-to-b from-[#1e3a8a]/20 to-[#333333]"
          : "bg-gradient-to-b from-[#383838]/50 to-[#2e2e2e]"
      }`}>
        <ImageIcon className={`h-12 w-12 ${featured ? "text-[#3b82f6]/30" : "text-[#474747]"}`} />
      </div>
    </div>
  );
}
