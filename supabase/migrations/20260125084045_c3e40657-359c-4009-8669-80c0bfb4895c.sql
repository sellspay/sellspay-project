-- Add explicit deny policy for anonymous users on saved_products
CREATE POLICY "Anon cannot view saved products"
  ON public.saved_products
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "Anon cannot insert saved products"
  ON public.saved_products
  FOR INSERT
  TO anon
  WITH CHECK (false);

CREATE POLICY "Anon cannot update saved products"
  ON public.saved_products
  FOR UPDATE
  TO anon
  USING (false);

CREATE POLICY "Anon cannot delete saved products"
  ON public.saved_products
  FOR DELETE
  TO anon
  USING (false);