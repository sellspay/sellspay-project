-- Create admin_notifications table
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  redirect_url TEXT,
  applicant_id UUID,
  application_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can read admin notifications"
ON public.admin_notifications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update (mark as read)
CREATE POLICY "Admins can update admin notifications"
ON public.admin_notifications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone authenticated can insert (for application submissions)
CREATE POLICY "Authenticated users can create admin notifications"
ON public.admin_notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admins can delete
CREATE POLICY "Admins can delete admin notifications"
ON public.admin_notifications FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;