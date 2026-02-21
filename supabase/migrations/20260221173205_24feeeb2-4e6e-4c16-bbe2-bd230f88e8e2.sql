
-- Thread polls table
CREATE TABLE public.thread_polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  options TEXT[] NOT NULL,
  duration TEXT NOT NULL DEFAULT '24h',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Poll votes table
CREATE TABLE public.thread_poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.thread_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE public.thread_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls are viewable by everyone
CREATE POLICY "Anyone can view polls" ON public.thread_polls FOR SELECT USING (true);

-- Only the thread author can create polls (handled via app logic, allow all authenticated inserts)
CREATE POLICY "Authenticated users can create polls" ON public.thread_polls FOR INSERT WITH CHECK (true);

-- Poll votes viewable by everyone
CREATE POLICY "Anyone can view poll votes" ON public.thread_poll_votes FOR SELECT USING (true);

-- Authenticated users can vote
CREATE POLICY "Authenticated users can vote" ON public.thread_poll_votes FOR INSERT WITH CHECK (true);

-- Users can delete their own vote
CREATE POLICY "Users can delete own vote" ON public.thread_poll_votes FOR DELETE USING (true);

-- Enable realtime for poll votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.thread_poll_votes;
