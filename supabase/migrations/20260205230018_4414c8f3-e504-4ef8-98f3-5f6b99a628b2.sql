-- =====================================================
-- PHASE 1: CREDIT ECONOMY CLEANUP
-- Delete all old credit system tables and columns
-- =====================================================

-- 1. Drop old credit-related tables (cascade to remove dependencies)
DROP TABLE IF EXISTS public.credit_packages CASCADE;
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.credit_topups CASCADE;

-- 2. Remove credit_balance column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS credit_balance;

-- 3. Drop any related functions that reference the old system
DROP FUNCTION IF EXISTS public.has_pro_subscription(uuid);
DROP FUNCTION IF EXISTS public.get_monthly_tool_usage(uuid);

-- 4. Drop tool_usage table if it exists (old tracking)
DROP TABLE IF EXISTS public.tool_usage CASCADE;

-- 5. Drop storefront_ai_usage table (used by old vibecoder credit system)
DROP TABLE IF EXISTS public.storefront_ai_usage CASCADE;

-- 6. Drop pro_tool_subscriptions table (old subscription model)
DROP TABLE IF EXISTS public.pro_tool_subscriptions CASCADE;