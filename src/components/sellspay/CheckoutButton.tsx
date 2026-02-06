import React from 'react';
import { useSellsPayCheckout } from '@/hooks/useSellsPayCheckout';

interface CheckoutButtonProps {
  productId: string;
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function CheckoutButton({ 
  productId, 
  children = 'Buy Now', 
  className = '',
  variant = 'primary'
}: CheckoutButtonProps) {
  const { buyProduct, isProcessing } = useSellsPayCheckout();
  
  const baseStyles = "px-6 py-3 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50";
  const variants = {
    primary: "bg-primary hover:bg-primary/90 text-primary-foreground",
    secondary: "bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border",
    ghost: "bg-transparent hover:bg-accent text-foreground",
  };
  
  return (
    <button
      onClick={() => buyProduct(productId)}
      disabled={isProcessing}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {isProcessing ? 'Processing...' : children}
    </button>
  );
}

export default CheckoutButton;
