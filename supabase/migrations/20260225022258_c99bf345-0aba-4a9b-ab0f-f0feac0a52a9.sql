-- Allow authenticated users to upload/update their own project thumbnails
CREATE POLICY "Users can upload project thumbnails"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'site-assets'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'project-thumbs'
);

CREATE POLICY "Users can update project thumbnails"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'site-assets'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'project-thumbs'
)
WITH CHECK (
  bucket_id = 'site-assets'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'project-thumbs'
);