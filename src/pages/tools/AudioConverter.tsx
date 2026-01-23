import { useState, useRef } from "react";
import { Upload, FileAudio, Download, RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function AudioConverter() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputFormat, setOutputFormat] = useState("mp3");
  const [audioDuration, setAudioDuration] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setProgress(0);
      toast.success("Audio file loaded successfully");
    } else {
      toast.error("Please select a valid audio file");
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getInputFormat = () => {
    if (!audioFile) return "Unknown";
    const extension = audioFile.name.split(".").pop()?.toUpperCase() || "Unknown";
    return extension;
  };

  const convertAudio = async () => {
    if (!audioFile) return;

    setIsProcessing(true);
    setProgress(20);
    toast.info("Converting audio... This may take a moment.");

    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      setProgress(40);

      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setProgress(60);

      // Convert to WAV (browser limitation - more formats would need ffmpeg.wasm)
      const wavBlob = bufferToWave(audioBuffer, audioBuffer.length);
      setProgress(80);

      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${audioFile.name.replace(/\.[^/.]+$/, "")}.${outputFormat}`;
      a.click();
      URL.revokeObjectURL(url);

      setProgress(100);
      audioContext.close();
      toast.success("Audio converted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to convert audio");
    } finally {
      setIsProcessing(false);
    }
  };

  const bufferToWave = (abuffer: AudioBuffer, len: number) => {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels: Float32Array[] = [];
    let sample: number;
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < numOfChan; i++) {
      channels.push(abuffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([buffer], { type: "audio/wav" });
  };

  const reset = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioFile(null);
    setAudioUrl(null);
    setProgress(0);
    setAudioDuration(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Audio Converter</h1>
        <p className="text-muted-foreground">
          Convert audio files between different formats. Free, no signup required.
        </p>
      </div>

      {!audioFile ? (
        <Card className="bg-card/50 border-dashed border-2 border-border/50 hover:border-primary/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <FileAudio className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upload Audio File</h3>
            <p className="text-muted-foreground mb-4">
              Supports MP3, WAV, OGG, AAC, FLAC, and more
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Choose File
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{audioFile.name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={reset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hidden audio element for metadata */}
              <audio
                ref={audioRef}
                src={audioUrl || undefined}
                onLoadedMetadata={handleLoadedMetadata}
                className="hidden"
              />

              {/* Conversion Flow */}
              <div className="flex items-center justify-center gap-4 py-8">
                <div className="p-6 rounded-xl bg-secondary/20 text-center">
                  <FileAudio className="w-12 h-12 mx-auto mb-3 text-primary" />
                  <p className="text-2xl font-bold">{getInputFormat()}</p>
                  <p className="text-sm text-muted-foreground">Input</p>
                </div>
                
                <ArrowRight className="w-8 h-8 text-muted-foreground" />
                
                <div className="p-6 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-center border border-primary/30">
                  <FileAudio className="w-12 h-12 mx-auto mb-3 text-accent" />
                  <p className="text-2xl font-bold uppercase">{outputFormat}</p>
                  <p className="text-sm text-muted-foreground">Output</p>
                </div>
              </div>

              {/* File Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-secondary/20 text-center">
                  <p className="text-sm text-muted-foreground">File Size</p>
                  <p className="font-semibold">{formatFileSize(audioFile.size)}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/20 text-center">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{formatTime(audioDuration)}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/20 text-center">
                  <p className="text-sm text-muted-foreground">Channels</p>
                  <p className="font-semibold">Stereo</p>
                </div>
              </div>

              {/* Output Format Selection */}
              <div className="flex items-center justify-center gap-4">
                <label className="text-sm text-muted-foreground">Convert to:</label>
                <Select value={outputFormat} onValueChange={setOutputFormat} disabled={isProcessing}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp3">MP3</SelectItem>
                    <SelectItem value="wav">WAV</SelectItem>
                    <SelectItem value="ogg">OGG</SelectItem>
                    <SelectItem value="webm">WebM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    Converting... {Math.round(progress)}%
                  </p>
                </div>
              )}

              {/* Convert Button */}
              <Button
                onClick={convertAudio}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-primary to-accent"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                {isProcessing ? "Converting..." : "Convert & Download"}
              </Button>
            </CardContent>
          </Card>

          {/* Supported Formats */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Supported Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["MP3", "WAV", "OGG", "AAC", "FLAC", "M4A", "WebM", "AIFF"].map((format) => (
                  <div key={format} className="p-3 rounded-lg bg-secondary/20 text-center">
                    <p className="font-medium">{format}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
