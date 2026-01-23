import { useState, useRef, useCallback } from "react";
import { Upload, Download, Play, Pause, Zap, Music, Loader2, X, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface StemResult {
  url: string;
  filename: string;
}

interface ProcessingResult {
  other?: StemResult;
  vocals?: StemResult;
  drums?: StemResult;
  bass?: StemResult;
}

export default function SFXIsolator() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
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
    setProgress(10);

    try {
      setProgress(20);
      const audioUrl = await uploadToStorage(file);
      setProgress(30);

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
            mode: "sfx",
            output_format: "mp3",
          }),
        }
      );

      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, 3000);

      if (!response.ok) {
        clearInterval(progressInterval);
        const errorData = await response.json();
        throw new Error(errorData.error || "Processing failed");
      }

      const data = await response.json();
      clearInterval(progressInterval);

      if (!data.success) {
        throw new Error(data.error || "Processing failed");
      }

      setProgress(100);
      setResult(data.stems);
      toast.success("Audio processed successfully!");

    } catch (error) {
      console.error("Processing error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process audio");
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlay = (trackName: string, url: string) => {
    const currentAudio = audioRefs.current[trackName];
    
    Object.entries(audioRefs.current).forEach(([name, audio]) => {
      if (name !== trackName && audio) {
        audio.pause();
      }
    });

    if (!currentAudio) {
      const audio = new Audio(url);
      audio.onended = () => setPlayingTrack(null);
      audioRefs.current[trackName] = audio;
      audio.play();
      setPlayingTrack(trackName);
    } else if (playingTrack === trackName) {
      currentAudio.pause();
      setPlayingTrack(null);
    } else {
      currentAudio.play();
      setPlayingTrack(trackName);
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

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    Object.values(audioRefs.current).forEach((audio) => audio?.pause());
    audioRefs.current = {};
    setPlayingTrack(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          SFX Isolator
        </h1>
        <p className="text-muted-foreground mt-1">
          Extract sound effects, synths, and ambient sounds from any track
        </p>
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
      {file && !result && (
        <Button
          className="w-full"
          size="lg"
          onClick={processAudio}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing with AI...
            </>
          ) : (
            "Extract Sound Effects"
          )}
        </Button>
      )}

      {/* Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="font-medium">Processing your audio...</p>
                <p className="text-sm text-muted-foreground">
                  Separating sound effects from music
                </p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Results</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* SFX / Other Track */}
            {result.other && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Sound Effects</p>
                        <p className="text-sm text-muted-foreground">
                          Synths, ambience, and FX
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => togglePlay("sfx", result.other!.url)}
                    >
                      {playingTrack === "sfx" ? (
                        <><Pause className="w-4 h-4 mr-2" /> Pause</>
                      ) : (
                        <><Play className="w-4 h-4 mr-2" /> Play</>
                      )}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => downloadTrack(result.other!.url, result.other!.filename)}
                    >
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Music Track (everything else) */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Music className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Music</p>
                      <p className="text-sm text-muted-foreground">
                        Vocals, drums, and bass
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-lg text-center">
                  Download individual stems using Music Splitter
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Process Another */}
          <Button variant="outline" onClick={clearFile} className="w-full">
            Process Another File
          </Button>
        </div>
      )}
    </div>
  );
}
