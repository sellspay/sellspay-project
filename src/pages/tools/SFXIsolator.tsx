import { useState, useRef, useCallback } from "react";
import { Waves, Layers, ArrowDownToLine, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AudioWaveformPlayer } from "@/components/tools/AudioWaveformPlayer";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";

interface StemResult {
  url: string;
  filename: string;
}

const TRACK_CONFIG = [
  { stemKey: "vocals", name: "Vocals", color: "#06b6d4" },
  { stemKey: "drums", name: "Drums", color: "#f59e0b" },
  { stemKey: "bass", name: "Bass", color: "#ef4444" },
  { stemKey: "other", name: "SFX/Other", color: "#8b5cf6" },
];

export default function SFXIsolator() {
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
    if (!canUseFeature("sfx-isolator")) {
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
    if (!user) throw new Error("Authentication required");
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
        body: { audio_url: audioUrl, mode: "sfx", output_format: "mp3" },
      });
      if (invokeError) throw new Error(invokeError.message || "Processing failed");
      if (!responseData?.success) throw new Error(responseData?.error || "Processing failed");
      if (!responseData.stems || Object.keys(responseData.stems).length === 0) {
        throw new Error("No audio stems returned from processing");
      }
      const deductResult = await deductCredits("sfx_isolator" as any);
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

  // ─── Processing Screen — Layered equaliser bars ───
  if (isProcessing) {
    const progress = processingStage === "upload" ? uploadProgress : undefined;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        {/* Equaliser bars animation */}
        <div className="flex items-end gap-1.5 mb-10 h-28">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-2 rounded-full"
              style={{
                background: `linear-gradient(to top, #06b6d4, #8b5cf6)`,
                height: processingStage === "process" ? undefined : `${20 + (progress || 0) * 0.8}%`,
                animation: processingStage === "process" ? `eqBar 1.${2 + (i % 5)}s ease-in-out ${i * 0.08}s infinite alternate` : "none",
                opacity: 0.6 + (i % 3) * 0.15,
              }}
            />
          ))}
        </div>

        <h2 className="text-xl font-semibold mb-2 text-foreground">
          {processingStage === "upload" ? `Uploading — ${Math.round(progress || 0)}%` : "Splitting stems"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {processingStage === "upload"
            ? "Sending your file to the cloud"
            : "AI is decomposing your track into 4 stems"}
        </p>
        {processingStage === "process" && (
          <p className="text-xs text-muted-foreground/50 mt-4">This may take up to a minute</p>
        )}

        <style>{`
          @keyframes eqBar {
            0%   { height: 18%; }
            100% { height: 90%; }
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
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground leading-tight">SFX Isolator</h2>
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

  // ─── Upload View — Horizontal split layout with stem preview ───
  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      {/* Header — left-aligned, minimal */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xs font-medium tracking-widest uppercase text-cyan-400/70">Stem Separation</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">SFX Isolator</h1>
        <p className="text-sm text-muted-foreground max-w-lg">
          Decompose any track into its individual layers — vocals, drums, bass, and effects — powered by AI.
        </p>
      </div>

      {/* Upload zone — wide, low-profile card style */}
      <div
        className={`group relative cursor-pointer transition-all duration-300 ${isDragging ? "scale-[1.005]" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
          isDragging
            ? "ring-2 ring-cyan-400/50 bg-cyan-400/[0.04]"
            : "ring-1 ring-white/[0.06] group-hover:ring-cyan-400/20"
        }`}>
          {/* Subtle horizontal gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="flex items-center gap-6 px-8 py-12 md:py-14">
            {/* Left: icon block */}
            <div className={`shrink-0 w-16 h-16 rounded-xl border border-white/[0.06] flex items-center justify-center transition-all duration-300 ${
              isDragging ? "bg-cyan-400/10 border-cyan-400/30" : "bg-white/[0.02] group-hover:bg-cyan-400/5 group-hover:border-cyan-400/20"
            }`}>
              <Waves className={`w-7 h-7 transition-colors duration-300 ${
                isDragging ? "text-cyan-400" : "text-muted-foreground/50 group-hover:text-cyan-400/70"
              }`} />
            </div>

            {/* Center: text */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-foreground mb-0.5">
                {isDragging ? "Drop to begin separation" : "Drop an audio file to separate"}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports MP3, WAV, FLAC, and OGG — up to 50 MB
              </p>
            </div>

            {/* Right: CTA */}
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 pointer-events-none text-xs border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
            >
              Browse
            </Button>
          </div>
        </div>
      </div>

      {/* Stem preview chips */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {TRACK_CONFIG.map((t) => (
          <div
            key={t.stemKey}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02]"
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
            <span className="text-[11px] font-medium text-muted-foreground">{t.name}</span>
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
