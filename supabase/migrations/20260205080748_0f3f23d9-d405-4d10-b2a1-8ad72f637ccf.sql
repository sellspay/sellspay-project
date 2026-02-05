-- =====================================================
-- Phase 1: Premium AI Builder Database Schema
-- =====================================================

-- 1. Create ai_storefront_layouts table
CREATE TABLE public.ai_storefront_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  layout_json JSONB NOT NULL DEFAULT '{"sections": [], "theme": {}, "header": {}}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- 2. Enable RLS
ALTER TABLE public.ai_storefront_layouts ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies for ai_storefront_layouts
CREATE POLICY "Users can manage their own AI layouts"
  ON public.ai_storefront_layouts
  FOR ALL
  TO authenticated
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can view published AI layouts"
  ON public.ai_storefront_layouts
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- 4. Add active_storefront_mode column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS active_storefront_mode TEXT NOT NULL DEFAULT 'free';

-- 5. Add check constraint for valid modes
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_active_storefront_mode_check
CHECK (active_storefront_mode IN ('free', 'ai'));

-- 6. Create trigger for updated_at on ai_storefront_layouts
CREATE TRIGGER update_ai_storefront_layouts_updated_at
  BEFORE UPDATE ON public.ai_storefront_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create index for faster lookups
CREATE INDEX idx_ai_storefront_layouts_profile_id ON public.ai_storefront_layouts(profile_id);
CREATE INDEX idx_ai_storefront_layouts_is_published ON public.ai_storefront_layouts(is_published) WHERE is_published = true;