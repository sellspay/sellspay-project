import { useState, useEffect } from 'react';
import { Package, Plus, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateProductDialog } from './CreateProductDialog';

interface Product {
  id: string;
  name: string;
  price_cents: number | null;
  currency: string | null;
  cover_image_url: string | null;
  product_type: string | null;
  status: string | null;
  pricing_type: string | null;
}

interface ProductsPanelProps {
  profileId: string;
  onProductsChange?: () => void;
}

export function ProductsPanel({ profileId, onProductsChange }: ProductsPanelProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price_cents, currency, cover_image_url, product_type, status, pricing_type')
      .eq('creator_id', profileId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [profileId]);

  const handleProductCreated = () => {
    fetchProducts();
    onProductsChange?.();
    setShowCreateDialog(false);
  };

  const formatPrice = (product: Product) => {
    if (product.pricing_type === 'free' || !product.price_cents) {
      return 'Free';
    }
    const dollars = product.price_cents / 100;
    return `$${dollars.toFixed(2)}`;
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'draft':
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-sm text-zinc-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Package className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Your Products</h2>
            <p className="text-xs text-zinc-500">
              {products.length} product{products.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Create Product
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {products.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-zinc-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No products yet</h3>
            <p className="text-zinc-400 max-w-md mb-6">
              Create your first product to display it in your storefront. 
              The AI will use your real products when building product pages.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Plus className="w-4 h-4" />
              Create Your First Product
            </Button>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all"
              >
                {/* Cover Image */}
                <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                  {product.cover_image_url ? (
                    <img
                      src={product.cover_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-zinc-600" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <Badge 
                    className={`absolute top-2 right-2 text-[10px] font-medium border ${getStatusColor(product.status)}`}
                  >
                    {product.status || 'draft'}
                  </Badge>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h4 className="font-semibold text-white text-sm truncate mb-1">
                    {product.name}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-400">
                      {formatPrice(product)}
                    </span>
                    {product.product_type && (
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                        {product.product_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Action */}
                <div className="px-4 pb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300"
                    onClick={() => window.open(`/product/${product.id}`, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Product
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Product Dialog */}
      <CreateProductDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        profileId={profileId}
        onSuccess={handleProductCreated}
      />
    </div>
  );
}
