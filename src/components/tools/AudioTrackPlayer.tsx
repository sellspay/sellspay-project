import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, SkipBack, Volume2, VolumeX, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface Track {
  id: string;
  name: string;
  url: string;
  color: string;
  filename: string;
}

interface AudioTrackPlayerProps {
  tracks: Track[];
  onDownload: (url: string, filename: string) => void;
  onDownloadAll?: () => void;
}

interface TrackState {
  muted: boolean;
  volume: number;
  waveformData: number[];
}

export function AudioTrackPlayer({ tracks, onDownload, onDownloadAll }: AudioTrackPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackStates, setTrackStates] = useState<Record<string, TrackState>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize track states and load audio
  useEffect(() => {
    const initialStates: Record<string, TrackState> = {};
    
    tracks.forEach((track) => {
      initialStates[track.id] = {
        muted: false,
        volume: 1,
        waveformData: generateWaveformData(),
      };

      // Create audio elements
      if (!audioRefs.current[track.id]) {
        const audio = new Audio(track.url);
        audio.preload = "metadata";
        audioRefs.current[track.id] = audio;

        audio.addEventListener("loadedmetadata", () => {
          if (audio.duration > duration) {
            setDuration(audio.duration);
          }
        });

        audio.addEventListener("ended", () => {
          setIsPlaying(false);
          setCurrentTime(0);
          Object.values(audioRefs.current).forEach((a) => {
            a.currentTime = 0;
          });
        });
      }
    });

    setTrackStates(initialStates);

    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioRefs.current = {};
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [tracks]);

  // Generate fake waveform data (in real app, analyze actual audio)
  const generateWaveformData = () => {
    const data: number[] = [];
    for (let i = 0; i < 200; i++) {
      // Create more realistic waveform pattern
      const base = Math.random() * 0.3 + 0.1;
      const peak = Math.sin(i * 0.1) * 0.2 + Math.random() * 0.4;
      data.push(Math.min(1, base + peak));
    }
    return data;
  };

  // Update time display
  const updateTime = useCallback(() => {
    const firstAudio = Object.values(audioRefs.current)[0];
    if (firstAudio) {
      setCurrentTime(firstAudio.currentTime);
    }
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateTime);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateTime);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, updateTime]);

  const togglePlay = () => {
    if (isPlaying) {
      Object.values(audioRefs.current).forEach((audio) => audio.pause());
    } else {
      Object.entries(audioRefs.current).forEach(([id, audio]) => {
        const state = trackStates[id];
        if (state) {
          audio.volume = state.muted ? 0 : state.volume;
        }
        audio.play();
      });
    }
    setIsPlaying(!isPlaying);
  };

  const skipToStart = () => {
    Object.values(audioRefs.current).forEach((audio) => {
      audio.currentTime = 0;
    });
    setCurrentTime(0);
  };

  const seekTo = (position: number) => {
    const newTime = (position / 100) * duration;
    Object.values(audioRefs.current).forEach((audio) => {
      audio.currentTime = newTime;
    });
    setCurrentTime(newTime);
  };

  const toggleMute = (trackId: string) => {
    setTrackStates((prev) => {
      const newState = { ...prev };
      const track = newState[trackId];
      if (track) {
        track.muted = !track.muted;
        const audio = audioRefs.current[trackId];
        if (audio) {
          audio.volume = track.muted ? 0 : track.volume;
        }
      }
      return newState;
    });
  };

  const setVolume = (trackId: string, value: number) => {
    setTrackStates((prev) => {
      const newState = { ...prev };
      const track = newState[trackId];
      if (track) {
        track.volume = value;
        const audio = audioRefs.current[trackId];
        if (audio && !track.muted) {
          audio.volume = value;
        }
      }
      return newState;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Tracks */}
      <div className="space-y-2" ref={containerRef}>
        {tracks.map((track) => {
          const state = trackStates[track.id];
          if (!state) return null;

          return (
            <div
              key={track.id}
              className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3"
            >
              {/* Track Label */}
              <div className="w-20 flex-shrink-0">
                <span className="text-sm font-medium">{track.name}</span>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-2 w-24 flex-shrink-0">
                <button
                  onClick={() => toggleMute(track.id)}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  {state.muted ? (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <Slider
                  value={[state.muted ? 0 : state.volume * 100]}
                  onValueChange={(v) => setVolume(track.id, v[0] / 100)}
                  max={100}
                  step={1}
                  className="w-16"
                />
              </div>

              {/* Waveform */}
              <div
                className="flex-1 h-12 relative cursor-pointer rounded overflow-hidden"
                style={{ backgroundColor: `${track.color}20` }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percent = (x / rect.width) * 100;
                  seekTo(percent);
                }}
              >
                {/* Waveform bars */}
                <div className="absolute inset-0 flex items-center gap-px px-1">
                  {state.waveformData.map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col justify-center"
                      style={{ height: "100%" }}
                    >
                      <div
                        className="w-full rounded-sm transition-opacity"
                        style={{
                          height: `${height * 100}%`,
                          backgroundColor: track.color,
                          opacity: (i / state.waveformData.length) * 100 < progressPercent ? 1 : 0.4,
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>

              {/* Download Button */}
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={() => onDownload(track.url, track.filename)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full w-10 h-10"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={skipToStart}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">format:</span>
          <span className="text-sm font-medium text-primary">mp3</span>
          {onDownloadAll && (
            <Button onClick={onDownloadAll} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Save All
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
