-- Sync missing seller config record to private schema
INSERT INTO private.seller_config (user_id, stripe_account_id, stripe_onboarding_complete, payoneer_email, payoneer_payee_id, payoneer_status, preferred_payout_method, seller_support_email, seller_email_verified, resend_vault_secret_id)
SELECT user_id, stripe_account_id, stripe_onboarding_complete, payoneer_email, payoneer_payee_id, payoneer_status, preferred_payout_method, seller_support_email, seller_email_verified, resend_vault_secret_id
FROM public.seller_payment_config p
WHERE NOT EXISTS (SELECT 1 FROM private.seller_config s WHERE s.user_id = p.user_id)
ON CONFLICT (user_id) DO UPDATE SET
  stripe_account_id = EXCLUDED.stripe_account_id,
  stripe_onboarding_complete = EXCLUDED.stripe_onboarding_complete,
  payoneer_email = EXCLUDED.payoneer_email,
  payoneer_payee_id = EXCLUDED.payoneer_payee_id,
  payoneer_status = EXCLUDED.payoneer_status,
  preferred_payout_method = EXCLUDED.preferred_payout_method,
  seller_support_email = EXCLUDED.seller_support_email,
  seller_email_verified = EXCLUDED.seller_email_verified,
  resend_vault_secret_id = EXCLUDED.resend_vault_secret_id;

-- Drop the redundant public seller_payment_config table
DROP TABLE public.seller_payment_config;