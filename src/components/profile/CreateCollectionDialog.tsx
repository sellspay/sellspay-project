import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Layers } from 'lucide-react';
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

  useEffect(() => {
    if (!open) {
      setName('');
      setSelectedProducts([]);
    }
  }, [open]);

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
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
          <Button onClick={handleCreate} disabled={creating}>
            {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
