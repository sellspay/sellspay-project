-- Allow anyone to check if a user has the admin role (for public display like Owner badge)
CREATE POLICY "Anyone can check admin status for public display"
ON public.user_roles
FOR SELECT
USING (role = 'admin'::app_role);