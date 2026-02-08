-- ============================================
-- PHASE 1: Dynamic Token-Based Credit System
-- ============================================

-- 1. Create AI usage logs table for token tracking and auditing
CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID, -- Groups related calls in a workflow
  model_used TEXT NOT NULL,
  model_class TEXT CHECK (model_class IN ('flash', 'standard', 'pro', 'flagship')),
  modality TEXT CHECK (modality IN ('text', 'image', 'video')),
  tokens_input INT DEFAULT 0,
  tokens_output INT DEFAULT 0,
  processing_time_ms INT,
  base_cost DECIMAL(10,2) DEFAULT 0, -- Pre-multiplier cost
  multiplier DECIMAL(4,2) DEFAULT 1.0, -- For auto-mode, plans, retries
  final_credits_deducted INT NOT NULL,
  action TEXT NOT NULL,
  is_auto_mode BOOLEAN DEFAULT false,
  is_plan_mode BOOLEAN DEFAULT false,
  is_retry BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user queries and analytics
CREATE INDEX idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_session ON public.ai_usage_logs(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_ai_usage_logs_model ON public.ai_usage_logs(model_used);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage logs
CREATE POLICY "Users can view their own usage logs"
  ON public.ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (edge functions)
CREATE POLICY "Service role can insert usage logs"
  ON public.ai_usage_logs FOR INSERT
  WITH CHECK (true);

-- 2. Create credit packs table for top-up options
CREATE TABLE public.credit_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  credits INT NOT NULL,
  price_cents INT NOT NULL,
  price_per_credit DECIMAL(6,4) GENERATED ALWAYS AS (price_cents::DECIMAL / credits) STORED,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed credit pack data
INSERT INTO public.credit_packs (id, name, description, credits, price_cents, display_order) VALUES
  ('small', 'Small Pack', '150 credits - Best for trying out', 150, 1000, 1),
  ('medium', 'Medium Pack', '1,000 credits - Most popular', 1000, 5000, 2),
  ('large', 'Large Pack', '2,200 credits - Best value top-up', 2200, 10000, 3);

-- Enable RLS (public read)
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active credit packs"
  ON public.credit_packs FOR SELECT
  USING (is_active = true);

-- 3. Add new columns to subscription_plans for dynamic features
ALTER TABLE public.subscription_plans 
  ADD COLUMN IF NOT EXISTS auto_mode_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS model_tier TEXT DEFAULT 'flash' CHECK (model_tier IN ('flash', 'standard', 'pro', 'flagship')),
  ADD COLUMN IF NOT EXISTS monthly_credits INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS priority_processing BOOLEAN DEFAULT false;

-- 4. Insert/update the 4-tier plan structure
INSERT INTO public.subscription_plans (id, name, price_cents, vibecoder_access, image_gen_access, video_gen_access, seller_fee_percent, auto_mode_enabled, model_tier, monthly_credits, priority_processing)
VALUES 
  ('starter', 'Starter', 0, false, false, false, 10, false, 'flash', 0, false),
  ('basic', 'Basic', 2500, true, false, false, 8, false, 'flash', 500, false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_cents = EXCLUDED.price_cents,
  vibecoder_access = EXCLUDED.vibecoder_access,
  image_gen_access = EXCLUDED.image_gen_access,
  video_gen_access = EXCLUDED.video_gen_access,
  seller_fee_percent = EXCLUDED.seller_fee_percent,
  auto_mode_enabled = EXCLUDED.auto_mode_enabled,
  model_tier = EXCLUDED.model_tier,
  monthly_credits = EXCLUDED.monthly_credits,
  priority_processing = EXCLUDED.priority_processing;

-- Update existing plans with new columns
UPDATE public.subscription_plans SET
  auto_mode_enabled = true,
  model_tier = 'pro',
  monthly_credits = 2500,
  priority_processing = false
WHERE id = 'creator';

UPDATE public.subscription_plans SET
  auto_mode_enabled = true,
  model_tier = 'flagship',
  monthly_credits = 6000,
  priority_processing = true
WHERE id = 'agency';

-- Update browser plan to match starter
UPDATE public.subscription_plans SET
  auto_mode_enabled = false,
  model_tier = 'flash',
  monthly_credits = 0,
  priority_processing = false
WHERE id = 'browser';

-- 5. Create model weights table for dynamic pricing
CREATE TABLE public.ai_model_weights (
  model_id TEXT PRIMARY KEY,
  model_class TEXT NOT NULL CHECK (model_class IN ('flash', 'standard', 'pro', 'flagship')),
  modality TEXT NOT NULL CHECK (modality IN ('text', 'image', 'video')),
  base_cost_per_1k_tokens DECIMAL(6,3) NOT NULL,
  flat_cost INT, -- For image/video generation (flat per item)
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed model weight data (2026 pricing)
INSERT INTO public.ai_model_weights (model_id, model_class, modality, base_cost_per_1k_tokens, flat_cost, display_name) VALUES
  -- Flash tier (cheap/fast)
  ('google/gemini-3-flash-preview', 'flash', 'text', 0.5, NULL, 'Gemini 3 Flash'),
  ('google/gemini-2.5-flash', 'flash', 'text', 0.4, NULL, 'Gemini 2.5 Flash'),
  ('google/gemini-2.5-flash-lite', 'flash', 'text', 0.2, NULL, 'Gemini 2.5 Flash Lite'),
  ('openai/gpt-5-nano', 'flash', 'text', 0.6, NULL, 'GPT-5 Nano'),
  
  -- Standard tier
  ('openai/gpt-5-mini', 'standard', 'text', 1.5, NULL, 'GPT-5 Mini'),
  
  -- Pro tier
  ('google/gemini-3-pro-preview', 'pro', 'text', 3.0, NULL, 'Gemini 3 Pro'),
  ('google/gemini-2.5-pro', 'pro', 'text', 2.5, NULL, 'Gemini 2.5 Pro'),
  ('openai/gpt-5', 'pro', 'text', 4.0, NULL, 'GPT-5'),
  
  -- Flagship tier
  ('openai/gpt-5.2', 'flagship', 'text', 6.0, NULL, 'GPT-5.2'),
  
  -- Image generation (flat cost)
  ('google/gemini-2.5-flash-image', 'standard', 'image', 0, 5, 'Gemini Image Gen'),
  ('google/gemini-3-pro-image-preview', 'pro', 'image', 0, 8, 'Gemini Pro Image Gen'),
  
  -- Video generation (flat cost per generation)
  ('video-gen', 'flagship', 'video', 0, 25, 'Video Generation');

-- Enable RLS (public read)
ALTER TABLE public.ai_model_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view model weights"
  ON public.ai_model_weights FOR SELECT
  USING (is_active = true);

-- 6. Create updated deduct_credits_dynamic function
CREATE OR REPLACE FUNCTION public.deduct_credits_dynamic(
  p_user_id UUID,
  p_amount INT,
  p_action TEXT,
  p_model_used TEXT DEFAULT NULL,
  p_tokens_input INT DEFAULT 0,
  p_tokens_output INT DEFAULT 0,
  p_session_id UUID DEFAULT NULL,
  p_is_auto_mode BOOLEAN DEFAULT false,
  p_is_plan_mode BOOLEAN DEFAULT false,
  p_is_retry BOOLEAN DEFAULT false,
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INT;
  v_new_balance INT;
  v_model_info RECORD;
  v_base_cost DECIMAL;
  v_multiplier DECIMAL := 1.0;
  v_final_cost INT;
  v_model_class TEXT := 'standard';
  v_modality TEXT := 'text';
BEGIN
  -- Get model info if provided
  IF p_model_used IS NOT NULL THEN
    SELECT * INTO v_model_info FROM ai_model_weights WHERE model_id = p_model_used;
    IF FOUND THEN
      v_model_class := v_model_info.model_class;
      v_modality := v_model_info.modality;
      
      -- Calculate base cost
      IF v_model_info.flat_cost IS NOT NULL THEN
        v_base_cost := v_model_info.flat_cost;
      ELSE
        v_base_cost := v_model_info.base_cost_per_1k_tokens * ((p_tokens_input + p_tokens_output)::DECIMAL / 1000);
      END IF;
    ELSE
      v_base_cost := p_amount;
    END IF;
  ELSE
    v_base_cost := p_amount;
  END IF;

  -- Apply multipliers
  IF p_is_auto_mode THEN
    v_multiplier := v_multiplier * 1.2;
  END IF;
  
  IF p_is_plan_mode THEN
    v_multiplier := v_multiplier * 2.0;
  END IF;
  
  IF p_is_retry THEN
    v_multiplier := v_multiplier * 0.5;
  END IF;

  -- Calculate final cost (minimum 1 credit unless free action)
  v_final_cost := GREATEST(CEIL(v_base_cost * v_multiplier)::INT, CASE WHEN p_amount = 0 THEN 0 ELSE 1 END);

  -- Lock and check balance
  SELECT balance INTO v_current_balance
  FROM user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NO_WALLET', 'cost', v_final_cost);
  END IF;

  IF v_current_balance < v_final_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_CREDITS', 'cost', v_final_cost, 'balance', v_current_balance);
  END IF;

  -- Deduct credits
  v_new_balance := v_current_balance - v_final_cost;
  
  UPDATE user_wallets
  SET balance = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;

  -- Log the transaction
  INSERT INTO wallet_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, -v_final_cost, 'debit', p_action || ' (' || COALESCE(p_model_used, 'unknown') || ')');

  -- Log detailed usage
  INSERT INTO ai_usage_logs (
    user_id, session_id, model_used, model_class, modality,
    tokens_input, tokens_output, base_cost, multiplier,
    final_credits_deducted, action, is_auto_mode, is_plan_mode, is_retry, metadata
  ) VALUES (
    p_user_id, p_session_id, COALESCE(p_model_used, 'unknown'), v_model_class, v_modality,
    p_tokens_input, p_tokens_output, v_base_cost, v_multiplier,
    v_final_cost, p_action, p_is_auto_mode, p_is_plan_mode, p_is_retry, p_metadata
  );

  RETURN jsonb_build_object(
    'success', true,
    'cost', v_final_cost,
    'newBalance', v_new_balance,
    'baseCost', v_base_cost,
    'multiplier', v_multiplier
  );
END;
$$;