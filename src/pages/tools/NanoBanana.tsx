import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Download,
  Wand2,
  Image as ImageIcon,
  Upload,
  Minus,
  Plus,
  ChevronDown,
  Check,
  Sparkles,
  RotateCcw,
  Play,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/lib/auth";
import { dispatchAuthGate } from "@/utils/authGateEvent";
import { dispatchToolGenStart, dispatchToolGenEnd } from "@/utils/toolGenerationEvent";
import { setPendingAnimateImage } from "@/utils/pendingAnimateImage";
import {
  IMAGE_MODELS,
  MODEL_CATEGORIES,
  getModelsByCategory,
  getModelById,
  type ModelCategory,
} from "@/models/imageModels";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "create" | "variations";

const OUTPUT_OPTIONS = [
  { value: "1:1-1024", label: "1:1", hint: "Square" },
  { value: "4:3-1k", label: "4:3", hint: "Landscape" },
  { value: "16:9-1k", label: "16:9", hint: "Wide" },
  { value: "9:16-1k", label: "9:16", hint: "Portrait" },
];

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
  const navigate = useNavigate();

  const currentModel = useMemo(() => getModelById(model) ?? IMAGE_MODELS[0], [model]);
  const grouped = useMemo(() => getModelsByCategory(), []);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (!user) { dispatchAuthGate(); return; }
    if (creditBalance < (currentModel.creditCost || 1)) { toast.error("Insufficient credits."); return; }
    setIsGenerating(true);
    setGeneratedImage(null);
    dispatchToolGenStart({ toolId: "image-generator", toolName: "Image Generator" });
    let success = false;
    try {
      const deductResult = await deductCredits("vibecoder_gen");
      if (!deductResult.success) { toast.error("Failed to deduct credit"); return; }
      const { data, error } = await supabase.functions.invoke("generate-image", { body: { prompt: prompt.trim(), model } });
      if (error) throw error;
      if (data?.image_url) { setGeneratedImage(data.image_url); toast.success(`${currentModel.name} finished generating.`); success = true; }
      else throw new Error("No image returned");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate image");
    } finally {
      setIsGenerating(false);
      dispatchToolGenEnd({ toolId: "image-generator", toolName: "Image Generator", success });
    }
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
    <div className="h-full w-full" style={{ background: "#08080a" }}>
      <div className="grid h-full grid-cols-[340px_minmax(0,1fr)] overflow-hidden">

        {/* ───── LEFT PANEL ───── */}
        <aside className="h-full overflow-hidden flex flex-col border-r border-white/[0.06]" style={{ background: "#0c0c0f" }}>

          {/* Header */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-white">Image Generator</h1>
                <p className="text-[11px] text-zinc-500">AI-powered creation</p>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">

            {/* Mode tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-xl p-1 bg-white/[0.03] border border-white/[0.04]">
              {(["create", "variations"] as const).map((entry) => (
                <button
                  key={entry}
                  onClick={() => setMode(entry)}
                  className="rounded-lg px-3 py-2 text-[11px] font-semibold transition-all"
                  style={{
                    background: mode === entry
                      ? "linear-gradient(135deg, rgba(6,182,212,0.25), rgba(59,130,246,0.15))"
                      : "transparent",
                    color: mode === entry ? "#fff" : "#71717a",
                    boxShadow: mode === entry ? "0 0 12px rgba(6,182,212,0.15)" : "none",
                    border: mode === entry ? "1px solid rgba(6,182,212,0.2)" : "1px solid transparent",
                  }}
                >
                  {entry === "create" ? "Create Image" : "Variations"}
                </button>
              ))}
            </div>

            {/* Model */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Model</label>
              <button
                onClick={() => setModelSelectorOpen(!modelSelectorOpen)}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] transition bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1]"
              >
                <span className="truncate font-medium text-white">{currentModel.name}</span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform ${modelSelectorOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {modelSelectorOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1.5 overflow-hidden"
                  >
                    <div className="max-h-[220px] overflow-y-auto space-y-2 rounded-xl p-2 bg-[#0a0a0d] border border-white/[0.06]">
                      {(Object.keys(MODEL_CATEGORIES) as ModelCategory[]).map((cat) => {
                        const models = grouped[cat];
                        if (!models?.length) return null;
                        const meta = MODEL_CATEGORIES[cat];
                        return (
                          <div key={cat}>
                            <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-600 px-1">
                              {meta.emoji} {meta.label}
                            </div>
                            <div className="space-y-px">
                              {models.map((m) => {
                                const selected = model === m.id;
                                return (
                                  <button
                                    key={m.id}
                                    onClick={() => { setModel(m.id); setModelSelectorOpen(false); }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] transition hover:bg-white/[0.04]"
                                    style={{
                                      background: selected ? "rgba(6,182,212,0.1)" : undefined,
                                      color: selected ? "#22d3ee" : "#a1a1aa",
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Prompt area */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Prompt</label>

              {/* Upload zone */}
              <div className="rounded-xl p-[1px] mb-2" style={{ border: "1px solid rgba(6,182,212,0.15)", background: "linear-gradient(180deg, rgba(6,182,212,0.08), transparent)" }}>
                <div className="rounded-[11px] px-3 py-2 bg-white/[0.02] flex items-center gap-2">
                  <Upload className="h-3.5 w-3.5 text-cyan-500/60" />
                  <div>
                    <div className="text-[11px] font-medium text-zinc-300">Add references</div>
                    <div className="text-[9px] text-zinc-600">JPEG/PNG/WEBP/GIF, 20MB</div>
                  </div>
                </div>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Describe what you want to see...'
                className="w-full min-h-[100px] resize-none rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 outline-none bg-white/[0.03] border border-white/[0.06] focus:border-cyan-500/30 transition"
                disabled={isGenerating}
              />
            </div>

            {/* Output options */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Size</label>
              <div className="flex gap-1.5">
                {OUTPUT_OPTIONS.map((opt) => {
                  const active = output === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setOutput(opt.value)}
                      className="flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition text-center"
                      style={{
                        background: active ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.02)",
                        color: active ? "#22d3ee" : "#52525b",
                        border: active ? "1px solid rgba(6,182,212,0.25)" : "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <span className="block text-[11px] font-semibold">{opt.label}</span>
                      <span className="block text-[9px] opacity-60">{opt.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky bottom action bar */}
          <div className="px-4 pb-4 pt-2 border-t border-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                <button onClick={() => setCount(Math.max(1, count - 1))} className="px-2.5 py-2 text-zinc-500 hover:text-white transition">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-xs font-medium text-white w-5 text-center">{count}</span>
                <button onClick={() => setCount(Math.min(4, count + 1))} className="px-2.5 py-2 text-zinc-500 hover:text-white transition">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-30 transition-all"
                style={{
                  background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                  boxShadow: isGenerating || !prompt.trim() ? "none" : "0 4px 20px rgba(6,182,212,0.3), 0 0 0 1px rgba(6,182,212,0.2)",
                }}
              >
                {isGenerating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="h-4 w-4" /> Create</>
                )}
              </button>
            </div>
            <div className="mt-1.5 text-center text-[10px] text-zinc-600">
              {currentModel.creditCost || 1} credit{(currentModel.creditCost || 1) > 1 ? "s" : ""} per image · {currentModel.name}
            </div>
          </div>
        </aside>

        {/* ───── RIGHT CANVAS ───── */}
        <main className="relative overflow-hidden flex items-center justify-center" style={{ background: "#08080a" }}>

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Ambient gradient */}
          <div
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(6,182,212,0.06), transparent), radial-gradient(ellipse 40% 40% at 30% 70%, rgba(99,102,241,0.04), transparent)",
            }}
          />

          <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
            <AnimatePresence mode="wait">
              {generatedImage ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative max-w-[90%] max-h-[90%] group"
                >
                  <img
                    src={generatedImage}
                    alt="Generated result"
                    className="max-w-full max-h-full rounded-2xl object-contain"
                    style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(6,182,212,0.08)" }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <button
                      onClick={() => setGeneratedImage(null)}
                      className="rounded-xl px-3.5 py-2 text-[11px] font-medium text-zinc-300 bg-black/60 backdrop-blur-sm border border-white/[0.08] hover:bg-black/80 transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-3 w-3" /> New
                    </button>
                    <button
                      onClick={() => {
                        if (generatedImage) {
                          setPendingAnimateImage(generatedImage);
                          navigate("/studio/video-generator", { replace: true });
                        }
                      }}
                      className="rounded-xl px-3.5 py-2 text-[11px] font-semibold text-white transition flex items-center gap-1.5"
                      style={{ background: "linear-gradient(135deg, #8b5cf6, #d946ef)" }}
                    >
                      <Play className="h-3 w-3" /> Animate
                    </button>
                    <button
                      onClick={handleDownload}
                      className="rounded-xl px-3.5 py-2 text-[11px] font-semibold text-white transition flex items-center gap-1.5"
                      style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
                    >
                      <Download className="h-3 w-3" /> Save
                    </button>
                  </motion.div>
                </motion.div>
              ) : isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-2xl opacity-30" style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }} />
                    <div
                      className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(99,102,241,0.15))", border: "1px solid rgba(6,182,212,0.2)" }}
                    >
                      <Loader2 className="w-9 h-9 text-cyan-400 animate-spin" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-medium text-white mb-1">Creating your image…</p>
                    <p className="text-[12px] text-zinc-500">Using {currentModel.name}</p>
                  </div>
                  <div className="w-48 h-1 rounded-full overflow-hidden bg-white/[0.04]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #06b6d4, #8b5cf6)" }}
                      initial={{ width: "0%" }}
                      animate={{ width: "85%" }}
                      transition={{ duration: 12, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-5 text-center max-w-sm"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <ImageIcon className="h-7 w-7 text-zinc-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-300 mb-1.5">
                      Create something amazing
                    </h2>
                    <p className="text-[13px] leading-relaxed text-zinc-600">
                      Write a prompt and hit Create to generate images with AI
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function TagBadge({ tag, small = false }: { tag: string; small?: boolean }) {
  const base = small ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[10px]";
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
