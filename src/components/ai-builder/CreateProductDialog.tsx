import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, DollarSign, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const productTypes = [
  { value: "preset", label: "Preset Pack" },
  { value: "lut", label: "LUT Pack" },
  { value: "sfx", label: "Sound Effects" },
  { value: "music", label: "Music" },
  { value: "template", label: "Template" },
  { value: "overlay", label: "Overlay" },
  { value: "font", label: "Font" },
  { value: "tutorial", label: "Tutorial" },
  { value: "project_file", label: "Project File" },
  { value: "transition", label: "Transition Pack" },
  { value: "color_grading", label: "Color Grading" },
  { value: "motion_graphics", label: "Motion Graphics" },
  { value: "digital_art", label: "Digital Art" },
  { value: "art", label: "Art" },
  { value: "3d_artist", label: "3D Artist" },
  { value: "other", label: "Other" },
];

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  onSuccess: () => void;
}

export function CreateProductDialog({ open, onOpenChange, profileId, onSuccess }: CreateProductDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState('');
  const [pricingType, setPricingType] = useState('free');
  const [price, setPrice] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [downloadFiles, setDownloadFiles] = useState<File[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const fileDropRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setProductType('');
    setPricingType('free');
    setPrice('');
    setCoverImage(null);
    setCoverPreview(null);
    setDownloadFiles([]);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleDownloadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setDownloadFiles(prev => [...prev, ...Array.from(files)]);
    }
    e.target.value = '';
  };

  const removeDownloadFile = (index: number) => {
    setDownloadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(true);
  }, []);

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!fileDropRef.current?.contains(e.relatedTarget as Node)) {
      setIsDraggingFiles(false);
    }
  }, []);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setDownloadFiles(prev => [...prev, ...Array.from(files)]);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to create a product');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter a product name');
      return;
    }

    if (!productType) {
      toast.error('Please select a product type');
      return;
    }

    if ((pricingType === 'paid') && parseFloat(price) < 4.99) {
      toast.error('Minimum price is $4.99 for paid products');
      return;
    }

    setLoading(true);

    try {
      let coverImageUrl: string | null = null;

      // Upload cover image
      if (coverImage) {
        const ext = coverImage.name.split('.').pop() || 'jpg';
        const path = `covers/${profileId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('product-media')
          .upload(path, coverImage);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from('product-media')
          .getPublicUrl(path);
        
        coverImageUrl = publicUrl.publicUrl;
      }

      // Upload product files
      let downloadUrl: string | null = null;
      let originalFilename: string | null = null;
      const attachments: { name: string; path: string; size: number }[] = [];
      
      if (downloadFiles.length > 0) {
        for (let i = 0; i < downloadFiles.length; i++) {
          const file = downloadFiles[i];
          const safeName = file.name.replace(/[^a-zA-Z0-9._()-]/g, '_');
          const path = `${user.id}/${Date.now()}-${i}-${safeName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('product-files')
            .upload(path, file);

          if (uploadError) throw uploadError;

          attachments.push({
            name: file.name,
            path,
            size: file.size,
          });
        }
        
        if (attachments.length > 0) {
          downloadUrl = attachments[0].path;
          originalFilename = attachments[0].name;
        }
      }

      const priceCents = pricingType === 'free' ? 0 : Math.round(parseFloat(price) * 100);

      const { error } = await supabase
        .from('products')
        .insert({
          name,
          description,
          product_type: productType || null,
          pricing_type: pricingType,
          price_cents: priceCents,
          currency: 'USD',
          cover_image_url: coverImageUrl,
          download_url: downloadUrl,
          original_filename: originalFilename,
          attachments: attachments.length > 0 ? attachments : null,
          creator_id: profileId,
          status: 'published',
        } as any);

      if (error) throw error;

      toast.success('Product created successfully!');
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Create New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-300">Product Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Premium LUT Pack"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-300">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product..."
              className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
            />
          </div>

          {/* Product Type */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Product Type *</Label>
            <Select value={productType} onValueChange={setProductType}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {productTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white hover:bg-zinc-700">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <Label className="text-zinc-300">Pricing</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPricingType('free')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  pricingType === 'free'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <span className="font-semibold text-white">Free</span>
                <p className="text-xs text-zinc-400 mt-1">Give away for free</p>
              </button>
              <button
                type="button"
                onClick={() => setPricingType('paid')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  pricingType === 'paid'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <span className="font-semibold text-white">Paid</span>
                <p className="text-xs text-zinc-400 mt-1">Set your price</p>
              </button>
            </div>

            {pricingType === 'paid' && (
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="number"
                  min="4.99"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="4.99"
                  className="pl-9 bg-zinc-800 border-zinc-700 text-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                  Min $4.99
                </span>
              </div>
            )}
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Cover Image</Label>
            <div className="border-2 border-dashed border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition-colors">
              {coverPreview ? (
                <div className="relative">
                  <img 
                    src={coverPreview} 
                    alt="Cover preview" 
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => { setCoverImage(null); setCoverPreview(null); }}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                  <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                  <span className="text-sm text-zinc-400">Click to upload cover image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Product Files */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Product Files</Label>
            <div
              ref={fileDropRef}
              onDragOver={handleFileDragOver}
              onDragLeave={handleFileDragLeave}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                isDraggingFiles 
                  ? 'border-emerald-500 bg-emerald-500/10' 
                  : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              {downloadFiles.length > 0 ? (
                <div className="space-y-2">
                  {downloadFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-zinc-800 rounded-lg">
                      <div className="flex items-center gap-2 truncate">
                        <FolderOpen className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="text-sm text-white truncate">{file.name}</span>
                        <span className="text-xs text-zinc-500 shrink-0">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDownloadFile(index)}
                        className="p-1 hover:bg-zinc-700 rounded"
                      >
                        <X className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                  ))}
                  <label className="flex items-center justify-center gap-2 p-2 text-sm text-emerald-400 cursor-pointer hover:text-emerald-300">
                    <Upload className="w-4 h-4" />
                    Add more files
                    <input
                      type="file"
                      multiple
                      onChange={handleDownloadChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                  <FolderOpen className="w-8 h-8 text-zinc-500 mb-2" />
                  <span className="text-sm text-zinc-400">Drag files here or click to upload</span>
                  <span className="text-xs text-zinc-500 mt-1">ZIP, RAR, or any file type</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleDownloadChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-zinc-700 hover:bg-zinc-800"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-500"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
