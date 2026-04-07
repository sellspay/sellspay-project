
CREATE TABLE public.video_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  prompt TEXT,
  fal_model TEXT,
  fal_request_id TEXT,
  request_body JSONB,
  result_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.video_generation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video queue entries"
  ON public.video_generation_queue FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all entries"
  ON public.video_generation_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
