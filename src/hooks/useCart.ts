import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function useCart() {
  const { user, profile } = useAuth();
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const userProfileId = profile?.id || null;

  const fetchCart = useCallback(async () => {
    if (!userProfileId) {
      setCartItems([]);
      return;
    }
    const { data } = await supabase
      .from('cart_items')
      .select('product_id')
      .eq('user_id', userProfileId);
    setCartItems((data || []).map((d: any) => d.product_id));
  }, [userProfileId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const isInCart = useCallback((productId: string) => {
    return cartItems.includes(productId);
  }, [cartItems]);

  const addToCart = useCallback(async (productId: string) => {
    if (!userProfileId) return false;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('cart_items')
        .insert({ user_id: userProfileId, product_id: productId });
      if (error) {
        if (error.code === '23505') {
          toast.info('Already in your cart');
        } else {
          throw error;
        }
      } else {
        setCartItems(prev => [...prev, productId]);
        toast.success('Added to cart');
      }
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
      return false;
    } finally {
      setLoading(false);
    }
  }, [userProfileId]);

  const removeFromCart = useCallback(async (productId: string) => {
    if (!userProfileId) return false;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userProfileId)
        .eq('product_id', productId);
      if (error) throw error;
      setCartItems(prev => prev.filter(id => id !== productId));
      toast.success('Removed from cart');
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove from cart');
      return false;
    } finally {
      setLoading(false);
    }
  }, [userProfileId]);

  const toggleCart = useCallback(async (productId: string) => {
    if (isInCart(productId)) {
      return removeFromCart(productId);
    }
    return addToCart(productId);
  }, [isInCart, addToCart, removeFromCart]);

  return {
    cartItems,
    cartCount: cartItems.length,
    isInCart,
    addToCart,
    removeFromCart,
    toggleCart,
    loading,
    refetch: fetchCart,
  };
}
