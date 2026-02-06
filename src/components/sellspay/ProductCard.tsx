import React from 'react';
import { useSellsPayCheckout } from '@/hooks/useSellsPayCheckout';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  description?: string;
  className?: string;
}

export function ProductCard({ id, title, price, image, description, className = '' }: ProductCardProps) {
  const { buyProduct, isProcessing } = useSellsPayCheckout();
  
  return (
    <div className={`group relative bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 ${className}`}>
      <div className="aspect-square overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground truncate">{title}</h3>
        {description && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-foreground">${price}</span>
          <button
            onClick={() => buyProduct(id)}
            disabled={isProcessing}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
