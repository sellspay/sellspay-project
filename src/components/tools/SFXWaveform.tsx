import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SFXWaveformProps {
  audioUrl: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export function SFXWaveform({ audioUrl, isPlaying, onPlayPause, audioRef }: SFXWaveformProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Generate realistic waveform data
  const generateWaveformData = useCallback(() => {
    const data: number[] = [];
    const bars = 80;
    for (let i = 0; i < bars; i++) {
      const position = i / bars;
      // Create a more natural waveform pattern
      const base = 0.15;
      const wave1 = Math.sin(position * Math.PI * 4) * 0.2;
      const wave2 = Math.sin(position * Math.PI * 8 + 0.5) * 0.15;
      const noise = Math.random() * 0.35;
      const envelope = Math.sin(position * Math.PI) * 0.3; // Fade in/out
      data.push(Math.min(1, Math.max(0.08, base + wave1 + wave2 + noise + envelope)));
    }
    return data;
  }, []);

  useEffect(() => {
    setWaveformData(generateWaveformData());
  }, [audioUrl, generateWaveformData]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);

    if (audio.duration) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [audioRef, audioUrl]);

  // Smooth animation for playhead
  useEffect(() => {
    const updateAnimation = () => {
      if (audioRef.current && isPlaying) {
        setCurrentTime(audioRef.current.currentTime);
        animationRef.current = requestAnimationFrame(updateAnimation);
      }
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateAnimation);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, audioRef]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !audioRef.current || !duration) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full space-y-4">
      {/* Waveform Container */}
      <div
        ref={containerRef}
        onClick={handleSeek}
        className="relative h-20 bg-secondary/30 rounded-lg cursor-pointer overflow-hidden group"
      >
        {/* Waveform Bars */}
        <div className="absolute inset-0 flex items-center justify-center gap-[2px] px-2">
          {waveformData.map((height, i) => {
            const barPosition = (i / waveformData.length) * 100;
            const isPlayed = barPosition < progressPercent;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-center"
                style={{ height: "100%" }}
              >
                <div
                  className="w-full rounded-full transition-all duration-75"
                  style={{
                    height: `${height * 85}%`,
                    backgroundColor: isPlayed ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.3)",
                    minHeight: "4px",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-lg shadow-primary/50 z-10 transition-none"
          style={{ left: `${progressPercent}%` }}
        />

        {/* Time tooltip on hover */}
        <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={handleRestart}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-primary/50 hover:border-primary hover:bg-primary/10"
          onClick={onPlayPause}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
