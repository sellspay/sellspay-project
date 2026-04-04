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
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    if (creditBalance < (currentModel.creditCost || 1)) {
      toast.error("Insufficient credits. Please top up.");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const deductResult = await deductCredits("vibecoder_gen");
      if (!deductResult.success) {
        toast.error("Failed to deduct credit");
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: prompt.trim(), model },
      });

      if (error) throw error;
      if (data?.image_url) {
        setGeneratedImage(data.image_url);
        toast.success(`${currentModel.name} finished generating.`);
      } else {
        throw new Error("No image returned");
      }
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
      a.download = `image-generator-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch {
      toast.error("Failed to download image");
    }
  };

  return (
    <div className="h-full overflow-hidden bg-[#f7fbff] px-4 py-4">
      <div className="grid h-full min-h-0 grid-cols-[390px_minmax(0,1fr)] gap-4">
        {/* ───── LEFT PANEL ───── */}
        <aside className={`min-h-0 overflow-hidden ${uiSurfaces.toolPanel}`}>
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-[#cfe3ee] px-5 pb-4 pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3ba6ff] text-white shadow-sm">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-[#0f172a]">Image Generator</h1>
                  <p className="text-sm text-[#5b6b7c]">
                    {mode === "create" ? "Create Image" : "Image Variations"}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
              <div className="space-y-3">
                {/* Mode tabs */}
                <ModeTabs mode={mode} setMode={setMode} />

                {/* Model selector */}
                <div className={`p-4 ${uiSurfaces.section}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-[#5b6b7c]">Model</span>
                    {currentModel.tag && <TagBadge tag={currentModel.tag} />}
                  </div>

                  <button
                    onClick={() => setModelSelectorOpen(!modelSelectorOpen)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition ${uiSurfaces.input}`}
                  >
                    <div>
                      <div className="font-semibold text-[#0f172a]">{currentModel.name}</div>
                      <div className="text-xs text-[#5b6b7c]">{currentModel.description}</div>
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-[#94a3b8] transition-transform ${modelSelectorOpen ? "rotate-180" : ""}`} />
                  </button>

                  {modelSelectorOpen && (
                    <div className="mt-3 space-y-4 rounded-[16px] bg-[#f4f9fd] border border-[#9fc2d4] p-3">
                      {(Object.keys(MODEL_CATEGORIES) as ModelCategory[]).map((cat) => {
                        const models = grouped[cat];
                        if (!models?.length) return null;
                        const meta = MODEL_CATEGORIES[cat];
                        return (
                          <div key={cat}>
                            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                              <span>{meta.emoji}</span> {meta.label}
                            </div>
                            <div className="space-y-1.5">
                              {models.map((m) => {
                                const selected = model === m.id;
                                return (
                                  <button
                                    key={m.id}
                                    onClick={() => {
                                      setModel(m.id);
                                      setModelSelectorOpen(false);
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3 text-left transition-all ${
                                      selected
                                        ? "bg-[#e6f3fb] border border-[#6fa6bd] shadow-sm"
                                        : "bg-white border border-[#cfe3ee] hover:border-[#9fc2d4] hover:shadow-sm"
                                    }`}
                                  >
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                      selected ? "bg-[#3ba6ff] text-white" : "bg-[#f4f9fd] text-[#94a3b8]"
                                    }`}>
                                      {selected ? <Check className="h-4 w-4" /> : <Wand2 className="h-3.5 w-3.5" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm font-semibold ${selected ? "text-[#3ba6ff]" : "text-[#0f172a]"}`}>
                                          {m.name}
                                        </span>
                                        {m.tag && <TagBadge tag={m.tag} small />}
                                      </div>
                                      <p className="text-xs text-[#5b6b7c] truncate">{m.description}</p>
                                    </div>
                                    <span className="shrink-0 text-[10px] font-semibold text-[#94a3b8]">
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
                    <h3 className="text-lg font-semibold text-[#0f172a]">Start with an image</h3>
                    <p className="mt-1 text-sm text-[#5b6b7c]">Upload a reference, then generate new versions.</p>
                    <div className={`mt-4 flex flex-col items-center justify-center px-6 py-10 text-center ${uiSurfaces.dropzone}`}>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef6fb] border border-[#dbeaf3]">
                        <Upload className="h-6 w-6 text-[#5b6b7c]" />
                      </div>
                      <div className="mt-4 text-lg font-semibold text-[#0f172a]">Upload or choose an image</div>
                      <div className="mt-1 max-w-sm text-sm text-[#5b6b7c]">Click or drag to upload · JPEG / PNG / WEBP</div>
                    </div>
                  </div>
                )}

                {/* Prompt section */}
                <div className={`p-4 ${uiSurfaces.section}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-[#0f172a]">
                      {mode === "create" ? "Describe your image" : "Describe your variation"}
                    </h3>
                    <CopyPlus className="h-4 w-4 text-[#94a3b8]" />
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
                    className={`mt-3 min-h-[150px] w-full resize-none px-4 py-4 text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:ring-2 focus:ring-[#3ba6ff]/30 ${uiSurfaces.input}`}
                    disabled={isGenerating}
                  />
                  <div className="mt-1.5 text-right text-xs text-[#94a3b8]">{prompt.length}/500</div>

                  {mode === "variations" && (
                    <button className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#5b6b7c] transition-colors hover:text-[#0f172a]">
                      <Sparkles className="h-4 w-4" /> Prompt from Image
                    </button>
                  )}
                </div>

                {/* Creativity (variations only) */}
                {mode === "variations" && (
                  <div className={`p-4 ${uiSurfaces.section}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-[#0f172a]">Creativity level</h3>
                      <span className="text-xs text-[#5b6b7c]">{creativity}%</span>
                    </div>
                    <input
                      type="range" min={0} max={100} value={creativity}
                      onChange={(e) => setCreativity(Number(e.target.value))}
                      className="mt-3 w-full accent-[#3ba6ff]"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-[#94a3b8]">
                      <span>Closer to original</span>
                      <span>More different</span>
                    </div>
                  </div>
                )}

                {/* Output selector */}
                <div className={`p-4 ${uiSurfaces.section}`}>
                  <div className="mb-2 text-sm text-[#5b6b7c]">Output</div>
                  <div className="grid grid-cols-2 gap-2">
                    {OUTPUT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setOutput(opt.value)}
                        className={`rounded-[14px] px-3 py-2.5 text-left text-sm transition ${
                          output === opt.value
                            ? "bg-[#e6f3ff] border border-[#3ba6ff] font-semibold text-[#3ba6ff]"
                            : "bg-[#f4f9fd] border border-[#e1eef6] font-medium text-[#5b6b7c] hover:border-[#c4d8e6]"
                        }`}
                      >
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-[10px] text-[#94a3b8]">{opt.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Count + Generate */}
                <div className="grid grid-cols-[122px_minmax(0,1fr)] gap-3">
                  <div className={`flex h-12 items-center justify-between px-4 ${uiSurfaces.input}`}>
                    <button onClick={() => setCount(Math.max(1, count - 1))} type="button">
                      <Minus className="h-4 w-4 text-[#5b6b7c]" />
                    </button>
                    <span className="text-sm font-semibold text-[#0f172a]">{count}/4</span>
                    <button onClick={() => setCount(Math.min(4, count + 1))} type="button">
                      <Plus className="h-4 w-4 text-[#5b6b7c]" />
                    </button>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#3ba6ff] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2f95ea] hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
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
            <div className="border-t border-[#cfe3ee] bg-[#f4f9fd] px-4 py-3">
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-[#94a3b8]">
                <Sparkles className="h-3.5 w-3.5 text-[#3ba6ff]" />
                {currentModel.name} · {currentModel.creditCost} credit{currentModel.creditCost > 1 ? "s" : ""}/gen
              </p>
            </div>
          </div>
        </aside>

        {/* ───── RIGHT CANVAS ───── */}
        <main className="min-w-0 overflow-hidden rounded-[28px] bg-white border border-[#9fc2d4] shadow-[0_8px_24px_rgba(111,166,189,0.12)]">
          <div className="flex h-full flex-col">
            {/* Canvas header */}
            <div className="border-b border-[#cfe3ee] px-5 py-4">
              <div className="flex items-center gap-2">
                <button className="rounded-full bg-[#e6f3fb] border border-[#6fa6bd] px-4 py-2 text-sm font-medium text-[#3ba6ff]">
                  Creations
                </button>
                <button className="px-3 py-2 text-sm text-[#94a3b8] transition-colors hover:text-[#5b6b7c]">
                  Collections
                </button>
                <button className="px-3 py-2 text-sm text-[#94a3b8] transition-colors hover:text-[#5b6b7c]">
                  Templates
                </button>
              </div>
            </div>

            {/* Canvas body */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-br from-[#f4f9fd] to-[#cfe3ee]">
              <div className="px-6 py-6">
                {generatedImage ? (
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-[20px] bg-white border border-[#e3edf5] p-1">
                      <img src={generatedImage} alt="Generated result" className="h-auto w-full rounded-[16px]" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setGeneratedImage(null)}
                        className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#e3edf5] px-4 py-2 text-sm font-medium text-[#5b6b7c] transition hover:border-[#c4d8e6]"
                      >
                        Generate another
                      </button>
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#3ba6ff] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2f95ea]"
                      >
                        <Download className="h-4 w-4" /> Download
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Hero card */}
                    <div className="rounded-[24px] bg-[#eef6fb] border border-[#dbeaf3] p-6">
                      <h2 className="text-4xl font-semibold tracking-tight text-[#0f172a] sm:text-5xl">
                        AI Image Generator
                      </h2>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {IMAGE_MODELS.filter((m) => m.tag).slice(0, 6).map((m) => (
                          <span key={m.id} className={`px-3 py-1 text-xs font-medium text-[#5b6b7c] ${uiSurfaces.chip}`}>
                            {m.name}
                          </span>
                        ))}
                      </div>
                      <p className="mt-4 max-w-3xl text-lg text-[#5b6b7c]">
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
      ? "text-amber-700 bg-amber-50 border border-amber-200"
      : tag === "New"
      ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
      : tag === "Fast"
      ? "text-sky-700 bg-sky-50 border border-sky-200"
      : "text-[#3ba6ff] bg-[#e6f3ff] border border-[#3ba6ff]/20";
  return <span className={`${base} ${colors} rounded-full font-bold uppercase tracking-wider`}>{tag}</span>;
}

function ModeTabs({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-[18px] bg-[#f4f9fd] border border-[#e1eef6] p-1.5">
      {(["create", "variations"] as const).map((entry) => (
        <button
          key={entry}
          onClick={() => setMode(entry)}
          className={`rounded-[14px] px-4 py-3 text-center text-sm font-semibold transition ${
            mode === entry
              ? "bg-[#3ba6ff] text-white shadow-sm"
              : "text-[#5b6b7c] hover:bg-white hover:text-[#0f172a]"
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
    <div className="mt-3 rounded-[16px] bg-[#f4f9fd] border border-[#e1eef6] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 w-9 rounded-lg bg-[#eef6fb] border border-[#dbeaf3]" />
            ))}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#0f172a]">Add visual references</div>
            <div className="text-xs text-[#94a3b8]">JPEG / PNG / WEBP / GIF, 20 MB max</div>
          </div>
        </div>
        <span className="rounded-full bg-[#eef6fb] border border-[#dbeaf3] px-2 py-1 text-xs font-semibold text-[#5b6b7c]">0/14</span>
      </div>
    </div>
  );
}

function PreviewCard({ featured = false }: { featured?: boolean }) {
  return (
    <div className={`h-[320px] overflow-hidden rounded-[20px] border ${
      featured ? "bg-white border-[#e3edf5]" : "bg-[#f4f9fd] border-[#e1eef6] opacity-70"
    }`}>
      <div className={`flex h-full w-full items-center justify-center ${
        featured
          ? "bg-gradient-to-b from-[#e6f3ff] to-white"
          : "bg-gradient-to-b from-[#eef6fb] to-[#f4f9fd]"
      }`}>
        <ImageIcon className={`h-12 w-12 ${featured ? "text-[#3ba6ff]/40" : "text-[#94a3b8]/40"}`} />
      </div>
    </div>
  );
}
