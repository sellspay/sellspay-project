import { useState, useEffect } from "react";
import {
  Loader2,
  Download,
  Play,
  Upload,
  Sparkles,
  RotateCcw,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/lib/auth";
import { dispatchAuthGate } from "@/utils/authGateEvent";
import { dispatchToolGenStart, dispatchToolGenEnd } from "@/utils/toolGenerationEvent";
import { consumePendingAnimateImage } from "@/utils/pendingAnimateImage";
import { saveToolAsset } from "@/utils/saveToolAsset";
import { motion, AnimatePresence } from "framer-motion";

export default function ImageAnimator() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [duration, setDuration] = useState<"5" | "10">("5");
  const { deductCredits, credits: creditBalance } = useSubscription();
  const { user } = useAuth();

  // Consume pending image from Image Generator on mount
  useEffect(() => {
    const pending = consumePendingAnimateImage();
    if (pending) setSourceImage(pending);
  }, []);

  const handleGenerate = async () => {
    if (!sourceImage) { toast.error("Please add a source image"); return; }
    if (!prompt.trim()) { toast.error("Please describe the animation"); return; }
    if (!user) { dispatchAuthGate(); return; }
    if (creditBalance < 50) { toast.error("Insufficient credits. Video generation costs 50 credits."); return; }

    setIsGenerating(true);
    setGeneratedVideo(null);
    dispatchToolGenStart({ toolId: "video-generator", toolName: "Image Animator" });
    let success = false;
    let resultUrl: string | undefined;

    try {
      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: {
          prompt: prompt.trim(),
          image_url: sourceImage,
          duration,
          aspect_ratio: "16:9",
        },
      });

      if (error) throw error;
      if (data?.video_url) {
        setGeneratedVideo(data.video_url);
        toast.success("Animation complete!");
        success = true;
        resultUrl = data.video_url;
        saveToolAsset({ userId: user!.id, type: "video", storageUrl: data.video_url, filename: `animation-${Date.now()}.mp4`, metadata: { prompt: prompt.trim(), duration } as any });
      } else {
        throw new Error("No video returned");
      }
    } catch (error) {
      console.error("Animation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to animate image");
    } finally {
      setIsGenerating(false);
      dispatchToolGenEnd({ toolId: "video-generator", toolName: "Image Animator", success, assetUrl: resultUrl, assetType: "video" });
    }
  };

  const handleDownload = async () => {
    if (!generatedVideo) return;
    try {
      const response = await fetch(generatedVideo);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `animated-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Video downloaded!");
    } catch {
      toast.error("Failed to download video");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("File too large. Max 20MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setSourceImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full w-full" style={{ background: "#08080a" }}>
      <div className="grid h-full grid-cols-[340px_minmax(0,1fr)] overflow-hidden">

        {/* ───── LEFT PANEL ───── */}
        <aside className="h-full overflow-hidden flex flex-col border-r border-white/[0.06]" style={{ background: "#0c0c0f" }}>
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20">
                <Play className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-white">Image Animator</h1>
                <p className="text-[11px] text-zinc-500">Bring images to life</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">

            {/* Source image */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Source Image</label>
              {sourceImage ? (
                <div className="relative rounded-xl overflow-hidden border border-white/[0.06]">
                  <img src={sourceImage} alt="Source" className="w-full h-40 object-cover" />
                  <button
                    onClick={() => setSourceImage(null)}
                    className="absolute top-2 right-2 rounded-lg px-2 py-1 text-[10px] font-medium text-white bg-black/60 backdrop-blur-sm border border-white/[0.1] hover:bg-black/80 transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 rounded-xl p-6 cursor-pointer border border-dashed border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.04] transition">
                  <Upload className="h-6 w-6 text-zinc-500" />
                  <span className="text-[12px] text-zinc-400">Upload an image to animate</span>
                  <span className="text-[10px] text-zinc-600">JPEG/PNG/WEBP, 20MB max</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>

            {/* Prompt */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Animation Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Describe how you want the image to move, e.g. "Camera slowly zooms in, hair blowing in the wind"'
                className="w-full min-h-[100px] resize-none rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 outline-none bg-white/[0.03] border border-white/[0.06] focus:border-violet-500/30 transition"
                disabled={isGenerating}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Duration</label>
              <div className="flex gap-1.5">
                {(["5", "10"] as const).map((d) => {
                  const active = duration === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className="flex-1 rounded-lg px-3 py-2 text-[12px] font-medium transition text-center"
                      style={{
                        background: active ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.02)",
                        color: active ? "#a78bfa" : "#52525b",
                        border: active ? "1px solid rgba(139,92,246,0.25)" : "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      {d}s
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky action bar */}
          <div className="px-4 pb-4 pt-2 border-t border-white/[0.04]">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !sourceImage || !prompt.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-30 transition-all"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #d946ef)",
                boxShadow: isGenerating || !sourceImage || !prompt.trim() ? "none" : "0 4px 20px rgba(139,92,246,0.3), 0 0 0 1px rgba(139,92,246,0.2)",
              }}
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Animating...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Animate</>
              )}
            </button>
            <div className="mt-1.5 text-center text-[10px] text-zinc-600">
              50 credits per animation
            </div>
          </div>
        </aside>

        {/* ───── RIGHT CANVAS ───── */}
        <main className="relative overflow-hidden flex items-center justify-center" style={{ background: "#08080a" }}>
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(139,92,246,0.06), transparent), radial-gradient(ellipse 40% 40% at 30% 70%, rgba(217,70,239,0.04), transparent)",
            }}
          />

          <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
            <AnimatePresence mode="wait">
              {generatedVideo ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative max-w-[90%] max-h-[90%] group"
                >
                  <video
                    src={generatedVideo}
                    controls
                    autoPlay
                    loop
                    className="max-w-full max-h-full rounded-2xl object-contain"
                    style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.08)" }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <button
                      onClick={() => { setGeneratedVideo(null); }}
                      className="rounded-xl px-3.5 py-2 text-[11px] font-medium text-zinc-300 bg-black/60 backdrop-blur-sm border border-white/[0.08] hover:bg-black/80 transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-3 w-3" /> New
                    </button>
                    <button
                      onClick={handleDownload}
                      className="rounded-xl px-3.5 py-2 text-[11px] font-semibold text-white transition flex items-center gap-1.5"
                      style={{ background: "linear-gradient(135deg, #8b5cf6, #d946ef)" }}
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
                    <div className="absolute inset-0 rounded-full blur-2xl opacity-30" style={{ background: "linear-gradient(135deg, #8b5cf6, #d946ef)" }} />
                    <div
                      className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(217,70,239,0.15))", border: "1px solid rgba(139,92,246,0.2)" }}
                    >
                      <Loader2 className="w-9 h-9 text-violet-400 animate-spin" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-medium text-white mb-1">Animating your image…</p>
                    <p className="text-[12px] text-zinc-500">This may take up to a minute</p>
                  </div>
                  <div className="w-48 h-1 rounded-full overflow-hidden bg-white/[0.04]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #8b5cf6, #d946ef)" }}
                      initial={{ width: "0%" }}
                      animate={{ width: "80%" }}
                      transition={{ duration: 45, ease: "easeOut" }}
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
                    <Play className="h-7 w-7 text-zinc-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-300 mb-1.5">
                      Animate any image
                    </h2>
                    <p className="text-[13px] leading-relaxed text-zinc-600">
                      Upload an image, describe the motion, and bring it to life with AI video
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
