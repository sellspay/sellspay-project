import React from 'react';
import { ProductCard } from './ProductCard';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  description?: string;
}

interface FeaturedProductsProps {
  products: Product[];
  title?: string;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function FeaturedProducts({ 
  products, 
  title = 'Featured Products',
  columns = 3,
  className = ''
}: FeaturedProductsProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };
  
  return (
    <section className={`py-16 px-6 ${className}`}>
      {title && (
        <h2 className="text-3xl font-bold text-foreground mb-8">{title}</h2>
      )}
      <div className={`grid ${gridCols[columns]} gap-6`}>
        {products.map(product => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
}

export default FeaturedProducts;
