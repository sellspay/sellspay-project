import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Loader2,
  Download,
  Play,
  Upload,
  Sparkles,
  RotateCcw,
  Image as ImageIcon,
} from "lucide-react";
import { Film } from "lucide-react";
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
  const location = useLocation();
  const [mode, setMode] = useState<"image" | "video-ref">("image");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceVideo, setSourceVideo] = useState<string | null>(null);
  const [sourceVideoName, setSourceVideoName] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [duration, setDuration] = useState<"5" | "10">("5");
  const { deductCredits, credits: creditBalance } = useSubscription();
  const { user } = useAuth();

  // If navigated here with a viewAssetUrl, show it
  useEffect(() => {
    const state = location.state as { viewAssetUrl?: string; prefillPrompt?: string } | null;
    if (state?.viewAssetUrl) {
      setGeneratedVideo(state.viewAssetUrl);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  // Consume pending image from Image Generator on mount
  useEffect(() => {
    const pending = consumePendingAnimateImage();
    if (pending) setSourceImage(pending);
  }, []);

  // Upload a base64 image to storage and return a public URL
  const uploadImageToStorage = async (base64: string): Promise<string> => {
    // Convert base64 to blob
    const res = await fetch(base64);
    const blob = await res.blob();
    const ext = blob.type.includes("png") ? "png" : "jpg";
    const path = `animate-src/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage.from("tool-assets").upload(path, blob, { contentType: blob.type });
    if (error) throw new Error("Failed to upload source image");
    const { data: urlData } = supabase.storage.from("tool-assets").getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const pollForVideo = async (requestId: string): Promise<string> => {
    const maxPollMs = 300_000; // 5 min client-side poll
    const interval = 6_000;
    const start = Date.now();

    while (Date.now() - start < maxPollMs) {
      await new Promise(r => setTimeout(r, interval));
      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: { action: "poll", request_id: requestId },
      });
      if (error) continue;
      if (data?.status === "completed" && data?.video_url) return data.video_url;
      if (data?.status === "failed") throw new Error(data.error || "Video generation failed");
    }
    throw new Error("Video generation timed out. Please try again.");
  };

  const handleGenerate = async () => {
    if (!sourceImage) { toast.error("Please add a source image"); return; }
    if (mode === "video-ref" && !sourceVideo) { toast.error("Please upload a reference video"); return; }
    if (!prompt.trim()) { toast.error("Please describe the animation"); return; }
    if (!user) { dispatchAuthGate(); return; }
    if (creditBalance < 50) { toast.error("Insufficient credits. Video generation costs 50 credits."); return; }

    setIsGenerating(true);
    setGeneratedVideo(null);
    dispatchToolGenStart({ toolId: "video-generator", toolName: "Image Animator" });
    let success = false;
    let resultUrl: string | undefined;

    try {
      // Upload base64 image to storage first to avoid massive payloads
      toast.info("Uploading source image...");
      const imageUrl = await uploadImageToStorage(sourceImage);

      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: {
          prompt: prompt.trim(),
          image_url: imageUrl,
          video_url: mode === "video-ref" ? sourceVideo : undefined,
          mode: mode === "video-ref" ? "video-reference" : "image-to-video",
          duration,
          aspect_ratio: "16:9",
        },
      });

      if (error) throw error;

      let videoUrl = data?.video_url;

      // If still processing, poll for result
      if (data?.status === "processing" && data?.request_id) {
        toast.info("Video is generating... this may take 2-4 minutes.");
        videoUrl = await pollForVideo(data.request_id);
      }

      if (videoUrl) {
        setGeneratedVideo(videoUrl);
        toast.success("Animation complete!");
        success = true;
        resultUrl = videoUrl;
        saveToolAsset({ userId: user!.id, type: "video", storageUrl: videoUrl, filename: `animation-${Date.now()}.mp4`, metadata: { prompt: prompt.trim(), duration } as any });
      } else if (!data?.video_url && !data?.request_id) {
        throw new Error(data?.error || "No video returned");
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

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error("File too large. Max 200MB."); return; }
    if (!file.type.startsWith("video/")) { toast.error("Please upload a video file."); return; }
    setSourceVideoName(file.name);
    const upload = async () => {
      const path = `video-ref/${Date.now()}-${file.name}`;
      const { data: upData, error: upErr } = await supabase.storage.from("tool-assets").upload(path, file, { contentType: file.type });
      if (upErr) { toast.error("Failed to upload video"); setSourceVideoName(null); return; }
      const { data: urlData } = supabase.storage.from("tool-assets").getPublicUrl(upData.path);
      setSourceVideo(urlData.publicUrl);
      toast.success("Video uploaded!");
    };
    upload();
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

            {/* Mode selector */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Source Type</label>
              <div className="flex gap-1.5">
                {([
                  { id: "image" as const, label: "Image", Icon: ImageIcon },
                  { id: "video-ref" as const, label: "Ref Video", Icon: Film },
                ]).map(({ id, label, Icon }) => {
                  const active = mode === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setMode(id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition text-center"
                      style={{
                        background: active ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.02)",
                        color: active ? "#a78bfa" : "#52525b",
                        border: active ? "1px solid rgba(139,92,246,0.25)" : "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source image — always shown in both modes */}
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
                  <span className="text-[12px] text-zinc-400">Upload the image to animate</span>
                  <span className="text-[10px] text-zinc-600">JPEG/PNG/WEBP, 20MB max</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>

            {/* Reference video — only in video-ref mode */}
            {mode === "video-ref" && <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Motion Reference Video</label>
              <p className="text-[10px] text-zinc-600 mb-1.5">Upload a video to guide the motion style</p>
              {sourceVideo ? (
                <div className="relative rounded-xl overflow-hidden border border-white/[0.06]">
                  <video src={sourceVideo} className="w-full h-40 object-cover" muted />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-[10px] text-zinc-300 truncate">{sourceVideoName}</p>
                  </div>
                  <button
                    onClick={() => { setSourceVideo(null); setSourceVideoName(null); }}
                    className="absolute top-2 right-2 rounded-lg px-2 py-1 text-[10px] font-medium text-white bg-black/60 backdrop-blur-sm border border-white/[0.1] hover:bg-black/80 transition"
                  >
                    Remove
                  </button>
                </div>
              ) : sourceVideoName ? (
                <div className="flex items-center gap-2 rounded-xl p-4 border border-white/[0.06] bg-white/[0.02]">
                  <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                  <span className="text-[12px] text-zinc-400">Uploading {sourceVideoName}…</span>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 rounded-xl p-6 cursor-pointer border border-dashed border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.04] transition">
                  <Film className="h-6 w-6 text-zinc-500" />
                  <span className="text-[12px] text-zinc-400">Upload a motion reference video</span>
                  <span className="text-[10px] text-zinc-600">MP4/MOV, 3-10s, max 200MB</span>
                  <input type="file" accept="video/mp4,video/quicktime,video/*" className="hidden" onChange={handleVideoUpload} />
                </label>
              )}
            </div>}

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
              disabled={isGenerating || !sourceImage || (mode === "video-ref" && !sourceVideo) || !prompt.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-30 transition-all"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #d946ef)",
                boxShadow: isGenerating || !sourceImage || (mode === "video-ref" && !sourceVideo) || !prompt.trim() ? "none" : "0 4px 20px rgba(139,92,246,0.3), 0 0 0 1px rgba(139,92,246,0.2)",
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
