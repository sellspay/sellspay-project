import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Keywords that indicate the user is building a pricing/subscription page
const PRICING_KEYWORDS = [
  'pricing', 'price', 'subscription', 'plan', 'tier', 'membership',
  'monthly', 'yearly', 'annual', 'premium', 'pro plan', 'basic plan',
  'enterprise', 'billing', 'payment plan', 'recurring'
];

// Keywords that indicate the user is building a products page
const PRODUCT_KEYWORDS = [
  'product', 'shop', 'store', 'catalog', 'merchandise', 'item',
  'buy', 'purchase', 'cart', 'checkout', 'listing', 'collection'
];

interface DataAvailabilityResult {
  needsSubscriptionPlans: boolean;
  needsProducts: boolean;
  subscriptionCount: number;
  productCount: number;
  requestedSubscriptionCount: number;
  requestedProductCount: number;
}

/**
 * Detects if the prompt is about pricing/subscriptions or products
 * and returns what count of items the user mentioned (if any)
 */
function detectDataIntent(prompt: string): { 
  needsPricing: boolean; 
  needsProducts: boolean;
  requestedPricingCount: number;
  requestedProductCount: number;
} {
  const lower = prompt.toLowerCase();
  
  const needsPricing = PRICING_KEYWORDS.some(kw => lower.includes(kw));
  const needsProducts = PRODUCT_KEYWORDS.some(kw => lower.includes(kw));
  
  // Try to detect how many items they're requesting
  let requestedPricingCount = 0;
  let requestedProductCount = 0;
  
  // Common patterns: "three subscriptions", "3 plans", "ten products"
  const numberMap: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12
  };
  
  // Check for numbers near pricing keywords
  if (needsPricing) {
    const pricingMatch = lower.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:subscription|plan|tier|pricing|price)/);
    if (pricingMatch) {
      const num = pricingMatch[1];
      requestedPricingCount = numberMap[num] ?? (parseInt(num) || 0);
    }
  }
  
  // Check for numbers near product keywords
  if (needsProducts) {
    const productMatch = lower.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:product|item|listing)/);
    if (productMatch) {
      const num = productMatch[1];
      requestedProductCount = numberMap[num] ?? (parseInt(num) || 0);
    }
  }
  
  return { needsPricing, needsProducts, requestedPricingCount, requestedProductCount };
}

/**
 * Generate a helpful "Next Steps" message for missing data
 */
function generateDataGuidance(result: DataAvailabilityResult): string {
  const parts: string[] = [];
  
  if (result.needsSubscriptionPlans) {
    parts.push(
      `\n\n---\n\n⚠️ **Heads up:** You don't have any subscription plans set up yet. ` +
      `The pricing cards I created are placeholders. To make them functional:\n\n` +
      `1. Use the **Subscriptions tab** above to create your plans\n` +
      `2. Set up your actual pricing tiers\n` +
      `3. Tell me to "link my subscriptions to the pricing cards"\n`
    );
  }
  
  if (result.needsProducts) {
    if (result.productCount === 0) {
      parts.push(
        `\n\n---\n\n⚠️ **Heads up:** You don't have any products yet. ` +
        `The product cards I created are using placeholder data. To make them real:\n\n` +
        `1. Use the **Products tab** above to create your products\n` +
        `2. Once you have products, tell me to "use my real products" and I'll update the page\n`
      );
    } else if (result.requestedProductCount > 0 && result.productCount < result.requestedProductCount) {
      const missing = result.requestedProductCount - result.productCount;
      parts.push(
        `\n\n---\n\n⚠️ **Heads up:** You asked for ${result.requestedProductCount} products, but you only have ${result.productCount}. ` +
        `I've filled the extra ${missing} slot${missing > 1 ? 's' : ''} with placeholder${missing > 1 ? 's' : ''}.\n\n` +
        `Create ${missing} more product${missing > 1 ? 's' : ''} in the **Products tab**, then tell me to refresh the products!\n`
      );
    }
  }
  
  return parts.join('');
}

/**
 * Hook that checks if the user has the required data for their request
 * and returns guidance to append to the AI's summary
 */
export function useDataAvailabilityCheck(profileId: string) {
  const checkDataAvailability = useCallback(async (
    lastPrompt: string
  ): Promise<string> => {
    const intent = detectDataIntent(lastPrompt);
    
    // If prompt doesn't mention pricing or products, skip the check
    if (!intent.needsPricing && !intent.needsProducts) {
      return '';
    }
    
    try {
      let subscriptionCount = 0;
      let productCount = 0;
      
      // Check subscription plans if needed
      if (intent.needsPricing) {
        const { count } = await supabase
          .from('creator_subscription_plans')
          .select('id', { count: 'exact', head: true })
          .eq('creator_id', profileId)
          .eq('is_active', true);
        
        subscriptionCount = count ?? 0;
      }
      
      // Check products if needed
      if (intent.needsProducts) {
        const { count } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('creator_id', profileId)
          .eq('status', 'published');
        
        productCount = count ?? 0;
      }
      
      const result: DataAvailabilityResult = {
        needsSubscriptionPlans: intent.needsPricing && subscriptionCount === 0,
        needsProducts: intent.needsProducts && (productCount === 0 || (intent.requestedProductCount > 0 && productCount < intent.requestedProductCount)),
        subscriptionCount,
        productCount,
        requestedSubscriptionCount: intent.requestedPricingCount,
        requestedProductCount: intent.requestedProductCount,
      };
      
      if (result.needsSubscriptionPlans || result.needsProducts) {
        console.log('[DataAvailabilityCheck] Missing data detected:', result);
        return generateDataGuidance(result);
      }
      
      return '';
    } catch (e) {
      console.warn('[DataAvailabilityCheck] Failed to check:', e);
      return '';
    }
  }, [profileId]);
  
  return { checkDataAvailability };
}
