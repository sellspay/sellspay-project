-- =====================================================
-- AI STOREFRONT VIBECODER SCHEMA
-- =====================================================

-- 1. Brand Profiles - Stores creator's brand identity for AI context
CREATE TABLE public.storefront_brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  color_palette JSONB DEFAULT '[]'::jsonb,
  vibe_tags TEXT[] DEFAULT '{}',
  font_preference TEXT DEFAULT 'default',
  reference_images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- 2. Generated Assets - Draft tray for AI-generated images
CREATE TABLE public.storefront_generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_url TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('banner', 'thumbnail', 'background', 'promo')),
  prompt TEXT,
  spec JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'applied', 'discarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. AI Conversations - Chat history for context
CREATE TABLE public.storefront_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  operations JSONB,
  asset_requests JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. AI Usage - Credit tracking for AI operations
CREATE TABLE public.storefront_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('text_layout', 'image_gen', 'video_gen')),
  credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.storefront_brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_generated_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_ai_usage ENABLE ROW LEVEL SECURITY;

-- Brand Profiles policies
CREATE POLICY "Users can view their own brand profile"
  ON public.storefront_brand_profiles FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own brand profile"
  ON public.storefront_brand_profiles FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own brand profile"
  ON public.storefront_brand_profiles FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own brand profile"
  ON public.storefront_brand_profiles FOR DELETE
  USING (profile_id = auth.uid());

-- Generated Assets policies
CREATE POLICY "Users can view their own generated assets"
  ON public.storefront_generated_assets FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own generated assets"
  ON public.storefront_generated_assets FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own generated assets"
  ON public.storefront_generated_assets FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own generated assets"
  ON public.storefront_generated_assets FOR DELETE
  USING (profile_id = auth.uid());

-- AI Conversations policies
CREATE POLICY "Users can view their own conversations"
  ON public.storefront_ai_conversations FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own conversations"
  ON public.storefront_ai_conversations FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete their own conversations"
  ON public.storefront_ai_conversations FOR DELETE
  USING (profile_id = auth.uid());

-- AI Usage policies
CREATE POLICY "Users can view their own usage"
  ON public.storefront_ai_usage FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own usage records"
  ON public.storefront_ai_usage FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_storefront_brand_profiles_profile_id ON public.storefront_brand_profiles(profile_id);
CREATE INDEX idx_storefront_generated_assets_profile_id ON public.storefront_generated_assets(profile_id);
CREATE INDEX idx_storefront_generated_assets_status ON public.storefront_generated_assets(status);
CREATE INDEX idx_storefront_ai_conversations_profile_id ON public.storefront_ai_conversations(profile_id);
CREATE INDEX idx_storefront_ai_conversations_created_at ON public.storefront_ai_conversations(created_at);
CREATE INDEX idx_storefront_ai_usage_profile_id ON public.storefront_ai_usage(profile_id);

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_storefront_brand_profiles_updated_at
  BEFORE UPDATE ON public.storefront_brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();