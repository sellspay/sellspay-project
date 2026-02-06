import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Unified checkout hook for the SellsPay managed marketplace.
 * 
 * This hook abstracts the platform's payment flow. Sellers cannot bypass it
 * with their own Stripe keys or external payment links. All transactions
 * flow through the platform's unified checkout with automatic fee handling.
 */
export function useSellsPayCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Initiate a product purchase through the SellsPay platform.
   * @param productId - The UUID of the product to purchase
   */
  const buyProduct = async (productId: string) => {
    setIsProcessing(true);
    try {
      // Call the platform's unified checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { product_id: productId }
      });

      if (error) throw error;

      // Redirect to the secure SellsPay checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout unavailable');
      }
    } catch (err) {
      console.error('SellsPay checkout error:', err);
      alert('Checkout failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return { buyProduct, isProcessing };
}
