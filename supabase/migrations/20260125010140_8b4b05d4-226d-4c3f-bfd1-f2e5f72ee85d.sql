-- Ensure owner badge can be displayed to everyone (including logged-out)
-- We allow public SELECT of ONLY the 'owner' role, while keeping other roles protected.

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Remove potentially conflicting older policies (safe if they don't exist)
DROP POLICY IF EXISTS "Anyone can check owner and admin status for public display" ON public.user_roles;
DROP POLICY IF EXISTS "Public can view owner and admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Public can view owner role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- 1) Public (anon + authenticated) can see ONLY the owner role rows
CREATE POLICY "Public can view owner role"
ON public.user_roles
FOR SELECT
TO public
USING (role = 'owner');

-- 2) Logged-in users can see their own roles (needed for client-side gating)
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3) Admin/Owner can see all role rows (for admin tools)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'owner')
);
