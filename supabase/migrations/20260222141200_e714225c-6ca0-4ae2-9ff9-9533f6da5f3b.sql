
-- Allow anyone to read project files that belong to a published AI storefront
CREATE POLICY "Anyone can view published storefront files"
ON public.project_files
FOR SELECT
USING (
  profile_id IN (
    SELECT profile_id FROM public.ai_storefront_layouts
    WHERE is_published = true
  )
);
