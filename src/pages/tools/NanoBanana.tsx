import { useMemo, useState } from "react";
import {
  Loader2, Download, Wand2, Image as ImageIcon, Upload, Sparkles,
  Minus, Plus, ChevronDown, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/lib/auth";
import { dispatchAuthGate } from "@/utils/authGateEvent";
import {
  IMAGE_MODELS, MODEL_CATEGORIES, getModelsByCategory, getModelById,
  type ModelCategory,
} from "@/models/imageModels";

type Mode = "create" | "variations";

const OUTPUT_OPTIONS = [
  { value: "1:1-1024", label: "1:1 | 1K", hint: "Square" },
  { value: "4:3-1k", label: "4:3 | 1K", hint: "Landscape" },
  { value: "16:9-1k", label: "16:9 | 1K", hint: "Wide" },
  { value: "9:16-1k", label: "9:16 | 1K", hint: "Vertical" },
];

const C = {
  pageBg: "#f7fbff",
  panel: "#ffffff",
  panelBorder: "#e3edf5",
  inner: "#f4f9fd",
  innerBorder: "#e1eef6",
  input: "#f8fcff",
  inputBorder: "#dceaf4",
  text: "#0f172a",
  textSoft: "#475569",
  textMuted: "#94a3b8",
  accent: "#3ba6ff",
  accentBg: "rgba(59,166,255,0.08)",
} as const;

export default function NanoBanana() {
  const [mode, setMode] = useState<Mode>("create");
  const [model, setModel] = useState("nano-banana-2");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("4:3-1k");
  const [count, setCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const { deductCredits, credits: creditBalance } = useSubscription();
  const { user } = useAuth();

  const currentModel = useMemo(() => getModelById(model) ?? IMAGE_MODELS[0], [model]);
  const grouped = useMemo(() => getModelsByCategory(), []);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (!user) { dispatchAuthGate(); return; }
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
    <div className="h-full p-3" style={{ background: C.pageBg }}>
      <div className="grid h-full grid-cols-[380px_minmax(0,1fr)] gap-3">
        {/* ───── LEFT CONTROL PANEL ───── */}
        <aside
          className="h-full rounded-[24px] overflow-hidden flex flex-col bg-white shadow-sm"
          style={{ border: `1px solid ${C.panelBorder}` }}
        >
          <div className="p-5 pb-4">
            <h1 className="text-xl font-bold text-slate-900">Image Generator</h1>
            <p className="text-xs mt-1 text-slate-400">Create stunning images from text prompts</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
            {/* Mode tabs */}
            <div className="grid grid-cols-2 gap-1.5 rounded-[16px] p-1.5" style={{ background: C.inner }}>
              {(["create", "variations"] as const).map((entry) => (
                <button
                  key={entry}
                  onClick={() => setMode(entry)}
                  className="rounded-[12px] px-3 py-2.5 text-xs font-semibold transition-all"
                  style={{
                    background: mode === entry
                      ? "linear-gradient(135deg, #3ba6ff, #2f95ea)"
                      : "transparent",
                    color: mode === entry ? "#fff" : C.textSoft,
                  }}
                >
                  {entry === "create" ? "Create Image" : "Image Variations"}
                </button>
              ))}
            </div>

            {/* Model selector */}
            <div className="rounded-[16px] p-3" style={{ background: C.inner, border: `1px solid ${C.innerBorder}` }}>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-slate-400">Model</div>
              <button
                onClick={() => setModelSelectorOpen(!modelSelectorOpen)}
                className="flex w-full items-center justify-between gap-2 rounded-[12px] px-3 py-2.5 text-left text-sm transition"
                style={{ background: C.input, border: `1px solid ${C.inputBorder}` }}
              >
                <span className="truncate font-medium text-slate-800">{currentModel.name}</span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform text-slate-400 ${modelSelectorOpen ? "rotate-180" : ""}`} />
              </button>

              {modelSelectorOpen && (
                <div className="mt-2 max-h-[260px] overflow-y-auto space-y-3 rounded-[12px] p-2" style={{ background: C.input, border: `1px solid ${C.inputBorder}` }}>
                  {(Object.keys(MODEL_CATEGORIES) as ModelCategory[]).map((cat) => {
                    const models = grouped[cat];
                    if (!models?.length) return null;
                    const meta = MODEL_CATEGORIES[cat];
                    return (
                      <div key={cat}>
                        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {meta.emoji} {meta.label}
                        </div>
                        <div className="space-y-0.5">
                          {models.map((m) => {
                            const selected = model === m.id;
                            return (
                              <button
                                key={m.id}
                                onClick={() => { setModel(m.id); setModelSelectorOpen(false); }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition"
                                style={{
                                  background: selected ? C.accentBg : "transparent",
                                  color: selected ? C.accent : C.textSoft,
                                }}
                              >
                                {selected && <Check className="h-3 w-3 shrink-0" />}
                                <span className="truncate">{m.name}</span>
                                {m.tag && <TagBadge tag={m.tag} small />}
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

            {/* Prompt */}
            <div className="rounded-[16px] p-3" style={{ background: C.inner, border: `1px solid ${C.innerBorder}` }}>
              <div className="text-xs font-semibold mb-2 text-slate-800">Describe your image</div>

              <div className="rounded-[12px] p-[1px]" style={{ border: `1px solid rgba(59,166,255,0.3)`, background: "linear-gradient(180deg, rgba(59,166,255,0.1), rgba(59,166,255,0.02))" }}>
                <div className="rounded-[11px] px-3 py-2.5" style={{ background: C.input }}>
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" style={{ color: C.accent }} />
                    <div>
                      <div className="text-xs font-medium text-slate-700">Add visual references</div>
                      <div className="text-[10px] text-slate-400">JPEG/PNG/WEBP/GIF, 20 MB max</div>
                    </div>
                  </div>
                </div>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='What do you want to see? Example: "A cat sitting on a table, warm morning light."'
                className="mt-2.5 min-h-[120px] w-full resize-none rounded-[12px] px-3.5 py-3 text-sm outline-none focus:ring-1 focus:ring-blue-400/40 text-slate-800 placeholder:text-slate-400"
                style={{ background: C.input, border: `1px solid ${C.inputBorder}` }}
                disabled={isGenerating}
              />
            </div>

            {/* Output */}
            <div className="rounded-[16px] p-3" style={{ background: C.inner, border: `1px solid ${C.innerBorder}` }}>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-slate-400">Output</div>
              <div className="flex flex-wrap gap-1.5">
                {OUTPUT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setOutput(opt.value)}
                    className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition"
                    style={{
                      background: output === opt.value ? C.accentBg : "transparent",
                      color: output === opt.value ? C.accent : C.textMuted,
                      border: output === opt.value ? `1px solid rgba(59,166,255,0.3)` : `1px solid transparent`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Count + Generate */}
            <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-2">
              <div
                className="flex items-center justify-between rounded-[12px] px-3 py-2.5"
                style={{ background: C.input, border: `1px solid ${C.inputBorder}` }}
              >
                <button onClick={() => setCount(Math.max(1, count - 1))}>
                  <Minus className="h-3 w-3 text-slate-500" />
                </button>
                <span className="text-xs font-medium text-slate-800">{count}</span>
                <button onClick={() => setCount(Math.min(4, count + 1))}>
                  <Plus className="h-3 w-3 text-slate-500" />
                </button>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 transition hover:brightness-110"
                style={{ background: C.accent, boxShadow: "0 4px 16px rgba(59,166,255,0.3)" }}
              >
                {isGenerating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="h-4 w-4" /> Create</>
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* ───── RIGHT CANVAS ───── */}
        <main
          className="relative rounded-[24px] overflow-hidden flex items-center justify-center bg-[#f4f9fd] shadow-sm"
          style={{ border: `1px solid ${C.panelBorder}` }}
        >
          <div
            className="absolute inset-0 blur-3xl opacity-30 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 40% 30%, rgba(59,166,255,0.12), transparent 50%), radial-gradient(circle at 70% 70%, rgba(139,92,246,0.08), transparent 50%)",
            }}
          />

          <div className="relative z-10 w-full h-full flex items-center justify-center p-6">
            {generatedImage ? (
              <div className="relative max-w-[85%] max-h-[85%]">
                <img
                  src={generatedImage}
                  alt="Generated result"
                  className="max-w-full max-h-full rounded-2xl object-contain"
                  style={{ boxShadow: "0 20px 60px rgba(15,23,42,0.15)" }}
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={() => setGeneratedImage(null)}
                    className="rounded-xl px-4 py-2 text-xs font-medium transition hover:bg-slate-100 bg-white border border-[#e3edf5] text-slate-600"
                  >
                    New
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
                    style={{ background: C.accent }}
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 text-center max-w-md">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white border border-[#e3edf5]"
                >
                  <ImageIcon className="h-9 w-9" style={{ color: C.accent }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-slate-900">
                    AI Image Generator
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-500">
                    Enter a prompt on the left and click Create to generate stunning images with AI.
                  </p>
                </div>

                {isGenerating && (
                  <div className="flex flex-col items-center gap-3 mt-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.accent}, #8b5cf6)` }}>
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <p className="text-sm font-medium text-slate-800">Generating your image...</p>
                    <p className="text-xs text-slate-400">This may take a few seconds</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function TagBadge({ tag, small = false }: { tag: string; small?: boolean }) {
  const base = small ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]";
  const colors =
    tag === "Pro" || tag === "HD"
      ? "text-amber-600 bg-amber-50 border border-amber-200"
      : tag === "New"
      ? "text-emerald-600 bg-emerald-50 border border-emerald-200"
      : tag === "Fast"
      ? "text-sky-600 bg-sky-50 border border-sky-200"
      : "text-blue-600 bg-blue-50 border border-blue-200";
  return <span className={`${base} ${colors} rounded-full font-bold uppercase tracking-wider`}>{tag}</span>;
}
