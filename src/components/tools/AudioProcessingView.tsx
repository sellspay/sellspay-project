import { useState, useRef, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AudioWaveformPlayer } from "./AudioWaveformPlayer";
import { useCredits } from "@/hooks/useCredits";
import { OutOfCreditsDialog } from "./OutOfCreditsDialog";

interface StemResult {
  url: string;
  filename: string;
}

interface AudioProcessingViewProps {
  title: string;
  description: string;
  mode: "voice" | "sfx" | "full";
  toolId: string; // Tool identifier for credit deduction
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

  const { deductCredit, canUseTool } = useCredits();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processWithCreditCheck = useCallback(async (audioFile: File) => {
    // Check if user can use this pro tool - show dialog instead of toast
    if (!canUseTool(toolId)) {
      setShowOutOfCredits(true);
      return;
    }

    // Deduct credit FIRST before processing
    const deductResult = await deductCredit(toolId);
    if (!deductResult.success) {
      toast.error(deductResult.error || "Failed to deduct credit");
      return;
    }

    // Proceed with audio processing
    processAudioWithFile(audioFile);
  }, [canUseTool, deductCredit, toolId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("audio/")) {
      setFile(droppedFile);
      setResult(null);
      // Check credit and process
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
      // Check credit and process
      processWithCreditCheck(selectedFile);
    }
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + Math.random() * 15, 95));
    }, 200);

    const { error } = await supabase.storage
      .from("temp-audio")
      .upload(fileName, file);

    clearInterval(progressInterval);
    setUploadProgress(100);

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage
      .from("temp-audio")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const processAudioWithFile = async (audioFile: File) => {
    setIsProcessing(true);
    setProcessingStage("upload");
    setUploadProgress(0);

    try {
      const audioUrl = await uploadToStorage(audioFile);
      setProcessingStage("process");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audio-stem-separation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            audio_url: audioUrl,
            mode,
            output_format: "mp3",
          }),
        }
      );

      const data = await response.json();
      console.log("Edge function response:", data);

      if (!response.ok) {
        throw new Error(data.error || `Processing failed with status ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || "Processing failed");
      }

      if (!data.stems || Object.keys(data.stems).length === 0) {
        throw new Error("No audio stems returned from processing");
      }

      setResult(data.stems);
      
      // Generate realistic BPM and Key values (simulated detection)
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
        // Check primary key first, then fallback keys
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

  // Processing Screen (Upload or AI Processing)
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        {/* Circular Progress */}
        <div className="relative w-32 h-32 mb-8">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-muted/30"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              className="text-primary transition-all duration-300"
              style={{
                strokeDasharray: "351.86",
                strokeDashoffset:
                  processingStage === "upload"
                    ? 351.86 - (351.86 * uploadProgress) / 100
                    : 351.86 * 0.75,
                animation:
                  processingStage === "process"
                    ? "spin 2s linear infinite"
                    : "none",
                transformOrigin: "center",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-medium">
              {processingStage === "upload" ? `${Math.round(uploadProgress)}%` : ""}
            </span>
          </div>
        </div>

        {processingStage === "upload" ? (
          <p className="text-lg text-muted-foreground">Uploading file...</p>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-3">Audio processing</h2>
            <p className="text-muted-foreground max-w-md">
              Artificial intelligence algorithm now works, it may take a minute.
            </p>
            <p className="text-muted-foreground">Please keep this page open.</p>
            <p className="text-sm text-muted-foreground mt-6">Pending</p>
          </>
        )}
      </div>
    );
  }

  // Results View
  if (result) {
    const tracks = getTracks();
    return (
      <div className="space-y-4">
        {/* Close button */}
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" onClick={clearFile}>
            <X className="w-5 h-5" />
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

        {/* Process Another */}
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={clearFile}>
            Process Another File
          </Button>
        </div>
      </div>
    );
  }

  // Upload View
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Upload Area */}
      <div
        className={`relative rounded-2xl transition-all cursor-pointer overflow-hidden ${
          isDragging
            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
            : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-border/50 to-accent/20 p-[1px]">
          <div className="w-full h-full rounded-2xl bg-card/95" />
        </div>
        
        {/* Dashed inner border */}
        <div className={`relative m-4 border-2 border-dashed rounded-xl transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20 hover:border-primary/40"
        }`}>
          <div className="flex flex-col items-center justify-center py-16 md:py-24 px-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center mb-5">
              <Upload className="w-7 h-7 text-primary" />
            </div>
            <p className="text-lg font-semibold mb-1">Drop your audio file here</p>
            <p className="text-sm text-muted-foreground mb-5 text-center">
              or click to browse • MP3, WAV, FLAC, OGG supported
            </p>
            <Button variant="secondary" size="default" className="px-6">
              Browse Files
            </Button>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="audio/*"
        className="hidden"
      />

      {/* Out of Credits Dialog */}
      <OutOfCreditsDialog 
        open={showOutOfCredits} 
        onOpenChange={setShowOutOfCredits} 
      />
    </div>
  );
}
