import { useState, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Camera, Check, X, Loader2 } from 'lucide-react';

interface VideoFrameSelectorProps {
  videoSrc: string;
  onFrameSelect: (blob: Blob, dataUrl: string) => void;
  onCancel: () => void;
}

export default function VideoFrameSelector({ 
  videoSrc, 
  onFrameSelect,
  onCancel
}: VideoFrameSelectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [previewFrame, setPreviewFrame] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // When video metadata loads
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Capture current frame
  const captureFrame = (): { blob: Blob; dataUrl: string } | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get data URL for preview
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    // Convert to blob
    const binaryString = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/jpeg' });
    
    return { blob, dataUrl };
  };

  // Capture initial frame when video data is ready
  const handleLoadedData = () => {
    setIsLoading(false);
    const result = captureFrame();
    if (result) {
      setPreviewFrame(result.dataUrl);
    }
  };

  // Handle video load error
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Update preview when seeking
  const handleSeek = (values: number[]) => {
    const time = values[0];
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // When video seeks, update preview
  const handleSeeked = () => {
    const result = captureFrame();
    if (result) {
      setPreviewFrame(result.dataUrl);
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    const result = captureFrame();
    if (result) {
      onFrameSelect(result.blob, result.dataUrl);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 p-4 rounded-lg bg-secondary/20 border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Camera className="w-4 h-4 text-primary" />
          <span>Select Cover Frame</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Hidden video for seeking */}
      <video
        ref={videoRef}
        src={videoSrc}
        crossOrigin="anonymous"
        preload="auto"
        className="hidden"
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedData}
        onSeeked={handleSeeked}
        onError={handleError}
        muted
        playsInline
      />
      
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Frame Preview */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {hasError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-destructive gap-2">
            <X className="w-8 h-8" />
            <span className="text-sm">Failed to load video</span>
          </div>
        ) : isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Loading video...</span>
          </div>
        ) : previewFrame ? (
          <img 
            src={previewFrame} 
            alt="Selected frame" 
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-sm">No frame captured</span>
          </div>
        )}
      </div>

      {/* Timeline slider */}
      {duration > 0 && (
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration}
            step={0.1}
            onValueChange={handleSeek}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleConfirm} className="flex-1" disabled={!previewFrame}>
          <Check className="w-4 h-4 mr-2" />
          Use This Frame
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Scrub through the video to find the perfect cover image
      </p>
    </div>
  );
}
