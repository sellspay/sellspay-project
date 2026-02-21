import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowLeft, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

interface CartProduct {
  id: string;
  name: string;
  cover_image_url: string | null;
  price_cents: number | null;
  currency: string | null;
  pricing_type: string | null;
  creator_id: string | null;
  product_type: string | null;
  creator?: { username: string | null; avatar_url: string | null } | null;
}

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cartItems, removeFromCart, loading: cartLoading } = useCart();
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (!cartItems.length) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }

    const fetchProducts = async () => {
      setLoadingProducts(true);
      const { data } = await supabase
        .from('products')
        .select('id, name, cover_image_url, price_cents, currency, pricing_type, creator_id, product_type')
        .in('id', cartItems);

      if (data) {
        // Fetch creator info
        const creatorIds = [...new Set(data.map(p => p.creator_id).filter(Boolean))];
        let creatorsMap: Record<string, { username: string | null; avatar_url: string | null }> = {};
        if (creatorIds.length > 0) {
          const { data: creators } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', creatorIds);
          if (creators) {
            creatorsMap = Object.fromEntries(creators.map(c => [c.id, { username: c.username, avatar_url: c.avatar_url }]));
          }
        }
        setProducts(data.map(p => ({ ...p, creator: p.creator_id ? creatorsMap[p.creator_id] || null : null })));
      }
      setLoadingProducts(false);
    };

    fetchProducts();
  }, [cartItems]);

  const formatPrice = (cents: number | null, currency: string | null, pricingType: string | null) => {
    if (pricingType === 'free' || !cents) return 'Free';
    const amount = (cents / 100).toFixed(2);
    return `$${amount} ${(currency || 'USD').toUpperCase()}`;
  };

  const total = products.reduce((sum, p) => sum + (p.price_cents || 0), 0);

  if (!user) {
    return (
      <div className="min-h-[70vh] py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Sign in to view your cart</h1>
          <Button asChild className="rounded-full px-8">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your Cart</h1>
          {cartItems.length > 0 && (
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {cartItems.length}
            </span>
          )}
        </div>

        {loadingProducts ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : cartItems.length === 0 ? (
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
          <div className="space-y-6">
            {/* Cart items */}
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
                >
                  {/* Thumbnail */}
                  <Link to={`/product/${product.id}`} className="flex-shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted">
                      {product.cover_image_url ? (
                        <img
                          src={product.cover_image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ShoppingBag className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${product.id}`} className="hover:text-primary transition-colors">
                      <h3 className="font-medium text-foreground truncate">{product.name}</h3>
                    </Link>
                    {product.creator?.username && (
                      <p className="text-sm text-muted-foreground">by @{product.creator.username}</p>
                    )}
                    {product.product_type && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                        {product.product_type}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-foreground">
                      {formatPrice(product.price_cents, product.currency, product.pricing_type)}
                    </p>
                  </div>

                  {/* Remove */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={cartLoading}
                    onClick={() => removeFromCart(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">{formatPrice(total, 'USD', total === 0 ? 'free' : 'paid')}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" asChild className="flex-1 rounded-full">
                  <Link to="/products">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Continue Browsing
                  </Link>
                </Button>
                <Button className="flex-1 rounded-full" size="lg">
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
