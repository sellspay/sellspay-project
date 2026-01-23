-- Fix security warnings - replace overly permissive policies with service role only policies

-- Drop the permissive policies on editor_bookings
DROP POLICY IF EXISTS "System can insert bookings" ON public.editor_bookings;
DROP POLICY IF EXISTS "System can update bookings" ON public.editor_bookings;

-- The stripe_events table has no RLS policies - add basic admin-only access
CREATE POLICY "Admins can view stripe events"
ON public.stripe_events FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));