import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Layers, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  cover_image_url: string | null;
}

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  products: Product[];
  onCreated: () => void;
}

export default function CreateCollectionDialog({
  open,
  onOpenChange,
  creatorId,
  products,
  onCreated,
}: CreateCollectionDialogProps) {
  const [name, setName] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setName('');
      setSelectedProducts([]);
      setCoverImageUrl(null);
    }
  }, [open]);

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

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
      const fileName = `collection-${Date.now()}.${fileExt}`;
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

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a collection name');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    setCreating(true);
    try {
      // Create collection
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .insert({
          creator_id: creatorId,
          name: name.trim(),
          cover_image_url: coverImageUrl,
        })
        .select()
        .single();

      if (collectionError) throw collectionError;

      // Add products to collection
      const collectionItems = selectedProducts.map((productId, index) => ({
        collection_id: collection.id,
        product_id: productId,
        display_order: index,
      }));

      const { error: itemsError } = await supabase
        .from('collection_items')
        .insert(collectionItems);

      if (itemsError) throw itemsError;

      toast.success('Collection created!');
      onCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating collection:', error);
      toast.error('Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Create Collection
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image (Optional)</Label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-16 h-16 rounded-lg bg-muted border border-dashed border-border overflow-hidden hover:border-primary transition-colors group"
                disabled={uploading}
              >
                {coverImageUrl ? (
                  <img
                    src={coverImageUrl}
                    alt="Collection cover"
                    className="w-full h-full object-cover"
                  />
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
                  Add a cover image for your collection
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

          <div className="space-y-2">
            <Label htmlFor="name">Collection Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Tutorials, Editing Packs"
            />
          </div>

          <div className="space-y-2">
            <Label>Select Products</Label>
            <div className="border border-border rounded-lg max-h-[300px] overflow-y-auto">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  No published products available
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {products.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                      {product.cover_image_url ? (
                        <img
                          src={product.cover_image_url}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Layers className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-sm font-medium truncate flex-1">
                        {product.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating || uploading}>
            {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}