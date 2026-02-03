-- Backfill purchases with $0 amounts using product prices
UPDATE public.purchases p
SET 
  amount_cents = prod.price_cents,
  platform_fee_cents = ROUND(prod.price_cents * 0.05),
  creator_payout_cents = prod.price_cents - ROUND(prod.price_cents * 0.05)
FROM public.products prod
WHERE p.product_id = prod.id
  AND p.amount_cents = 0
  AND prod.price_cents > 0;