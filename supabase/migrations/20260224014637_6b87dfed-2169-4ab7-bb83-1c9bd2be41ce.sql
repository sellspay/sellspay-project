
-- Add brand_identity JSONB column and lock flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS brand_identity jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS brand_identity_locked boolean DEFAULT false;

-- Add a comment for documentation
COMMENT ON COLUMN public.profiles.brand_identity IS 'Stores the user brand identity object: brandStyle, colorPalette, typography, borderRadius, spacingScale, ctaStyle, vibe';
COMMENT ON COLUMN public.profiles.brand_identity_locked IS 'When true, AI cannot auto-update brand_identity during Design Cofounder mode';
