import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Star, X, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  cover_image_url: string | null;
  featured: boolean | null;
  creator?: {
    username: string | null;
    full_name: string | null;
  };
}

interface ManageFeaturedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeaturedChanged: () => void;
}

export default function ManageFeaturedDialog({
  open,
  onOpenChange,
  onFeaturedChanged,
}: ManageFeaturedDialogProps) {
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Fetch all published products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, cover_image_url, featured, creator_id")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      // Fetch creator info
      const creatorIds = [...new Set(productsData?.map(p => p.creator_id).filter(Boolean) || [])];
      let creatorsMap: Record<string, { username: string | null; full_name: string | null }> = {};

      if (creatorIds.length > 0) {
        const { data: creatorsData } = await supabase
          .from("profiles")
          .select("id, username, full_name")
          .in("id", creatorIds);

        creatorsData?.forEach(c => {
          creatorsMap[c.id] = { username: c.username, full_name: c.full_name };
        });
      }

      const productsWithCreators = productsData?.map(p => ({
        ...p,
        creator: p.creator_id ? creatorsMap[p.creator_id] || undefined : undefined
      })) || [];

      setFeaturedProducts(productsWithCreators.filter(p => p.featured));
      setAllProducts(productsWithCreators.filter(p => !p.featured));
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (productId: string, featured: boolean) => {
    setUpdating(productId);
    try {
      const { error } = await supabase
        .from("products")
        .update({ featured })
        .eq("id", productId);

      if (error) throw error;

      toast.success(featured ? "Product featured successfully" : "Product removed from featured");
      await fetchProducts();
      onFeaturedChanged();
    } catch (error) {
      console.error("Error updating featured status:", error);
      toast.error("Failed to update product");
    } finally {
      setUpdating(null);
    }
  };

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.creator?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.creator?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Manage Featured Products
          </DialogTitle>
          <DialogDescription>
            Products marked as featured will appear on the homepage
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Currently Featured */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                Currently Featured ({featuredProducts.length})
              </h3>
              
              {featuredProducts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                  No featured products yet
                </div>
              ) : (
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-2">
                    {featuredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
                      >
                        <div className="flex items-center gap-3">
                          {product.cover_image_url ? (
                            <img
                              src={product.cover_image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <Star className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              by {product.creator?.full_name || product.creator?.username || "Unknown"}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFeatured(product.id, false)}
                          disabled={updating === product.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {updating === product.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          <span className="ml-1">Remove</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Add Products */}
            <div>
              <h3 className="font-medium mb-3">Add Products to Featured</h3>
              
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="pl-9"
                />
              </div>

              <ScrollArea className="max-h-[250px]">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    {searchQuery ? "No products found" : "All products are featured"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {product.cover_image_url ? (
                            <img
                              src={product.cover_image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <Star className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              by {product.creator?.full_name || product.creator?.username || "Unknown"}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleFeatured(product.id, true)}
                          disabled={updating === product.id}
                        >
                          {updating === product.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          <span className="ml-1">Feature</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
