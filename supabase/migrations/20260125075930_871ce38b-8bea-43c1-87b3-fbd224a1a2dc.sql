-- Re-grant SELECT permissions on the public views to ensure anon access

-- Grant all necessary permissions on public views
GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT SELECT ON public.public_identities TO anon, authenticated;
GRANT SELECT ON public.public_products TO anon, authenticated;
GRANT SELECT ON public.safe_public_identities TO anon, authenticated;

-- Verify the views exist and have correct permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;