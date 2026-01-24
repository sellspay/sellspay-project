-- Unfollow history for 7-day cooldown
CREATE TABLE public.unfollow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unfollower_id UUID NOT NULL,
  unfollowed_id UUID NOT NULL,
  unfollowed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  can_refollow_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  actor_id UUID,
  product_id UUID,
  comment_id UUID,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  redirect_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies for unfollow_history
ALTER TABLE public.unfollow_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own unfollow history"
  ON public.unfollow_history FOR SELECT
  USING (unfollower_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own unfollow records"
  ON public.unfollow_history FOR INSERT
  WITH CHECK (unfollower_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_unfollow_history_lookup ON public.unfollow_history(unfollower_id, unfollowed_id);