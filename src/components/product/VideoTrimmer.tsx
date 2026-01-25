import { useState, useRef, useEffect, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Play, Pause, Scissors, Check } from 'lucide-react';

interface VideoTrimmerProps {
  videoSrc: string;
  onTrimConfirm: (startTime: number, endTime: number) => void;
  maxDuration?: number;
  minDuration?: number;
}

export default function VideoTrimmer({ 
  videoSrc, 
  onTrimConfirm, 
  maxDuration = 5, 
  minDuration = 1 
}: VideoTrimmerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(maxDuration);
  const [currentTime, setCurrentTime] = useState(0);
  const animationRef = useRef<number>();

  // When video metadata loads
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      // Set initial end time to min(maxDuration, videoDuration)
      setEndTime(Math.min(maxDuration, dur));
    }
  };

  // Update current time during playback
  const updateProgress = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
      // Loop within selected range
      if (time >= endTime) {
        videoRef.current.currentTime = startTime;
      }
    }
    animationRef.current = requestAnimationFrame(updateProgress);
  }, [startTime, endTime]);

  // Handle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      // Start from startTime if not within range
      if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    setIsPlaying(!isPlaying);
  };

  // Handle range change
  const handleRangeChange = (values: number[]) => {
    let [newStart, newEnd] = values;
    
    // Enforce min/max duration
    const selectedDuration = newEnd - newStart;
    if (selectedDuration < minDuration) {
      newEnd = newStart + minDuration;
      if (newEnd > duration) {
        newEnd = duration;
        newStart = Math.max(0, newEnd - minDuration);
      }
    } else if (selectedDuration > maxDuration) {
      // Keep the moved handle and adjust the other
      if (Math.abs(newStart - startTime) > Math.abs(newEnd - endTime)) {
        newEnd = newStart + maxDuration;
        if (newEnd > duration) newEnd = duration;
      } else {
        newStart = newEnd - maxDuration;
        if (newStart < 0) newStart = 0;
      }
    }
    
    setStartTime(newStart);
    setEndTime(newEnd);
    
    // Seek to new start
    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
    }
  };

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Confirm selection
  const handleConfirm = () => {
    onTrimConfirm(startTime, endTime);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const selectedDuration = endTime - startTime;

  return (
    <div className="space-y-4 p-4 rounded-lg bg-secondary/20 border">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Scissors className="w-4 h-4 text-primary" />
        <span>Select Preview Clip ({minDuration}-{maxDuration} seconds)</span>
      </div>
      
      {/* Video Preview */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain"
          onLoadedMetadata={handleLoadedMetadata}
          muted
          playsInline
        />
        
        {/* Play overlay */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-12 h-12 text-white drop-shadow-lg" />
          ) : (
            <Play className="w-12 h-12 text-white drop-shadow-lg" />
          )}
        </button>
        
        {/* Time overlay */}
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 text-white text-xs font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Timeline with dual slider */}
      {duration > 0 && (
        <div className="space-y-3">
          <div className="relative pt-2">
            {/* Range slider */}
            <Slider
              value={[startTime, endTime]}
              min={0}
              max={duration}
              step={0.1}
              onValueChange={handleRangeChange}
              className="[&_[role=slider]]:w-4 [&_[role=slider]]:h-4"
            />
            
            {/* Playhead indicator */}
            <div 
              className="absolute top-0 w-0.5 h-3 bg-primary pointer-events-none"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          
          {/* Time labels */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Start: <span className="font-mono text-foreground">{formatTime(startTime)}</span></span>
            <span className={`font-medium ${selectedDuration >= minDuration && selectedDuration <= maxDuration ? 'text-emerald-500' : 'text-destructive'}`}>
              {selectedDuration.toFixed(1)}s selected
            </span>
            <span>End: <span className="font-mono text-foreground">{formatTime(endTime)}</span></span>
          </div>
        </div>
      )}

      {/* Confirm button */}
      <Button
        onClick={handleConfirm}
        className="w-full"
        disabled={selectedDuration < minDuration || selectedDuration > maxDuration}
      >
        <Check className="w-4 h-4 mr-2" />
        Use This Clip ({selectedDuration.toFixed(1)}s)
      </Button>
      
      <p className="text-xs text-muted-foreground text-center">
        This clip will loop on hover in product cards
      </p>
    </div>
  );
}

