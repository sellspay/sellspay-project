
-- Add credit source breakdown columns to user_wallets
ALTER TABLE public.user_wallets
  ADD COLUMN IF NOT EXISTS rollover_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Add credit_source to wallet_transactions for tracking
ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS credit_source text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS transaction_type text DEFAULT 'debit';

-- Initialize existing balances: put all current balance into monthly_credits
UPDATE public.user_wallets
SET monthly_credits = balance
WHERE balance > 0;
