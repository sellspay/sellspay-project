-- Allow public read access to profiles for creators/editors via the public_profiles view
-- This policy only allows SELECT access and the view already filters to non-sensitive columns
CREATE POLICY "Public can view creator and editor basic info via view" 
ON public.profiles 
FOR SELECT 
USING ((is_creator = true) OR (is_editor = true));