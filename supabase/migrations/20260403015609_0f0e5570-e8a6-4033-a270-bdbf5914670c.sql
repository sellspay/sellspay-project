
-- Curated playlists (weekly featured playlists)
CREATE TABLE public.curated_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  date_range TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tracks within a curated playlist
CREATE TABLE public.curated_playlist_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.curated_playlists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  genre TEXT,
  duration_seconds INT,
  cover_image_url TEXT,
  audio_preview_url TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.curated_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Public read access (these are curated by admins, visible to all)
CREATE POLICY "Anyone can view active playlists"
  ON public.curated_playlists FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view playlist tracks"
  ON public.curated_playlist_tracks FOR SELECT
  USING (true);

-- Admin write access
CREATE POLICY "Admins can manage playlists"
  ON public.curated_playlists FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage playlist tracks"
  ON public.curated_playlist_tracks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
