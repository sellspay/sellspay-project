-- Drop and recreate public_profiles view with security_invoker=on
-- This removes exposure of sensitive PII like email, phone, payment IDs

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker=on) AS
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
    verified,
    show_recent_uploads,
    editor_about,
    editor_city,
    editor_country,
    editor_services,
    editor_languages,
    editor_hourly_rate_cents,
    editor_social_links,
    created_at,
    updated_at
FROM public.profiles
WHERE is_creator = true OR is_editor = true;

-- Grant appropriate access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Drop and recreate public_identities view with security_invoker=on
DROP VIEW IF EXISTS public.public_identities;

CREATE VIEW public.public_identities
WITH (security_invoker=on) AS
SELECT 
    id,
    user_id,
    username,
    full_name,
    avatar_url,
    is_creator,
    is_editor,
    verified
FROM public.profiles;

-- Grant appropriate access
GRANT SELECT ON public.public_identities TO anon, authenticated;

-- Add RLS policies for verification_codes table to prevent unauthorized access
-- Users should only be able to see their own codes
CREATE POLICY "Users can view their own verification codes"
ON public.verification_codes
FOR SELECT
USING (user_id = auth.uid());

-- Only allow system/edge functions to insert codes (via service role)
-- No direct user INSERT policy needed as codes are created by edge functions

-- Users cannot delete verification codes directly - handled by system
-- No UPDATE policy needed - codes are immutable