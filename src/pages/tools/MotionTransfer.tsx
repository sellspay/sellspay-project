import { useState } from "react";
import {
  Loader2,
  Download,
  Play,
  Upload,
  Sparkles,
  RotateCcw,
  Film,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/lib/auth";
import { dispatchAuthGate } from "@/utils/authGateEvent";
import { dispatchToolGenStart, dispatchToolGenEnd } from "@/utils/toolGenerationEvent";
import { saveToolAsset } from "@/utils/saveToolAsset";
import { motion, AnimatePresence } from "framer-motion";

const VIDEO_COST = 50;

export default function MotionTransfer() {
  const [sourceVideo, setSourceVideo] = useState<string | null>(null);
  const [sourceVideoName, setSourceVideoName] = useState<string | null>(null);
  const [referenceVideo, setReferenceVideo] = useState<string | null>(null);
  const [referenceVideoName, setReferenceVideoName] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [duration, setDuration] = useState<"5" | "10">("5");
  const { credits: creditBalance } = useSubscription();
  const { user } = useAuth();

  const uploadVideo = async (file: File, folder: string): Promise<string> => {
    const path = `${folder}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("tool-assets")
      .upload(path, file, { contentType: file.type });
    if (error) throw new Error("Failed to upload video");
    const { data: urlData } = supabase.storage.from("tool-assets").getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const pollForVideo = async (requestId: string): Promise<string> => {
    const maxPollMs = 300_000;
    const interval = 6_000;
    const start = Date.now();
    while (Date.now() - start < maxPollMs) {
      await new Promise((r) => setTimeout(r, interval));
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
    if (!sourceVideo) { toast.error("Please upload a source video"); return; }
    if (!referenceVideo) { toast.error("Please upload a motion reference video"); return; }
    if (!prompt.trim()) { toast.error("Please describe the transfer"); return; }
    if (!user) { dispatchAuthGate(); return; }
    if (creditBalance < VIDEO_COST) { toast.error(`Insufficient credits. Motion transfer costs ${VIDEO_COST} credits.`); return; }

    setIsGenerating(true);
    setGeneratedVideo(null);
    dispatchToolGenStart({ toolId: "motion-transfer", toolName: "Motion Transfer" });
    let success = false;
    let resultUrl: string | undefined;

    try {
      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: {
          prompt: prompt.trim(),
          video_url: referenceVideo,
          source_video_url: sourceVideo,
          mode: "motion-transfer",
          duration,
          aspect_ratio: "16:9",
        },
      });

      if (error) throw error;

      let videoUrl = data?.video_url;

      if (data?.status === "processing" && data?.request_id) {
        toast.info("Transferring motion... this may take 2-4 minutes.");
        videoUrl = await pollForVideo(data.request_id);
      }

      if (videoUrl) {
        setGeneratedVideo(videoUrl);
        toast.success("Motion transfer complete!");
        success = true;
        resultUrl = videoUrl;
        saveToolAsset({
          userId: user!.id,
          type: "video",
          storageUrl: videoUrl,
          filename: `motion-transfer-${Date.now()}.mp4`,
          metadata: { prompt: prompt.trim(), duration } as any,
        });
      } else if (!data?.video_url && !data?.request_id) {
        throw new Error(data?.error || "No video returned");
      }
    } catch (error) {
      console.error("Motion transfer error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to transfer motion");
    } finally {
      setIsGenerating(false);
      dispatchToolGenEnd({ toolId: "motion-transfer", toolName: "Motion Transfer", success, assetUrl: resultUrl, assetType: "video" });
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
      a.download = `motion-transfer-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Video downloaded!");
    } catch {
      toast.error("Failed to download video");
    }
  };

  const handleFileUpload = (
    setter: (url: string) => void,
    nameSetter: (name: string | null) => void,
    folder: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error("File too large. Max 200MB."); return; }
    if (!file.type.startsWith("video/")) { toast.error("Please upload a video file."); return; }
    nameSetter(file.name);
    const doUpload = async () => {
      try {
        const url = await uploadVideo(file, folder);
        setter(url);
        nameSetter(file.name);
        toast.success("Video uploaded!");
      } catch {
        toast.error("Failed to upload video");
        nameSetter(null);
      }
    };
    doUpload();
  };

  return (
    <div className="h-full w-full" style={{ background: "#08080a" }}>
      <div className="grid h-full grid-cols-[340px_minmax(0,1fr)] overflow-hidden">

        {/* ───── LEFT PANEL ───── */}
        <aside className="h-full overflow-hidden flex flex-col border-r border-white/[0.06]" style={{ background: "#0c0c0f" }}>
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
                <ArrowRight className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-white">Motion Transfer</h1>
                <p className="text-[11px] text-zinc-500">Transfer motion between videos</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">

            {/* Source Video */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Source Video</label>
              <p className="text-[10px] text-zinc-600 mb-1.5">The video you want to transform</p>
              {sourceVideo ? (
                <div className="relative rounded-xl overflow-hidden border border-white/[0.06]">
                  <video src={sourceVideo} className="w-full h-36 object-cover" muted />
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
                  <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                  <span className="text-[12px] text-zinc-400">Uploading {sourceVideoName}…</span>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 rounded-xl p-5 cursor-pointer border border-dashed border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.04] transition">
                  <Upload className="h-5 w-5 text-zinc-500" />
                  <span className="text-[12px] text-zinc-400">Upload source video</span>
                  <span className="text-[10px] text-zinc-600">MP4/MOV, max 200MB</span>
                  <input type="file" accept="video/mp4,video/quicktime,video/*" className="hidden" onChange={handleFileUpload(setSourceVideo, setSourceVideoName, "motion-src")} />
                </label>
              )}
            </div>

            {/* Reference Video */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Motion Reference</label>
              <p className="text-[10px] text-zinc-600 mb-1.5">The video whose motion/style to copy</p>
              {referenceVideo ? (
                <div className="relative rounded-xl overflow-hidden border border-white/[0.06]">
                  <video src={referenceVideo} className="w-full h-36 object-cover" muted />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-[10px] text-zinc-300 truncate">{referenceVideoName}</p>
                  </div>
                  <button
                    onClick={() => { setReferenceVideo(null); setReferenceVideoName(null); }}
                    className="absolute top-2 right-2 rounded-lg px-2 py-1 text-[10px] font-medium text-white bg-black/60 backdrop-blur-sm border border-white/[0.1] hover:bg-black/80 transition"
                  >
                    Remove
                  </button>
                </div>
              ) : referenceVideoName ? (
                <div className="flex items-center gap-2 rounded-xl p-4 border border-white/[0.06] bg-white/[0.02]">
                  <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                  <span className="text-[12px] text-zinc-400">Uploading {referenceVideoName}…</span>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 rounded-xl p-5 cursor-pointer border border-dashed border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.04] transition">
                  <Film className="h-5 w-5 text-zinc-500" />
                  <span className="text-[12px] text-zinc-400">Upload motion reference</span>
                  <span className="text-[10px] text-zinc-600">MP4/MOV, 3-10s, max 200MB</span>
                  <input type="file" accept="video/mp4,video/quicktime,video/*" className="hidden" onChange={handleFileUpload(setReferenceVideo, setReferenceVideoName, "motion-ref")} />
                </label>
              )}
            </div>

            {/* Prompt */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Transfer Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Describe the motion transfer, e.g. "Apply the dance movements to the character while keeping the original style"'
                className="w-full min-h-[90px] resize-none rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 outline-none bg-white/[0.03] border border-white/[0.06] focus:border-cyan-500/30 transition"
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
                        background: active ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.02)",
                        color: active ? "#67e8f9" : "#52525b",
                        border: active ? "1px solid rgba(6,182,212,0.25)" : "1px solid rgba(255,255,255,0.04)",
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
              disabled={isGenerating || !sourceVideo || !referenceVideo || !prompt.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-30 transition-all"
              style={{
                background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                boxShadow: isGenerating || !sourceVideo || !referenceVideo || !prompt.trim() ? "none" : "0 4px 20px rgba(6,182,212,0.3), 0 0 0 1px rgba(6,182,212,0.2)",
              }}
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Transferring...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Transfer Motion</>
              )}
            </button>
            <div className="mt-1.5 text-center text-[10px] text-zinc-600">
              {VIDEO_COST} credits per transfer
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
              background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(6,182,212,0.06), transparent), radial-gradient(ellipse 40% 40% at 30% 70%, rgba(59,130,246,0.04), transparent)",
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
                    className="max-h-[70vh] rounded-2xl shadow-2xl"
                    style={{ boxShadow: "0 0 80px rgba(6,182,212,0.15)" }}
                  />
                  <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-white bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md border border-white/[0.08] transition"
                    >
                      <Download className="h-3 w-3" /> Download
                    </button>
                    <button
                      onClick={() => { setGeneratedVideo(null); }}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-white bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md border border-white/[0.08] transition"
                    >
                      <RotateCcw className="h-3 w-3" /> New
                    </button>
                  </div>
                </motion.div>
              ) : isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full border-2 border-cyan-500/20 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                    </div>
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20 border-2 border-cyan-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">Transferring motion...</p>
                    <p className="text-[11px] text-zinc-500 mt-1">This typically takes 2-4 minutes</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 text-center"
                >
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center border border-cyan-500/10">
                    <ArrowRight className="h-8 w-8 text-cyan-500/40" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-400">Upload two videos to get started</p>
                    <p className="text-[11px] text-zinc-600 mt-1">
                      Source video + motion reference = transformed result
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
