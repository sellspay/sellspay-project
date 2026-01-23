import { useState, useRef, useCallback } from "react";
import { Upload, Mic, Music, Loader2, X, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AudioTrackPlayer } from "@/components/tools/AudioTrackPlayer";

type Mode = "remove-vocals" | "isolate-vocals";

interface StemResult {
  url: string;
  filename: string;
}

interface ProcessingResult {
  vocals?: StemResult;
  no_vocals?: StemResult;
  instrumental?: StemResult;
}

export default function VoiceIsolator() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("remove-vocals");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("audio/")) {
      setFile(droppedFile);
      setResult(null);
    } else {
      toast.error("Please drop an audio file");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("temp-audio")
      .upload(fileName, file);

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage
      .from("temp-audio")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const processAudio = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessingStatus("Uploading file...");

    try {
      const audioUrl = await uploadToStorage(file);
      setProcessingStatus("Audio processing - AI algorithm working...");

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
            mode: "voice",
            output_format: "mp3",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Processing failed");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Processing failed");
      }

      setResult(data.stems);
      toast.success("Audio processed successfully!");

    } catch (error) {
      console.error("Processing error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process audio");
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
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
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    toast.success("All tracks downloaded!");
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
  };

  const getTracks = () => {
    if (!result) return [];
    
    const tracks = [];
    
    // Add instrumental/music track
    const instrumental = result.no_vocals || result.instrumental;
    if (instrumental) {
      tracks.push({
        id: "music",
        name: "Music",
        url: instrumental.url,
        color: "#22c55e", // green
        filename: instrumental.filename,
      });
    }
    
    // Add vocals track
    if (result.vocals) {
      tracks.push({
        id: "vocals",
        name: "Vocal",
        url: result.vocals.url,
        color: "#a855f7", // purple
        filename: result.vocals.filename,
      });
    }
    
    return tracks;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mic className="w-6 h-6 text-primary" />
          Voice Isolator
        </h1>
        <p className="text-muted-foreground mt-1">
          Remove vocals to create karaoke tracks or isolate vocals for acapella
        </p>
      </div>

      {/* Results View */}
      {result ? (
        <div className="space-y-4">
          {/* File info header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Processed successfully
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearFile}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Multi-track Player */}
          <AudioTrackPlayer
            tracks={getTracks()}
            onDownload={downloadTrack}
            onDownloadAll={downloadAll}
          />

          {/* Process Another */}
          <Button variant="outline" onClick={clearFile} className="w-full">
            Process Another File
          </Button>
        </div>
      ) : (
        <>
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={mode === "remove-vocals" ? "default" : "outline"}
              onClick={() => setMode("remove-vocals")}
              className="flex-1"
            >
              <Music className="w-4 h-4 mr-2" />
              Remove Vocals (Karaoke)
            </Button>
            <Button
              variant={mode === "isolate-vocals" ? "default" : "outline"}
              onClick={() => setMode("isolate-vocals")}
              className="flex-1"
            >
              <Mic className="w-4 h-4 mr-2" />
              Isolate Vocals (Acapella)
            </Button>
          </div>

          {/* Upload Area */}
          {!file ? (
            <Card
              className={`border-2 border-dashed transition-colors cursor-pointer ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="text-lg font-medium mb-1">Drop your audio file here</p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse • MP3, WAV, FLAC, OGG supported
                </p>
                <Button variant="outline" size="sm">
                  Browse Files
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Volume2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearFile}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="audio/*"
            className="hidden"
          />

          {/* Process Button */}
          {file && !isProcessing && (
            <Button
              className="w-full"
              size="lg"
              onClick={processAudio}
            >
              {mode === "remove-vocals" ? "Remove Vocals" : "Isolate Vocals"}
            </Button>
          )}

          {/* Processing State */}
          {isProcessing && (
            <Card className="bg-secondary/30">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="relative w-24 h-24 mb-6">
                  {/* Circular progress indicator */}
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-secondary"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      className="text-primary animate-spin"
                      style={{
                        strokeDasharray: "251.2",
                        strokeDashoffset: "188.4",
                        transformOrigin: "center",
                        animation: "spin 2s linear infinite",
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Audio processing</h3>
                <p className="text-muted-foreground">
                  Artificial intelligence algorithm now works, it may take a minute.
                </p>
                <p className="text-muted-foreground">
                  Please keep this page open.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  {processingStatus || "Pending"}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
