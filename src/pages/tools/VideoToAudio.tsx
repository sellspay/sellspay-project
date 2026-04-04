import { useState, useRef } from "react";
import { Upload, Video, Download, RotateCcw, Music } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const C = {
  bg: "#0e0e10", panel: "#18181b", panel2: "#1e1e22", inner: "#141416", deepInner: "#0c0c0e",
  border: "rgba(255,255,255,0.06)", borderMid: "rgba(255,255,255,0.10)",
  text: "#f4f4f5", textSoft: "#a1a1aa", textMuted: "#71717a",
  accent: "#06b6d4", accentBg: "rgba(6,182,212,0.12)",
} as const;

export default function VideoToAudio() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputFormat, setOutputFormat] = useState("mp3");
  const [audioDuration, setAudioDuration] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file); setVideoUrl(URL.createObjectURL(file)); setProgress(0);
      toast.success("Video file loaded successfully");
    } else { toast.error("Please select a valid video file"); }
  };

  const handleLoadedMetadata = () => { if (videoRef.current) setAudioDuration(videoRef.current.duration); };
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const extractAudio = async () => {
    if (!videoFile || !videoUrl) return;
    setIsProcessing(true); setProgress(10);
    try {
      const video = document.createElement("video");
      video.src = videoUrl; video.muted = false;
      await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = reject; });
      setProgress(30);
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const dest = audioContext.createMediaStreamDestination();
      source.connect(dest);
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const mediaRecorder = new MediaRecorder(dest.stream, { mimeType });
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      setProgress(50);
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve();
        mediaRecorder.start(); video.play();
        const pi = setInterval(() => { setProgress(Math.min((video.currentTime / video.duration) * 40 + 50, 90)); }, 100);
        video.onended = () => { clearInterval(pi); mediaRecorder.stop(); };
      });
      setProgress(95);
      const audioBlob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement("a");
      a.href = url; a.download = `${videoFile.name.replace(/\.[^/.]+$/, "")}_audio.${outputFormat}`; a.click();
      URL.revokeObjectURL(url);
      setProgress(100); audioContext.close();
      toast.success("Audio extracted successfully!");
    } catch { toast.error("Failed to extract audio."); }
    finally { setIsProcessing(false); }
  };

  const reset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null); setVideoUrl(null); setProgress(0); setAudioDuration(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: C.text }}>Video to Audio Converter</h1>
        <p style={{ color: C.textMuted }}>Extract audio from any video file quickly and easily.</p>
      </div>

      {!videoFile ? (
        <div
          className="rounded-[16px] border-2 border-dashed flex flex-col items-center justify-center py-16 cursor-pointer transition-colors hover:border-cyan-500/30"
          style={{ background: C.panel2, borderColor: C.borderMid }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
          <Video className="w-16 h-16 mb-4" style={{ color: C.textMuted }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: C.text }}>Upload Video File</h3>
          <p className="mb-4" style={{ color: C.textMuted }}>Supports MP4, WebM, MOV, AVI, and more</p>
          <button className="rounded-[12px] px-6 py-2.5 text-sm font-semibold text-white" style={{ background: C.accent }}>Choose File</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-[16px] p-5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: C.text }}>{videoFile.name}</h3>
              <button onClick={reset} className="p-2 rounded-lg" style={{ background: C.inner, border: `1px solid ${C.border}` }}>
                <RotateCcw className="w-4 h-4" style={{ color: C.textSoft }} />
              </button>
            </div>

            <div className="aspect-video rounded-[12px] overflow-hidden" style={{ background: "#000" }}>
              <video ref={videoRef} src={videoUrl || undefined} className="w-full h-full object-contain" controls onLoadedMetadata={handleLoadedMetadata} />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { icon: Video, label: "File Size", value: formatFileSize(videoFile.size) },
                { icon: Music, label: "Duration", value: formatTime(audioDuration) },
                { icon: Download, label: "Output", value: outputFormat.toUpperCase() },
              ].map(item => (
                <div key={item.label} className="rounded-[12px] p-3 text-center" style={{ background: C.inner, border: `1px solid ${C.border}` }}>
                  <item.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: C.accent }} />
                  <p className="text-xs" style={{ color: C.textMuted }}>{item.label}</p>
                  <p className="font-semibold text-sm" style={{ color: C.text }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-4">
              <label className="text-sm" style={{ color: C.textMuted }}>Output:</label>
              <div className="flex gap-1.5">
                {["mp3", "wav", "ogg", "webm"].map(f => (
                  <button key={f} onClick={() => !isProcessing && setOutputFormat(f)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium uppercase transition"
                    style={{
                      background: outputFormat === f ? C.accentBg : "transparent",
                      color: outputFormat === f ? C.accent : C.textMuted,
                      border: outputFormat === f ? `1px solid rgba(6,182,212,0.3)` : `1px solid transparent`,
                    }}
                  >{f}</button>
                ))}
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-2 mt-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center" style={{ color: C.textMuted }}>Extracting audio... {Math.round(progress)}%</p>
              </div>
            )}

            <button onClick={extractAudio} disabled={isProcessing}
              className="w-full mt-5 inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40 transition hover:brightness-110"
              style={{ background: C.accent, boxShadow: `0 4px 16px rgba(6,182,212,0.3)` }}
            >
              <Music className="w-5 h-5" /> {isProcessing ? "Extracting..." : "Extract Audio"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
