-- Add is_seller column to profiles for selling capability
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_seller boolean DEFAULT false;

-- Update yaboyvis to be a seller
UPDATE public.profiles 
SET is_seller = true 
WHERE username = 'yaboyvis';

-- Add comment to clarify the distinction
COMMENT ON COLUMN public.profiles.is_seller IS 'Whether user can sell products (unlocked via Seller toggle)';
COMMENT ON COLUMN public.profiles.is_creator IS 'Whether user is a verified creator (approved application, shown on Creators page with badge)';