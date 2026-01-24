-- Add mfa_enabled column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mfa_enabled boolean DEFAULT false;

-- Create creator_applications table
CREATE TABLE public.creator_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  country text NOT NULL,
  state text NOT NULL,
  languages text[] NOT NULL,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  product_types text[] NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid
);

-- Enable RLS
ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON public.creator_applications
  FOR SELECT USING (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Users can insert their own applications
CREATE POLICY "Users can submit applications" ON public.creator_applications
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Admins can view all applications
CREATE POLICY "Admins can view all creator applications" ON public.creator_applications
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Admins can update applications
CREATE POLICY "Admins can update creator applications" ON public.creator_applications
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Admins can delete applications
CREATE POLICY "Admins can delete creator applications" ON public.creator_applications
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_creator_applications_updated_at
  BEFORE UPDATE ON public.creator_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();