import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, SkipBack, Download, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const generateWaveformData = useCallback(() => {
    const data: number[] = [];
    for (let i = 0; i < 200; i++) {
      const base = Math.random() * 0.2 + 0.1;
      const peak = Math.sin(i * 0.08) * 0.15 + Math.random() * 0.5;
      data.push(Math.min(1, Math.max(0.05, base + peak)));
    }
    return data;
  }, []);

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
          if (audio.duration > duration) setDuration(audio.duration);
        });
        audio.addEventListener("ended", () => {
          setIsPlaying(false);
          setCurrentTime(0);
          Object.values(audioRefs.current).forEach((a) => { a.currentTime = 0; });
        });
      }
    });
    setTrackStates(initialStates);
    return () => {
      Object.values(audioRefs.current).forEach((audio) => { audio.pause(); audio.src = ""; });
      audioRefs.current = {};
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [tracks, generateWaveformData]);

  const updateTime = useCallback(() => {
    const firstAudio = Object.values(audioRefs.current)[0];
    if (firstAudio) setCurrentTime(firstAudio.currentTime);
    if (isPlaying) animationRef.current = requestAnimationFrame(updateTime);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) animationRef.current = requestAnimationFrame(updateTime);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPlaying, updateTime]);

  const togglePlay = () => {
    if (isPlaying) {
      Object.values(audioRefs.current).forEach((audio) => audio.pause());
    } else {
      Object.entries(audioRefs.current).forEach(([id, audio]) => {
        const state = trackStates[id];
        if (state) audio.volume = state.volume;
        audio.play();
      });
    }
    setIsPlaying(!isPlaying);
  };

  const skipToStart = () => {
    Object.values(audioRefs.current).forEach((audio) => { audio.currentTime = 0; });
    setCurrentTime(0);
  };

  const seekTo = (position: number) => {
    const newTime = (position / 100) * duration;
    Object.values(audioRefs.current).forEach((audio) => { audio.currentTime = newTime; });
    setCurrentTime(newTime);
  };

  const setVolume = (trackId: string, value: number) => {
    setTrackStates((prev) => {
      const newState = { ...prev };
      const track = newState[trackId];
      if (track) {
        track.volume = value;
        const audio = audioRefs.current[trackId];
        if (audio) audio.volume = value;
      }
      return newState;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl bg-card/50 border border-border/50 overflow-hidden">
      {/* Track rows */}
      <div className="divide-y divide-border/30">
        {tracks.map((track) => {
          const state = trackStates[track.id];
          if (!state) return null;

          return (
            <div key={track.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20 transition-colors">
              {/* Color dot + name */}
              <div className="flex items-center gap-2.5 w-24 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: track.color }} />
                <span className="text-sm font-medium text-foreground truncate">{track.name}</span>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-1.5 w-20 flex-shrink-0">
                <Volume2 className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                <div className="relative w-14 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all"
                    style={{ width: `${state.volume * 100}%`, backgroundColor: track.color }}
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
              </div>

              {/* Waveform */}
              <div
                className="flex-1 h-12 relative cursor-pointer rounded-lg overflow-hidden"
                style={{ backgroundColor: `${track.color}08` }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  seekTo((x / rect.width) * 100);
                }}
              >
                <div className="absolute inset-0 flex items-center gap-px px-0.5">
                  {state.waveformData.map((height, i) => {
                    const isPlayed = (i / state.waveformData.length) * 100 < progressPercent;
                    return (
                      <div key={i} className="flex-1 flex flex-col justify-center" style={{ height: "100%" }}>
                        <div
                          className="w-full rounded-full transition-opacity duration-75"
                          style={{
                            height: `${height * 75}%`,
                            backgroundColor: track.color,
                            opacity: isPlayed ? 0.9 : 0.25,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-px z-10"
                  style={{ left: `${progressPercent}%`, backgroundColor: track.color }}
                />
              </div>

              {/* Download single */}
              <button
                onClick={(e) => { e.stopPropagation(); onDownload(track.url, track.filename); }}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/10 border-t border-border/30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-full hover:bg-primary/10"
            onClick={skipToStart}
          >
            <SkipBack className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:brightness-110 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-primary-foreground" />
            ) : (
              <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
            )}
          </button>
          <span className="text-xs text-muted-foreground font-mono ml-2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {bpm && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/30">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">BPM</span>
              <span className="text-xs font-medium text-foreground">{bpm}</span>
            </div>
          )}
          {musicalKey && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/30">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Key</span>
              <span className="text-xs font-medium text-foreground">{musicalKey}</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/30">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Format</span>
            <span className="text-xs font-medium text-primary">MP3</span>
          </div>
          {onDownloadAll && (
            <Button onClick={onDownloadAll} size="sm" className="h-8 text-xs px-4">
              Save All
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
