-- Phase 2: Database Schema Updates

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add editor fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_editor BOOLEAN DEFAULT false,
ADD COLUMN editor_hourly_rate_cents INTEGER,
ADD COLUMN editor_services TEXT[],
ADD COLUMN editor_languages TEXT[],
ADD COLUMN editor_country TEXT,
ADD COLUMN editor_city TEXT,
ADD COLUMN editor_about TEXT,
ADD COLUMN editor_social_links JSONB DEFAULT '{}';

-- Create editor_applications table
CREATE TABLE public.editor_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    display_name TEXT NOT NULL,
    about_me TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    hourly_rate_cents INTEGER NOT NULL,
    starting_budget_cents INTEGER,
    social_links JSONB DEFAULT '{}',
    languages TEXT[] NOT NULL,
    services TEXT[] NOT NULL,
    status TEXT DEFAULT 'pending',
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on editor_applications
ALTER TABLE public.editor_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for editor_applications
CREATE POLICY "Users can view their own applications"
ON public.editor_applications FOR SELECT
USING (user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can create applications"
ON public.editor_applications FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Admins can view all applications"
ON public.editor_applications FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update applications"
ON public.editor_applications FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create editor_bookings table
CREATE TABLE public.editor_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    editor_id UUID NOT NULL,
    buyer_id UUID NOT NULL,
    hours INTEGER NOT NULL,
    total_amount_cents INTEGER NOT NULL,
    platform_fee_cents INTEGER NOT NULL,
    editor_payout_cents INTEGER NOT NULL,
    stripe_payment_intent_id TEXT,
    stripe_checkout_session_id TEXT,
    stripe_transfer_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on editor_bookings
ALTER TABLE public.editor_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for editor_bookings
CREATE POLICY "Editors can view their bookings"
ON public.editor_bookings FOR SELECT
USING (editor_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Buyers can view their bookings"
ON public.editor_bookings FOR SELECT
USING (buyer_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "System can insert bookings"
ON public.editor_bookings FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update bookings"
ON public.editor_bookings FOR UPDATE
USING (true);

-- Create trigger for updated_at on editor_applications
CREATE TRIGGER update_editor_applications_updated_at
BEFORE UPDATE ON public.editor_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on editor_bookings
CREATE TRIGGER update_editor_bookings_updated_at
BEFORE UPDATE ON public.editor_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();