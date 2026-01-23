-- Drop foreign key constraints to allow data migration from Base44
-- The profiles table references auth.users which won't have matching records

-- First, check and drop the profiles_user_id_fkey if exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Also drop products_creator_id_fkey to allow products without matching profiles initially
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_creator_id_fkey;

-- Drop the pricing_type check constraint and recreate with more options
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_pricing_type_check;

-- Add 'one_time' as valid pricing type along with existing ones
ALTER TABLE public.products ADD CONSTRAINT products_pricing_type_check 
CHECK (pricing_type IN ('free', 'paid', 'subscription', 'one_time'));