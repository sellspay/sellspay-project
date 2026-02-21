import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Cart() {
  // Empty cart state for now — will integrate with real cart logic later
  const [items] = useState<any[]>([]);

  return (
    <div className="min-h-[70vh] py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your Cart</h1>
          {items.length > 0 && (
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {items.length}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Discover amazing digital products from talented creators around the world.
            </p>
            <Button asChild className="rounded-full px-8">
              <Link to="/products">Browse Marketplace</Link>
            </Button>
          </div>
        ) : (
          /* Cart items would render here */
          <div className="space-y-4">
            {/* Future cart items */}
          </div>
        )}
      </div>
    </div>
  );
}
