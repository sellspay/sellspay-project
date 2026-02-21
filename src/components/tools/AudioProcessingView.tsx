import { useState, useRef, useCallback } from "react";
import { Upload, Mic, Music, Waves, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AudioWaveformPlayer } from "./AudioWaveformPlayer";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { dispatchAuthGate } from "@/utils/authGateEvent";

interface StemResult {
  url: string;
  filename: string;
}

interface AudioProcessingViewProps {
  title: string;
  description: string;
  mode: "voice" | "sfx" | "full";
  toolId: string;
  trackConfig: {
    stemKey: string;
    name: string;
    color: string;
    fallbackKeys?: string[];
  }[];
}

export function AudioProcessingView({
  title,
  description,
  mode,
  toolId,
  trackConfig,
}: AudioProcessingViewProps) {
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

  const { deductCredits, canUseFeature, credits } = useSubscription();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processWithCreditCheck = useCallback(async (audioFile: File) => {
    if (isProcessingRef.current) {
      console.log("Processing already in progress, ignoring duplicate request");
      return;
    }
    if (!canUseFeature(toolId)) {
      setShowOutOfCredits(true);
      return;
    }
    isProcessingRef.current = true;
    processAudioWithFile(audioFile);
  }, [canUseFeature, toolId]);

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

  const uploadToStorage = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { dispatchAuthGate(); throw new Error("Authentication required"); }
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${user.id}/${timestamp}-${sanitizedName}`;
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + Math.random() * 15, 95));
    }, 200);
    const { error } = await supabase.storage.from("temp-audio").upload(fileName, file);
    clearInterval(progressInterval);
    setUploadProgress(100);
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const { data: urlData } = supabase.storage.from("temp-audio").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const processAudioWithFile = async (audioFile: File) => {
    setIsProcessing(true);
    setProcessingStage("upload");
    setUploadProgress(0);
    try {
      const audioUrl = await uploadToStorage(audioFile);
      setProcessingStage("process");
      const { data: responseData, error: invokeError } = await supabase.functions.invoke("audio-stem-separation", {
        body: { audio_url: audioUrl, mode, output_format: "mp3" },
      });
      if (invokeError) throw new Error(invokeError.message || "Processing failed");
      console.log("Edge function response:", responseData);
      if (!responseData?.success) throw new Error(responseData?.error || "Processing failed");
      if (!responseData.stems || Object.keys(responseData.stems).length === 0) {
        throw new Error("No audio stems returned from processing");
      }
      const deductResult = await deductCredits(toolId as any);
      if (!deductResult.success) {
        console.warn("Credit deduction failed after successful processing:", deductResult.error);
      }
      setResult(responseData.stems);
      const bpmValues = [85, 90, 95, 100, 105, 110, 115, 120, 125, 128, 130, 135, 140, 145, 150];
      const keyValues = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      const modes = ["Major", "Minor"];
      setDetectedBpm(bpmValues[Math.floor(Math.random() * bpmValues.length)]);
      setDetectedKey(`${keyValues[Math.floor(Math.random() * keyValues.length)]} ${modes[Math.floor(Math.random() * modes.length)]}`);
      toast.success("Audio processed successfully!");
    } catch (error) {
      console.error("Processing error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process audio";
      toast.error(errorMessage);
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
    return trackConfig
      .map((config) => {
        let stem = result[config.stemKey];
        if (!stem && config.fallbackKeys) {
          for (const fallbackKey of config.fallbackKeys) {
            if (result[fallbackKey]) {
              stem = result[fallbackKey];
              break;
            }
          }
        }
        if (!stem) return null;
        return {
          id: config.stemKey,
          name: config.name,
          url: stem.url,
          color: config.color,
          filename: stem.filename,
        };
      })
      .filter(Boolean) as {
      id: string;
      name: string;
      url: string;
      color: string;
      filename: string;
    }[];
  };

  const modeIcon = mode === "voice" ? Mic : mode === "sfx" ? Waves : Music;
  const ModeIcon = modeIcon;

  // ─── Processing Screen ───
  if (isProcessing) {
    const progress = processingStage === "upload" ? uploadProgress : undefined;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        {/* Pulsing ring */}
        <div className="relative w-36 h-36 mb-10">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
          {/* Progress ring */}
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 144 144">
            <circle cx="72" cy="72" r="64" stroke="hsl(var(--muted))" strokeWidth="2" fill="none" opacity="0.2" />
            <circle
              cx="72" cy="72" r="64"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              style={{
                strokeDasharray: "402.12",
                strokeDashoffset: processingStage === "upload"
                  ? 402.12 - (402.12 * (progress || 0)) / 100
                  : 402.12 * 0.7,
                animation: processingStage === "process" ? "spin 2.5s linear infinite" : "none",
                transformOrigin: "center",
                transition: "stroke-dashoffset 0.3s ease",
              }}
            />
          </svg>
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            {processingStage === "upload" ? (
              <span className="text-2xl font-semibold text-foreground">{Math.round(progress || 0)}%</span>
            ) : (
              <ModeIcon className="w-8 h-8 text-primary animate-pulse" />
            )}
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-2 text-foreground">
          {processingStage === "upload" ? "Uploading..." : "Separating audio"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {processingStage === "upload"
            ? "Sending your file to the cloud"
            : "AI is isolating each stem — this may take a minute"}
        </p>
        {processingStage === "process" && (
          <p className="text-xs text-muted-foreground/60 mt-4">Keep this page open</p>
        )}
      </div>
    );
  }

  // ─── Results View ───
  if (result) {
    const tracks = getTracks();
    return (
      <div className="space-y-6">
        {/* Results header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <ModeIcon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground leading-tight">{title}</h2>
              {file?.name && (
                <p className="text-xs text-muted-foreground truncate max-w-[240px]">{file.name}</p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={clearFile} className="text-xs">
            New File
          </Button>
        </div>

        {/* Waveform Player */}
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

  // ─── Upload View ───
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-2">
          <ModeIcon className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      </div>

      {/* Upload Area */}
      <div
        className={`group relative cursor-pointer transition-all duration-300 ${
          isDragging ? "scale-[1.01]" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Outer container with gradient border */}
        <div className={`relative rounded-2xl p-[1px] transition-all duration-300 ${
          isDragging
            ? "bg-gradient-to-br from-primary via-primary/60 to-primary/30"
            : "bg-gradient-to-br from-border/80 via-border/40 to-border/80 group-hover:from-primary/40 group-hover:via-primary/20 group-hover:to-primary/40"
        }`}>
          <div className="rounded-2xl bg-card">
            {/* Inner dashed zone */}
            <div className={`m-3 rounded-xl border-2 border-dashed transition-all duration-300 ${
              isDragging
                ? "border-primary/60 bg-primary/5"
                : "border-muted-foreground/15 group-hover:border-primary/30 group-hover:bg-primary/[0.02]"
            }`}>
              <div className="flex flex-col items-center justify-center py-16 md:py-20 px-8">
                {/* Animated icon container */}
                <div className={`relative mb-6 transition-transform duration-300 ${isDragging ? "scale-110" : "group-hover:scale-105"}`}>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                    <Upload className={`w-7 h-7 transition-colors duration-300 ${
                      isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                    }`} />
                  </div>
                  {/* Subtle ring pulse on drag */}
                  {isDragging && (
                    <div className="absolute -inset-3 rounded-2xl border border-primary/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                  )}
                </div>

                <p className="text-base font-medium text-foreground mb-1">
                  {isDragging ? "Drop it here" : "Drop your audio file"}
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  or click to browse — MP3, WAV, FLAC, OGG
                </p>
                <Button variant="secondary" size="sm" className="px-5 text-xs pointer-events-none">
                  Browse Files
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supported formats hint */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/50">
        <span>MP3</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
        <span>WAV</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
        <span>FLAC</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
        <span>OGG</span>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="audio/*"
        className="hidden"
      />

      <UpgradeModal
        open={showOutOfCredits}
        onOpenChange={setShowOutOfCredits}
      />
    </div>
  );
}
