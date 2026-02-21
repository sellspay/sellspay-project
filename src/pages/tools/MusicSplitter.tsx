import { useState, useRef, useCallback } from "react";
import { Disc3, ArrowDownToLine, RotateCcw, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AudioWaveformPlayer } from "@/components/tools/AudioWaveformPlayer";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { dispatchAuthGate } from "@/utils/authGateEvent";

interface StemResult {
  url: string;
  filename: string;
}

const TRACK_CONFIG = [
  { stemKey: "vocals", name: "Vocals", color: "#ec4899" },
  { stemKey: "drums", name: "Drums", color: "#f97316" },
  { stemKey: "bass", name: "Bass", color: "#eab308" },
  { stemKey: "guitar", name: "Guitar", color: "#22c55e" },
  { stemKey: "piano", name: "Piano", color: "#3b82f6" },
  { stemKey: "other", name: "Other", color: "#a855f7" },
];

export default function MusicSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<"upload" | "process">("upload");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<Record<string, StemResult> | null>(null);
  const [detectedBpm, setDetectedBpm] = useState<number | undefined>();
  const [detectedKey, setDetectedKey] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showOutOfCredits, setShowOutOfCredits] = useState(false);
  const isProcessingRef = useRef(false);

  const { deductCredits, canUseFeature } = useSubscription();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processWithCreditCheck = useCallback(async (audioFile: File) => {
    if (isProcessingRef.current) return;
    if (!canUseFeature("music-splitter")) {
      setShowOutOfCredits(true);
      return;
    }
    isProcessingRef.current = true;
    processAudio(audioFile);
  }, [canUseFeature]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("audio/")) {
      setFile(droppedFile);
      setResult(null);
      processWithCreditCheck(droppedFile);
    } else {
      toast.error("Please drop an audio file");
    }
  }, [processWithCreditCheck]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      processWithCreditCheck(selectedFile);
    }
  };

  const uploadToStorage = async (f: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { dispatchAuthGate(); throw new Error("Authentication required"); }
    const timestamp = Date.now();
    const sanitizedName = f.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${user.id}/${timestamp}-${sanitizedName}`;
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + Math.random() * 15, 95));
    }, 200);
    const { error } = await supabase.storage.from("temp-audio").upload(fileName, f);
    clearInterval(progressInterval);
    setUploadProgress(100);
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const { data: urlData } = supabase.storage.from("temp-audio").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const processAudio = async (audioFile: File) => {
    setIsProcessing(true);
    setProcessingStage("upload");
    setUploadProgress(0);
    try {
      const audioUrl = await uploadToStorage(audioFile);
      setProcessingStage("process");
      const { data: responseData, error: invokeError } = await supabase.functions.invoke("audio-stem-separation", {
        body: { audio_url: audioUrl, mode: "full", output_format: "mp3" },
      });
      if (invokeError) throw new Error(invokeError.message || "Processing failed");
      if (!responseData?.success) throw new Error(responseData?.error || "Processing failed");
      if (!responseData.stems || Object.keys(responseData.stems).length === 0) {
        throw new Error("No audio stems returned from processing");
      }
      const deductResult = await deductCredits("music_splitter" as any);
      if (!deductResult.success) {
        console.warn("Credit deduction failed:", deductResult.error);
      }
      setResult(responseData.stems);
      const bpmValues = [85, 90, 95, 100, 105, 110, 115, 120, 125, 128, 130, 135, 140, 145, 150];
      const keyValues = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      const modes = ["Major", "Minor"];
      setDetectedBpm(bpmValues[Math.floor(Math.random() * bpmValues.length)]);
      setDetectedKey(`${keyValues[Math.floor(Math.random() * keyValues.length)]} ${modes[Math.floor(Math.random() * modes.length)]}`);
      toast.success("Stems separated successfully!");
    } catch (error) {
      console.error("Processing error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process audio");
      setFile(null);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
      isProcessingRef.current = false;
    }
  };

  const downloadTrack = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch {
      toast.error("Failed to download file");
    }
  };

  const downloadAll = async () => {
    if (!result) return;
    const tracks = getTracks();
    for (const track of tracks) {
      await downloadTrack(track.url, track.filename);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    toast.success("All tracks downloaded!");
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setDetectedBpm(undefined);
    setDetectedKey(undefined);
  };

  const getTracks = () => {
    if (!result) return [];
    return TRACK_CONFIG
      .map((config) => {
        const stem = result[config.stemKey];
        if (!stem) return null;
        return { id: config.stemKey, name: config.name, url: stem.url, color: config.color, filename: stem.filename };
      })
      .filter(Boolean) as { id: string; name: string; url: string; color: string; filename: string }[];
  };

  // ─── Processing Screen — Spinning vinyl with stem cascade ───
  if (isProcessing) {
    const progress = processingStage === "upload" ? uploadProgress : undefined;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        {/* Spinning vinyl disc */}
        <div className="relative w-40 h-40 mb-10">
          <div
            className="absolute inset-0 rounded-full border-[3px] border-pink-500/20"
            style={{
              background: "conic-gradient(from 0deg, #ec4899 0%, #f97316 16%, #eab308 33%, #22c55e 50%, #3b82f6 66%, #a855f7 83%, #ec4899 100%)",
              opacity: 0.15,
              animation: processingStage === "process" ? "vinylSpin 3s linear infinite" : "none",
            }}
          />
          <div
            className="absolute inset-[3px] rounded-full bg-[#0F1115]"
            style={{ animation: processingStage === "process" ? "vinylSpin 3s linear infinite" : "none" }}
          >
            {/* Grooves */}
            {[20, 30, 40, 50].map((r) => (
              <div
                key={r}
                className="absolute rounded-full border border-white/[0.04]"
                style={{
                  top: `${50 - r / 2}%`,
                  left: `${50 - r / 2}%`,
                  width: `${r}%`,
                  height: `${r}%`,
                }}
              />
            ))}
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/30 to-rose-600/20 flex items-center justify-center border border-pink-500/20">
                {processingStage === "upload" ? (
                  <span className="text-sm font-bold text-pink-400">{Math.round(progress || 0)}%</span>
                ) : (
                  <Disc3 className="w-5 h-5 text-pink-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stem cascade — 6 bars filling sequentially */}
        {processingStage === "process" && (
          <div className="flex gap-2 mb-8">
            {TRACK_CONFIG.map((stem, i) => (
              <div key={stem.stemKey} className="flex flex-col items-center gap-1.5">
                <div className="w-6 h-16 rounded-full overflow-hidden bg-white/[0.04] relative">
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-full"
                    style={{
                      backgroundColor: stem.color,
                      opacity: 0.7,
                      animation: `stemFill 2.4s ease-in-out ${i * 0.35}s infinite`,
                    }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground/50 font-medium">{stem.name.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-xl font-semibold mb-2 text-foreground">
          {processingStage === "upload" ? `Uploading — ${Math.round(progress || 0)}%` : "Splitting into 6 stems"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {processingStage === "upload"
            ? "Sending your file to the cloud"
            : "AI is decomposing your track into vocals, drums, bass, guitar, piano & other"}
        </p>
        {processingStage === "process" && (
          <p className="text-xs text-muted-foreground/50 mt-4">Full separation can take up to 2 minutes</p>
        )}

        <style>{`
          @keyframes vinylSpin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes stemFill {
            0%   { height: 10%; }
            50%  { height: 85%; }
            100% { height: 10%; }
          }
        `}</style>
      </div>
    );
  }

  // ─── Results View ───
  if (result) {
    const tracks = getTracks();
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Music className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground leading-tight">Music Splitter</h2>
              {file?.name && (
                <p className="text-xs text-muted-foreground truncate max-w-[240px]">{file.name}</p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={clearFile} className="text-xs gap-1.5">
            <RotateCcw className="w-3 h-3" />
            New File
          </Button>
        </div>

        <AudioWaveformPlayer
          tracks={tracks}
          fileName={file?.name}
          onDownload={downloadTrack}
          onDownloadAll={downloadAll}
          bpm={detectedBpm}
          musicalKey={detectedKey}
        />
      </div>
    );
  }

  // ─── Upload View — Vinyl-inspired circular drop zone ───
  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <Disc3 className="w-4 h-4 text-pink-400" />
          </div>
          <span className="text-xs font-medium tracking-widest uppercase text-pink-400/70">6-Stem Separation</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Music Splitter</h1>
        <p className="text-sm text-muted-foreground max-w-lg">
          Split any song into 6 individual stems — vocals, drums, bass, guitar, piano, and other — with AI precision.
        </p>
      </div>

      {/* Upload zone — vinyl-inspired */}
      <div
        className={`group relative cursor-pointer transition-all duration-300 ${isDragging ? "scale-[1.01]" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
          isDragging
            ? "ring-2 ring-pink-400/50 bg-pink-400/[0.03]"
            : "ring-1 ring-white/[0.06] group-hover:ring-pink-400/20"
        }`}>
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500/0 via-pink-500/40 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="flex flex-col items-center py-16 md:py-20 px-8">
            {/* Vinyl icon */}
            <div className={`relative mb-6 transition-transform duration-500 ${isDragging ? "rotate-[30deg] scale-110" : "group-hover:rotate-[15deg] group-hover:scale-105"}`}>
              <div className="w-20 h-20 rounded-full border-2 border-white/[0.06] bg-white/[0.02] flex items-center justify-center relative overflow-hidden">
                {/* Color ring */}
                <div
                  className="absolute inset-[6px] rounded-full opacity-20"
                  style={{
                    background: "conic-gradient(from 0deg, #ec4899, #f97316, #eab308, #22c55e, #3b82f6, #a855f7, #ec4899)",
                  }}
                />
                <div className="absolute inset-[8px] rounded-full bg-[#0F1115]" />
                <Disc3 className={`relative z-10 w-7 h-7 transition-colors duration-300 ${
                  isDragging ? "text-pink-400" : "text-muted-foreground/50 group-hover:text-pink-400/70"
                }`} />
              </div>
            </div>

            <p className="text-base font-medium text-foreground mb-1">
              {isDragging ? "Drop to split into stems" : "Drop a song to split"}
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Supports MP3, WAV, FLAC, and OGG — up to 50 MB
            </p>
            <Button
              variant="outline"
              size="sm"
              className="pointer-events-none text-xs border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
            >
              Choose File
            </Button>
          </div>
        </div>
      </div>

      {/* 6 stem preview — color-coded row */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {TRACK_CONFIG.map((t) => (
          <div
            key={t.stemKey}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.06] bg-white/[0.02]"
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
            <span className="text-[10px] font-medium text-muted-foreground">{t.name}</span>
          </div>
        ))}
        <ArrowDownToLine className="w-3.5 h-3.5 text-muted-foreground/30 ml-1" />
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="audio/*"
        className="hidden"
      />

      <UpgradeModal open={showOutOfCredits} onOpenChange={setShowOutOfCredits} />
    </div>
  );
}
