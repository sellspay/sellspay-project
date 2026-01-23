-- Create temp-audio storage bucket for AI audio processing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-audio', 
  'temp-audio', 
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/m4a', 'audio/x-m4a']
);

-- Allow anyone to upload to temp-audio bucket
CREATE POLICY "Anyone can upload temp audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'temp-audio');

-- Allow anyone to read from temp-audio bucket
CREATE POLICY "Anyone can read temp audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'temp-audio');

-- Allow anyone to delete their own uploads (by matching path)
CREATE POLICY "Anyone can delete temp audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'temp-audio');