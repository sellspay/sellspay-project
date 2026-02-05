-- Fix RLS policies for storefront_brand_profiles
-- The profile_id is NOT the auth.uid(), it's the profile.id from profiles table

DROP POLICY IF EXISTS "Users can create their own brand profile" ON public.storefront_brand_profiles;
DROP POLICY IF EXISTS "Users can view their own brand profile" ON public.storefront_brand_profiles;
DROP POLICY IF EXISTS "Users can update their own brand profile" ON public.storefront_brand_profiles;
DROP POLICY IF EXISTS "Users can delete their own brand profile" ON public.storefront_brand_profiles;

-- Create correct policies that check profile ownership via profiles table
CREATE POLICY "Users can create their own brand profile"
ON public.storefront_brand_profiles
FOR INSERT
WITH CHECK (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their own brand profile"
ON public.storefront_brand_profiles
FOR SELECT
USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own brand profile"
ON public.storefront_brand_profiles
FOR UPDATE
USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own brand profile"
ON public.storefront_brand_profiles
FOR DELETE
USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);