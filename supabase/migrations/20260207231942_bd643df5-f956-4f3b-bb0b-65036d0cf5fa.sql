-- Add seller contract signing timestamp to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS seller_contract_signed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.seller_contract_signed_at IS 'Timestamp when the user signed the seller agreement contract';