
-- Add public SELECT policy for profiles to allow anonymous users to view creator/editor profiles
-- This is essential for public_profiles and public_identities views to work for non-logged-in users

-- First drop the existing policy if it exists (to make this idempotent)
DROP POLICY IF EXISTS "Public can view creator and editor profiles" ON public.profiles;

-- Create a policy that allows anyone (including anonymous) to read profiles of creators or editors
-- This only exposes public-safe data since the views filter columns
CREATE POLICY "Public can view creator and editor profiles"
ON public.profiles
FOR SELECT
TO public
USING (is_creator = true OR is_editor = true);

-- Also ensure the user_roles table allows public to check owner status for badges
DROP POLICY IF EXISTS "Public can view owner role for badges" ON public.user_roles;

CREATE POLICY "Public can view owner role for badges"
ON public.user_roles
FOR SELECT
TO public
USING (role = 'owner');
