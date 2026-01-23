-- Add UPDATE policy for subscription_plan_products
CREATE POLICY "Creators can update their plan products"
ON public.subscription_plan_products
FOR UPDATE
USING (
  plan_id IN (
    SELECT creator_subscription_plans.id
    FROM creator_subscription_plans
    WHERE creator_subscription_plans.creator_id IN (
      SELECT profiles.id
      FROM profiles
      WHERE profiles.user_id = auth.uid()
    )
  )
);