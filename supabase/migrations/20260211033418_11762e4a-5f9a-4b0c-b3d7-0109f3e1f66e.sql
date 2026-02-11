
-- ============================================================
-- 1. tools_registry — Central tool catalog
-- ============================================================
CREATE TABLE public.tools_registry (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  subcategory text,
  icon_name text,
  description text,
  inputs_schema jsonb DEFAULT '{}'::jsonb,
  outputs_schema jsonb DEFAULT '{}'::jsonb,
  credit_cost integer NOT NULL DEFAULT 1,
  execution_type text NOT NULL DEFAULT 'provider_api',
  max_duration_seconds integer,
  safety_profile text NOT NULL DEFAULT 'normal',
  is_pro boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tools_registry ENABLE ROW LEVEL SECURITY;

-- Public read for everyone
CREATE POLICY "Anyone can read active tools"
  ON public.tools_registry FOR SELECT
  USING (true);

-- Admin-only write
CREATE POLICY "Admins can manage tools_registry"
  ON public.tools_registry FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.is_owner(auth.uid()));

-- ============================================================
-- 2. tool_jobs — Unified job pipeline
-- ============================================================
CREATE TABLE public.tool_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_id text NOT NULL REFERENCES public.tools_registry(id),
  status text NOT NULL DEFAULT 'queued',
  inputs jsonb DEFAULT '{}'::jsonb,
  product_context jsonb,
  brand_kit_snapshot jsonb,
  credit_cost integer NOT NULL DEFAULT 0,
  credit_refunded boolean NOT NULL DEFAULT false,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own jobs"
  ON public.tool_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs"
  ON public.tool_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON public.tool_jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_tool_jobs_user_status ON public.tool_jobs(user_id, status);
CREATE INDEX idx_tool_jobs_tool ON public.tool_jobs(tool_id);

-- Enable realtime for live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.tool_jobs;

-- ============================================================
-- 3. tool_assets — Every output is a reusable asset
-- ============================================================
CREATE TABLE public.tool_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid REFERENCES public.tool_jobs(id) ON DELETE SET NULL,
  type text NOT NULL,
  storage_url text,
  thumbnail_url text,
  filename text,
  file_size_bytes integer,
  duration_seconds numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  product_id uuid,
  used_on_page text,
  safety_flags jsonb DEFAULT '{"nsfw": false, "copyrighted": false}'::jsonb,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own assets"
  ON public.tool_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assets"
  ON public.tool_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON public.tool_assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON public.tool_assets FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_tool_assets_user ON public.tool_assets(user_id);
CREATE INDEX idx_tool_assets_job ON public.tool_assets(job_id);
CREATE INDEX idx_tool_assets_product ON public.tool_assets(product_id);

-- ============================================================
-- 4. brand_kits — Per-seller brand identity
-- ============================================================
CREATE TABLE public.brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  logo_url text,
  logo_dark_url text,
  color_palette jsonb DEFAULT '[]'::jsonb,
  fonts jsonb DEFAULT '{"heading": "Inter", "body": "System"}'::jsonb,
  brand_voice text,
  banned_words text[] DEFAULT '{}',
  target_audience text,
  product_categories text[] DEFAULT '{}',
  sample_prompts jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own brand kit"
  ON public.brand_kits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own brand kit"
  ON public.brand_kits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand kit"
  ON public.brand_kits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. campaign_templates — Multi-step workflow definitions
-- ============================================================
CREATE TABLE public.campaign_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text NOT NULL,
  estimated_credits integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read active campaign templates"
  ON public.campaign_templates FOR SELECT
  USING (true);

-- Admin-only write
CREATE POLICY "Admins can manage campaign templates"
  ON public.campaign_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.is_owner(auth.uid()));

-- ============================================================
-- 6. Storage bucket for tool assets
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('tool-assets', 'tool-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload tool assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tool-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Users can read tool assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tool-assets');

CREATE POLICY "Users can update own tool assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'tool-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own tool assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'tool-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- 7. Seed tools_registry with initial tools
-- ============================================================
INSERT INTO public.tools_registry (id, name, category, subcategory, icon_name, description, credit_cost, execution_type, is_pro, sort_order) VALUES
-- Store Growth
('product-description', 'Product Description', 'quick_tool', 'store_growth', 'FileText', 'Generate SEO-optimized product descriptions from your product data', 1, 'provider_api', false, 10),
('thumbnail-generator', 'Thumbnail Generator', 'quick_tool', 'store_growth', 'Image', 'Create eye-catching product thumbnails with AI', 2, 'provider_api', false, 20),
('sales-page-sections', 'Sales Page Sections', 'quick_tool', 'store_growth', 'LayoutTemplate', 'Generate hero, features, testimonials, and FAQ sections', 1, 'provider_api', true, 30),
('upsell-suggestions', 'Upsell & Bundle Ideas', 'quick_tool', 'store_growth', 'PackagePlus', 'AI-powered bundle and upsell recommendations', 1, 'provider_api', true, 40),

-- Social Content
('social-posts-pack', '10 Posts from Product', 'quick_tool', 'social_content', 'MessageSquare', 'Generate 10 social media posts from your product listing', 2, 'provider_api', false, 50),
('short-form-script', 'Short-Form Script', 'quick_tool', 'social_content', 'Clapperboard', 'Generate scripts for TikTok, Reels, and Shorts', 1, 'provider_api', false, 60),
('caption-hashtags', 'Caption & Hashtags Pack', 'quick_tool', 'social_content', 'Hash', 'Engaging captions with optimized hashtag sets', 1, 'provider_api', false, 70),
('carousel-generator', 'Carousel Generator', 'quick_tool', 'social_content', 'GalleryHorizontal', 'Create multi-slide carousel posts for Instagram', 2, 'provider_api', true, 80),

-- Media Creation
('sfx-generator', 'SFX Generator', 'quick_tool', 'media_creation', 'AudioLines', 'Generate custom sound effects with AI', 1, 'provider_api', false, 90),
('voice-isolator', 'Voice Isolator', 'quick_tool', 'media_creation', 'Mic', 'Separate vocals from background audio', 1, 'provider_api', false, 100),
('sfx-isolator', 'SFX Isolator', 'quick_tool', 'media_creation', 'AudioWaveform', 'Isolate sound effects from mixed audio', 1, 'provider_api', false, 110),
('music-splitter', 'Music Splitter', 'quick_tool', 'media_creation', 'Split', 'Split audio into stems (vocals, drums, bass, etc.)', 1, 'provider_api', false, 120),
('tts-voiceover', 'TTS Voiceover', 'quick_tool', 'media_creation', 'Speech', 'Text-to-speech voiceovers in multiple voices', 1, 'provider_api', true, 130),

-- Creator Utility
('background-remover', 'Background Remover', 'quick_tool', 'utility', 'Eraser', 'Remove image backgrounds instantly', 1, 'provider_api', false, 140),
('image-upscaler', 'Image Upscaler', 'quick_tool', 'utility', 'Maximize', 'Upscale images to higher resolution', 1, 'provider_api', false, 150),
('audio-cleanup', 'Audio Cleanup', 'quick_tool', 'utility', 'Sparkles', 'Remove noise and enhance audio quality', 1, 'provider_api', false, 160),
('subtitle-generator', 'Subtitle Generator', 'quick_tool', 'utility', 'Subtitles', 'Auto-generate subtitles and captions', 1, 'provider_api', true, 170),
('audio-cutter', 'Audio Cutter', 'quick_tool', 'utility', 'Scissors', 'Trim and cut audio files', 0, 'cpu_local', false, 180),
('audio-joiner', 'Audio Joiner', 'quick_tool', 'utility', 'Merge', 'Join multiple audio files together', 0, 'cpu_local', false, 190),
('audio-converter', 'Audio Converter', 'quick_tool', 'utility', 'RefreshCw', 'Convert between audio formats', 0, 'cpu_local', false, 200),
('audio-recorder', 'Audio Recorder', 'quick_tool', 'utility', 'CircleDot', 'Record audio directly in browser', 0, 'cpu_local', false, 210),
('video-to-audio', 'Video to Audio', 'quick_tool', 'utility', 'FileAudio', 'Extract audio from video files', 0, 'cpu_local', false, 220),
('waveform-generator', 'Waveform Generator', 'quick_tool', 'utility', 'Activity', 'Create visual waveform images from audio', 0, 'cpu_local', false, 230),

-- Store Assistant
('generate-hero', 'Generate Hero Section', 'store_assistant', NULL, 'Wand2', 'AI-generate a hero section for your storefront', 3, 'provider_api', true, 300),
('rewrite-brand-voice', 'Rewrite in Brand Voice', 'store_assistant', NULL, 'PenLine', 'Rewrite your store copy using your brand voice', 2, 'provider_api', true, 310),
('create-faq', 'Create FAQ from Product', 'store_assistant', NULL, 'HelpCircle', 'Auto-generate FAQs from your product details', 1, 'provider_api', false, 320),
('seo-landing-page', 'SEO Landing Page', 'store_assistant', NULL, 'Search', 'Generate SEO-optimized landing page for a keyword', 3, 'provider_api', true, 330),
('generate-bundles', 'Generate Bundles & Upsells', 'store_assistant', NULL, 'Package', 'AI suggests product bundles and upsell combos', 1, 'provider_api', true, 340);

-- Seed campaign_templates
INSERT INTO public.campaign_templates (name, description, steps, category, estimated_credits, sort_order) VALUES
('Product Launch Pack', 'Complete launch kit: extract benefits, generate hooks, scripts, voiceover, captions, and export pack.', '[{"tool_id":"product-description","label":"Extract Key Benefits"},{"tool_id":"social-posts-pack","label":"Generate Hooks"},{"tool_id":"short-form-script","label":"Create Scripts"},{"tool_id":"tts-voiceover","label":"Generate Voiceover"},{"tool_id":"caption-hashtags","label":"Captions & Hashtags"}]', 'product_launch', 8, 10),
('Social Content Pack', 'Pick a product and generate 10 posts, carousel images, and a full caption pack.', '[{"tool_id":"social-posts-pack","label":"Generate 10 Posts"},{"tool_id":"carousel-generator","label":"Carousel Images"},{"tool_id":"caption-hashtags","label":"Caption Pack"}]', 'social_pack', 5, 20),
('Promo Video Builder', 'Combine product images with captions, voiceover, and transitions for a promo video.', '[{"tool_id":"short-form-script","label":"Write Script"},{"tool_id":"tts-voiceover","label":"Voiceover"},{"tool_id":"subtitle-generator","label":"Auto Captions"},{"tool_id":"thumbnail-generator","label":"Thumbnail"}]', 'promo_video', 5, 30);
