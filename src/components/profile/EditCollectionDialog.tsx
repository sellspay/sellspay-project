import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Layers, Pencil, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [name, setName] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && collection) {
      setName(collection.name);
      setCoverImageUrl(collection.cover_image_url);
    }
  }, [open, collection]);

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

  const handleSave = async () => {
    if (!collection) return;

    if (!name.trim()) {
      toast.error('Please enter a collection name');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('collections')
        .update({
          name: name.trim(),
          cover_image_url: coverImageUrl,
        })
        .eq('id', collection.id);

      if (error) throw error;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Edit Collection
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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

        <DialogFooter>
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
