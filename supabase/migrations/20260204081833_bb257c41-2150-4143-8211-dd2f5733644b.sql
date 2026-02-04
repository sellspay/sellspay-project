-- Create a table for site content settings
CREATE TABLE public.site_content (
  id TEXT PRIMARY KEY DEFAULT 'main',
  hero_media_type TEXT DEFAULT 'image' CHECK (hero_media_type IN ('image', 'video')),
  hero_image_url TEXT,
  hero_video_url TEXT,
  hero_headline TEXT DEFAULT 'Create with',
  hero_subheadline TEXT DEFAULT 'Premium',
  hero_rotating_words TEXT[] DEFAULT ARRAY['Presets', 'LUTs', 'SFX', 'Templates', 'Overlays', 'Fonts', 'Tutorials'],
  hero_subtitle TEXT DEFAULT 'Discover thousands of high-quality digital assets from professional creators. Everything you need to level up your work.',
  hero_stats JSONB DEFAULT '{"assets": "5,000+", "creators": "500+", "downloads": "50k+"}'::jsonb,
  tools_title TEXT DEFAULT 'AI Studio',
  tools_subtitle TEXT DEFAULT 'Professional AI tools for modern creators',
  sfx_thumbnails JSONB,
  vocal_thumbnails JSONB,
  manga_thumbnails JSONB,
  video_thumbnails JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read site content
CREATE POLICY "Anyone can read site content"
ON public.site_content
FOR SELECT
USING (true);

-- Only admins can update site content (we'll check in app code)
CREATE POLICY "Authenticated users can update site content"
ON public.site_content
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert site content"
ON public.site_content
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Insert default row
INSERT INTO public.site_content (id) VALUES ('main');

-- Create trigger for updated_at
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();