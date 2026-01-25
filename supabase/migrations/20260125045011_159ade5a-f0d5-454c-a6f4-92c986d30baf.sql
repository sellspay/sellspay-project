-- Add is_pinned column to comments table for sellers to pin comments
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- Create index for efficient pinned comment queries
CREATE INDEX IF NOT EXISTS idx_comments_product_pinned 
ON public.comments (product_id, is_pinned) 
WHERE is_pinned = true;

-- RLS policy: Only product creators can pin/unpin comments
CREATE POLICY "Product creators can update is_pinned on their products"
ON public.comments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.profiles pr ON pr.id = p.creator_id
    WHERE p.id = comments.product_id
    AND pr.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.profiles pr ON pr.id = p.creator_id
    WHERE p.id = comments.product_id
    AND pr.user_id = auth.uid()
  )
);