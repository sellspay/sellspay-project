import { supabase } from "@/integrations/supabase/client";

export interface ProviderFeeSettings {
  id: string;
  provider_key: string;
  provider_name: string;
  fixed_fee_cents: number;
  percentage_fee: number;
  cross_border_surcharge: number;
  safety_buffer: number;
  is_active: boolean;
  notes: string | null;
  updated_at: string;
}

export interface PayoutEstimate {
  gross_amount_cents: number;
  platform_fee_cents: number;
  provider_fixed_fee_cents: number;
  provider_percentage_fee_cents: number;
  cross_border_fee_cents: number;
  safety_buffer_cents: number;
  estimated_payout_cents: number;
}

/**
 * Fetches all provider fee settings from the database
 */
export async function getProviderFeeSettings(): Promise<ProviderFeeSettings[]> {
  const { data, error } = await supabase
    .from("provider_fee_settings")
    .select("*")
    .order("provider_name");

  if (error) {
    console.error("Error fetching provider fee settings:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetches fee settings for a specific provider
 */
export async function getProviderFee(providerKey: string): Promise<ProviderFeeSettings | null> {
  const { data, error } = await supabase
    .from("provider_fee_settings")
    .select("*")
    .eq("provider_key", providerKey)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error(`Error fetching fee for ${providerKey}:`, error);
    return null;
  }

  return data;
}

/**
 * Calculate estimated seller payout using client-side logic
 * This mirrors the database function for real-time UI updates
 */
export function calculatePayoutEstimate(
  productPriceCents: number,
  platformFeePercent: number,
  providerSettings: ProviderFeeSettings,
  isCrossBorder: boolean = false
): PayoutEstimate {
  const platformFeeCents = Math.round(productPriceCents * (platformFeePercent / 100));
  const providerFixedFeeCents = providerSettings.fixed_fee_cents;
  const providerPercentageFeeCents = Math.round(productPriceCents * (providerSettings.percentage_fee / 100));
  const crossBorderFeeCents = isCrossBorder
    ? Math.round(productPriceCents * (providerSettings.cross_border_surcharge / 100))
    : 0;
  const safetyBufferCents = Math.round(productPriceCents * (providerSettings.safety_buffer / 100));

  const estimatedPayoutCents = Math.max(
    0,
    productPriceCents -
      platformFeeCents -
      providerFixedFeeCents -
      providerPercentageFeeCents -
      crossBorderFeeCents -
      safetyBufferCents
  );

  return {
    gross_amount_cents: productPriceCents,
    platform_fee_cents: platformFeeCents,
    provider_fixed_fee_cents: providerFixedFeeCents,
    provider_percentage_fee_cents: providerPercentageFeeCents,
    cross_border_fee_cents: crossBorderFeeCents,
    safety_buffer_cents: safetyBufferCents,
    estimated_payout_cents: estimatedPayoutCents,
  };
}

/**
 * Format cents to currency string
 */
export function formatCents(cents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Get platform fee percent based on subscription tier
 */
export function getPlatformFeeByTier(tier: string | null): number {
  switch (tier?.toLowerCase()) {
    case "enterprise":
      return 0;
    case "pro":
      return 5;
    case "basic":
      return 8;
    default:
      return 10; // Free tier
  }
}

/**
 * Calculate and compare payouts across all active providers
 */
export async function compareProviderPayouts(
  productPriceCents: number,
  platformFeePercent: number,
  isCrossBorder: boolean = false
): Promise<{ provider: ProviderFeeSettings; estimate: PayoutEstimate }[]> {
  const providers = await getProviderFeeSettings();
  const activeProviders = providers.filter((p) => p.is_active);

  return activeProviders.map((provider) => ({
    provider,
    estimate: calculatePayoutEstimate(productPriceCents, platformFeePercent, provider, isCrossBorder),
  }));
}
