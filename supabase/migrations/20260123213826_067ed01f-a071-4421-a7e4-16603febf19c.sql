-- Create private storage bucket for product download files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-files', 'product-files', false)
ON CONFLICT (id) DO NOTHING;

-- Allow creators to upload files to their own folder
CREATE POLICY "Creators can upload product files" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'product-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow creators to update their own files
CREATE POLICY "Creators can update their product files" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'product-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow creators to delete their own files
CREATE POLICY "Creators can delete their product files" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'product-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow service role to read files (for signed URL generation)
CREATE POLICY "Service role can read product files" 
ON storage.objects 
FOR SELECT 
TO service_role
USING (bucket_id = 'product-files');