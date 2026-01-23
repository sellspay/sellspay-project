-- Create the temp-audio bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-audio', 
  'temp-audio', 
  true,
  104857600, -- 100MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/x-wav', 'audio/x-m4a', 'audio/mp4', 'audio/aac', 'audio/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/x-wav', 'audio/x-m4a', 'audio/mp4', 'audio/aac', 'audio/webm'];

-- Allow public uploads to temp-audio bucket
CREATE POLICY "Allow public uploads to temp-audio"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'temp-audio');

-- Allow public reads from temp-audio bucket
CREATE POLICY "Allow public reads from temp-audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'temp-audio');

-- Allow public deletes from temp-audio bucket (for cleanup)
CREATE POLICY "Allow public deletes from temp-audio"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'temp-audio');