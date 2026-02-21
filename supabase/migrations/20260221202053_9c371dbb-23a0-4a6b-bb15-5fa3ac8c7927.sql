
-- Create support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  subject TEXT NOT NULL,
  category TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create tickets
CREATE POLICY "Users can create support tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

-- Owners can view all tickets
CREATE POLICY "Owners can view all tickets"
ON public.support_tickets FOR SELECT
USING (public.has_role(auth.uid(), 'owner'));

-- Owners can update tickets
CREATE POLICY "Owners can update tickets"
ON public.support_tickets FOR UPDATE
USING (public.has_role(auth.uid(), 'owner'));

-- Trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
