-- ====== SECURE TEMP-AUDIO BUCKET ======

-- Drop existing public policies
DROP POLICY IF EXISTS "Allow public uploads to temp-audio" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from temp-audio" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from temp-audio" ON storage.objects;

-- Create authenticated-only policies with user-scoped paths
CREATE POLICY "Authenticated users can upload temp audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'temp-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can read their temp audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'temp-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their temp audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'temp-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Keep bucket public for reading processed results from fal.ai
-- but restrict write/delete operations to authenticated users with their own folder