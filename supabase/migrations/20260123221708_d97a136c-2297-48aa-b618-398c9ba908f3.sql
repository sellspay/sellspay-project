-- Allow public viewing of creator and editor profiles
-- This enables the Creators and Hire Editors pages to display profiles to all visitors
CREATE POLICY "Public can view creator and editor profiles"
  ON public.profiles FOR SELECT
  USING (is_creator = true OR is_editor = true);