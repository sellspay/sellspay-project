-- Create table for tracking Pro Tools subscriptions
CREATE TABLE public.pro_tool_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for tracking tool usage (50 uses/month limit)
CREATE TABLE public.tool_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast usage counting
CREATE INDEX idx_tool_usage_user_month ON public.tool_usage (user_id, used_at);

-- Enable RLS
ALTER TABLE public.pro_tool_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for pro_tool_subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.pro_tool_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- RLS policies for tool_usage
CREATE POLICY "Users can view their own usage"
ON public.tool_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
ON public.tool_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to count monthly usage
CREATE OR REPLACE FUNCTION public.get_monthly_tool_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.tool_usage
  WHERE user_id = p_user_id
    AND used_at >= date_trunc('month', now())
    AND used_at < date_trunc('month', now()) + interval '1 month'
$$;

-- Function to check if user has active pro subscription
CREATE OR REPLACE FUNCTION public.has_pro_subscription(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pro_tool_subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND (current_period_end IS NULL OR current_period_end > now())
  )
$$;

-- Trigger for updated_at on pro_tool_subscriptions
CREATE TRIGGER update_pro_tool_subscriptions_updated_at
BEFORE UPDATE ON public.pro_tool_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();