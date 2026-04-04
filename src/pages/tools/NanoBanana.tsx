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

// Dark palette
const C = {
  bg: "#06090d",
  panel: "#0f141b",
  panel2: "#131922",
  inner: "#0c1117",
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.08)",
  borderMid: "rgba(255,255,255,0.10)",
  text: "#f8fafc",
  textSoft: "#94a3b8",
  textMuted: "#64748b",
  accent: "#2563eb",
  cta: "#ff2bb8",
  ctaShadow: "rgba(255,43,184,0.35)",
} as const;

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
    <div className="h-full overflow-hidden p-3" style={{ background: C.bg }}>
      <div className="grid h-full min-h-0 grid-cols-[380px_minmax(0,1fr)] gap-3">

        {/* ───── LEFT PANEL ───── */}
        <aside
          className="min-h-0 overflow-hidden rounded-[28px]"
          style={{ background: C.panel, border: `1px solid ${C.border}` }}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="px-5 pb-4 pt-5" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                  style={{ background: C.accent, boxShadow: `0 0 20px rgba(37,99,235,0.4)` }}
                >
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold" style={{ color: C.text }}>Image Generator</h1>
                  <p className="text-sm" style={{ color: C.textSoft }}>
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
                <Section>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm" style={{ color: C.textSoft }}>Model</span>
                    {currentModel.tag && <TagBadge tag={currentModel.tag} />}
                  </div>

                  <button
                    onClick={() => setModelSelectorOpen(!modelSelectorOpen)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition rounded-[14px]"
                    style={{ background: C.inner, border: `1px solid ${C.border}` }}
                  >
                    <div>
                      <div className="font-semibold" style={{ color: C.text }}>{currentModel.name}</div>
                      <div className="text-xs" style={{ color: C.textSoft }}>{currentModel.description}</div>
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${modelSelectorOpen ? "rotate-180" : ""}`} style={{ color: C.textMuted }} />
                  </button>

                  {modelSelectorOpen && (
                    <div className="mt-3 space-y-4 rounded-[14px] p-3" style={{ background: C.inner, border: `1px solid ${C.border}` }}>
                      {(Object.keys(MODEL_CATEGORIES) as ModelCategory[]).map((cat) => {
                        const models = grouped[cat];
                        if (!models?.length) return null;
                        const meta = MODEL_CATEGORIES[cat];
                        return (
                          <div key={cat}>
                            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
                              <span>{meta.emoji}</span> {meta.label}
                            </div>
                            <div className="space-y-1.5">
                              {models.map((m) => {
                                const selected = model === m.id;
                                return (
                                  <button
                                    key={m.id}
                                    onClick={() => { setModel(m.id); setModelSelectorOpen(false); }}
                                    className="flex w-full items-center gap-3 rounded-[12px] px-3.5 py-3 text-left transition-all"
                                    style={{
                                      background: selected ? "rgba(37,99,235,0.15)" : C.panel2,
                                      border: `1px solid ${selected ? "rgba(59,130,246,0.5)" : C.border}`,
                                      boxShadow: selected ? "0 0 20px rgba(59,130,246,0.2)" : "none",
                                    }}
                                  >
                                    <div
                                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                      style={{
                                        background: selected ? C.accent : C.panel2,
                                        color: selected ? "#fff" : C.textMuted,
                                        boxShadow: selected ? "0 0 12px rgba(37,99,235,0.5)" : "none",
                                      }}
                                    >
                                      {selected ? <Check className="h-4 w-4" /> : <Wand2 className="h-3.5 w-3.5" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold" style={{ color: selected ? "#60a5fa" : C.text }}>
                                          {m.name}
                                        </span>
                                        {m.tag && <TagBadge tag={m.tag} small />}
                                      </div>
                                      <p className="text-xs truncate" style={{ color: C.textMuted }}>{m.description}</p>
                                    </div>
                                    <span className="shrink-0 text-[10px] font-semibold" style={{ color: C.textMuted }}>
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
                </Section>

                {/* Upload for variations mode */}
                {mode === "variations" && (
                  <Section>
                    <h3 className="text-lg font-semibold" style={{ color: C.text }}>Start with an image</h3>
                    <p className="mt-1 text-sm" style={{ color: C.textSoft }}>Upload a reference, then generate new versions.</p>
                    <div
                      className="mt-4 flex flex-col items-center justify-center rounded-[16px] px-6 py-10 text-center border-dashed border-2"
                      style={{ background: C.inner, borderColor: C.borderLight }}
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
                        <Upload className="h-6 w-6" style={{ color: C.textSoft }} />
                      </div>
                      <div className="mt-4 text-lg font-semibold" style={{ color: C.text }}>Upload or choose an image</div>
                      <div className="mt-1 max-w-sm text-sm" style={{ color: C.textMuted }}>Click or drag to upload · JPEG / PNG / WEBP</div>
                    </div>
                  </Section>
                )}

                {/* Prompt section */}
                <Section>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold" style={{ color: C.text }}>
                      {mode === "create" ? "Describe your image" : "Describe your variation"}
                    </h3>
                    <CopyPlus className="h-4 w-4" style={{ color: C.textMuted }} />
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
                    className="mt-3 min-h-[150px] w-full resize-none rounded-[16px] px-4 py-4 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40"
                    style={{ background: C.inner, border: `1px solid ${C.border}`, color: C.text }}
                    disabled={isGenerating}
                  />
                  <div className="mt-1.5 text-right text-xs" style={{ color: C.textMuted }}>{prompt.length}/500</div>

                  {mode === "variations" && (
                    <button className="mt-2 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-white" style={{ color: C.textSoft }}>
                      <Sparkles className="h-4 w-4" /> Prompt from Image
                    </button>
                  )}
                </Section>

                {/* Creativity (variations only) */}
                {mode === "variations" && (
                  <Section>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold" style={{ color: C.text }}>Creativity level</h3>
                      <span className="text-xs" style={{ color: C.textSoft }}>{creativity}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={creativity}
                      onChange={(e) => setCreativity(Number(e.target.value))}
                      className="mt-3 w-full accent-blue-500"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs" style={{ color: C.textMuted }}>
                      <span>Closer to original</span><span>More different</span>
                    </div>
                  </Section>
                )}

                {/* Output selector */}
                <Section>
                  <div className="mb-2 text-sm" style={{ color: C.textSoft }}>Output</div>
                  <div className="grid grid-cols-2 gap-2">
                    {OUTPUT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setOutput(opt.value)}
                        className="rounded-[12px] px-3 py-2.5 text-left text-sm transition"
                        style={{
                          background: output === opt.value ? "rgba(37,99,235,0.15)" : C.inner,
                          border: `1px solid ${output === opt.value ? "rgba(59,130,246,0.5)" : C.border}`,
                          color: output === opt.value ? "#60a5fa" : C.textSoft,
                          boxShadow: output === opt.value ? "0 0 20px rgba(59,130,246,0.15)" : "none",
                        }}
                      >
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-[10px]" style={{ color: C.textMuted }}>{opt.hint}</div>
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Count + Generate */}
                <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
                  <div
                    className="flex h-12 items-center justify-between rounded-[14px] px-4"
                    style={{ background: C.inner, border: `1px solid ${C.border}` }}
                  >
                    <button onClick={() => setCount(Math.max(1, count - 1))} type="button">
                      <Minus className="h-4 w-4" style={{ color: C.textSoft }} />
                    </button>
                    <span className="text-sm font-semibold" style={{ color: C.text }}>{count}/4</span>
                    <button onClick={() => setCount(Math.min(4, count + 1))} type="button">
                      <Plus className="h-4 w-4" style={{ color: C.textSoft }} />
                    </button>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] px-5 text-sm font-semibold text-white disabled:pointer-events-none disabled:opacity-50 transition-all hover:brightness-110"
                    style={{ background: C.cta, boxShadow: `0 8px 24px ${C.ctaShadow}` }}
                  >
                    {isGenerating ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                    ) : (
                      <><Wand2 className="h-4 w-4" /> Create ({currentModel.creditCost} cr)</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3" style={{ borderTop: `1px solid ${C.border}`, background: C.inner }}>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs" style={{ color: C.textMuted }}>
                <Sparkles className="h-3.5 w-3.5" style={{ color: C.accent }} />
                {currentModel.name} · {currentModel.creditCost} credit{currentModel.creditCost > 1 ? "s" : ""}/gen
              </p>
            </div>
          </div>
        </aside>

        {/* ───── RIGHT CANVAS ───── */}
        <main
          className="relative min-w-0 overflow-hidden rounded-[30px]"
          style={{ background: "#090d12", border: `1px solid ${C.border}` }}
        >
          {/* Ambient glow backdrop */}
          <div
            className="absolute inset-0 blur-2xl pointer-events-none"
            style={{
              background: [
                "radial-gradient(circle at center, rgba(255,120,60,0.18), transparent 35%)",
                "radial-gradient(circle at top, rgba(255,0,170,0.10), transparent 25%)",
                "radial-gradient(circle at bottom, rgba(0,120,255,0.12), transparent 30%)",
              ].join(","),
            }}
          />

          <div className="relative z-10 flex h-full flex-col">
            {/* Canvas header tabs */}
            <div className="px-6 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <button className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium">
                  Creations
                </button>
                <button className="px-3 py-2 text-sm transition-colors hover:text-white" style={{ color: C.textSoft }}>
                  Collections
                </button>
                <button className="px-3 py-2 text-sm transition-colors hover:text-white" style={{ color: C.textSoft }}>
                  Templates
                </button>
              </div>
            </div>

            {/* Canvas body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              {generatedImage ? (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[22px] p-1" style={{ background: C.panel, border: `1px solid ${C.borderMid}` }}>
                    <img src={generatedImage} alt="Generated result" className="h-auto w-full rounded-[18px]" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setGeneratedImage(null)}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition hover:text-white"
                      style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.textSoft }}
                    >
                      Generate another
                    </button>
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110"
                      style={{ background: C.cta, boxShadow: `0 8px 24px ${C.ctaShadow}` }}
                    >
                      <Download className="h-4 w-4" /> Download
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Hero text */}
                  <div className="mt-4 max-w-5xl">
                    <h2 className="text-5xl font-semibold tracking-tight lg:text-6xl" style={{ color: C.text }}>
                      Free AI Image Creation
                    </h2>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {IMAGE_MODELS.filter((m) => m.tag).slice(0, 6).map((m) => (
                        <span
                          key={m.id}
                          className="rounded-full px-3 py-1 text-xs font-medium"
                          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.borderMid}`, color: C.textSoft }}
                        >
                          {m.name}
                        </span>
                      ))}
                    </div>

                    <p className="mt-4 max-w-4xl text-lg" style={{ color: C.textSoft }}>
                      {IMAGE_MODELS.length} models across {Object.keys(MODEL_CATEGORIES).length} categories.
                      Select a model, write a prompt, and generate stunning images.
                    </p>

                    <button
                      className="mt-6 h-12 rounded-[14px] px-8 text-sm font-semibold text-white transition-all hover:brightness-110"
                      style={{ background: C.cta, boxShadow: `0 8px 24px ${C.ctaShadow}` }}
                    >
                      Sign up to create for FREE
                    </button>
                  </div>

                  {/* Preview cards — cinematic 3-column */}
                  <div className="grid grid-cols-[0.8fr_1.3fr_0.8fr] gap-4 mt-8">
                    <PreviewCard />
                    <PreviewCard featured />
                    <PreviewCard />
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[18px] p-3"
      style={{ background: C.panel2, border: `1px solid ${C.border}` }}
    >
      {children}
    </div>
  );
}

function TagBadge({ tag, small = false }: { tag: string; small?: boolean }) {
  const base = small ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]";
  const colors =
    tag === "Pro" || tag === "HD"
      ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
      : tag === "New"
      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
      : tag === "Fast"
      ? "text-sky-400 bg-sky-500/10 border border-sky-500/20"
      : "text-blue-400 bg-blue-500/10 border border-blue-500/20";
  return <span className={`${base} ${colors} rounded-full font-bold uppercase tracking-wider`}>{tag}</span>;
}

function ModeTabs({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div
      className="grid grid-cols-2 gap-2 rounded-[18px] p-2"
      style={{ background: C.panel2, border: `1px solid ${C.border}` }}
    >
      {(["create", "variations"] as const).map((entry) => (
        <button
          key={entry}
          onClick={() => setMode(entry)}
          className="rounded-[14px] px-4 py-4 text-center text-sm font-semibold transition"
          style={{
            background: mode === entry
              ? "radial-gradient(circle at top, #ff70d7 0%, #b1268f 45%, #171c25 100%)"
              : "transparent",
            color: mode === entry ? "#fff" : C.textSoft,
          }}
        >
          {entry === "create" ? "Create Image" : "Image Variations"}
        </button>
      ))}
    </div>
  );
}

function ReferenceBox() {
  return (
    <div
      className="mt-3 rounded-[14px] p-[1px]"
      style={{
        border: `1px solid rgba(255,43,184,0.5)`,
        background: "linear-gradient(180deg, rgba(255,43,184,0.18), rgba(255,43,184,0.04))",
      }}
    >
      <div className="rounded-[13px] px-4 py-3" style={{ background: C.inner }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-9 w-9 rounded-lg" style={{ background: C.panel2, border: `1px solid ${C.border}` }} />
              ))}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: C.text }}>Add visual references</div>
              <div className="text-xs" style={{ color: C.textMuted }}>JPEG / PNG / WEBP / GIF, 20 MB max</div>
            </div>
          </div>
          <span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.textSoft }}>0/14</span>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className="h-[520px] overflow-hidden rounded-[22px] transition hover:scale-[1.01]"
      style={{
        background: C.panel,
        border: `1px solid ${featured ? C.borderMid : C.borderLight}`,
        opacity: featured ? 1 : 0.6,
        filter: featured ? "none" : "blur(1px)",
        boxShadow: featured ? "0 20px 60px rgba(0,0,0,0.45)" : "none",
      }}
    >
      <div className="flex h-full w-full items-center justify-center">
        <ImageIcon className="h-12 w-12" style={{ color: featured ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)" }} />
      </div>
    </div>
  );
}
