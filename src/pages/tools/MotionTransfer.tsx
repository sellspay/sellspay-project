import { useState, useRef } from "react";
import {
  Loader2,
  Download,
  Upload,
  Sparkles,
  RotateCcw,
  Film,
  Play,
  Pause,
  Video,
  Zap,
  ArrowRightLeft,
  Check,
  ChevronDown,
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

const EXAMPLE_PAIRS = [
  { label: "Dance Transfer", desc: "Apply choreography from one performer to another", emoji: "💃" },
  { label: "Action Sync", desc: "Transfer athletic movements to a different character", emoji: "🏃" },
  { label: "Facial Motion", desc: "Map facial expressions and lip movements", emoji: "🎭" },
  { label: "Camera Motion", desc: "Copy camera movement patterns between scenes", emoji: "🎬" },
];

export default function MotionTransfer() {
  const [sourceVideo, setSourceVideo] = useState<string | null>(null);
  const [sourceVideoName, setSourceVideoName] = useState<string | null>(null);
  const [referenceVideo, setReferenceVideo] = useState<string | null>(null);
  const [referenceVideoName, setReferenceVideoName] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [duration, setDuration] = useState<"5" | "10">("5");
  const [motionStrength, setMotionStrength] = useState<"exact" | "partial">("exact");
  const [isSourcePlaying, setIsSourcePlaying] = useState(false);
  const [isRefPlaying, setIsRefPlaying] = useState(false);
  const sourceVideoRef = useRef<HTMLVideoElement>(null);
  const refVideoRef = useRef<HTMLVideoElement>(null);
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

  const toggleSourcePlay = () => {
    if (!sourceVideoRef.current) return;
    if (isSourcePlaying) sourceVideoRef.current.pause();
    else sourceVideoRef.current.play();
    setIsSourcePlaying(!isSourcePlaying);
  };

  const toggleRefPlay = () => {
    if (!refVideoRef.current) return;
    if (isRefPlaying) refVideoRef.current.pause();
    else refVideoRef.current.play();
    setIsRefPlaying(!isRefPlaying);
  };

  // Step completion state
  const step1Done = !!sourceVideo;
  const step2Done = !!referenceVideo;
  const step3Done = !!prompt.trim();

  return (
    <div className="h-full w-full overflow-hidden" style={{ background: "#050507" }}>
      <div className="grid h-full grid-cols-[380px_minmax(0,1fr)] overflow-hidden">

        {/* ═══════ LEFT: STEP-BASED WORKFLOW PANEL ═══════ */}
        <aside className="h-full overflow-hidden flex flex-col border-r border-white/[0.06]" style={{ background: "#09090b" }}>

          {/* Header with accent gradient */}
          <div className="relative px-5 pt-5 pb-4 overflow-hidden">
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 80% 100% at 50% -20%, rgba(168,85,247,0.15), transparent 70%)",
              }}
            />
            <div className="relative flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center border border-purple-500/30"
                style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.15))" }}>
                <ArrowRightLeft className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-[16px] font-bold text-white tracking-tight">Motion-Sync</h1>
                <p className="text-[11px] text-purple-300/60">Video-to-Video Motion Transfer</p>
              </div>
            </div>
            {/* Model badge */}
            <div className="relative mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="h-4 w-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Zap className="h-2.5 w-2.5 text-white" />
              </div>
              <span className="text-[11px] text-zinc-400">Kling v2 Master</span>
              <span className="ml-auto text-[10px] text-purple-400/60 font-medium">Video-to-Video</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-4">

            {/* ── STEP 1: Source Video ── */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${step1Done ? "bg-purple-500 text-white" : "bg-white/[0.06] text-zinc-500"}`}>
                  {step1Done ? <Check className="h-3 w-3" /> : "1"}
                </div>
                <span className="text-[12px] font-semibold text-white">Select Your Source</span>
                <span className="text-[10px] text-zinc-600 ml-auto">The video to transform</span>
              </div>

              {sourceVideo ? (
                <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 group">
                  <video
                    ref={sourceVideoRef}
                    src={sourceVideo}
                    className="w-full h-40 object-cover"
                    muted
                    loop
                    onEnded={() => setIsSourcePlaying(false)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {/* Play overlay */}
                  <button onClick={toggleSourcePlay} className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transition">
                      {isSourcePlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white ml-0.5" />}
                    </div>
                  </button>
                  <div className="absolute bottom-0 inset-x-0 p-2.5 flex items-end justify-between">
                    <p className="text-[10px] text-zinc-300 truncate max-w-[70%]">{sourceVideoName}</p>
                    <button
                      onClick={() => { setSourceVideo(null); setSourceVideoName(null); setIsSourcePlaying(false); }}
                      className="rounded-lg px-2 py-0.5 text-[10px] font-medium text-red-400 bg-black/50 backdrop-blur-sm border border-red-500/20 hover:border-red-500/40 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : sourceVideoName ? (
                <div className="flex items-center gap-2 rounded-2xl p-5 border border-purple-500/20 bg-purple-500/[0.03]">
                  <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                  <span className="text-[12px] text-purple-300/60">Uploading {sourceVideoName}…</span>
                </div>
              ) : (
                <label className="relative flex flex-col items-center gap-2 rounded-2xl p-6 cursor-pointer border-2 border-dashed border-purple-500/15 bg-purple-500/[0.02] hover:bg-purple-500/[0.05] hover:border-purple-500/30 transition-all group">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center border border-purple-500/10 group-hover:scale-110 transition-transform">
                    <Upload className="h-5 w-5 text-purple-400/60" />
                  </div>
                  <span className="text-[12px] text-zinc-400 font-medium">Drop or click to upload</span>
                  <span className="text-[10px] text-zinc-600">MP4 / MOV · Max 200MB</span>
                  <input type="file" accept="video/mp4,video/quicktime,video/*" className="hidden" onChange={handleFileUpload(setSourceVideo, setSourceVideoName, "motion-src")} />
                </label>
              )}
            </div>

            {/* ── Connector Arrow ── */}
            <div className="flex items-center justify-center py-1">
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-px h-3 bg-gradient-to-b from-purple-500/30 to-pink-500/30" />
                <ArrowRightLeft className="h-3.5 w-3.5 text-purple-400/40 rotate-90" />
                <div className="w-px h-3 bg-gradient-to-b from-pink-500/30 to-purple-500/30" />
              </div>
            </div>

            {/* ── STEP 2: Motion Reference ── */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${step2Done ? "bg-pink-500 text-white" : "bg-white/[0.06] text-zinc-500"}`}>
                  {step2Done ? <Check className="h-3 w-3" /> : "2"}
                </div>
                <span className="text-[12px] font-semibold text-white">Add Motion Reference</span>
                <span className="text-[10px] text-zinc-600 ml-auto">Motion to copy</span>
              </div>

              {referenceVideo ? (
                <div className="relative rounded-2xl overflow-hidden border border-pink-500/20 group">
                  <video
                    ref={refVideoRef}
                    src={referenceVideo}
                    className="w-full h-40 object-cover"
                    muted
                    loop
                    onEnded={() => setIsRefPlaying(false)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <button onClick={toggleRefPlay} className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transition">
                      {isRefPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white ml-0.5" />}
                    </div>
                  </button>
                  <div className="absolute bottom-0 inset-x-0 p-2.5 flex items-end justify-between">
                    <p className="text-[10px] text-zinc-300 truncate max-w-[70%]">{referenceVideoName}</p>
                    <button
                      onClick={() => { setReferenceVideo(null); setReferenceVideoName(null); setIsRefPlaying(false); }}
                      className="rounded-lg px-2 py-0.5 text-[10px] font-medium text-red-400 bg-black/50 backdrop-blur-sm border border-red-500/20 hover:border-red-500/40 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : referenceVideoName ? (
                <div className="flex items-center gap-2 rounded-2xl p-5 border border-pink-500/20 bg-pink-500/[0.03]">
                  <Loader2 className="h-4 w-4 text-pink-400 animate-spin" />
                  <span className="text-[12px] text-pink-300/60">Uploading {referenceVideoName}…</span>
                </div>
              ) : (
                <label className="relative flex flex-col items-center gap-2 rounded-2xl p-6 cursor-pointer border-2 border-dashed border-pink-500/15 bg-pink-500/[0.02] hover:bg-pink-500/[0.05] hover:border-pink-500/30 transition-all group">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 flex items-center justify-center border border-pink-500/10 group-hover:scale-110 transition-transform">
                    <Film className="h-5 w-5 text-pink-400/60" />
                  </div>
                  <span className="text-[12px] text-zinc-400 font-medium">Upload motion reference</span>
                  <span className="text-[10px] text-zinc-600">MP4 / MOV · 3–10s recommended</span>
                  <input type="file" accept="video/mp4,video/quicktime,video/*" className="hidden" onChange={handleFileUpload(setReferenceVideo, setReferenceVideoName, "motion-ref")} />
                </label>
              )}
            </div>

            {/* ── STEP 3: Prompt ── */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${step3Done ? "bg-violet-500 text-white" : "bg-white/[0.06] text-zinc-500"}`}>
                  {step3Done ? <Check className="h-3 w-3" /> : "3"}
                </div>
                <span className="text-[12px] font-semibold text-white">Describe the Transfer</span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`e.g. "Apply the dance choreography to the character while preserving the original lighting and style"`}
                className="w-full min-h-[80px] resize-none rounded-xl px-3.5 py-3 text-[13px] text-white placeholder:text-zinc-600 outline-none bg-white/[0.03] border border-white/[0.06] focus:border-purple-500/30 transition"
                disabled={isGenerating}
              />
            </div>

            {/* ── Controls Row ── */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Motion Strength */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Motion Control</label>
                <div className="flex gap-1">
                  {(["exact", "partial"] as const).map((s) => {
                    const active = motionStrength === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setMotionStrength(s)}
                        className="flex-1 rounded-lg px-2 py-2 text-[11px] font-medium transition text-center capitalize"
                        style={{
                          background: active ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.02)",
                          color: active ? "#c084fc" : "#52525b",
                          border: active ? "1px solid rgba(168,85,247,0.25)" : "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Duration</label>
                <div className="flex gap-1">
                  {(["5", "10"] as const).map((d) => {
                    const active = duration === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className="flex-1 rounded-lg px-2 py-2 text-[11px] font-medium transition text-center"
                        style={{
                          background: active ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.02)",
                          color: active ? "#c084fc" : "#52525b",
                          border: active ? "1px solid rgba(168,85,247,0.25)" : "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        {d}s
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Sticky CTA ── */}
          <div className="px-4 pb-4 pt-3 border-t border-white/[0.04]">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !sourceVideo || !referenceVideo || !prompt.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-30 transition-all"
              style={{
                background: isGenerating || !sourceVideo || !referenceVideo || !prompt.trim()
                  ? "rgba(168,85,247,0.15)"
                  : "linear-gradient(135deg, #a855f7, #ec4899)",
                boxShadow: isGenerating || !sourceVideo || !referenceVideo || !prompt.trim()
                  ? "none"
                  : "0 4px 24px rgba(168,85,247,0.35), 0 0 0 1px rgba(168,85,247,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Syncing Motion…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Transfer Motion</>
              )}
            </button>
            <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] text-zinc-600">
              <Zap className="h-3 w-3" />
              {VIDEO_COST} credits per transfer
            </div>
          </div>
        </aside>

        {/* ═══════ RIGHT: MARKETING SHOWCASE + RESULT CANVAS ═══════ */}
        <main className="relative overflow-y-auto overflow-x-hidden" style={{ background: "#050507" }}>

          <AnimatePresence mode="wait">
            {generatedVideo ? (
              /* ── Result View ── */
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-full p-8"
              >
                <div className="relative group max-w-3xl w-full">
                  <video
                    src={generatedVideo}
                    controls
                    autoPlay
                    loop
                    className="w-full rounded-2xl shadow-2xl"
                    style={{ boxShadow: "0 0 100px rgba(168,85,247,0.15)" }}
                  />
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition"
                    >
                      <Download className="h-3.5 w-3.5" /> Download MP4
                    </button>
                    <button
                      onClick={() => setGeneratedVideo(null)}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Create Another
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : isGenerating ? (
              /* ── Generating State ── */
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-full gap-6"
              >
                <div className="relative">
                  <div className="h-24 w-24 rounded-full flex items-center justify-center"
                    style={{ background: "conic-gradient(from 0deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3), rgba(168,85,247,0.3))" }}>
                    <div className="h-20 w-20 rounded-full bg-[#050507] flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                    </div>
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: "2px solid rgba(168,85,247,0.2)" }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-white">Syncing motion between videos…</p>
                  <p className="text-[12px] text-zinc-500 mt-1.5">This typically takes 2–4 minutes</p>
                </div>
                {/* Source → Ref visual */}
                {sourceVideo && referenceVideo && (
                  <div className="flex items-center gap-3 mt-2">
                    <video src={sourceVideo} className="h-16 w-24 object-cover rounded-lg border border-purple-500/20" muted />
                    <ArrowRightLeft className="h-4 w-4 text-purple-400/40 animate-pulse" />
                    <video src={referenceVideo} className="h-16 w-24 object-cover rounded-lg border border-pink-500/20" muted />
                  </div>
                )}
              </motion.div>
            ) : (
              /* ── Marketing Showcase (Default State) ── */
              <motion.div
                key="showcase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-full"
              >
                {/* Hero */}
                <div className="relative overflow-hidden px-8 pt-10 pb-8">
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(168,85,247,0.08), transparent 70%), radial-gradient(ellipse 50% 50% at 80% 30%, rgba(236,72,153,0.06), transparent)",
                    }}
                  />
                  <div className="relative max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                      <span className="text-[11px] font-semibold text-purple-300">Video-to-Video AI</span>
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight">
                      <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                        Motion-Sync
                      </span>
                    </h2>
                    <p className="mt-3 text-[14px] text-zinc-400 leading-relaxed max-w-lg">
                      Transfer motion from any reference video onto your source footage. Copy dance moves, facial expressions, camera movements, or body gestures — the AI preserves your original content while applying new motion.
                    </p>
                  </div>
                </div>

                {/* Example Wall */}
                <div className="px-8 pb-8">
                  {!user && (
                    <button
                      onClick={() => dispatchAuthGate()}
                      className="mb-5 w-full rounded-2xl px-5 py-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                      style={{
                        background: "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(168,85,247,0.95) 55%, rgba(236,72,153,0.9))",
                        boxShadow: "0 18px 40px rgba(168,85,247,0.22)",
                      }}
                    >
                      Sign up to create for FREE
                    </button>
                  )}

                  <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h3 className="text-[15px] font-semibold text-white">
                        {user ? "Example Creations" : "Browse motion transfer examples"}
                      </h3>
                      <p className="mt-1 text-[12px] text-zinc-500">
                        {user
                          ? "Tap a card to drop its transfer idea into the prompt box."
                          : "Preview how source footage can inherit motion, rhythm, and camera energy."}
                      </p>
                    </div>
                    {user && (
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-medium text-zinc-400">
                        <Play className="h-3 w-3" /> Click any example to preload the prompt
                      </span>
                    )}
                  </div>

                  <div className="grid auto-rows-[180px] grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      {
                        title: "Street Dance Swap",
                        source: "3D heroine",
                        motion: "Club choreography",
                        prompt: "Transfer energetic street dance choreography onto the source subject while preserving the original style, framing, and lighting.",
                        className: "sm:col-span-2 xl:col-span-2 xl:row-span-2",
                        background:
                          "radial-gradient(circle at 20% 20%, rgba(236,72,153,0.32), transparent 28%), radial-gradient(circle at 80% 24%, rgba(59,130,246,0.26), transparent 30%), linear-gradient(135deg, rgba(17,24,39,1), rgba(76,29,149,0.92))",
                      },
                      {
                        title: "Cinematic Walk",
                        source: "Fashion portrait",
                        motion: "Runway pace",
                        prompt: "Apply a confident runway walk with smooth body motion while keeping the scene elegant and editorial.",
                        background:
                          "radial-gradient(circle at 75% 20%, rgba(245,158,11,0.28), transparent 30%), linear-gradient(135deg, rgba(39,39,42,1), rgba(113,63,18,0.92))",
                      },
                      {
                        title: "Facial Emotion",
                        source: "Close-up character",
                        motion: "Expressive face acting",
                        prompt: "Transfer subtle facial expressions and lip motion onto the source subject without changing the camera angle.",
                        background:
                          "radial-gradient(circle at 25% 25%, rgba(168,85,247,0.34), transparent 30%), linear-gradient(160deg, rgba(15,23,42,1), rgba(67,56,202,0.92))",
                      },
                      {
                        title: "Action Burst",
                        source: "Fantasy warrior",
                        motion: "Combat movement",
                        prompt: "Map aggressive action movement and weight shifts onto the source subject while keeping the original environment intact.",
                        className: "xl:row-span-2",
                        background:
                          "radial-gradient(circle at 50% 15%, rgba(239,68,68,0.26), transparent 28%), radial-gradient(circle at 80% 78%, rgba(168,85,247,0.22), transparent 30%), linear-gradient(145deg, rgba(24,24,27,1), rgba(63,28,48,0.96))",
                      },
                      {
                        title: "Camera Drift",
                        source: "Static shot",
                        motion: "Floating handheld",
                        prompt: "Add smooth handheld camera drift and gentle parallax motion from the reference video while preserving composition.",
                        background:
                          "radial-gradient(circle at 20% 25%, rgba(34,211,238,0.24), transparent 30%), linear-gradient(145deg, rgba(12,10,9,1), rgba(22,78,99,0.9))",
                      },
                      {
                        title: "Performance Sync",
                        source: "Music clip",
                        motion: "Stage energy",
                        prompt: "Transfer high-energy performance motion and timing onto the source clip while preserving the original visual identity.",
                        className: "sm:col-span-2",
                        background:
                          "radial-gradient(circle at 15% 20%, rgba(244,114,182,0.28), transparent 30%), radial-gradient(circle at 85% 30%, rgba(168,85,247,0.28), transparent 30%), linear-gradient(135deg, rgba(9,9,11,1), rgba(88,28,135,0.94))",
                      },
                    ].map((example, index) => (
                      <button
                        key={example.title}
                        onClick={() => setPrompt(example.prompt)}
                        className={`group relative overflow-hidden rounded-[28px] border border-white/[0.06] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-purple-500/20 ${example.className ?? ""}`}
                        style={{ background: example.background }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-black/55" />
                        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-3xl" />
                        <div className="relative flex h-full flex-col justify-between">
                          <div className="flex items-start justify-between gap-3">
                            <span className="inline-flex items-center rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 backdrop-blur-sm">
                              Example 0{index + 1}
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
                              <Play className="h-4 w-4 text-white ml-0.5" />
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/45">Source + Motion</p>
                            <h4 className="mt-2 text-lg font-semibold text-white sm:text-xl">{example.title}</h4>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-medium text-white/75 backdrop-blur-sm">
                                Source: {example.source}
                              </span>
                              <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-medium text-white/75 backdrop-blur-sm">
                                Motion: {example.motion}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* How it works: 3-step visual */}
                <div className="px-8 pb-6">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { step: "1", title: "Upload Source", desc: "Your original video", icon: Video, color: "purple" },
                      { step: "2", title: "Add Motion Ref", desc: "Video with desired motion", icon: Film, color: "pink" },
                      { step: "3", title: "Generate", desc: "AI syncs the motion", icon: Sparkles, color: "violet" },
                    ].map((s) => (
                      <div
                        key={s.step}
                        className="relative rounded-2xl p-4 border border-white/[0.04] overflow-hidden group hover:border-white/[0.08] transition"
                        style={{ background: "rgba(255,255,255,0.015)" }}
                      >
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                          style={{ background: `radial-gradient(circle at 50% 50%, rgba(168,85,247,0.05), transparent 70%)` }}
                        />
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-purple-400/60 bg-purple-500/10 rounded-md px-1.5 py-0.5">STEP {s.step}</span>
                          </div>
                          <s.icon className="h-6 w-6 text-zinc-500 mb-2" />
                          <p className="text-[13px] font-semibold text-white">{s.title}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Use cases */}
                <div className="px-8 pb-8">
                  <h3 className="text-[13px] font-semibold text-zinc-400 mb-3">What you can create</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {EXAMPLE_PAIRS.map((ex) => (
                      <button
                        key={ex.label}
                        onClick={() => setPrompt(ex.desc)}
                        className="text-left rounded-xl p-3.5 border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.04] hover:border-purple-500/15 transition-all group"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-xl">{ex.emoji}</span>
                          <div>
                            <p className="text-[12px] font-semibold text-white group-hover:text-purple-200 transition-colors">{ex.label}</p>
                            <p className="text-[10px] text-zinc-600 mt-0.5 leading-relaxed">{ex.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feature pills */}
                <div className="px-8 pb-10">
                  <div className="flex flex-wrap gap-2">
                    {["Kling v2 Master", "Video → Video", "5s or 10s output", "Exact or Partial sync", "50 credits/gen"].map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium text-zinc-500 bg-white/[0.03] border border-white/[0.04]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
