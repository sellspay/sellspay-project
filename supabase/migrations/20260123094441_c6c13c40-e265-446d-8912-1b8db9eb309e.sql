-- Add suspended column to profiles table for user suspension functionality
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspended boolean DEFAULT false;

-- Add admin update policy so admins can suspend/unsuspend users
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to update products (for featuring)
CREATE POLICY "Admins can update any product"
ON public.products
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to delete products
CREATE POLICY "Admins can delete any product"
ON public.products
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));