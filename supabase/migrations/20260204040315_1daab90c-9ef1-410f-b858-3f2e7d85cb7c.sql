-- =============================================================================
-- HYBRID PAYMENTS ARCHITECTURE - Phase 1: Database Schema
-- =============================================================================

-- 1. Country Eligibility Table
-- Tracks which countries can use Stripe Connect vs Platform MoR
CREATE TABLE public.country_eligibility (
  country_code TEXT PRIMARY KEY,
  country_name TEXT NOT NULL,
  connect_eligible BOOLEAN DEFAULT false,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.country_eligibility ENABLE ROW LEVEL SECURITY;

-- Anyone can read country eligibility
CREATE POLICY "Anyone can read country eligibility" ON public.country_eligibility
FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage country eligibility" ON public.country_eligibility
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 2. Add seller mode columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS seller_mode TEXT CHECK (seller_mode IN ('CONNECT', 'MOR')),
ADD COLUMN IF NOT EXISTS seller_country_code TEXT,
ADD COLUMN IF NOT EXISTS seller_kyc_status TEXT DEFAULT 'not_started' CHECK (seller_kyc_status IN ('not_started', 'in_review', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS seller_status TEXT DEFAULT 'pending' CHECK (seller_status IN ('pending', 'active', 'restricted', 'suspended'));

-- 3. Add funds flow mode to purchases
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS funds_flow_mode TEXT CHECK (funds_flow_mode IN ('CONNECT', 'MOR')),
ADD COLUMN IF NOT EXISTS available_on TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dispute_status TEXT CHECK (dispute_status IN ('none', 'disputed', 'resolved', 'lost'));

-- Set default for existing purchases
UPDATE public.purchases SET dispute_status = 'none' WHERE dispute_status IS NULL;

-- 4. Wallet Ledger Entries Table
-- Append-only ledger for all seller earnings and debits
CREATE TABLE public.wallet_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID,
  order_type TEXT CHECK (order_type IN ('purchase', 'booking', 'subscription', 'manual')),
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'credit',
    'debit',
    'hold_release',
    'refund_debit',
    'chargeback_debit',
    'fee_debit',
    'payout_debit',
    'adjustment'
  )),
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'locked', 'reversed')),
  available_on TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ledger_seller ON public.wallet_ledger_entries(seller_id);
CREATE INDEX idx_ledger_status ON public.wallet_ledger_entries(status);
CREATE INDEX idx_ledger_available_on ON public.wallet_ledger_entries(available_on);
CREATE INDEX idx_ledger_order ON public.wallet_ledger_entries(order_id);

-- Enable RLS
ALTER TABLE public.wallet_ledger_entries ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own ledger entries
CREATE POLICY "Sellers view own ledger" ON public.wallet_ledger_entries
FOR SELECT USING (seller_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

-- Admins can view all ledger entries
CREATE POLICY "Admins view all ledger" ON public.wallet_ledger_entries
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Only system (service role) can insert ledger entries
CREATE POLICY "System inserts ledger entries" ON public.wallet_ledger_entries
FOR INSERT WITH CHECK (false);

-- 5. Payouts Table
-- Tracks all payout requests and their status
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  provider_type TEXT NOT NULL CHECK (provider_type IN (
    'STRIPE', 'PAYPAL', 'PAYONEER', 'WISE', 'BANK', 'CRYPTO', 'MANUAL'
  )),
  status TEXT DEFAULT 'requested' CHECK (status IN (
    'requested', 'approved', 'processing', 'sent', 'failed', 'cancelled'
  )),
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ,
  external_reference TEXT,
  admin_notes TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_payouts_seller ON public.payouts(seller_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);
CREATE INDEX idx_payouts_requested_at ON public.payouts(requested_at);

-- Enable RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own payouts
CREATE POLICY "Sellers view own payouts" ON public.payouts
FOR SELECT USING (seller_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

-- Admins can view all payouts
CREATE POLICY "Admins view all payouts" ON public.payouts
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update payouts
CREATE POLICY "Admins update payouts" ON public.payouts
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Sellers can request payouts (insert)
CREATE POLICY "Sellers request payouts" ON public.payouts
FOR INSERT WITH CHECK (seller_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

-- 6. Admin Audit Log
-- Tracks all admin actions for compliance
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  old_value JSONB,
  new_value JSONB,
  notes TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying
CREATE INDEX idx_audit_admin ON public.admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_action ON public.admin_audit_log(action_type);
CREATE INDEX idx_audit_target ON public.admin_audit_log(target_type, target_id);
CREATE INDEX idx_audit_created ON public.admin_audit_log(created_at);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit log
CREATE POLICY "Admins view audit log" ON public.admin_audit_log
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- System inserts audit entries
CREATE POLICY "System inserts audit log" ON public.admin_audit_log
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. Database function to get seller wallet balance
CREATE OR REPLACE FUNCTION public.get_seller_wallet_balance(p_seller_id UUID)
RETURNS TABLE (
  available_cents BIGINT,
  pending_cents BIGINT,
  locked_cents BIGINT,
  total_earned_cents BIGINT,
  total_withdrawn_cents BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN status = 'available' AND entry_type IN ('credit', 'hold_release', 'adjustment') THEN amount_cents
                      WHEN status = 'available' AND entry_type IN ('refund_debit', 'chargeback_debit', 'payout_debit', 'fee_debit') THEN -amount_cents
                      ELSE 0 END), 0)::BIGINT as available_cents,
    COALESCE(SUM(CASE WHEN status = 'pending' AND entry_type = 'credit' THEN amount_cents ELSE 0 END), 0)::BIGINT as pending_cents,
    COALESCE(SUM(CASE WHEN status = 'locked' THEN amount_cents ELSE 0 END), 0)::BIGINT as locked_cents,
    COALESCE(SUM(CASE WHEN entry_type = 'credit' THEN amount_cents ELSE 0 END), 0)::BIGINT as total_earned_cents,
    COALESCE(SUM(CASE WHEN entry_type = 'payout_debit' AND status != 'reversed' THEN amount_cents ELSE 0 END), 0)::BIGINT as total_withdrawn_cents
  FROM public.wallet_ledger_entries
  WHERE seller_id = p_seller_id;
END;
$$;

-- 8. Database function to release held funds (run via cron)
CREATE OR REPLACE FUNCTION public.release_held_funds()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  released_count INTEGER;
BEGIN
  UPDATE public.wallet_ledger_entries
  SET status = 'available'
  WHERE status = 'pending'
    AND available_on IS NOT NULL
    AND available_on <= now();
  
  GET DIAGNOSTICS released_count = ROW_COUNT;
  RETURN released_count;
END;
$$;

-- 9. Seed initial country eligibility data (Stripe Connect supported countries)
INSERT INTO public.country_eligibility (country_code, country_name, connect_eligible, notes) VALUES
-- North America
('US', 'United States', true, 'Full support'),
('CA', 'Canada', true, 'Full support'),
('MX', 'Mexico', true, 'Full support'),
-- Europe
('AT', 'Austria', true, 'Full support'),
('BE', 'Belgium', true, 'Full support'),
('BG', 'Bulgaria', true, 'Full support'),
('HR', 'Croatia', true, 'Full support'),
('CY', 'Cyprus', true, 'Full support'),
('CZ', 'Czech Republic', true, 'Full support'),
('DK', 'Denmark', true, 'Full support'),
('EE', 'Estonia', true, 'Full support'),
('FI', 'Finland', true, 'Full support'),
('FR', 'France', true, 'Full support'),
('DE', 'Germany', true, 'Full support'),
('GR', 'Greece', true, 'Full support'),
('HU', 'Hungary', true, 'Full support'),
('IE', 'Ireland', true, 'Full support'),
('IT', 'Italy', true, 'Full support'),
('LV', 'Latvia', true, 'Full support'),
('LT', 'Lithuania', true, 'Full support'),
('LU', 'Luxembourg', true, 'Full support'),
('MT', 'Malta', true, 'Full support'),
('NL', 'Netherlands', true, 'Full support'),
('NO', 'Norway', true, 'Full support'),
('PL', 'Poland', true, 'Full support'),
('PT', 'Portugal', true, 'Full support'),
('RO', 'Romania', true, 'Full support'),
('SK', 'Slovakia', true, 'Full support'),
('SI', 'Slovenia', true, 'Full support'),
('ES', 'Spain', true, 'Full support'),
('SE', 'Sweden', true, 'Full support'),
('CH', 'Switzerland', true, 'Full support'),
('GB', 'United Kingdom', true, 'Full support'),
-- Asia Pacific
('AU', 'Australia', true, 'Full support'),
('NZ', 'New Zealand', true, 'Full support'),
('JP', 'Japan', true, 'Full support'),
('SG', 'Singapore', true, 'Full support'),
('HK', 'Hong Kong', true, 'Full support'),
('MY', 'Malaysia', true, 'Full support'),
('TH', 'Thailand', true, 'Full support'),
-- Other
('AE', 'United Arab Emirates', true, 'Full support'),
('BR', 'Brazil', true, 'Full support'),
-- MoR-only countries (examples of non-supported)
('IN', 'India', false, 'Stripe Connect not available - use Platform MoR'),
('PH', 'Philippines', false, 'Stripe Connect not available - use Platform MoR'),
('PK', 'Pakistan', false, 'Stripe Connect not available - use Platform MoR'),
('NG', 'Nigeria', false, 'Stripe Connect not available - use Platform MoR'),
('KE', 'Kenya', false, 'Stripe Connect not available - use Platform MoR'),
('BD', 'Bangladesh', false, 'Stripe Connect not available - use Platform MoR'),
('VN', 'Vietnam', false, 'Stripe Connect not available - use Platform MoR'),
('ID', 'Indonesia', false, 'Stripe Connect not available - use Platform MoR'),
('EG', 'Egypt', false, 'Stripe Connect not available - use Platform MoR'),
('ZA', 'South Africa', false, 'Stripe Connect not available - use Platform MoR'),
('CO', 'Colombia', false, 'Stripe Connect not available - use Platform MoR'),
('AR', 'Argentina', false, 'Stripe Connect not available - use Platform MoR'),
('CL', 'Chile', false, 'Stripe Connect not available - use Platform MoR'),
('PE', 'Peru', false, 'Stripe Connect not available - use Platform MoR'),
('UA', 'Ukraine', false, 'Stripe Connect not available - use Platform MoR'),
('RU', 'Russia', false, 'Stripe Connect not available - use Platform MoR'),
('TR', 'Turkey', false, 'Stripe Connect not available - use Platform MoR'),
('SA', 'Saudi Arabia', false, 'Stripe Connect not available - use Platform MoR'),
('IL', 'Israel', false, 'Stripe Connect not available - use Platform MoR'),
('TW', 'Taiwan', false, 'Stripe Connect not available - use Platform MoR'),
('KR', 'South Korea', false, 'Stripe Connect not available - use Platform MoR'),
('CN', 'China', false, 'Stripe Connect not available - use Platform MoR')
ON CONFLICT (country_code) DO NOTHING;