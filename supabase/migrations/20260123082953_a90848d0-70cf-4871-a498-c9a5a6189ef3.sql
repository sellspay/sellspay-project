-- Allow creators to delete any comment on their products
CREATE POLICY "Creators can delete comments on their products"
ON public.comments
FOR DELETE
USING (
  product_id IN (
    SELECT products.id
    FROM products
    JOIN profiles ON products.creator_id = profiles.id
    WHERE profiles.user_id = auth.uid()
  )
);