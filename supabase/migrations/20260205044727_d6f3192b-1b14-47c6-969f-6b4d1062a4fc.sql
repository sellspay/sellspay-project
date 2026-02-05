-- Add columns for the 6 panel cards in AIToolsReveal section
-- Each panel can have an image or video (up to 100MB)
ALTER TABLE public.site_content 
ADD COLUMN IF NOT EXISTS reveal_panel_1_media_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reveal_panel_1_media_type TEXT DEFAULT 'image',
ADD COLUMN IF NOT EXISTS reveal_panel_2_media_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reveal_panel_2_media_type TEXT DEFAULT 'image',
ADD COLUMN IF NOT EXISTS reveal_panel_3_media_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reveal_panel_3_media_type TEXT DEFAULT 'image',
ADD COLUMN IF NOT EXISTS reveal_panel_4_media_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reveal_panel_4_media_type TEXT DEFAULT 'image',
ADD COLUMN IF NOT EXISTS reveal_panel_5_media_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reveal_panel_5_media_type TEXT DEFAULT 'image',
ADD COLUMN IF NOT EXISTS reveal_panel_6_media_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reveal_panel_6_media_type TEXT DEFAULT 'image';

-- Add check constraint for media type
ALTER TABLE public.site_content
ADD CONSTRAINT reveal_panel_1_media_type_check CHECK (reveal_panel_1_media_type IN ('image', 'video')),
ADD CONSTRAINT reveal_panel_2_media_type_check CHECK (reveal_panel_2_media_type IN ('image', 'video')),
ADD CONSTRAINT reveal_panel_3_media_type_check CHECK (reveal_panel_3_media_type IN ('image', 'video')),
ADD CONSTRAINT reveal_panel_4_media_type_check CHECK (reveal_panel_4_media_type IN ('image', 'video')),
ADD CONSTRAINT reveal_panel_5_media_type_check CHECK (reveal_panel_5_media_type IN ('image', 'video')),
ADD CONSTRAINT reveal_panel_6_media_type_check CHECK (reveal_panel_6_media_type IN ('image', 'video'));