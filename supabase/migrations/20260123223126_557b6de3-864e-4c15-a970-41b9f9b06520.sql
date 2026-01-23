-- Update default credit_balance from 5 to 3 for new users
ALTER TABLE public.profiles ALTER COLUMN credit_balance SET DEFAULT 3;