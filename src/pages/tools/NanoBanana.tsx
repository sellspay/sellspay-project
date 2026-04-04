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
  LayoutTemplate,
  Shapes,
  Music,
  Type,
  Captions,
  FileText,
  Sliders,
  Layers,
  Paintbrush,
  Puzzle,
  Monitor,
  CloudUpload,
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

// CapCut-inspired dark palette
const C = {
  bg: "#0e0e10",
  sidebarBg: "#18181b",
  panelBg: "#1e1e22",
  canvasBg: "#121214",
  innerBg: "#141416",
  timelineBg: "#18181b",
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.08)",
  borderMid: "rgba(255,255,255,0.10)",
  text: "#f4f4f5",
  textSoft: "#a1a1aa",
  textMuted: "#71717a",
  accent: "#06b6d4", // cyan like CapCut
  accentBg: "rgba(6,182,212,0.12)",
  cta: "#06b6d4",
  ctaShadow: "rgba(6,182,212,0.3)",
  purple: "#8b5cf6",
  green: "#22c55e",
} as const;

const SIDEBAR_ITEMS = [
  { icon: ImageIcon, label: "Media", active: true },
  { icon: LayoutTemplate, label: "Templates" },
  { icon: Shapes, label: "Elements" },
  { icon: Music, label: "Audio" },
  { icon: Type, label: "Text" },
  { icon: Captions, label: "Captions" },
  { icon: FileText, label: "Transcript" },
  { icon: Sliders, label: "Effects" },
  { icon: Layers, label: "Transitions" },
  { icon: Paintbrush, label: "Filters" },
  { icon: Puzzle, label: "Brand kit" },
  { icon: Puzzle, label: "Plugins" },
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
    <div className="h-full flex overflow-hidden" style={{ background: C.bg }}>
      {/* ───── ICON SIDEBAR (narrow) ───── */}
      <nav
        className="flex w-[60px] shrink-0 flex-col items-center py-3 gap-0.5 overflow-y-auto"
        style={{ background: C.sidebarBg, borderRight: `1px solid ${C.border}` }}
      >
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className="flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2.5 w-[54px] transition-colors"
              style={{
                color: item.active ? C.accent : C.textMuted,
                background: item.active ? C.accentBg : "transparent",
              }}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ───── SECONDARY PANEL (media/controls) ───── */}
      <aside
        className="flex w-[240px] shrink-0 flex-col overflow-hidden"
        style={{ background: C.panelBg, borderRight: `1px solid ${C.border}` }}
      >
        {/* Upload button */}
        <div className="p-3">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors hover:brightness-110"
            style={{ border: `1px solid ${C.borderMid}`, color: C.accent }}
          >
            <CloudUpload className="h-4 w-4" /> Upload
          </button>

          {/* Device / Cloud toggle */}
          <div className="mt-2 grid grid-cols-2 gap-1">
            <button
              className="flex items-center justify-center gap-1.5 rounded-md py-2 text-xs"
              style={{ background: C.innerBg, border: `1px solid ${C.border}`, color: C.textSoft }}
            >
              <Monitor className="h-3.5 w-3.5" /> Device
            </button>
            <button
              className="flex items-center justify-center gap-1.5 rounded-md py-2 text-xs"
              style={{ background: C.innerBg, border: `1px solid ${C.border}`, color: C.textSoft }}
            >
              <ImageIcon className="h-3.5 w-3.5" /> Cloud
            </button>
          </div>
        </div>

        {/* AI prompt card */}
        <div className="mx-3 rounded-xl p-3" style={{ background: "linear-gradient(135deg, #3b2667 0%, #1d1640 100%)", border: `1px solid rgba(139,92,246,0.3)` }}>
          <div className="flex items-start gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(139,92,246,0.3)" }}>
              <Wand2 className="h-4 w-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">AI Image Gen</div>
              <div className="text-xs text-purple-300/80 mt-0.5">Create stunning images from text prompts.</div>
            </div>
          </div>
          <button
            onClick={() => {}}
            className="mt-2.5 w-full rounded-lg py-2 text-xs font-semibold text-white transition hover:brightness-110"
            style={{ background: C.green }}
          >
            Try it →
          </button>
        </div>

        {/* Model selector compact */}
        <div className="mt-3 px-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Model</div>
          <button
            onClick={() => setModelSelectorOpen(!modelSelectorOpen)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition"
            style={{ background: C.innerBg, border: `1px solid ${C.border}` }}
          >
            <span className="truncate font-medium" style={{ color: C.text }}>{currentModel.name}</span>
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${modelSelectorOpen ? "rotate-180" : ""}`} style={{ color: C.textMuted }} />
          </button>

          {modelSelectorOpen && (
            <div className="mt-2 max-h-[300px] overflow-y-auto space-y-3 rounded-lg p-2" style={{ background: C.innerBg, border: `1px solid ${C.border}` }}>
              {(Object.keys(MODEL_CATEGORIES) as ModelCategory[]).map((cat) => {
                const models = grouped[cat];
                if (!models?.length) return null;
                const meta = MODEL_CATEGORIES[cat];
                return (
                  <div key={cat}>
                    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
                      {meta.emoji} {meta.label}
                    </div>
                    <div className="space-y-1">
                      {models.map((m) => {
                        const selected = model === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => { setModel(m.id); setModelSelectorOpen(false); }}
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition"
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

        {/* Media library area */}
        <div className="mt-3 mx-3 flex-1 rounded-xl flex flex-col items-center justify-center gap-3 min-h-[180px]"
          style={{ background: C.innerBg, border: `1px solid ${C.border}` }}
        >
          <p className="text-xs font-medium" style={{ color: C.accent }}>There's nothing yet</p>
          <p className="text-[11px]" style={{ color: C.textMuted }}>Drag and drop your files here</p>
          <div className="flex items-center gap-2 mt-1">
            <button className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: C.panelBg, border: `1px solid ${C.border}` }}>
              <Monitor className="h-3.5 w-3.5" style={{ color: C.textMuted }} />
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: C.panelBg, border: `1px solid ${C.border}` }}>
              <CloudUpload className="h-3.5 w-3.5" style={{ color: C.textMuted }} />
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: C.panelBg, border: `1px solid ${C.border}` }}>
              <Sliders className="h-3.5 w-3.5" style={{ color: C.textMuted }} />
            </button>
          </div>
        </div>

        <div className="p-3" />
      </aside>

      {/* ───── MAIN AREA (canvas + timeline) ───── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header
          className="flex h-[48px] shrink-0 items-center justify-between px-4"
          style={{ background: C.sidebarBg, borderBottom: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5" style={{ background: C.innerBg, border: `1px solid ${C.border}` }}>
              <span className="text-xs" style={{ color: C.textSoft }}>Ratio</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg px-5 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
              style={{ background: C.accent }}
            >
              Export
            </button>
          </div>
        </header>

        {/* Canvas */}
        <main className="flex-1 min-h-0 flex items-center justify-center relative" style={{ background: C.canvasBg }}>
          {generatedImage ? (
            <div className="relative max-w-[80%] max-h-[80%]">
              <img
                src={generatedImage}
                alt="Generated result"
                className="max-w-full max-h-full rounded-lg object-contain"
                style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={() => setGeneratedImage(null)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition hover:brightness-110"
                  style={{ background: C.panelBg, border: `1px solid ${C.borderMid}`, color: C.textSoft }}
                >
                  New
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
                  style={{ background: C.accent }}
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <button
                className="flex h-16 w-16 items-center justify-center rounded-2xl transition hover:brightness-110"
                style={{ background: C.accent }}
              >
                <Plus className="h-7 w-7 text-white" />
              </button>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: C.text }}>Click to upload</p>
                <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>Or drag and drop file here</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: C.panelBg, border: `1px solid ${C.borderMid}` }}>
                  <CloudUpload className="h-4 w-4" style={{ color: C.textMuted }} />
                </button>
                <button className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: C.panelBg, border: `1px solid ${C.borderMid}` }}>
                  <Sliders className="h-4 w-4" style={{ color: C.textMuted }} />
                </button>
              </div>
            </div>
          )}

          {/* Prompt overlay panel — slides from bottom of canvas when no image */}
          {!generatedImage && (
            <div
              className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[560px] rounded-2xl p-4"
              style={{ background: C.panelBg, border: `1px solid ${C.borderMid}`, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
            >
              {/* Mode tabs */}
              <div className="grid grid-cols-2 gap-1.5 rounded-xl p-1" style={{ background: C.innerBg }}>
                {(["create", "variations"] as const).map((entry) => (
                  <button
                    key={entry}
                    onClick={() => setMode(entry)}
                    className="rounded-lg px-3 py-2 text-xs font-semibold transition"
                    style={{
                      background: mode === entry ? C.accent : "transparent",
                      color: mode === entry ? "#fff" : C.textSoft,
                    }}
                  >
                    {entry === "create" ? "Create Image" : "Image Variations"}
                  </button>
                ))}
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Describe what you want to see...'
                className="mt-3 min-h-[80px] w-full resize-none rounded-xl px-3.5 py-3 text-sm outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-cyan-500/40"
                style={{ background: C.innerBg, border: `1px solid ${C.border}`, color: C.text }}
                disabled={isGenerating}
              />

              <div className="mt-3 flex items-center gap-2">
                {/* Output selector */}
                <div className="flex items-center gap-1.5 flex-1">
                  {OUTPUT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setOutput(opt.value)}
                      className="rounded-md px-2 py-1 text-[10px] font-medium transition"
                      style={{
                        background: output === opt.value ? C.accentBg : "transparent",
                        color: output === opt.value ? C.accent : C.textMuted,
                        border: output === opt.value ? `1px solid rgba(6,182,212,0.3)` : `1px solid transparent`,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Count */}
                <div
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                  style={{ background: C.innerBg, border: `1px solid ${C.border}` }}
                >
                  <button onClick={() => setCount(Math.max(1, count - 1))}>
                    <Minus className="h-3 w-3" style={{ color: C.textSoft }} />
                  </button>
                  <span className="text-xs font-medium" style={{ color: C.text }}>{count}</span>
                  <button onClick={() => setCount(Math.min(4, count + 1))}>
                    <Plus className="h-3 w-3" style={{ color: C.textSoft }} />
                  </button>
                </div>

                {/* Generate */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-40 transition hover:brightness-110"
                  style={{ background: C.accent, boxShadow: `0 4px 16px ${C.ctaShadow}` }}
                >
                  {isGenerating ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</>
                  ) : (
                    <><Wand2 className="h-3.5 w-3.5" /> Create</>
                  )}
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Timeline bar */}
        <div
          className="shrink-0"
          style={{ background: C.timelineBg, borderTop: `1px solid ${C.border}` }}
        >
          {/* Timeline controls */}
          <div className="flex h-[36px] items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button className="text-xs" style={{ color: C.textMuted }}>✂</button>
              <button className="text-xs" style={{ color: C.textMuted }}>🗑</button>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: C.accent }}>
                <span className="text-[10px] text-white">▶</span>
              </button>
              <span className="text-[11px] font-mono" style={{ color: C.textMuted }}>00:00:00 | 00:00:00</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: C.textMuted }}>🎤</span>
              <span className="text-[10px]" style={{ color: C.textMuted }}>🔊</span>
            </div>
          </div>

          {/* Timeline ruler */}
          <div className="h-[24px] flex items-end px-4 gap-0" style={{ borderTop: `1px solid ${C.border}` }}>
            {["00:00", "10:00", "20:00", "30:00", "40:00", "50:00"].map((t) => (
              <div key={t} className="flex-1 text-[9px] font-mono" style={{ color: C.textMuted }}>{t}</div>
            ))}
          </div>

          {/* Timeline track */}
          <div
            className="mx-4 mb-3 mt-1 flex items-center justify-center rounded-lg py-4"
            style={{ background: C.innerBg, border: `1px dashed ${C.borderLight}` }}
          >
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" style={{ color: C.textMuted }} />
              <span className="text-xs" style={{ color: C.textMuted }}>Drag and drop media here</span>
            </div>
          </div>
        </div>
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
      : "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20";
  return <span className={`${base} ${colors} rounded-full font-bold uppercase tracking-wider`}>{tag}</span>;
}
