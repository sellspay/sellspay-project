import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Reveal } from './Reveal';
import { ProductCarousel } from './ProductCarousel';
import { TrendingUp } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  status: string;
  product_type: string | null;
  featured: boolean | null;
  cover_image_url: string | null;
  preview_video_url: string | null;
  pricing_type: string | null;
  subscription_access?: string | null;
  price_cents: number | null;
  currency: string | null;
  youtube_url: string | null;
  tags: string[] | null;
  created_at: string | null;
  creator_id: string | null;
}

export function TrendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('products')
        .select('id, name, status, product_type, featured, cover_image_url, preview_video_url, pricing_type, subscription_access, price_cents, currency, youtube_url, tags, created_at, creator_id')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(12);

      setProducts(data || []);
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <Reveal>
      <div className="pb-8">
        <ProductCarousel
          title="Trending Now"
          products={products}
          viewAllLink="/explore"
        />
      </div>
    </Reveal>
  );
}
