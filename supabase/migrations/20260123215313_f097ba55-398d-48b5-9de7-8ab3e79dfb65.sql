-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can insert credit transactions" ON public.credit_transactions;

-- Add column to profiles for credit_balance if not exists (already added but ensuring it works)
-- Update the profile view to include credit_balance
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  banner_url,
  background_url,
  bio,
  website,
  social_links,
  is_creator,
  is_editor,
  editor_about,
  editor_services,
  editor_languages,
  editor_hourly_rate_cents,
  editor_country,
  editor_city,
  editor_social_links,
  verified,
  show_recent_uploads,
  created_at,
  updated_at
FROM profiles
WHERE suspended = false OR suspended IS NULL;

-- Add credit_balance column to profiles table if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credit_balance integer DEFAULT 5;

-- Create new tables for credit system
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')),
  amount INTEGER NOT NULL,
  description TEXT,
  tool_id TEXT,
  package_id UUID,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);