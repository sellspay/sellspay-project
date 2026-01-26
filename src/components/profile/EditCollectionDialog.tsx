import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Layers, Pencil, ImageIcon, Package, Plus, X, Check, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

interface Product {
  id: string;
  name: string;
  cover_image_url: string | null;
  status: string | null;
}

interface EditCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: {
    id: string;
    name: string;
    cover_image_url: string | null;
  } | null;
  onUpdated: () => void;
}

export default function EditCollectionDialog({
  open,
  onOpenChange,
  collection,
  onUpdated,
}: EditCollectionDialogProps) {
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  // Products state
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all user's products and collection items when dialog opens
  useEffect(() => {
    if (open && collection && profile?.id) {
      setName(collection.name);
      setCoverImageUrl(collection.cover_image_url);
      setActiveTab('details');
      setSearchQuery('');
      fetchProductsAndCollectionItems();
    }
  }, [open, collection, profile?.id]);

  const fetchProductsAndCollectionItems = useCallback(async () => {
    if (!collection || !profile?.id) return;
    
    setLoadingProducts(true);
    try {
      // Fetch only published products by this creator
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, cover_image_url, status')
        .eq('creator_id', profile.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setAllProducts(products || []);

      // Fetch products currently in this collection
      const { data: collectionItems, error: itemsError } = await supabase
        .from('collection_items')
        .select('product_id')
        .eq('collection_id', collection.id);

      if (itemsError) throw itemsError;
      
      const productIds = new Set((collectionItems || []).map(item => item.product_id));
      setSelectedProductIds(productIds);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  }, [collection, profile?.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `collection-${collection?.id}-${Date.now()}.${fileExt}`;
      const filePath = `collections/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-media')
        .getPublicUrl(filePath);

      setCoverImageUrl(publicUrl);
      toast.success('Image uploaded!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!collection) return;

    if (!name.trim()) {
      toast.error('Please enter a collection name');
      return;
    }

    setSaving(true);
    try {
      // Update collection details
      const { error: updateError } = await supabase
        .from('collections')
        .update({
          name: name.trim(),
          cover_image_url: coverImageUrl,
        })
        .eq('id', collection.id);

      if (updateError) throw updateError;

      // Get current collection items
      const { data: currentItems, error: fetchError } = await supabase
        .from('collection_items')
        .select('product_id')
        .eq('collection_id', collection.id);

      if (fetchError) throw fetchError;

      const currentProductIds = new Set((currentItems || []).map(item => item.product_id));
      
      // Find products to add and remove
      const toAdd = [...selectedProductIds].filter(id => !currentProductIds.has(id));
      const toRemove = [...currentProductIds].filter(id => !selectedProductIds.has(id));

      // Remove products
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('collection_items')
          .delete()
          .eq('collection_id', collection.id)
          .in('product_id', toRemove);

        if (removeError) throw removeError;
      }

      // Add products
      if (toAdd.length > 0) {
        const newItems = toAdd.map((productId, index) => ({
          collection_id: collection.id,
          product_id: productId,
          display_order: currentProductIds.size + index,
        }));

        const { error: addError } = await supabase
          .from('collection_items')
          .insert(newItems);

        if (addError) throw addError;
      }

      toast.success('Collection updated!');
      onUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error('Failed to update collection');
    } finally {
      setSaving(false);
    }
  };

  // Filter products based on search
  const filteredProducts = allProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = selectedProductIds.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Edit Collection
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="gap-2">
              <Layers className="w-4 h-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              Products
              {selectedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                  {selectedCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 mt-4">
            <div className="space-y-4">
              {/* Cover Image */}
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-16 h-16 rounded-lg bg-muted border border-border overflow-hidden hover:border-primary transition-colors group"
                    disabled={uploading}
                  >
                    {coverImageUrl ? (
                      <>
                        <img
                          src={coverImageUrl}
                          alt="Collection cover"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil className="w-4 h-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Click to {coverImageUrl ? 'change' : 'add'} cover image
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recommended: Square image, max 5MB
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Collection Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-name">Collection Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Tutorials, Editing Packs"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="products" className="flex-1 mt-4 flex flex-col min-h-0">
            <div className="space-y-3 flex flex-col min-h-0 flex-1">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Products List */}
              <div className="flex-1 min-h-0">
                {loadingProducts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {allProducts.length === 0 ? (
                      <p>No products found. Create some products first!</p>
                    ) : (
                      <p>No products match your search.</p>
                    )}
                  </div>
                ) : (
                  <ScrollArea className="h-[280px] pr-4">
                    <div className="space-y-2">
                      {filteredProducts.map((product) => {
                        const isSelected = selectedProductIds.has(product.id);
                        const isDraft = product.status === 'draft';
                        
                        return (
                          <div
                            key={product.id}
                            onClick={() => toggleProduct(product.id)}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                            }`}
                          >
                            {/* Thumbnail */}
                            <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              {product.cover_image_url ? (
                                <img
                                  src={product.cover_image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              {isDraft && (
                                <span className="text-xs text-amber-500">Draft</span>
                              )}
                            </div>

                            {/* Checkbox */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary' 
                                : 'border-muted-foreground/30'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Selection Summary */}
              <div className="text-sm text-muted-foreground pt-2 border-t">
                {selectedCount} product{selectedCount !== 1 ? 's' : ''} selected
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
