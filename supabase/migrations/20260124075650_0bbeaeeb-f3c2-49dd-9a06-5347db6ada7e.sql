-- Create threads table for community discussions
CREATE TABLE public.threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  gif_url TEXT,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'discussion',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create thread_replies table
CREATE TABLE public.thread_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  parent_reply_id UUID REFERENCES public.thread_replies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  gif_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create thread_likes table
CREATE TABLE public.thread_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(thread_id, user_id)
);

-- Create thread_reply_likes table
CREATE TABLE public.thread_reply_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reply_id UUID NOT NULL REFERENCES public.thread_replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reply_id, user_id)
);

-- Create creator_spotlights table
CREATE TABLE public.creator_spotlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  headline TEXT NOT NULL,
  story TEXT NOT NULL,
  achievement TEXT,
  quote TEXT,
  featured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_reply_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_spotlights ENABLE ROW LEVEL SECURITY;

-- Threads policies
CREATE POLICY "Anyone can view threads"
ON public.threads FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create threads"
ON public.threads FOR INSERT
WITH CHECK (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own threads"
ON public.threads FOR UPDATE
USING (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own threads"
ON public.threads FOR DELETE
USING (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete any thread"
ON public.threads FOR DELETE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any thread"
ON public.threads FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Thread replies policies
CREATE POLICY "Anyone can view thread replies"
ON public.thread_replies FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create replies"
ON public.thread_replies FOR INSERT
WITH CHECK (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own replies"
ON public.thread_replies FOR UPDATE
USING (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own replies"
ON public.thread_replies FOR DELETE
USING (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete any reply"
ON public.thread_replies FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Thread likes policies
CREATE POLICY "Anyone can view thread likes"
ON public.thread_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like threads"
ON public.thread_likes FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can unlike threads"
ON public.thread_likes FOR DELETE
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Thread reply likes policies
CREATE POLICY "Anyone can view reply likes"
ON public.thread_reply_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like replies"
ON public.thread_reply_likes FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can unlike replies"
ON public.thread_reply_likes FOR DELETE
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Creator spotlights policies
CREATE POLICY "Anyone can view active spotlights"
ON public.creator_spotlights FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage spotlights"
ON public.creator_spotlights FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create updated_at triggers
CREATE TRIGGER update_threads_updated_at
BEFORE UPDATE ON public.threads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_thread_replies_updated_at
BEFORE UPDATE ON public.thread_replies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_spotlights_updated_at
BEFORE UPDATE ON public.creator_spotlights
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for threads
ALTER PUBLICATION supabase_realtime ADD TABLE public.threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.thread_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.thread_likes;