import { useState, useRef } from "react";
import { Upload, Video, Download, RotateCcw, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

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
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setProgress(0);
      toast.success("Video file loaded successfully");
    } else {
      toast.error("Please select a valid video file");
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setAudioDuration(videoRef.current.duration);
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

  const extractAudio = async () => {
    if (!videoFile || !videoUrl) return;

    setIsProcessing(true);
    setProgress(10);
    toast.info("Extracting audio... This may take a moment.");

    try {
      // Create a video element to capture audio
      const video = document.createElement("video");
      video.src = videoUrl;
      video.muted = false;

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
      });

      setProgress(30);

      // Create audio context
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const dest = audioContext.createMediaStreamDestination();
      source.connect(dest);

      // Create MediaRecorder to capture the audio
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      
      const mediaRecorder = new MediaRecorder(dest.stream, { mimeType });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      setProgress(50);

      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve();
        
        mediaRecorder.start();
        video.play();

        // Track progress
        const progressInterval = setInterval(() => {
          const currentProgress = (video.currentTime / video.duration) * 40 + 50;
          setProgress(Math.min(currentProgress, 90));
        }, 100);

        video.onended = () => {
          clearInterval(progressInterval);
          mediaRecorder.stop();
        };
      });

      setProgress(95);

      // Create blob and download
      const audioBlob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${videoFile.name.replace(/\.[^/.]+$/, "")}_audio.${outputFormat}`;
      a.click();
      URL.revokeObjectURL(url);

      setProgress(100);
      audioContext.close();
      toast.success("Audio extracted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to extract audio. Try a different video format.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoFile(null);
    setVideoUrl(null);
    setProgress(0);
    setAudioDuration(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Video to Audio Converter</h1>
        <p className="text-muted-foreground">
          Extract audio from any video file quickly and easily. Free, no signup required.
        </p>
      </div>

      {!videoFile ? (
        <Card className="bg-card/50 border-dashed border-2 border-border/50 hover:border-primary/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Video className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upload Video File</h3>
            <p className="text-muted-foreground mb-4">
              Supports MP4, WebM, MOV, AVI, and more
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
              <CardTitle className="text-lg">{videoFile.name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={reset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Video Preview */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  src={videoUrl || undefined}
                  className="w-full h-full object-contain"
                  controls
                  onLoadedMetadata={handleLoadedMetadata}
                />
              </div>

              {/* File Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-secondary/20 text-center">
                  <Video className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">File Size</p>
                  <p className="font-semibold">{formatFileSize(videoFile.size)}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/20 text-center">
                  <Music className="w-6 h-6 mx-auto mb-2 text-accent" />
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{formatTime(audioDuration)}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/20 text-center">
                  <Download className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Output</p>
                  <p className="font-semibold uppercase">{outputFormat}</p>
                </div>
              </div>

              {/* Output Format */}
              <div className="flex items-center gap-4">
                <label className="text-sm text-muted-foreground">Output Format:</label>
                <Select value={outputFormat} onValueChange={setOutputFormat} disabled={isProcessing}>
                  <SelectTrigger className="w-32">
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
                    Extracting audio... {Math.round(progress)}%
                  </p>
                </div>
              )}

              {/* Extract Button */}
              <Button
                onClick={extractAudio}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-primary to-accent"
                size="lg"
              >
                <Music className="w-5 h-5 mr-2" />
                {isProcessing ? "Extracting..." : "Extract Audio"}
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Upload your video file using the upload button</li>
                <li>Preview the video to make sure it's the correct file</li>
                <li>Select your preferred audio output format</li>
                <li>Click "Extract Audio" to start the conversion</li>
                <li>Your audio file will download automatically</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
