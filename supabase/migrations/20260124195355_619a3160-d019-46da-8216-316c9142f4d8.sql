-- Add seller email configuration columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS resend_vault_secret_id uuid,
ADD COLUMN IF NOT EXISTS seller_support_email text,
ADD COLUMN IF NOT EXISTS seller_email_verified boolean DEFAULT false;

-- Create support_messages table for Phase 2 (structure ready)
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  subject text NOT NULL,
  message text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on support_messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Sellers can view messages where they are the seller
CREATE POLICY "Sellers can view their support messages"
ON public.support_messages
FOR SELECT
USING (
  seller_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Sellers can create outbound messages
CREATE POLICY "Sellers can send support messages"
ON public.support_messages
FOR INSERT
WITH CHECK (
  seller_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  AND direction = 'outbound'
);

-- Customers can view messages where they are the customer
CREATE POLICY "Customers can view their support messages"
ON public.support_messages
FOR SELECT
USING (
  customer_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Create function to securely store seller Resend API key using Vault
CREATE OR REPLACE FUNCTION public.store_seller_resend_key(
  p_api_key text,
  p_support_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
  v_secret_id uuid;
  v_existing_secret_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get profile id and check if seller
  SELECT id, resend_vault_secret_id INTO v_profile_id, v_existing_secret_id
  FROM public.profiles
  WHERE user_id = v_user_id AND is_seller = true;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a seller');
  END IF;

  -- Delete existing secret if exists
  IF v_existing_secret_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_existing_secret_id;
  END IF;

  -- Create new secret in vault
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (
    p_api_key,
    'resend_key_' || v_user_id::text,
    'Resend API key for seller ' || v_user_id::text
  )
  RETURNING id INTO v_secret_id;

  -- Update profile with secret reference and email
  UPDATE public.profiles
  SET 
    resend_vault_secret_id = v_secret_id,
    seller_support_email = p_support_email,
    seller_email_verified = false
  WHERE id = v_profile_id;

  RETURN jsonb_build_object('success', true, 'secret_id', v_secret_id);
END;
$$;

-- Create function to retrieve seller's Resend API key (for edge functions only)
CREATE OR REPLACE FUNCTION public.get_seller_resend_key(p_seller_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret_id uuid;
  v_api_key text;
BEGIN
  -- Get the vault secret id from profile
  SELECT resend_vault_secret_id INTO v_secret_id
  FROM public.profiles
  WHERE user_id = p_seller_user_id AND is_seller = true;

  IF v_secret_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Retrieve the decrypted secret
  SELECT decrypted_secret INTO v_api_key
  FROM vault.decrypted_secrets
  WHERE id = v_secret_id;

  RETURN v_api_key;
END;
$$;

-- Create function to get seller email config
CREATE OR REPLACE FUNCTION public.get_seller_email_config(p_seller_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config jsonb;
BEGIN
  SELECT jsonb_build_object(
    'support_email', seller_support_email,
    'verified', seller_email_verified,
    'has_api_key', resend_vault_secret_id IS NOT NULL
  ) INTO v_config
  FROM public.profiles
  WHERE user_id = p_seller_user_id AND is_seller = true;

  RETURN COALESCE(v_config, jsonb_build_object('support_email', null, 'verified', false, 'has_api_key', false));
END;
$$;

-- Function to mark seller email as verified
CREATE OR REPLACE FUNCTION public.mark_seller_email_verified(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET seller_email_verified = true
  WHERE user_id = p_user_id AND is_seller = true;
  
  RETURN FOUND;
END;
$$;