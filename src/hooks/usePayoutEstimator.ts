import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ProviderFeeSettings,
  calculatePayoutEstimate,
  PayoutEstimate,
  getPlatformFeeByTier,
} from "@/lib/payoutCalculator";

export interface UsePayoutEstimatorResult {
  providers: ProviderFeeSettings[];
  isLoading: boolean;
  error: Error | null;
  getEstimate: (
    priceCents: number,
    providerKey: string,
    platformFeePercent?: number,
    isCrossBorder?: boolean
  ) => PayoutEstimate | null;
  getEstimateForTier: (
    priceCents: number,
    providerKey: string,
    subscriptionTier: string | null,
    isCrossBorder?: boolean
  ) => PayoutEstimate | null;
  compareProviders: (
    priceCents: number,
    platformFeePercent: number,
    isCrossBorder?: boolean
  ) => { provider: ProviderFeeSettings; estimate: PayoutEstimate }[];
}

/**
 * Hook to fetch provider fee settings and calculate payout estimates
 * Use this in seller-facing pages like Add Product, Dashboard, etc.
 */
export function usePayoutEstimator(): UsePayoutEstimatorResult {
  const {
    data: providers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["provider-fee-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_fee_settings")
        .select("*")
        .eq("is_active", true)
        .order("provider_name");

      if (error) throw error;
      return data as ProviderFeeSettings[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const getEstimate = (
    priceCents: number,
    providerKey: string,
    platformFeePercent: number = 10,
    isCrossBorder: boolean = false
  ): PayoutEstimate | null => {
    const provider = providers.find((p) => p.provider_key === providerKey);
    if (!provider) return null;

    return calculatePayoutEstimate(priceCents, platformFeePercent, provider, isCrossBorder);
  };

  const getEstimateForTier = (
    priceCents: number,
    providerKey: string,
    subscriptionTier: string | null,
    isCrossBorder: boolean = false
  ): PayoutEstimate | null => {
    const platformFeePercent = getPlatformFeeByTier(subscriptionTier);
    return getEstimate(priceCents, providerKey, platformFeePercent, isCrossBorder);
  };

  const compareProviders = (
    priceCents: number,
    platformFeePercent: number,
    isCrossBorder: boolean = false
  ): { provider: ProviderFeeSettings; estimate: PayoutEstimate }[] => {
    return providers.map((provider) => ({
      provider,
      estimate: calculatePayoutEstimate(priceCents, platformFeePercent, provider, isCrossBorder),
    }));
  };

  return {
    providers,
    isLoading,
    error: error as Error | null,
    getEstimate,
    getEstimateForTier,
    compareProviders,
  };
}
