-- Add transferred flag to track which purchases have been paid out to creators
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS transferred boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS transferred_at timestamptz DEFAULT NULL;

-- Add index for efficient pending earnings queries
CREATE INDEX IF NOT EXISTS idx_purchases_creator_pending 
ON public.purchases (product_id, transferred) 
WHERE transferred = false AND status = 'completed';

-- Add comment explaining the column
COMMENT ON COLUMN public.purchases.transferred IS 'Whether the creator payout has been transferred to their Stripe account';
COMMENT ON COLUMN public.purchases.transferred_at IS 'When the payout was transferred to the creator';

-- Similarly for editor bookings
ALTER TABLE public.editor_bookings 
ADD COLUMN IF NOT EXISTS transferred boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS transferred_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN public.editor_bookings.transferred IS 'Whether the editor payout has been transferred to their Stripe account';
COMMENT ON COLUMN public.editor_bookings.transferred_at IS 'When the payout was transferred to the editor';