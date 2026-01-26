import React, { useState, useCallback } from 'react';
import { ProfileSection, SectionStyleOptions, SectionContent, SECTION_TEMPLATES, FontOption, CustomFont, AnimationType } from './types';
import { FontSelector } from './FontSelector';
import { AnimationPickerInline } from './AnimationPicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  X, 
  Trash2, 
  Upload, 
  Eye, 
  EyeOff,
  ArrowLeft,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductData {
  id: string;
  name: string;
  cover_image_url?: string | null;
  price_cents?: number | null;
  currency?: string | null;
  description?: string | null;
  excerpt?: string | null;
}

interface SectionEditorPanelProps {
  section: ProfileSection;
  onUpdate: (section: ProfileSection) => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onClose: () => void;
  collections?: { id: string; name: string }[];
  products?: ProductData[];
  onPreviewAnimation?: () => void;
}

export function SectionEditorPanel({
  section,
  onUpdate,
  onDelete,
  onToggleVisibility,
  onClose,
  collections = [],
  products = [],
  onPreviewAnimation,
}: SectionEditorPanelProps) {
  const [activeTab, setActiveTab] = useState('format');
  const [uploading, setUploading] = useState(false);

  const template = SECTION_TEMPLATES.find(t => t.type === section.section_type);

  const updateContent = useCallback((updates: Record<string, any>) => {
    onUpdate({
      ...section,
      content: { ...section.content, ...updates } as SectionContent,
    });
  }, [section, onUpdate]);

  const updateStyleOptions = useCallback((updates: Partial<SectionStyleOptions>) => {
    onUpdate({
      ...section,
      style_options: { ...section.style_options, ...updates },
    });
  }, [section, onUpdate]);

  const handleImageUpload = async (
    file: File, 
    onSuccess: (url: string) => void
  ) => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${section.id}/${Date.now()}.${fileExt}`;
      const filePath = `profile-sections/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-media')
        .getPublicUrl(filePath);

      onSuccess(publicUrl);
      toast.success('Image uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const renderFormatTab = () => {
    switch (section.section_type) {
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title (optional)</Label>
              <Input
                value={(section.content as any).title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Section title"
              />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                value={(section.content as any).body || ''}
                onChange={(e) => updateContent({ body: e.target.value })}
                placeholder="Your text content..."
                rows={6}
              />
            </div>
            <div>
              <Label>Alignment</Label>
              <Select
                value={(section.content as any).alignment || 'center'}
                onValueChange={(value: 'left' | 'center' | 'right') => updateContent({ alignment: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Font Selector */}
            <FontSelector
              font={(section.content as any).font}
              customFont={(section.content as any).customFont}
              onChange={(updates) => updateContent(updates)}
            />
            
            {/* Font Size */}
            <div>
              <Label>Font Size</Label>
              <Select
                value={(section.content as any).fontSize || 'base'}
                onValueChange={(value) => updateContent({ fontSize: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="base">Normal</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                  <SelectItem value="2xl">2X Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Font Weight */}
            <div>
              <Label>Font Weight</Label>
              <Select
                value={(section.content as any).fontWeight || 'normal'}
                onValueChange={(value) => updateContent({ fontWeight: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="semibold">Semibold</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="extrabold">Extra Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'headline':
        return (
          <div className="space-y-4">
            <div>
              <Label>Headline Text</Label>
              <Textarea
                value={(section.content as any).text || ''}
                onChange={(e) => updateContent({ text: e.target.value })}
                placeholder="Your headline..."
                rows={3}
              />
            </div>
            <div>
              <Label>Size</Label>
              <Select
                value={(section.content as any).size || 'large'}
                onValueChange={(value: 'small' | 'medium' | 'large') => updateContent({ size: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Font Selector */}
            <FontSelector
              font={(section.content as any).font}
              customFont={(section.content as any).customFont}
              onChange={(updates) => updateContent(updates)}
            />
            
            {/* Font Weight */}
            <div>
              <Label>Font Weight</Label>
              <Select
                value={(section.content as any).fontWeight || 'bold'}
                onValueChange={(value) => updateContent({ fontWeight: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="semibold">Semibold</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="extrabold">Extra Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'image':
        const preset = section.style_options?.preset;
        const imageCount = (section.content as any).imageCount || 1;
        const currentImages = ((section.content as any).imageUrl || '')
          .split(',')
          .map((url: string) => url.trim())
          .filter(Boolean);
        
        const isMultiImage = preset === 'style3' || preset === 'style4' || imageCount > 1;
        const targetImageCount = preset === 'style4' ? 4 : preset === 'style3' ? 2 : imageCount;

        const handleMultiImageUpload = (file: File, index: number) => {
          handleImageUpload(file, (url) => {
            const newImages = [...currentImages];
            newImages[index] = url;
            updateContent({ imageUrl: newImages.join(',') });
          });
        };

        // Multi-image layouts (2 or 4 images)
        if (isMultiImage) {
          const slots = Array.from({ length: targetImageCount }, (_, i) => currentImages[i] || null);
          return (
            <div className="space-y-4">
              <Label>Images ({targetImageCount} slots)</Label>
              <div className={cn(
                "grid gap-2",
                targetImageCount === 4 ? "grid-cols-2" : "grid-cols-2"
              )}>
                {slots.map((imageUrl, index) => (
                  <div key={index} className="space-y-2">
                    {imageUrl ? (
                      <div className="relative">
                        <img
                          src={imageUrl}
                          alt=""
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => document.getElementById(`multi-image-upload-${section.id}-${index}`)?.click()}
                          >
                            Replace
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              const newImages = [...currentImages];
                              newImages[index] = '';
                              updateContent({ imageUrl: newImages.filter(Boolean).join(',') });
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => document.getElementById(`multi-image-upload-${section.id}-${index}`)?.click()}
                      >
                        <Upload className="h-6 w-6 mb-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Image {index + 1}</span>
                      </div>
                    )}
                    <input
                      id={`multi-image-upload-${section.id}-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleMultiImageUpload(file, index);
                      }}
                    />
                  </div>
                ))}
              </div>
              <div>
                <Label>Caption (optional)</Label>
                <Input
                  value={(section.content as any).caption || ''}
                  onChange={(e) => updateContent({ caption: e.target.value })}
                  placeholder="Image caption"
                />
              </div>
            </div>
          );
        }

        // Single image layout
        return (
          <div className="space-y-4">
            <div>
              <Label>Image</Label>
              {(section.content as any).imageUrl ? (
                <div className="mt-2 space-y-2">
                  <img
                    src={(section.content as any).imageUrl}
                    alt=""
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`image-upload-${section.id}`)?.click()}
                    >
                      Replace
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateContent({ imageUrl: '' })}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => document.getElementById(`image-upload-${section.id}`)?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload image</p>
                </div>
              )}
              <input
                id={`image-upload-${section.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file, (url) => updateContent({ imageUrl: url }));
                  }
                }}
              />
            </div>
            <div>
              <Label>Caption (optional)</Label>
              <Input
                value={(section.content as any).caption || ''}
                onChange={(e) => updateContent({ caption: e.target.value })}
                placeholder="Image caption"
              />
            </div>
          </div>
        );

      case 'image_with_text':
        const isHeroLayout = section.style_options?.preset === 'style1' || (section.content as any).layout === 'hero';
        return (
          <div className="space-y-4">
            <div>
              <Label>Background Image</Label>
              {(section.content as any).imageUrl ? (
                <div className="mt-2 space-y-2">
                  <img
                    src={(section.content as any).imageUrl}
                    alt=""
                    className="w-full h-32 object-cover rounded-lg"
                    style={{ objectPosition: `center ${(section.content as any).imagePositionY ?? 50}%` }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`img-text-upload-${section.id}`)?.click()}
                    >
                      Replace
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateContent({ imageUrl: '' })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50"
                  onClick={() => document.getElementById(`img-text-upload-${section.id}`)?.click()}
                >
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload image</p>
                </div>
              )}
              <input
                id={`img-text-upload-${section.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file, (url) => updateContent({ imageUrl: url }));
                  }
                }}
              />
            </div>
            {/* Image Position Y - only for Hero layout */}
            {isHeroLayout && (section.content as any).imageUrl && (
              <div>
                <Label>Image Position (Vertical)</Label>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-muted-foreground">Top</span>
                  <Slider
                    value={[(section.content as any).imagePositionY ?? 50]}
                    onValueChange={([value]) => updateContent({ imagePositionY: value })}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground">Bottom</span>
                </div>
              </div>
            )}
            <div>
              <Label>Image Position</Label>
              <Select
                value={(section.content as any).imagePosition || 'left'}
                onValueChange={(value: 'left' | 'right') => updateContent({ imagePosition: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={(section.content as any).title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
              />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                value={(section.content as any).body || ''}
                onChange={(e) => updateContent({ body: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label>Button Text (optional)</Label>
              <Input
                value={(section.content as any).buttonText || ''}
                onChange={(e) => updateContent({ buttonText: e.target.value })}
                placeholder="e.g. Shop Now, Learn More, View"
              />
            </div>
            <div>
              <Label>Button Link Type</Label>
              <Select
                value={(section.content as any).buttonLinkType || 'external'}
                onValueChange={(value: 'external' | 'product' | 'profile') => updateContent({ buttonLinkType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose link type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="external">External URL</SelectItem>
                  <SelectItem value="product">Link to Product</SelectItem>
                  <SelectItem value="profile">Link to My Profile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(section.content as any).buttonLinkType === 'product' ? (
              <div>
                <Label>Select Product</Label>
                <Select
                  value={(section.content as any).buttonProductId || ''}
                  onValueChange={(value) => updateContent({ buttonProductId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((prod) => (
                      <SelectItem key={prod.id} value={prod.id}>
                        {prod.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (section.content as any).buttonLinkType !== 'profile' && (
              <div>
                <Label>Button URL</Label>
                <Input
                  value={(section.content as any).buttonUrl || ''}
                  onChange={(e) => updateContent({ buttonUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}
            {/* Hide Button Toggle */}
            <div className="flex items-center justify-between">
              <Label>Hide Button</Label>
              <Switch
                checked={(section.content as any).hideButton || false}
                onCheckedChange={(checked) => updateContent({ hideButton: checked })}
              />
            </div>
            {/* Button Styling - only show if button is not hidden */}
            {!(section.content as any).hideButton && (section.content as any).buttonText && (
              <div className="border-t pt-4 space-y-4">
                <Label className="text-sm font-medium">Button Styling</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Button Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={(section.content as any).buttonColor || '#8B5CF6'}
                        onChange={(e) => updateContent({ buttonColor: e.target.value })}
                        className="w-12 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={(section.content as any).buttonColor || '#8B5CF6'}
                        onChange={(e) => updateContent({ buttonColor: e.target.value })}
                        placeholder="#8B5CF6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Text Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={(section.content as any).buttonTextColor || '#FFFFFF'}
                        onChange={(e) => updateContent({ buttonTextColor: e.target.value })}
                        className="w-12 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={(section.content as any).buttonTextColor || '#FFFFFF'}
                        onChange={(e) => updateContent({ buttonTextColor: e.target.value })}
                        placeholder="#FFFFFF"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <Label>YouTube URL</Label>
              <Input
                value={(section.content as any).videoUrl || ''}
                onChange={(e) => updateContent({ videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div>
              <Label>Title (optional)</Label>
              <Input
                value={(section.content as any).title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={(section.content as any).description || ''}
                onChange={(e) => updateContent({ description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        );

      case 'gallery':
        const galleryImages = (section.content as any).images || [];
        const galleryPreset = section.style_options?.preset || 'style1';
        const galleryImageCount = galleryPreset === 'style3' ? 4 : 6; // Masonry = 4, others = 6
        const galleryColumns = galleryPreset === 'style2' ? 2 : 3;

        const handleGalleryImageUpload = (file: File, index: number) => {
          handleImageUpload(file, (url) => {
            const newImages = [...galleryImages];
            newImages[index] = { url, altText: '' };
            updateContent({ images: newImages });
          });
        };

        const handleGalleryImageRemove = (index: number) => {
          const newImages = [...galleryImages];
          newImages[index] = null;
          updateContent({ images: newImages.filter(Boolean) });
        };

        return (
          <div className="space-y-4">
            <Label>Gallery Images ({galleryImageCount} slots)</Label>
            <div className={cn("grid gap-2", galleryColumns === 2 ? "grid-cols-2" : "grid-cols-3")}>
              {Array.from({ length: galleryImageCount }, (_, index) => {
                const img = galleryImages[index];
                return (
                  <div key={index} className="space-y-1">
                    {img?.url ? (
                      <div className="relative">
                        <img
                          src={img.url}
                          alt=""
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <div className="absolute bottom-1 left-1 right-1 flex gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 text-xs h-7"
                            onClick={() => document.getElementById(`gallery-upload-${section.id}-${index}`)?.click()}
                          >
                            Replace
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => handleGalleryImageRemove(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => document.getElementById(`gallery-upload-${section.id}-${index}`)?.click()}
                      >
                        <Upload className="h-5 w-5 mb-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{index + 1}</span>
                      </div>
                    )}
                    <input
                      id={`gallery-upload-${section.id}-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleGalleryImageUpload(file, index);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'slideshow':
        const slideshowSlides = (section.content as any).slides || [];
        const maxSlides = 3;

        const handleSlideImageUpload = (file: File, index: number) => {
          handleImageUpload(file, (url) => {
            const newSlides = [...slideshowSlides];
            if (!newSlides[index]) {
              newSlides[index] = { id: Date.now().toString(), imageUrl: '', caption: '', linkUrl: '' };
            }
            newSlides[index] = { ...newSlides[index], imageUrl: url };
            updateContent({ slides: newSlides });
          });
        };

        const handleSlideUpdate = (index: number, updates: Record<string, any>) => {
          const newSlides = [...slideshowSlides];
          if (!newSlides[index]) {
            newSlides[index] = { id: Date.now().toString(), imageUrl: '', caption: '', linkUrl: '' };
          }
          newSlides[index] = { ...newSlides[index], ...updates };
          updateContent({ slides: newSlides });
        };

        const handleSlideRemove = (index: number) => {
          const newSlides = slideshowSlides.filter((_: any, i: number) => i !== index);
          updateContent({ slides: newSlides });
        };

        return (
          <div className="space-y-4">
            <Label>Slides ({maxSlides} max)</Label>
            <div className="space-y-3">
              {Array.from({ length: maxSlides }, (_, index) => {
                const slide = slideshowSlides[index];
                return (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Slide {index + 1}</span>
                      {slide?.imageUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs ml-auto"
                          onClick={() => handleSlideRemove(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {slide?.imageUrl ? (
                      <div className="relative">
                        <img
                          src={slide.imageUrl}
                          alt=""
                          className="w-full aspect-video object-cover rounded-lg"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute bottom-2 left-2 text-xs"
                          onClick={() => document.getElementById(`slide-upload-${section.id}-${index}`)?.click()}
                        >
                          Replace
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => document.getElementById(`slide-upload-${section.id}-${index}`)?.click()}
                      >
                        <Upload className="h-6 w-6 mb-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload image</span>
                      </div>
                    )}
                    <input
                      id={`slide-upload-${section.id}-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSlideImageUpload(file, index);
                      }}
                    />
                    <Input
                      placeholder="Caption (optional)"
                      value={slide?.caption || ''}
                      onChange={(e) => handleSlideUpdate(index, { caption: e.target.value })}
                    />
                    <Input
                      placeholder="Link URL (optional)"
                      value={slide?.linkUrl || ''}
                      onChange={(e) => handleSlideUpdate(index, { linkUrl: e.target.value })}
                    />
                  </div>
                );
              })}
            </div>
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label>Auto Play</Label>
                <Switch
                  checked={(section.content as any).autoPlay ?? false}
                  onCheckedChange={(checked) => updateContent({ autoPlay: checked })}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Interval (seconds)</Label>
                  <span className="text-sm text-muted-foreground">{(section.content as any).interval || 5}s</span>
                </div>
                <Slider
                  value={[(section.content as any).interval || 5]}
                  onValueChange={([value]) => updateContent({ interval: value })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            </div>
          </div>
        );

      case 'about_me':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={(section.content as any).title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={(section.content as any).description || ''}
                onChange={(e) => updateContent({ description: e.target.value })}
                rows={5}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Avatar</Label>
              <Switch
                checked={(section.content as any).showAvatar ?? true}
                onCheckedChange={(checked) => updateContent({ showAvatar: checked })}
              />
            </div>
          </div>
        );

      case 'collection':
        return (
          <div className="space-y-4">
            <div>
              <Label>Select Collection</Label>
              <Select
                value={(section.content as any).collectionId || ''}
                onValueChange={(value) => updateContent({ collectionId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a collection" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Display Style</Label>
              <Select
                value={(section.content as any).displayStyle || 'grid'}
                onValueChange={(value: 'grid' | 'slider') => updateContent({ displayStyle: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="slider">Slider</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'divider':
        return (
          <div className="space-y-4">
            <div>
              <Label>Style</Label>
              <Select
                value={(section.content as any).style || 'line'}
                onValueChange={(value: 'line' | 'space' | 'dots') => updateContent({ style: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="space">Space</SelectItem>
                  <SelectItem value="dots">Dots</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'newsletter':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={(section.content as any).title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
              />
            </div>
            <div>
              <Label>Subtitle (optional)</Label>
              <Input
                value={(section.content as any).subtitle || ''}
                onChange={(e) => updateContent({ subtitle: e.target.value })}
              />
            </div>
            <div>
              <Label>Button Text</Label>
              <Input
                value={(section.content as any).buttonText || ''}
                onChange={(e) => updateContent({ buttonText: e.target.value })}
              />
            </div>
            <div>
              <Label>Input Placeholder</Label>
              <Input
                value={(section.content as any).placeholder || ''}
                onChange={(e) => updateContent({ placeholder: e.target.value })}
              />
            </div>
          </div>
        );

      case 'faq':
        const faqItems = (section.content as any).items || [];
        return (
          <div className="space-y-4">
            <div>
              <Label>Title (optional)</Label>
              <Input
                value={(section.content as any).title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>FAQ Items</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newItem = { id: Date.now().toString(), question: '', answer: '' };
                    updateContent({ items: [...faqItems, newItem] });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {faqItems.map((item: any, index: number) => (
                <div key={item.id} className="border rounded-lg p-3 space-y-2">
                  <Input
                    value={item.question}
                    onChange={(e) => {
                      const updated = [...faqItems];
                      updated[index] = { ...item, question: e.target.value };
                      updateContent({ items: updated });
                    }}
                    placeholder="Question"
                  />
                  <Textarea
                    value={item.answer}
                    onChange={(e) => {
                      const updated = [...faqItems];
                      updated[index] = { ...item, answer: e.target.value };
                      updateContent({ items: updated });
                    }}
                    placeholder="Answer"
                    rows={2}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      updateContent({ items: faqItems.filter((_: any, i: number) => i !== index) });
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'testimonials':
        const testimonials = (section.content as any).testimonials || [];
        return (
          <div className="space-y-4">
            <div>
              <Label>Title (optional)</Label>
              <Input
                value={(section.content as any).title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
              />
            </div>
            <div>
              <Label>Layout</Label>
              <Select
                value={(section.content as any).layout || 'grid'}
                onValueChange={(value: 'grid' | 'slider' | 'stacked') => updateContent({ layout: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="slider">Slider</SelectItem>
                  <SelectItem value="stacked">Stacked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Testimonials</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newItem = { id: Date.now().toString(), name: '', quote: '', role: '' };
                    updateContent({ testimonials: [...testimonials, newItem] });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {testimonials.map((item: any, index: number) => (
                <div key={item.id} className="border rounded-lg p-3 space-y-2">
                  <Input
                    value={item.name}
                    onChange={(e) => {
                      const updated = [...testimonials];
                      updated[index] = { ...item, name: e.target.value };
                      updateContent({ testimonials: updated });
                    }}
                    placeholder="Name"
                  />
                  <Input
                    value={item.role || ''}
                    onChange={(e) => {
                      const updated = [...testimonials];
                      updated[index] = { ...item, role: e.target.value };
                      updateContent({ testimonials: updated });
                    }}
                    placeholder="Role/Title (optional)"
                  />
                  <Textarea
                    value={item.quote}
                    onChange={(e) => {
                      const updated = [...testimonials];
                      updated[index] = { ...item, quote: e.target.value };
                      updateContent({ testimonials: updated });
                    }}
                    placeholder="Testimonial quote"
                    rows={2}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      updateContent({ testimonials: testimonials.filter((_: any, i: number) => i !== index) });
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'featured_product':
        const handleProductSelect = (productId: string) => {
          const selectedProduct = products.find(p => p.id === productId);
          if (selectedProduct) {
            updateContent({
              productId: productId,
              productName: selectedProduct.name,
              productImageUrl: selectedProduct.cover_image_url || '',
              productPriceCents: selectedProduct.price_cents || 0,
              productCurrency: selectedProduct.currency || 'USD',
              productDescription: selectedProduct.excerpt || selectedProduct.description || '',
            });
          } else {
            updateContent({ productId: productId });
          }
        };
        
        return (
          <div className="space-y-4">
            <div>
              <Label>Select Product</Label>
              <Select
                value={(section.content as any).productId || ''}
                onValueChange={handleProductSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((prod) => (
                    <SelectItem key={prod.id} value={prod.id}>
                      {prod.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Description</Label>
              <Switch
                checked={(section.content as any).showDescription ?? true}
                onCheckedChange={(checked) => updateContent({ showDescription: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Price</Label>
              <Switch
                checked={(section.content as any).showPrice ?? true}
                onCheckedChange={(checked) => updateContent({ showPrice: checked })}
              />
            </div>
            <div>
              <Label>Button Text</Label>
              <Input
                value={(section.content as any).buttonText || ''}
                onChange={(e) => updateContent({ buttonText: e.target.value })}
              />
            </div>
          </div>
        );

      case 'contact_us':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={(section.content as any).title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
              />
            </div>
            <div>
              <Label>Subtitle (optional)</Label>
              <Input
                value={(section.content as any).subtitle || ''}
                onChange={(e) => updateContent({ subtitle: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Contact Form</Label>
              <Switch
                checked={(section.content as any).showForm ?? true}
                onCheckedChange={(checked) => updateContent({ showForm: checked })}
              />
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input
                type="email"
                value={(section.content as any).email || ''}
                onChange={(e) => updateContent({ email: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return (
          <p className="text-muted-foreground text-sm">
            No options available for this section type.
          </p>
        );
    }
  };

  const renderBackgroundTab = () => (
    <div className="space-y-6">
      {/* Animation Picker - Prominent at the top */}
      <AnimationPickerInline
        value={(section.style_options?.animation as AnimationType) || 'none'}
        onChange={(animation) => updateStyleOptions({ animation })}
        onPreview={onPreviewAnimation}
      />
      
      <div className="border-t pt-6">
        {/* Show Container Background Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Show Container</Label>
            <p className="text-xs text-muted-foreground">Add a background card behind this section</p>
          </div>
          <Switch
            checked={section.style_options?.showBackground ?? false}
            onCheckedChange={(checked) => updateStyleOptions({ showBackground: checked })}
          />
        </div>
      </div>

      {/* Container styling options - only show when container is enabled */}
      {section.style_options?.showBackground && (
        <>
          {/* Container Background Color */}
          <div>
            <Label className="mb-2 block">Container Background Color</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={section.style_options?.containerBackgroundColor || '#1a1a1a'}
                onChange={(e) => updateStyleOptions({ containerBackgroundColor: e.target.value })}
                className="w-10 h-10 rounded border border-border cursor-pointer"
              />
              <Input
                value={section.style_options?.containerBackgroundColor || '#1a1a1a'}
                onChange={(e) => updateStyleOptions({ containerBackgroundColor: e.target.value })}
                placeholder="#1a1a1a"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateStyleOptions({ containerBackgroundColor: undefined })}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Border Style */}
          <div>
            <Label className="mb-2 block">Border Style</Label>
            <div className="flex gap-2">
              {[
                { id: 'none', label: 'None' },
                { id: 'solid', label: 'Solid' },
                { id: 'dashed', label: 'Dashed' },
              ].map((style) => (
                <Button
                  key={style.id}
                  variant={(section.style_options?.borderStyle || 'solid') === style.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateStyleOptions({ borderStyle: style.id as any })}
                >
                  {style.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Border Color - only show when border is not 'none' */}
          {section.style_options?.borderStyle !== 'none' && (
            <div>
              <Label className="mb-2 block">Border Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={section.style_options?.borderColor || '#333333'}
                  onChange={(e) => updateStyleOptions({ borderColor: e.target.value })}
                  className="w-10 h-10 rounded border border-border cursor-pointer"
                />
                <Input
                  value={section.style_options?.borderColor || '#333333'}
                  onChange={(e) => updateStyleOptions({ borderColor: e.target.value })}
                  placeholder="#333333"
                  className="flex-1"
                />
              </div>
            </div>
          )}
        </>
      )}

      <div>
        <Label className="mb-2 block">Background Image</Label>
        {section.style_options?.backgroundImage ? (
          <div className="space-y-2">
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <img
                src={section.style_options.backgroundImage}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(`bg-upload-${section.id}`)?.click()}
              >
                Replace
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStyleOptions({ backgroundImage: undefined })}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => document.getElementById(`bg-upload-${section.id}`)?.click()}
          >
            <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to add background image</p>
          </div>
        )}
        <input
          id={`bg-upload-${section.id}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImageUpload(file, (url) => updateStyleOptions({ backgroundImage: url }));
            }
          }}
        />
      </div>

      {section.style_options?.backgroundImage && (
        <div>
          <Label className="mb-2 block">
            Overlay Opacity: {section.style_options?.backgroundOverlay || 0}%
          </Label>
          <Slider
            value={[section.style_options?.backgroundOverlay || 0]}
            onValueChange={([value]) => updateStyleOptions({ backgroundOverlay: value })}
            max={100}
            step={5}
          />
        </div>
      )}

      <div>
        <Label className="mb-2 block">Background Width</Label>
        <div className="flex gap-2">
          <Button
            variant={section.style_options?.backgroundWidth !== 'full' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateStyleOptions({ backgroundWidth: 'contained' })}
          >
            Contained
          </Button>
          <Button
            variant={section.style_options?.backgroundWidth === 'full' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateStyleOptions({ backgroundWidth: 'full' })}
          >
            Full Width
          </Button>
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Section Height</Label>
        <div className="flex gap-2">
          {['small', 'medium', 'large'].map((size) => (
            <Button
              key={size}
              variant={section.style_options?.sectionHeight === size ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateStyleOptions({ sectionHeight: size as any })}
              className="capitalize"
            >
              {size}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderColorSchemeTab = () => {
    const schemes = [
      { id: 'white', name: 'White', bg: 'bg-white', text: 'text-black' },
      { id: 'light', name: 'Light', bg: 'bg-zinc-100', text: 'text-zinc-900' },
      { id: 'dark', name: 'Dark', bg: 'bg-zinc-800', text: 'text-white' },
      { id: 'black', name: 'Black', bg: 'bg-black', text: 'text-white' },
      { id: 'highlight', name: 'Highlight', bg: 'bg-primary/20', text: 'text-foreground' },
    ];

    return (
      <div className="space-y-4">
        <Label className="block">Color Scheme</Label>
        <div className="grid grid-cols-5 gap-2">
          {schemes.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => updateStyleOptions({ colorScheme: scheme.id as any })}
              className={cn(
                'aspect-square rounded-lg flex items-center justify-center text-sm font-medium border-2 transition-all',
                scheme.bg,
                scheme.text,
                section.style_options?.colorScheme === scheme.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-muted-foreground/30'
              )}
            >
              Aa
            </button>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2 text-xs text-center text-muted-foreground">
          {schemes.map((scheme) => (
            <span key={scheme.id}>{scheme.name}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium capitalize">
            {template?.name || section.section_type.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleVisibility}
            title={section.is_visible ? 'Hide section' : 'Show section'}
          >
            {section.is_visible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="format"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Format
          </TabsTrigger>
          <TabsTrigger
            value="background"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Background
          </TabsTrigger>
          <TabsTrigger
            value="color"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Color
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="format" className="p-4 mt-0">
            {renderFormatTab()}
          </TabsContent>
          <TabsContent value="background" className="p-4 mt-0">
            {renderBackgroundTab()}
          </TabsContent>
          <TabsContent value="color" className="p-4 mt-0">
            {renderColorSchemeTab()}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Delete Button */}
      <div className="p-4 border-t">
        <Button
          variant="destructive"
          className="w-full"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Section
        </Button>
      </div>
    </div>
  );
}
