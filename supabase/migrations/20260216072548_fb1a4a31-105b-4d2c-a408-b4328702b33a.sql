CREATE POLICY "Public can count completed purchases"
ON public.purchases
FOR SELECT
USING (status = 'completed');