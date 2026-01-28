import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Plus, AlignLeft, AlignCenter, AlignRight, Trash2, Star, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ProfileSection,
  TextContent,
  ImageContent,
  ImageWithTextContent,
  GalleryContent,
  VideoContent,
  CollectionContent,
  AboutMeContent,
  HeadlineContent,
  SlidingBannerContent,
  DividerContent,
  TestimonialsContent,
  TestimonialItem,
  FAQContent,
  FAQItem,
  NewsletterContent,
  SlideshowContent,
  SlideItem,
  LogoListContent,
  LogoItem,
  ContactUsContent,
  FooterContent,
  FooterColumn,
  FooterLink,
  FooterSocialLink,
  FooterSocialPlatform,
  CardSlideshowContent,
  CardSlideItem,
  BannerSlideshowContent,
  BannerSlideItem,
  FeaturedProductContent,
  BasicListContent,
  ListItem,
  SECTION_TEMPLATES,
} from './types';
import { EditablePreview } from './previews/EditablePreview';
import { FontSelector } from './FontSelector';
import { ColorPicker } from './ColorPicker';

interface EditSectionDialogProps {
  section: ProfileSection | null;
  collections: { id: string; name: string }[];
  products?: { id: string; name: string }[];
  onUpdate: (section: ProfileSection) => void;
  onDelete: (sectionId: string) => void;
  onClose: () => void;
  onCreateCollection?: () => void;
}

export function EditSectionDialog({
  section,
  collections,
  products = [],
  onUpdate,
  onDelete,
  onClose,
  onCreateCollection,
}: EditSectionDialogProps) {
  const [uploading, setUploading] = useState(false);

  if (!section) return null;

  const template = SECTION_TEMPLATES.find((t) => t.type === section.section_type);

  const updateContent = <T extends object>(updates: Partial<T>) => {
    onUpdate({
      ...section,
      content: { ...section.content, ...updates },
    });
  };

  const handleImageUpload = async (file: File, onSuccess: (url: string) => void) => {
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
      const ext = file.name.split('.').pop();
      const fileName = `profile-sections/${section.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-media').getPublicUrl(fileName);

      onSuccess(data.publicUrl);
      toast.success('Image uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      onDelete(section.id);
    }
  };

  const renderEditor = () => {
    switch (section.section_type) {
      case 'text':
        return <TextEditor content={section.content as TextContent} onChange={updateContent} />;
      case 'image':
        return (
          <ImageEditor
            content={section.content as ImageContent}
            onChange={updateContent}
            onUpload={handleImageUpload}
            uploading={uploading}
          />
        );
      case 'image_with_text':
        return (
          <ImageWithTextEditor
            content={section.content as ImageWithTextContent}
            section={section}
            onChange={updateContent}
            onUpload={handleImageUpload}
            uploading={uploading}
            products={products}
          />
        );
      case 'gallery':
        return (
          <GalleryEditor
            content={section.content as GalleryContent}
            section={section}
            onChange={updateContent}
            onUpload={handleImageUpload}
            uploading={uploading}
          />
        );
      case 'video':
        return <VideoEditor content={section.content as VideoContent} onChange={updateContent} />;
      case 'collection':
        return (
          <CollectionEditor
            content={section.content as CollectionContent}
            onChange={updateContent}
            collections={collections}
            onCreateCollection={onCreateCollection}
          />
        );
      case 'about_me':
        return (
          <AboutMeEditor 
            content={section.content as AboutMeContent} 
            onChange={updateContent}
            onUpload={handleImageUpload}
            uploading={uploading}
          />
        );
      case 'headline':
        return (
          <HeadlineEditor content={section.content as HeadlineContent} onChange={updateContent} />
        );
      case 'sliding_banner':
        return (
          <SlidingBannerEditor content={section.content as SlidingBannerContent} onChange={updateContent} />
        );
      case 'divider':
        return (
          <DividerEditor content={section.content as DividerContent} onChange={updateContent} />
        );
      case 'testimonials':
        return (
          <TestimonialsEditor
            content={section.content as TestimonialsContent}
            onChange={updateContent}
            onUpload={handleImageUpload}
            uploading={uploading}
          />
        );
      case 'faq':
        return (
          <FAQEditor content={section.content as FAQContent} onChange={updateContent} />
        );
      case 'newsletter':
        return (
          <NewsletterEditor content={section.content as NewsletterContent} onChange={updateContent} />
        );
      case 'slideshow':
        return (
          <SlideshowEditor
            content={section.content as SlideshowContent}
            onChange={updateContent}
            onUpload={handleImageUpload}
            uploading={uploading}
          />
        );
      case 'logo_list':
        return (
          <LogoListEditor
            content={section.content as LogoListContent}
            onChange={updateContent}
            onUpload={handleImageUpload}
            uploading={uploading}
          />
        );
      case 'contact_us':
        return (
          <ContactUsEditor content={section.content as ContactUsContent} onChange={updateContent} />
        );
      case 'footer':
        return (
          <FooterEditor 
            content={section.content as FooterContent} 
            onChange={updateContent}
            preset={section.style_options?.preset as string | undefined}
          />
        );
      case 'card_slideshow':
        return (
          <CardSlideshowEditor
            content={section.content as CardSlideshowContent}
            onChange={updateContent}
            onUpload={handleImageUpload}
            uploading={uploading}
          />
        );
      case 'banner_slideshow':
        return (
          <BannerSlideshowEditor
            content={section.content as BannerSlideshowContent}
            onChange={updateContent}
            onUpload={handleImageUpload}
            uploading={uploading}
          />
        );
      case 'featured_product':
        return (
          <FeaturedProductEditor
            content={section.content as FeaturedProductContent}
            onChange={updateContent}
            products={products}
          />
        );
      case 'basic_list':
        return (
          <BasicListEditor
            content={section.content as BasicListContent}
            onChange={updateContent}
          />
        );
      default:
        return <p className="text-muted-foreground">Editor not available for this section type</p>;
    }
  };

  return (
    <Dialog open={!!section} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl h-[90svh] max-h-[90svh] flex flex-col min-h-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{template?.name || 'Edit Section'}</DialogTitle>
        </DialogHeader>

        {/* Interactive Editable Preview */}
        <div className="flex-shrink-0 bg-muted/30 border border-border rounded-lg p-4 mb-2">
          <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">
            Preview <span className="text-primary/70">· Click to edit</span>
          </div>
          <div className="bg-card rounded-lg overflow-hidden p-4 border border-border/50">
            <EditablePreview section={section} onUpdate={updateContent} />
          </div>
        </div>

        {/* Editing Controls */}
        <div className="flex-shrink-0 text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Settings</div>
        <ScrollArea className="flex-1 -mx-6 px-6 min-h-0">
          <div className="space-y-4 py-2">{renderEditor()}</div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t border-border flex-shrink-0">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Star Rating Component
function StarRating({ 
  rating, 
  onChange 
}: { 
  rating: number; 
  onChange?: (r: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 cursor-pointer transition-colors ${
            star <= rating 
              ? "fill-yellow-400 text-yellow-400" 
              : "text-muted-foreground hover:text-yellow-300"
          }`}
          onClick={() => onChange?.(star)}
        />
      ))}
    </div>
  );
}

// Individual section editors (only non-inline-editable settings)

function TextEditor({
  content,
  onChange,
}: {
  content: TextContent;
  onChange: (updates: Partial<TextContent>) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Font Style */}
      <FontSelector
        font={content.font}
        customFont={content.customFont}
        onChange={(updates) => onChange(updates)}
      />
      
      {/* Font Size */}
      <div>
        <Label>Font Size</Label>
        <Select
          value={content.fontSize || 'base'}
          onValueChange={(value) => onChange({ fontSize: value as TextContent['fontSize'] })}
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
          value={content.fontWeight || 'normal'}
          onValueChange={(value) => onChange({ fontWeight: value as TextContent['fontWeight'] })}
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

      {/* Letter Spacing */}
      <div>
        <Label>Letter Spacing</Label>
        <Select
          value={content.letterSpacing || 'normal'}
          onValueChange={(value) => onChange({ letterSpacing: value as TextContent['letterSpacing'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tighter">Tighter</SelectItem>
            <SelectItem value="tight">Tight</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="wide">Wide</SelectItem>
            <SelectItem value="wider">Wider</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Line Height */}
      <div>
        <Label>Line Height</Label>
        <Select
          value={content.lineHeight || 'normal'}
          onValueChange={(value) => onChange({ lineHeight: value as TextContent['lineHeight'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tight">Tight</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="relaxed">Relaxed</SelectItem>
            <SelectItem value="loose">Loose</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Text Color */}
      <ColorPicker
        label="Text Color"
        value={content.textColor || '#000000'}
        onChange={(color) => onChange({ textColor: color })}
      />

      {/* Alignment */}
      <div>
        <Label>Alignment</Label>
        <div className="flex gap-2 mt-2">
          {[
            { value: 'left', icon: AlignLeft },
            { value: 'center', icon: AlignCenter },
            { value: 'right', icon: AlignRight },
          ].map(({ value, icon: Icon }) => (
            <Button
              key={value}
              variant={content.alignment === value ? 'default' : 'outline'}
              size="icon"
              onClick={() => onChange({ alignment: value as 'left' | 'center' | 'right' })}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImageEditor({
  content,
  onChange,
  onUpload,
  uploading,
}: {
  content: ImageContent;
  onChange: (updates: Partial<ImageContent>) => void;
  onUpload: (file: File, onSuccess: (url: string) => void) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div>
        <Label>Image</Label>
        <div className="mt-2">
          {content.imageUrl ? (
            <div className="relative">
              <img
                src={content.imageUrl}
                alt={content.altText || ''}
                className="w-full max-h-32 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => onChange({ imageUrl: '' })}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploading ? 'Uploading...' : 'Click to upload'}
              </span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onUpload(file, (url) => onChange({ imageUrl: url }));
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ImageWithTextEditor({
  content,
  section,
  onChange,
  onUpload,
  uploading,
  products = [],
}: {
  content: ImageWithTextContent;
  section: ProfileSection;
  onChange: (updates: Partial<ImageWithTextContent>) => void;
  onUpload: (file: File, onSuccess: (url: string) => void) => void;
  uploading: boolean;
  products?: { id: string; name: string }[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Determine if image position is relevant (only for side-by-side layout)
  const preset = section.style_options?.preset;
  const layout = content.layout || (preset === 'style1' ? 'hero' : preset === 'style4' ? 'overlay' : 'side-by-side');
  const showImagePosition = layout === 'side-by-side';

  return (
    <div className="space-y-4">
      <div>
        <Label>Background Image</Label>
        <div className="mt-2">
          {content.imageUrl ? (
            <div className="relative">
              <img src={content.imageUrl} alt="" className="w-full max-h-24 object-cover rounded-lg" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => onChange({ imageUrl: '' })}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-full h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2 hover:border-primary/50"
            >
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploading ? 'Uploading...' : 'Upload Image'}
              </span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file, (url) => onChange({ imageUrl: url }));
            }}
          />
        </div>
      </div>
      
      {/* Only show image position for side-by-side layout */}
      {showImagePosition && (
        <div>
          <Label>Image Position</Label>
          <Select
            value={content.imagePosition}
            onValueChange={(value) => onChange({ imagePosition: value as 'left' | 'right' })}
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
      )}
      
      {/* Button Link Settings */}
      <div className="border-t border-border pt-4 mt-4">
        <Label className="text-sm font-medium">Button Link</Label>
        <div className="space-y-3 mt-3">
          <div>
            <Label className="text-xs text-muted-foreground">Link Type</Label>
            <Select
              value={content.buttonLinkType || 'external'}
              onValueChange={(value) => onChange({ buttonLinkType: value as 'external' | 'product' | 'profile' })}
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
          {content.buttonLinkType === 'product' ? (
            <div>
              <Label className="text-xs text-muted-foreground">Select Product</Label>
              <Select
                value={content.buttonProductId || ''}
                onValueChange={(value) => onChange({ buttonProductId: value })}
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
          ) : content.buttonLinkType !== 'profile' && (
            <div>
              <Label className="text-xs text-muted-foreground">Button URL</Label>
              <Input
                value={content.buttonUrl || ''}
                onChange={(e) => onChange({ buttonUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GalleryEditor({
  content,
  section,
  onChange,
  onUpload,
  uploading,
}: {
  content: GalleryContent;
  section: ProfileSection;
  onChange: (updates: Partial<GalleryContent>) => void;
  onUpload: (file: File, onSuccess: (url: string) => void) => void;
  uploading: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Calculate expected slots based on preset
  const preset = section.style_options?.preset;
  const columns = content.columns || 3;
  const rows = content.rows || 2;
  const layout = content.layout || 'grid';
  const isMasonry = preset === 'style3' || layout === 'masonry';
  
  // Calculate total slots needed
  const getSlotCount = () => {
    if (preset === 'style1') return 6; // 3x2
    if (preset === 'style2') return 6; // 2x3
    if (isMasonry) return 4; // masonry
    return columns * rows;
  };
  
  const slotCount = getSlotCount();
  const slots = Array.from({ length: slotCount }, (_, i) => content.images[i] || null);

  const sortableIds = content.images
    .slice(0, slotCount)
    .map((_, i) => String(i));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = Number(active.id);
    const newIndex = Number(over.id);
    if (Number.isNaN(oldIndex) || Number.isNaN(newIndex)) return;
    const limited = content.images.slice(0, slotCount);
    const reordered = arrayMove(limited, oldIndex, newIndex);
    // Preserve any images beyond slotCount (shouldn't happen, but keep safe)
    const remainder = content.images.slice(slotCount);
    onChange({ images: [...reordered, ...remainder] });
  };

  function SortableImageTile({
    id,
    idx,
    img,
  }: {
    id: string;
    idx: number;
    img: { url: string; altText?: string } | null;
  }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id,
      disabled: !img?.url,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.6 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} className="relative group aspect-square">
        {img ? (
          <>
            {/* Drag handle */}
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="absolute top-1 left-1 z-10 p-1 rounded bg-background/60 border border-border opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-3 h-3 text-foreground" />
            </button>

            <img
              src={img.url}
              alt={img.altText || ''}
              className="w-full h-full object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100"
              onClick={() => onChange({ images: content.images.filter((_, i) => i !== idx) })}
            >
              <X className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => document.getElementById(`gallery-upload-${section.id}`)?.click()}
            disabled={uploading}
            className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 bg-muted/30"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{idx + 1}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Gallery Images ({content.images.length}/{slotCount})</Label>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <div
              className="grid gap-2 mt-2"
              style={{
                gridTemplateColumns: `repeat(${Math.min(isMasonry ? 2 : columns, 3)}, 1fr)`,
              }}
            >
              {slots.map((img, idx) => (
                <SortableImageTile key={idx} id={String(idx)} idx={idx} img={img} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <input
          id={`gallery-upload-${section.id}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && content.images.length < slotCount) {
              onUpload(file, (url) => onChange({ images: [...content.images, { url, altText: '' }] }));
            }
          }}
        />
      </div>
    </div>
  );
}

function VideoEditor({
  content,
  onChange,
}: {
  content: VideoContent;
  onChange: (updates: Partial<VideoContent>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>YouTube URL</Label>
        <Input
          value={content.videoUrl || ''}
          onChange={(e) => onChange({ videoUrl: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>
    </div>
  );
}

function CollectionEditor({
  content,
  onChange,
  collections,
  onCreateCollection,
}: {
  content: CollectionContent;
  onChange: (updates: Partial<CollectionContent>) => void;
  collections: { id: string; name: string }[];
  onCreateCollection?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Select Collection</Label>
        {collections.length > 0 ? (
          <Select value={content.collectionId} onValueChange={(value) => onChange({ collectionId: value })}>
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
        ) : (
          <div className="mt-2 p-4 border-2 border-dashed border-border rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-3">
              No collections yet. Create one to display your products.
            </p>
            {onCreateCollection && (
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                onClick={onCreateCollection}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Collection
              </Button>
            )}
          </div>
        )}
      </div>
      {collections.length > 0 && (
        <>
          <div>
            <Label>Display Style</Label>
            <Select
              value={content.displayStyle || 'grid'}
              onValueChange={(value) => onChange({ displayStyle: value as 'grid' | 'slider' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Product Grid</SelectItem>
                <SelectItem value="slider">Product Slider</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {onCreateCollection && (
            <Button 
              type="button"
              variant="ghost" 
              size="sm"
              onClick={onCreateCollection}
              className="w-full gap-2 text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-4 h-4" />
              Create Another Collection
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function FeaturedProductEditor({
  content,
  onChange,
  products,
}: {
  content: FeaturedProductContent;
  onChange: (updates: Partial<FeaturedProductContent>) => void;
  products: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Select Product</Label>
        {products.length > 0 ? (
          <Select
            value={content.productId || ''}
            onValueChange={(value) => onChange({ productId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a product to feature" />
            </SelectTrigger>
            <SelectContent>
              {products.map((prod) => (
                <SelectItem key={prod.id} value={prod.id}>
                  {prod.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="mt-2 p-4 border-2 border-dashed border-border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              No products available. Create products first to feature them here.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Label>Show Description</Label>
        <Switch
          checked={content.showDescription ?? true}
          onCheckedChange={(checked) => onChange({ showDescription: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Show Price</Label>
        <Switch
          checked={content.showPrice ?? true}
          onCheckedChange={(checked) => onChange({ showPrice: checked })}
        />
      </div>

      <div>
        <Label>Button Text</Label>
        <Input
          value={content.buttonText || ''}
          onChange={(e) => onChange({ buttonText: e.target.value })}
          placeholder="View Product"
        />
      </div>
    </div>
  );
}

function BasicListEditor({
  content,
  onChange,
}: {
  content: BasicListContent;
  onChange: (updates: Partial<BasicListContent>) => void;
}) {
  const items = content.items || [];

  const addItem = () => {
    const newItem: ListItem = {
      id: Date.now().toString(),
      text: '',
      icon: 'check',
    };
    onChange({ items: [...items, newItem] });
  };

  const updateItem = (index: number, updates: Partial<ListItem>) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...updates };
    onChange({ items: updated });
  };

  const removeItem = (index: number) => {
    onChange({ items: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Title (optional)</Label>
        <Input
          value={content.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="List title"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>List Items</Label>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={item.id} className="flex gap-2 items-start">
            <Input
              value={item.text}
              onChange={(e) => updateItem(index, { text: e.target.value })}
              placeholder={`Item ${index + 1}`}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
              className="h-10 w-10 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No items yet. Click "Add Item" to start.
          </p>
        )}
      </div>

      <div>
        <Label>Style</Label>
        <Select
          value={content.style || 'bullet'}
          onValueChange={(value) => onChange({ style: value as BasicListContent['style'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bullet">Bullet Points</SelectItem>
            <SelectItem value="numbered">Numbered</SelectItem>
            <SelectItem value="icon">Icons</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function AboutMeEditor({
  content,
  onChange,
  onUpload,
  uploading,
}: {
  content: AboutMeContent;
  onChange: (updates: Partial<AboutMeContent>) => void;
  onUpload: (file: File, onSuccess: (url: string) => void) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="space-y-4">
      {/* Image Upload - Issue #3 fix */}
      <div>
        <Label>Profile Image</Label>
        <div className="mt-2">
          {content.imageUrl ? (
            <div className="relative w-20 h-20">
              <img
                src={content.imageUrl}
                alt="About me"
                className="w-20 h-20 rounded-full object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-1 -right-1 h-6 w-6"
                onClick={() => onChange({ imageUrl: '' })}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors"
            >
              {uploading ? (
                <span className="text-xs text-muted-foreground">...</span>
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onUpload(file, (url) => onChange({ imageUrl: url }));
              }
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Upload a photo to display with your bio
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Label>Show Avatar</Label>
        <Switch
          checked={content.showAvatar}
          onCheckedChange={(checked) => onChange({ showAvatar: checked })}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Click on the title or description in the preview above to edit
      </p>
    </div>
  );
}

function HeadlineEditor({
  content,
  onChange,
}: {
  content: HeadlineContent;
  onChange: (updates: Partial<HeadlineContent>) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Font Style */}
      <FontSelector
        font={content.font}
        customFont={content.customFont}
        onChange={(updates) => onChange(updates)}
      />
      
      {/* Font Weight */}
      <div>
        <Label>Font Weight</Label>
        <Select
          value={content.fontWeight || 'bold'}
          onValueChange={(value) => onChange({ fontWeight: value as HeadlineContent['fontWeight'] })}
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

      {/* Letter Spacing */}
      <div>
        <Label>Letter Spacing</Label>
        <Select
          value={content.letterSpacing || 'normal'}
          onValueChange={(value) => onChange({ letterSpacing: value as HeadlineContent['letterSpacing'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tighter">Tighter</SelectItem>
            <SelectItem value="tight">Tight</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="wide">Wide</SelectItem>
            <SelectItem value="wider">Wider</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Line Height */}
      <div>
        <Label>Line Height</Label>
        <Select
          value={content.lineHeight || 'normal'}
          onValueChange={(value) => onChange({ lineHeight: value as HeadlineContent['lineHeight'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tight">Tight</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="relaxed">Relaxed</SelectItem>
            <SelectItem value="loose">Loose</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Text Shadow */}
      <div>
        <Label>Text Shadow</Label>
        <Select
          value={content.textShadow || 'none'}
          onValueChange={(value) => onChange({ textShadow: value as HeadlineContent['textShadow'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="soft">Soft</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="strong">Strong</SelectItem>
            <SelectItem value="glow">Glow</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Text Color */}
      <ColorPicker
        label="Text Color"
        value={content.textColor || '#000000'}
        onChange={(color) => onChange({ textColor: color })}
      />

      {/* Size */}
      <div>
        <Label>Size</Label>
        <Select
          value={content.size || 'large'}
          onValueChange={(value) => onChange({ size: value as 'small' | 'medium' | 'large' })}
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
    </div>
  );
}

function SlidingBannerEditor({
  content,
  onChange,
}: {
  content: SlidingBannerContent;
  onChange: (updates: Partial<SlidingBannerContent>) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Banner Text */}
      <div>
        <Label>Banner Text</Label>
        <Input
          value={content.text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Enter scrolling text..."
        />
      </div>

      {/* Font Style */}
      <FontSelector
        font={content.font}
        customFont={content.customFont}
        onChange={(updates) => onChange(updates)}
      />

      {/* Font Size */}
      <div>
        <Label>Font Size</Label>
        <Select
          value={content.fontSize || 'base'}
          onValueChange={(value) => onChange({ fontSize: value as SlidingBannerContent['fontSize'] })}
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
          value={content.fontWeight || 'medium'}
          onValueChange={(value) => onChange({ fontWeight: value as SlidingBannerContent['fontWeight'] })}
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

      {/* Letter Spacing */}
      <div>
        <Label>Letter Spacing</Label>
        <Select
          value={content.letterSpacing || 'normal'}
          onValueChange={(value) => onChange({ letterSpacing: value as SlidingBannerContent['letterSpacing'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tighter">Tighter</SelectItem>
            <SelectItem value="tight">Tight</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="wide">Wide</SelectItem>
            <SelectItem value="wider">Wider</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Text Color */}
      <ColorPicker
        label="Text Color"
        value={content.textColor || '#000000'}
        onChange={(color) => onChange({ textColor: color })}
      />

      {/* Background Color */}
      <ColorPicker
        label="Background Color"
        value={content.backgroundColor || '#f3f4f6'}
        onChange={(color) => onChange({ backgroundColor: color })}
      />

      {/* Scroll Speed */}
      <div>
        <Label>Scroll Speed</Label>
        <Select
          value={content.speed || 'medium'}
          onValueChange={(value) => onChange({ speed: value as 'slow' | 'medium' | 'fast' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="slow">Slow</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="fast">Fast</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function DividerEditor({
  content,
  onChange,
}: {
  content: DividerContent;
  onChange: (updates: Partial<DividerContent>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Style</Label>
        <Select
          value={content.style || 'line'}
          onValueChange={(value) => onChange({ style: value as DividerContent['style'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="line">Line</SelectItem>
            <SelectItem value="space">Space</SelectItem>
            <SelectItem value="dots">Dots</SelectItem>
            <SelectItem value="thick">Thick Line</SelectItem>
            <SelectItem value="gradient">Gradient</SelectItem>
            <SelectItem value="wave">Wave</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function TestimonialsEditor({
  content,
  onChange,
  onUpload,
  uploading,
}: {
  content: TestimonialsContent;
  onChange: (updates: Partial<TestimonialsContent>) => void;
  onUpload: (file: File, onSuccess: (url: string) => void) => void;
  uploading: boolean;
}) {
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const addTestimonial = () => {
    const newTestimonial: TestimonialItem = {
      id: crypto.randomUUID(),
      name: 'Customer Name',
      role: 'Role/Company',
      quote: 'Their testimonial goes here...',
      rating: 5,
    };
    onChange({ testimonials: [...content.testimonials, newTestimonial] });
  };

  const updateTestimonial = (id: string, updates: Partial<TestimonialItem>) => {
    onChange({
      testimonials: content.testimonials.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    });
  };

  const removeTestimonial = (id: string) => {
    onChange({ testimonials: content.testimonials.filter((t) => t.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Layout</Label>
        <Select
          value={content.layout || 'grid'}
          onValueChange={(value) => onChange({ layout: value as TestimonialsContent['layout'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Cards Grid</SelectItem>
            <SelectItem value="slider">Slideshow</SelectItem>
            <SelectItem value="stacked">Stacked</SelectItem>
            <SelectItem value="grid-6">6x1 Grid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-3">
        <Label>Testimonials</Label>
        {content.testimonials.map((testimonial) => (
          <div key={testimonial.id} className="border border-border rounded-lg p-3 space-y-3">
            <div className="flex items-start gap-3">
              {/* Avatar upload */}
              <div className="flex-shrink-0">
                {testimonial.avatar ? (
                  <div className="relative">
                    <img
                      src={testimonial.avatar}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 h-4 w-4"
                      onClick={() => updateTestimonial(testimonial.id, { avatar: '' })}
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => inputRefs.current[testimonial.id]?.click()}
                    className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                <input
                  ref={(el) => (inputRefs.current[testimonial.id] = el)}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onUpload(file, (url) => updateTestimonial(testimonial.id, { avatar: url }));
                    }
                  }}
                />
              </div>
              
              <div className="flex-1 space-y-2">
                <Input
                  value={testimonial.name}
                  onChange={(e) => updateTestimonial(testimonial.id, { name: e.target.value })}
                  placeholder="Name"
                  className="h-8"
                />
                <Input
                  value={testimonial.role || ''}
                  onChange={(e) => updateTestimonial(testimonial.id, { role: e.target.value })}
                  placeholder="Role / Company"
                  className="h-8"
                />
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => removeTestimonial(testimonial.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground">Rating</Label>
              <StarRating
                rating={testimonial.rating || 5}
                onChange={(rating) => updateTestimonial(testimonial.id, { rating: rating as 1 | 2 | 3 | 4 | 5 })}
              />
            </div>
            
            <Textarea
              value={testimonial.quote}
              onChange={(e) => updateTestimonial(testimonial.id, { quote: e.target.value })}
              placeholder="Their testimonial..."
              rows={2}
            />
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTestimonial}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Testimonial
        </Button>
      </div>
    </div>
  );
}

function FAQEditor({
  content,
  onChange,
}: {
  content: FAQContent;
  onChange: (updates: Partial<FAQContent>) => void;
}) {
  const addFAQItem = () => {
    if (content.items.length >= 6) {
      toast.error('Maximum 6 FAQ items allowed');
      return;
    }
    const newItem: FAQItem = {
      id: crypto.randomUUID(),
      question: 'New Question?',
      answer: 'Answer goes here...',
    };
    onChange({ items: [...content.items, newItem] });
  };

  const updateFAQItem = (id: string, updates: Partial<FAQItem>) => {
    onChange({
      items: content.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    });
  };

  const removeFAQItem = (id: string) => {
    onChange({ items: content.items.filter((item) => item.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Layout</Label>
        <Select
          value={content.layout || 'accordion'}
          onValueChange={(value) => onChange({ layout: value as 'accordion' | 'grid' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="accordion">Accordion</SelectItem>
            <SelectItem value="grid">3x2 Grid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>FAQ Items ({content.items.length}/6)</Label>
        </div>
        
        {content.items.map((item, index) => (
          <div key={item.id} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
              <Input
                value={item.question}
                onChange={(e) => updateFAQItem(item.id, { question: e.target.value })}
                placeholder="Question"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => removeFAQItem(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <Textarea
              value={item.answer}
              onChange={(e) => updateFAQItem(item.id, { answer: e.target.value })}
              placeholder="Answer"
              rows={2}
              className="ml-7"
            />
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addFAQItem}
          disabled={content.items.length >= 6}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Add FAQ
        </Button>
      </div>
    </div>
  );
}

function NewsletterEditor({
  content,
  onChange,
}: {
  content: NewsletterContent;
  onChange: (updates: Partial<NewsletterContent>) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Click on the title, subtitle, and button in the preview above to edit
      </p>
      <div>
        <Label>Email Placeholder</Label>
        <Input
          value={content.placeholder || ''}
          onChange={(e) => onChange({ placeholder: e.target.value })}
          placeholder="Enter your email"
        />
      </div>
      <div>
        <Label>Success Message</Label>
        <Input
          value={content.successMessage || ''}
          onChange={(e) => onChange({ successMessage: e.target.value })}
          placeholder="Thanks for subscribing!"
        />
      </div>
    </div>
  );
}

function SlideshowEditor({
  content,
  onChange,
  onUpload,
  uploading,
}: {
  content: SlideshowContent;
  onChange: (updates: Partial<SlideshowContent>) => void;
  onUpload: (file: File, onSuccess: (url: string) => void) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_SLIDES = 3;

  const addSlide = () => {
    if (content.slides.length >= MAX_SLIDES) {
      toast.error(`Maximum ${MAX_SLIDES} slides allowed`);
      return;
    }
    inputRef.current?.click();
  };

  const removeSlide = (id: string) => {
    onChange({ slides: content.slides.filter((s) => s.id !== id) });
  };

  const updateSlide = (id: string, updates: Partial<SlideItem>) => {
    onChange({
      slides: content.slides.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Slides ({content.slides.length}/{MAX_SLIDES})</Label>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Auto-play</Label>
          <Switch
            checked={content.autoPlay}
            onCheckedChange={(checked) => onChange({ autoPlay: checked })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {content.slides.map((slide) => (
          <div key={slide.id} className="relative aspect-video group">
            <img
              src={slide.imageUrl}
              alt=""
              className="w-full h-full object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100"
              onClick={() => removeSlide(slide.id)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
        {content.slides.length < MAX_SLIDES && (
          <button
            onClick={addSlide}
            disabled={uploading}
            className="aspect-video border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {uploading ? 'Uploading...' : 'Add Slide'}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onUpload(file, (url) => {
              const newSlide: SlideItem = {
                id: crypto.randomUUID(),
                imageUrl: url,
              };
              onChange({ slides: [...content.slides, newSlide] });
            });
          }
        }}
      />

      {content.autoPlay && (
        <div>
          <Label>Interval (seconds)</Label>
          <Select
            value={String(content.interval)}
            onValueChange={(value) => onChange({ interval: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 seconds</SelectItem>
              <SelectItem value="5">5 seconds</SelectItem>
              <SelectItem value="7">7 seconds</SelectItem>
              <SelectItem value="10">10 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function LogoListEditor({
  content,
  onChange,
  onUpload,
  uploading,
}: {
  content: LogoListContent;
  onChange: (updates: Partial<LogoListContent>) => void;
  onUpload: (file: File, onSuccess: (url: string) => void) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addLogo = () => {
    inputRef.current?.click();
  };

  const removeLogo = (id: string) => {
    onChange({ logos: content.logos.filter((l) => l.id !== id) });
  };

  const updateLogo = (id: string, updates: Partial<LogoItem>) => {
    onChange({
      logos: content.logos.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Grayscale Effect</Label>
        <Switch
          checked={content.grayscale}
          onCheckedChange={(checked) => onChange({ grayscale: checked })}
        />
      </div>

      <div className="space-y-3">
        <Label>Logos</Label>
        {content.logos.map((logo) => (
          <div key={logo.id} className="flex items-center gap-3 border border-border rounded-lg p-2">
            <img
              src={logo.imageUrl}
              alt={logo.altText || ''}
              className={`h-10 w-16 object-contain ${content.grayscale ? 'grayscale' : ''}`}
            />
            <div className="flex-1 space-y-1">
              <Input
                value={logo.altText || ''}
                onChange={(e) => updateLogo(logo.id, { altText: e.target.value })}
                placeholder="Alt text"
                className="h-7 text-xs"
              />
              <Input
                value={logo.linkUrl || ''}
                onChange={(e) => updateLogo(logo.id, { linkUrl: e.target.value })}
                placeholder="Link URL (optional)"
                className="h-7 text-xs"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => removeLogo(logo.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLogo}
          disabled={uploading}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Add Logo'}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onUpload(file, (url) => {
              const newLogo: LogoItem = {
                id: crypto.randomUUID(),
                imageUrl: url,
              };
              onChange({ logos: [...content.logos, newLogo] });
            });
          }
        }}
      />
    </div>
  );
}

function ContactUsEditor({
  content,
  onChange,
}: {
  content: ContactUsContent;
  onChange: (updates: Partial<ContactUsContent>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Style</Label>
        <Select
          value={content.style || 'centered'}
          onValueChange={(value) => onChange({ style: value as ContactUsContent['style'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="centered">Centered</SelectItem>
            <SelectItem value="split">Split Layout</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="card">Card</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Email Address</Label>
        <Input
          value={content.email || ''}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="your@email.com"
          type="email"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Show Contact Form</Label>
        <Switch
          checked={content.showForm}
          onCheckedChange={(checked) => onChange({ showForm: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Show Social Links</Label>
        <Switch
          checked={content.socialLinks}
          onCheckedChange={(checked) => onChange({ socialLinks: checked })}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Click on the title and subtitle in the preview above to edit
      </p>
    </div>
  );
}

function FooterEditor({
  content,
  onChange,
  preset,
}: {
  content: FooterContent;
  onChange: (updates: Partial<FooterContent>) => void;
  preset?: string;
}) {
  // Determine layout from preset: style1 = simple, style3 = minimal, style2 or default = multi-column
  const layout = preset === 'style1' ? 'simple' : preset === 'style3' ? 'minimal' : 'multi-column';

  const addColumn = () => {
    if (content.columns.length >= 7) {
      toast.error('Maximum 7 columns allowed');
      return;
    }
    const newColumn: FooterColumn = {
      id: crypto.randomUUID(),
      title: 'New Column',
      links: [],
    };
    onChange({ columns: [...content.columns, newColumn] });
  };

  const updateColumn = (id: string, updates: Partial<FooterColumn>) => {
    onChange({
      columns: content.columns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  const removeColumn = (id: string) => {
    onChange({ columns: content.columns.filter((c) => c.id !== id) });
  };

  const addLink = (columnId: string) => {
    const column = content.columns.find((c) => c.id === columnId);
    if (!column) return;
    const newLink: FooterLink = {
      id: crypto.randomUUID(),
      label: 'New Link',
      url: '/',
    };
    updateColumn(columnId, { links: [...column.links, newLink] });
  };

  const updateLink = (columnId: string, linkId: string, updates: Partial<FooterLink>) => {
    const column = content.columns.find((c) => c.id === columnId);
    if (!column) return;
    updateColumn(columnId, {
      links: column.links.map((l) => (l.id === linkId ? { ...l, ...updates } : l)),
    });
  };

  const removeLink = (columnId: string, linkId: string) => {
    const column = content.columns.find((c) => c.id === columnId);
    if (!column) return;
    updateColumn(columnId, { links: column.links.filter((l) => l.id !== linkId) });
  };

  // Social platform options
  const socialPlatforms: { value: FooterSocialPlatform; label: string }[] = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'twitter', label: 'X (Twitter)' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'discord', label: 'Discord' },
    { value: 'website', label: 'Website' },
  ];

  const addSocialLink = (platform: FooterSocialPlatform) => {
    const existingLink = content.socialLinks?.find(l => l.platform === platform);
    if (existingLink) {
      toast.error(`${platform} link already exists`);
      return;
    }
    const newLink: FooterSocialLink = {
      id: crypto.randomUUID(),
      platform,
      url: '',
    };
    onChange({ socialLinks: [...(content.socialLinks || []), newLink] });
  };

  const updateSocialLink = (id: string, url: string) => {
    onChange({
      socialLinks: (content.socialLinks || []).map(l => l.id === id ? { ...l, url } : l),
    });
  };

  const removeSocialLink = (id: string) => {
    onChange({ socialLinks: (content.socialLinks || []).filter(l => l.id !== id) });
  };

  // Get available platforms (not yet added)
  const availablePlatforms = socialPlatforms.filter(
    p => !(content.socialLinks || []).some(l => l.platform === p.value)
  );

  // Minimal footer - just copyright text
  if (layout === 'minimal') {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          This is a minimal footer with just copyright text.
        </p>
        <div>
          <Label>Copyright Text</Label>
          <Input
            value={content.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="© 2026 Your Store. All rights reserved."
          />
        </div>
      </div>
    );
  }

  // Simple footer - copyright + social links editor
  if (layout === 'simple') {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Simple footer with centered social icons and copyright text.
        </p>
        <div>
          <Label>Copyright Text</Label>
          <Input
            value={content.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="© 2026 Your Store. All rights reserved."
          />
        </div>

        <div className="space-y-3">
          <Label>Social Links</Label>
          <p className="text-xs text-muted-foreground">
            Add your social links - icons will appear for each platform you add.
          </p>
          
          {(content.socialLinks || []).map((link) => (
            <div key={link.id} className="flex items-center gap-2">
              <div className="w-24 text-sm font-medium capitalize">{link.platform}</div>
              <Input
                value={link.url}
                onChange={(e) => updateSocialLink(link.id, e.target.value)}
                placeholder={`https://${link.platform}.com/...`}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeSocialLink(link.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {availablePlatforms.length > 0 && (
            <Select onValueChange={(value) => addSocialLink(value as FooterSocialPlatform)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="+ Add Social Link" />
              </SelectTrigger>
              <SelectContent>
                {availablePlatforms.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    );
  }

  // Multi-column footer - full editor
  return (
    <div className="space-y-4">
      <div>
        <Label>Copyright Text</Label>
        <Input
          value={content.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="© 2026 Your Store. All rights reserved."
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Show Social Links</Label>
        <Switch
          checked={content.showSocialLinks}
          onCheckedChange={(checked) => onChange({ showSocialLinks: checked })}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Footer Columns ({content.columns.length}/7)</Label>
        </div>

        {content.columns.map((column) => (
          <div key={column.id} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={column.title}
                onChange={(e) => updateColumn(column.id, { title: e.target.value })}
                placeholder="Column Title"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => removeColumn(column.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-1 ml-2">
              {column.links.map((link) => (
                <div key={link.id} className="flex items-center gap-1">
                  <Input
                    value={link.label}
                    onChange={(e) => updateLink(column.id, link.id, { label: e.target.value })}
                    placeholder="Label"
                    className="h-7 text-xs flex-1"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => updateLink(column.id, link.id, { url: e.target.value })}
                    placeholder="URL"
                    className="h-7 text-xs flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeLink(column.id, link.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addLink(column.id)}
                className="w-full h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Link
              </Button>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addColumn}
          disabled={content.columns.length >= 7}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Column
        </Button>
      </div>
    </div>
  );
}

function CardSlideshowEditor({
  content,
  onChange,
  onUpload,
  uploading,
}: {
  content: CardSlideshowContent;
  onChange: (updates: Partial<CardSlideshowContent>) => void;
  onUpload: (file: File, onSuccess: (url: string) => void) => void;
  uploading: boolean;
}) {
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const MAX_CARDS = 5;

  const addCard = () => {
    if (content.cards.length >= MAX_CARDS) {
      toast.error(`Maximum ${MAX_CARDS} cards allowed`);
      return;
    }
    const newCard: CardSlideItem = {
      id: crypto.randomUUID(),
      title: 'Card Title',
      description: 'Card description...',
    };
    onChange({ cards: [...content.cards, newCard] });
  };

  const removeCard = (id: string) => {
    onChange({ cards: content.cards.filter((c) => c.id !== id) });
  };

  const updateCard = (id: string, updates: Partial<CardSlideItem>) => {
    onChange({
      cards: content.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Auto-play</Label>
        <Switch
          checked={content.autoPlay}
          onCheckedChange={(checked) => onChange({ autoPlay: checked })}
        />
      </div>

      <div className="space-y-3">
        <Label>Cards ({content.cards.length}/{MAX_CARDS})</Label>
        {content.cards.map((card) => (
          <div key={card.id} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0">
                {card.imageUrl ? (
                  <div className="relative">
                    <img src={card.imageUrl} alt="" className="w-16 h-16 object-cover rounded" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 h-4 w-4"
                      onClick={() => updateCard(card.id, { imageUrl: '' })}
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => inputRefs.current[card.id]?.click()}
                    className="w-16 h-16 bg-muted rounded flex items-center justify-center"
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                <input
                  ref={(el) => (inputRefs.current[card.id] = el)}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onUpload(file, (url) => updateCard(card.id, { imageUrl: url }));
                    }
                  }}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  value={card.title}
                  onChange={(e) => updateCard(card.id, { title: e.target.value })}
                  placeholder="Title"
                  className="h-8"
                />
                <Input
                  value={card.description || ''}
                  onChange={(e) => updateCard(card.id, { description: e.target.value })}
                  placeholder="Description"
                  className="h-8"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeCard(card.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCard}
          disabled={content.cards.length >= MAX_CARDS}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Card
        </Button>
      </div>
    </div>
  );
}

function BannerSlideshowEditor({
  content,
  onChange,
  onUpload,
  uploading,
}: {
  content: BannerSlideshowContent;
  onChange: (updates: Partial<BannerSlideshowContent>) => void;
  onUpload: (file: File, onSuccess: (url: string) => void) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_SLIDES = 5;

  const addSlide = () => {
    if (content.slides.length >= MAX_SLIDES) {
      toast.error(`Maximum ${MAX_SLIDES} slides allowed`);
      return;
    }
    inputRef.current?.click();
  };

  const removeSlide = (id: string) => {
    onChange({ slides: content.slides.filter((s) => s.id !== id) });
  };

  const updateSlide = (id: string, updates: Partial<BannerSlideItem>) => {
    onChange({
      slides: content.slides.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Auto-play</Label>
        <Switch
          checked={content.autoPlay}
          onCheckedChange={(checked) => onChange({ autoPlay: checked })}
        />
      </div>

      <div className="space-y-3">
        <Label>Banner Slides ({content.slides.length}/{MAX_SLIDES})</Label>
        {content.slides.map((slide) => (
          <div key={slide.id} className="border border-border rounded-lg p-3 space-y-2">
            <div className="relative aspect-[3/1] bg-muted rounded overflow-hidden">
              <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => removeSlide(slide.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <Input
              value={slide.title || ''}
              onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
              placeholder="Title (optional)"
              className="h-8"
            />
            <Input
              value={slide.buttonText || ''}
              onChange={(e) => updateSlide(slide.id, { buttonText: e.target.value })}
              placeholder="Button text (optional)"
              className="h-8"
            />
            <Input
              value={slide.buttonUrl || ''}
              onChange={(e) => updateSlide(slide.id, { buttonUrl: e.target.value })}
              placeholder="Button URL"
              className="h-8"
            />
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSlide}
          disabled={uploading || content.slides.length >= MAX_SLIDES}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Add Banner Slide'}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onUpload(file, (url) => {
              const newSlide: BannerSlideItem = {
                id: crypto.randomUUID(),
                imageUrl: url,
              };
              onChange({ slides: [...content.slides, newSlide] });
            });
          }
        }}
      />
    </div>
  );
}
