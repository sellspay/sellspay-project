-- Table for creator subscription plans (multiple tiers per creator)
CREATE TABLE public.creator_subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  stripe_product_id text,
  stripe_price_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table linking products to subscription plans
CREATE TABLE public.subscription_plan_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.creator_subscription_plans(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(plan_id, product_id)
);

-- Table for user subscriptions to creator plans
CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.creator_subscription_plans(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_id)
);

-- Add subscription_access column to products table
ALTER TABLE public.products 
ADD COLUMN subscription_access text DEFAULT 'none';
-- Values: 'none' (not in any subscription), 'subscription_only', 'both' (one-time + subscription)

-- Enable RLS
ALTER TABLE public.creator_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creator_subscription_plans
CREATE POLICY "Anyone can view active plans"
ON public.creator_subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Creators can view their own plans"
ON public.creator_subscription_plans FOR SELECT
USING (creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Creators can insert their own plans"
ON public.creator_subscription_plans FOR INSERT
WITH CHECK (creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Creators can update their own plans"
ON public.creator_subscription_plans FOR UPDATE
USING (creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Creators can delete their own plans"
ON public.creator_subscription_plans FOR DELETE
USING (creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for subscription_plan_products
CREATE POLICY "Anyone can view plan products"
ON public.subscription_plan_products FOR SELECT
USING (true);

CREATE POLICY "Creators can manage their plan products"
ON public.subscription_plan_products FOR INSERT
WITH CHECK (plan_id IN (
  SELECT id FROM creator_subscription_plans 
  WHERE creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
));

CREATE POLICY "Creators can delete their plan products"
ON public.subscription_plan_products FOR DELETE
USING (plan_id IN (
  SELECT id FROM creator_subscription_plans 
  WHERE creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
));

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions FOR SELECT
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Creators can view subscriptions to their plans"
ON public.user_subscriptions FOR SELECT
USING (plan_id IN (
  SELECT id FROM creator_subscription_plans 
  WHERE creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
));

-- Triggers for updated_at
CREATE TRIGGER update_creator_subscription_plans_updated_at
BEFORE UPDATE ON public.creator_subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();