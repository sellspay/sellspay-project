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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Star, X, Loader2, Plus, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  cover_image_url: string | null;
  featured: boolean | null;
  product_type: string | null;
  creator_id: string | null;
  creator?: {
    id: string;
    username: string | null;
    full_name: string | null;
  };
}

interface Creator {
  id: string;
  username: string | null;
  full_name: string | null;
}

interface ManageFeaturedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeaturedChanged: () => void;
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  preset: "Preset",
  lut: "LUT",
  sfx: "SFX",
  motion_graphics: "Motion Graphics",
  tutorial: "Tutorial",
  project_file: "Project File",
  other: "Other",
};

export default function ManageFeaturedDialog({
  open,
  onOpenChange,
  onFeaturedChanged,
}: ManageFeaturedDialogProps) {
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [creatorFilter, setCreatorFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Fetch 20 most recent published products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, cover_image_url, featured, product_type, creator_id")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(50);

      if (productsError) throw productsError;

      // Fetch creator info
      const creatorIds = [...new Set(productsData?.map(p => p.creator_id).filter(Boolean) || [])];
      let creatorsMap: Record<string, Creator> = {};

      if (creatorIds.length > 0) {
        const { data: creatorsData } = await supabase
          .from("profiles")
          .select("id, username, full_name")
          .in("id", creatorIds);

        const creatorsList: Creator[] = [];
        creatorsData?.forEach(c => {
          creatorsMap[c.id] = { id: c.id, username: c.username, full_name: c.full_name };
          creatorsList.push({ id: c.id, username: c.username, full_name: c.full_name });
        });
        setCreators(creatorsList);
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

  const clearFilters = () => {
    setSearchQuery("");
    setCreatorFilter("all");
    setTypeFilter("all");
  };

  const filteredProducts = allProducts.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.creator?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.creator?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCreator = creatorFilter === "all" || p.creator_id === creatorFilter;
    const matchesType = typeFilter === "all" || p.product_type === typeFilter;

    return matchesSearch && matchesCreator && matchesType;
  });

  const hasActiveFilters = searchQuery || creatorFilter !== "all" || typeFilter !== "all";
  const productTypes = [...new Set(allProducts.map(p => p.product_type).filter(Boolean))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Manage Featured Products
          </DialogTitle>
          <DialogDescription>
            Products marked as featured will appear on the homepage "Popular Picks" section
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
                  No featured products yet. Add products below to feature them on the homepage.
                </div>
              ) : (
                <ScrollArea className="max-h-[180px]">
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
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                by {product.creator?.full_name || product.creator?.username || "Unknown"}
                              </p>
                              {product.product_type && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1">
                                  {PRODUCT_TYPE_LABELS[product.product_type] || product.product_type}
                                </Badge>
                              )}
                            </div>
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Add Products to Featured</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7">
                    <X className="w-3 h-3 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
              
              {/* Filters Row */}
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by keyword..."
                    className="pl-9"
                  />
                </div>
                
                <Select value={creatorFilter} onValueChange={setCreatorFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Creators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Creators</SelectItem>
                    {creators.map((creator) => (
                      <SelectItem key={creator.id} value={creator.id}>
                        {creator.full_name || creator.username || "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {productTypes.map((type) => (
                      <SelectItem key={type} value={type!}>
                        {PRODUCT_TYPE_LABELS[type!] || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="max-h-[280px]">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                    {hasActiveFilters ? "No products match your filters" : "All products are featured"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredProducts.slice(0, 20).map((product) => (
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
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                by {product.creator?.full_name || product.creator?.username || "Unknown"}
                              </p>
                              {product.product_type && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1">
                                  {PRODUCT_TYPE_LABELS[product.product_type] || product.product_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleFeatured(product.id, true)}
                          disabled={updating === product.id}
                          className="bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-600"
                        >
                          {updating === product.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Star className="w-4 h-4" />
                          )}
                          <span className="ml-1">Feature</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Showing up to 20 most recent products
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
