import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Reveal } from './Reveal';
import { Play, Pause, Download, Star, MoreHorizontal, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  duration_seconds: number | null;
  cover_image_url: string | null;
  audio_preview_url: string | null;
  product_id: string | null;
  display_order: number;
}

interface Playlist {
  id: string;
  title: string;
  subtitle: string | null;
  date_range: string | null;
}

// Generate fake waveform data for visual display
function generateWaveform(): number[] {
  const data: number[] = [];
  for (let i = 0; i < 80; i++) {
    const base = Math.random() * 0.2 + 0.1;
    const peak = Math.sin(i * 0.15) * 0.2 + Math.random() * 0.5;
    data.push(Math.min(1, base + peak));
  }
  return data;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function HomeMusicSection() {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [waveforms] = useState<Record<string, number[]>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number>();

  useEffect(() => {
    async function fetchPlaylist() {
      const { data: playlists } = await supabase
        .from('curated_playlists')
        .select('id, title, subtitle, date_range')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(1);

      if (!playlists || playlists.length === 0) {
        setLoading(false);
        return;
      }

      const pl = playlists[0];
      setPlaylist(pl);

      const { data: trackData } = await supabase
        .from('curated_playlist_tracks')
        .select('id, title, artist, genre, duration_seconds, cover_image_url, audio_preview_url, product_id, display_order')
        .eq('playlist_id', pl.id)
        .order('display_order', { ascending: true });

      setTracks(trackData || []);
      setLoading(false);
    }
    fetchPlaylist();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const getWaveform = useCallback((id: string) => {
    if (!waveforms[id]) {
      waveforms[id] = generateWaveform();
    }
    return waveforms[id];
  }, [waveforms]);

  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (audio && playingId && audio.duration) {
      setProgress(prev => ({ ...prev, [playingId]: (audio.currentTime / audio.duration) * 100 }));
      animRef.current = requestAnimationFrame(updateProgress);
    }
  }, [playingId]);

  const togglePlay = (track: Track) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (!track.audio_preview_url) return;

    const audio = new Audio(track.audio_preview_url);
    audioRef.current = audio;
    setPlayingId(track.id);

    audio.addEventListener('ended', () => {
      setPlayingId(null);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    });

    audio.play();
    animRef.current = requestAnimationFrame(updateProgress);
  };

  // Update animation frame when playingId changes
  useEffect(() => {
    if (playingId) {
      animRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [playingId, updateProgress]);

  if (loading || !playlist || tracks.length === 0) return null;

  return (
    <Reveal>
      <section className="px-6 sm:px-8 lg:px-10 pb-10">
        {/* Header */}
        <div className="mb-2">
          {playlist.date_range && (
            <p className="text-xs text-muted-foreground/60 mb-1">{playlist.date_range}</p>
          )}
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {playlist.title}
          </h2>
          {playlist.subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{playlist.subtitle}</p>
          )}
        </div>

        {/* Track List */}
        <div className="mt-5 space-y-px">
          {tracks.map((track, index) => {
            const isPlaying = playingId === track.id;
            const waveform = getWaveform(track.id);
            const prog = progress[track.id] || 0;

            return (
              <div
                key={track.id}
                className={`group flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-lg transition-colors ${
                  isPlaying ? 'bg-primary/10' : 'hover:bg-secondary/40'
                }`}
              >
                {/* Play button + Cover */}
                <div className="relative flex-shrink-0">
                  {track.cover_image_url ? (
                    <img
                      src={track.cover_image_url}
                      alt={track.title}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-secondary flex items-center justify-center">
                      <span className="text-xs text-muted-foreground font-bold">{index + 1}</span>
                    </div>
                  )}
                  <button
                    onClick={() => togglePlay(track)}
                    className={`absolute inset-0 flex items-center justify-center rounded bg-black/40 transition-opacity ${
                      isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 text-white" fill="white" />
                    ) : (
                      <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                    )}
                  </button>
                </div>

                {/* Track Info */}
                <div className="min-w-0 w-32 sm:w-44 flex-shrink-0">
                  <p className={`text-sm font-medium truncate ${isPlaying ? 'text-primary' : 'text-foreground'}`}>
                    {track.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                </div>

                {/* Genre chip */}
                {track.genre && (
                  <div className="hidden md:flex items-center gap-1">
                    <ChevronDown className="w-3 h-3 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground">{track.genre}</span>
                  </div>
                )}

                {/* Duration */}
                <span className="hidden sm:block text-xs text-muted-foreground tabular-nums w-12 text-right flex-shrink-0">
                  {formatDuration(track.duration_seconds)}
                </span>

                {/* Waveform */}
                <div className="flex-1 hidden lg:flex items-center h-8 gap-px">
                  {waveform.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 flex items-center justify-center"
                      style={{ height: '100%' }}
                    >
                      <div
                        className="w-full rounded-sm"
                        style={{
                          height: `${h * 100}%`,
                          backgroundColor: (i / waveform.length) * 100 < prog
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--muted-foreground) / 0.25)',
                          transition: 'background-color 0.1s',
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {track.product_id && (
                    <Link
                      to={`/product/${track.product_id}`}
                      className="p-1.5 rounded hover:bg-secondary transition-colors"
                    >
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  )}
                  <button className="p-1.5 rounded hover:bg-secondary transition-colors">
                    <Star className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-secondary transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Reveal>
  );
}
