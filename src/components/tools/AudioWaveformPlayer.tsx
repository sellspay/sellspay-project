import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, SkipBack, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Track {
  id: string;
  name: string;
  url: string;
  color: string;
  filename: string;
}

interface AudioWaveformPlayerProps {
  tracks: Track[];
  fileName?: string;
  onDownload: (url: string, filename: string) => void;
  onDownloadAll?: () => void;
  bpm?: number;
  musicalKey?: string;
}

interface TrackState {
  volume: number;
  waveformData: number[];
}

export function AudioWaveformPlayer({
  tracks,
  fileName,
  onDownload,
  onDownloadAll,
  bpm,
  musicalKey,
}: AudioWaveformPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackStates, setTrackStates] = useState<Record<string, TrackState>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const animationRef = useRef<number>();

  // Generate realistic waveform data
  const generateWaveformData = useCallback(() => {
    const data: number[] = [];
    for (let i = 0; i < 300; i++) {
      const base = Math.random() * 0.2 + 0.1;
      const peak = Math.sin(i * 0.08) * 0.15 + Math.random() * 0.5;
      data.push(Math.min(1, Math.max(0.05, base + peak)));
    }
    return data;
  }, []);

  // Initialize track states and load audio
  useEffect(() => {
    const initialStates: Record<string, TrackState> = {};

    tracks.forEach((track) => {
      initialStates[track.id] = {
        volume: 1,
        waveformData: generateWaveformData(),
      };

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
  }, [tracks, generateWaveformData]);

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
          audio.volume = state.volume;
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

  const setVolume = (trackId: string, value: number) => {
    setTrackStates((prev) => {
      const newState = { ...prev };
      const track = newState[trackId];
      if (track) {
        track.volume = value;
        const audio = audioRefs.current[trackId];
        if (audio) {
          audio.volume = value;
        }
      }
      return newState;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-2">
      {/* Tracks with waveforms */}
      {tracks.map((track) => {
        const state = trackStates[track.id];
        if (!state) return null;

        return (
          <div key={track.id} className="flex items-center gap-3">
            {/* Track Label */}
            <div className="w-16 flex-shrink-0 text-right">
              <span className="text-sm font-medium">{track.name}</span>
            </div>

            {/* Volume Slider (visual bar like reference) */}
            <div className="w-12 flex-shrink-0 h-6 relative">
              <div
                className="absolute inset-y-0 left-0 rounded-sm"
                style={{
                  width: `${state.volume * 100}%`,
                  background: `linear-gradient(to right, ${track.color}, ${track.color}88)`,
                }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={state.volume * 100}
                onChange={(e) => setVolume(track.id, parseInt(e.target.value) / 100)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Waveform */}
            <div
              className="flex-1 h-14 relative cursor-pointer rounded overflow-hidden"
              style={{ backgroundColor: `${track.color}15` }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = (x / rect.width) * 100;
                seekTo(percent);
              }}
            >
              {/* File name on first track */}
              {track === tracks[0] && fileName && (
                <span className="absolute top-1 right-2 text-xs text-muted-foreground truncate max-w-[60%]">
                  {fileName}
                </span>
              )}

              {/* Waveform bars */}
              <div className="absolute inset-0 flex items-center">
                {state.waveformData.map((height, i) => {
                  const isPlayed = (i / state.waveformData.length) * 100 < progressPercent;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col justify-center"
                      style={{ height: "100%" }}
                    >
                      <div
                        className="w-full transition-opacity"
                        style={{
                          height: `${height * 80}%`,
                          backgroundColor: track.color,
                          opacity: isPlayed ? 1 : 0.4,
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Playhead line */}
              <div
                className="absolute top-0 bottom-0 w-px bg-foreground/80 z-10"
                style={{ left: `${progressPercent}%` }}
              />

              {/* Time indicator at playhead */}
              <div
                className="absolute bottom-1 text-xs text-muted-foreground z-10 transform -translate-x-1/2"
                style={{ left: `${progressPercent}%` }}
              >
                {formatTime(currentTime)}
              </div>
            </div>
          </div>
        );
      })}

      {/* Playback Controls - Fixed at bottom like reference */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-4">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="rounded-full w-20 h-10 gap-2"
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
        </div>

        <div className="flex items-center gap-4">
          {/* BPM Display */}
          {bpm && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">BPM:</span>
              <span className="text-sm font-medium">{bpm}</span>
            </div>
          )}

          {/* Key Display */}
          {musicalKey && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">Key:</span>
              <span className="text-sm font-medium">{musicalKey}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">format:</span>
            <span className="text-sm font-medium text-primary">mp3</span>
          </div>
          {onDownloadAll && (
            <Button onClick={onDownloadAll} size="sm">
              Save
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
