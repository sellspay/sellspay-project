-- Add dedicated columns for SFX Isolator and Music Splitter tool banners
ALTER TABLE public.site_content 
ADD COLUMN IF NOT EXISTS tool_sfx_isolator_banner_url TEXT,
ADD COLUMN IF NOT EXISTS tool_music_splitter_banner_url TEXT;