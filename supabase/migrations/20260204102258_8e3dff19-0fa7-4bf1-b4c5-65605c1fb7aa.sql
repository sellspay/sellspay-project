-- Add tool banner images to site_content table
ALTER TABLE public.site_content
ADD COLUMN IF NOT EXISTS tool_sfx_banner_url TEXT,
ADD COLUMN IF NOT EXISTS tool_vocal_banner_url TEXT,
ADD COLUMN IF NOT EXISTS tool_manga_banner_url TEXT,
ADD COLUMN IF NOT EXISTS tool_video_banner_url TEXT,
ADD COLUMN IF NOT EXISTS tool_audio_cutter_banner_url TEXT,
ADD COLUMN IF NOT EXISTS tool_audio_joiner_banner_url TEXT,
ADD COLUMN IF NOT EXISTS tool_audio_converter_banner_url TEXT,
ADD COLUMN IF NOT EXISTS tool_audio_recorder_banner_url TEXT,
ADD COLUMN IF NOT EXISTS tool_waveform_banner_url TEXT,
ADD COLUMN IF NOT EXISTS tool_video_to_audio_banner_url TEXT;