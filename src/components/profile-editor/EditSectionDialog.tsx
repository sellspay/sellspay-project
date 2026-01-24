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
import { Upload, X, Plus, AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react';
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
  SECTION_TEMPLATES,
} from './types';
import { SectionPreviewContent } from './previews/SectionPreviewContent';

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
          <AboutMeEditor content={section.content as AboutMeContent} onChange={updateContent} />
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
      default:
        return <p className="text-muted-foreground">Editor not available for this section type</p>;
    }
  };

  return (
    <Dialog open={!!section} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{template?.name || 'Edit Section'}</DialogTitle>
        </DialogHeader>

        {/* Live Preview */}
        <div className="flex-shrink-0 bg-muted/30 border border-border rounded-lg p-4 mb-2">
          <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">Preview</div>
          <div className="bg-card rounded-lg overflow-hidden p-4 border border-border/50">
            <SectionPreviewContent section={section} />
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

// Individual section editors (compact versions)

function TextEditor({
  content,
  onChange,
}: {
  content: TextContent;
  onChange: (updates: Partial<TextContent>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Heading</Label>
        <Input
          value={content.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Optional heading"
        />
      </div>
      <div>
        <Label>Body Text</Label>
        <Textarea
          value={content.body || ''}
          onChange={(e) => onChange({ body: e.target.value })}
          placeholder="Enter your text..."
          rows={4}
        />
      </div>
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
                className="w-full max-h-48 object-cover rounded-lg"
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
              className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
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
      <div>
        <Label>Caption</Label>
        <Input
          value={content.caption || ''}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Optional caption"
        />
      </div>
    </div>
  );
}

function ImageWithTextEditor({
  content,
  onChange,
  onUpload,
  uploading,
  products = [],
}: {
  content: ImageWithTextContent;
  onChange: (updates: Partial<ImageWithTextContent>) => void;
  onUpload: (file: File, onSuccess: (url: string) => void) => void;
  uploading: boolean;
  products?: { id: string; name: string }[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div>
        <Label>Image</Label>
        <div className="mt-2">
          {content.imageUrl ? (
            <div className="relative">
              <img src={content.imageUrl} alt="" className="w-full max-h-32 object-cover rounded-lg" />
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
              className="w-full h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2 hover:border-primary/50"
            >
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploading ? 'Uploading...' : 'Upload'}
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Position</Label>
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
        <div>
          <Label>Title</Label>
          <Input value={content.title} onChange={(e) => onChange({ title: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>Body</Label>
        <Textarea value={content.body} onChange={(e) => onChange({ body: e.target.value })} rows={3} />
      </div>
      
      {/* Button Configuration */}
      <div className="border-t border-border pt-4 mt-4">
        <Label className="text-sm font-medium">Button Settings</Label>
        <div className="space-y-3 mt-3">
          <div>
            <Label className="text-xs text-muted-foreground">Button Text</Label>
            <Input
              value={content.buttonText || ''}
              onChange={(e) => onChange({ buttonText: e.target.value })}
              placeholder="e.g. Shop Now, Learn More, View"
            />
          </div>
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
  onChange,
  onUpload,
  uploading,
}: {
  content: GalleryContent;
  onChange: (updates: Partial<GalleryContent>) => void;
  onUpload: (file: File, onSuccess: (url: string) => void) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div>
        <Label>Columns</Label>
        <Select
          value={String(content.columns)}
          onValueChange={(value) => onChange({ columns: parseInt(value) as 2 | 3 | 4 })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Images</Label>
        <div
          className="grid gap-2 mt-2"
          style={{ gridTemplateColumns: `repeat(${Math.min(content.columns, 3)}, 1fr)` }}
        >
          {content.images.map((img, idx) => (
            <div key={idx} className="relative group">
              <img
                src={img.url}
                alt={img.altText || ''}
                className="w-full aspect-square object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100"
                onClick={() => onChange({ images: content.images.filter((_, i) => i !== idx) })}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Add</span>
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
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
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="slider">Slider</SelectItem>
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

function AboutMeEditor({
  content,
  onChange,
}: {
  content: AboutMeContent;
  onChange: (updates: Partial<AboutMeContent>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={content.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="About Me"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={content.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={4}
        />
      </div>
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
      <div>
        <Label>Headline</Label>
        <Input value={content.text || ''} onChange={(e) => onChange({ text: e.target.value })} />
      </div>
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
      <div>
        <Label>Banner Text</Label>
        <Textarea
          value={content.text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="✨ Your scrolling message here ✨"
          rows={2}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use emojis and separators like • or ✨ for visual appeal
        </p>
      </div>
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
          onValueChange={(value) => onChange({ style: value as 'line' | 'space' | 'dots' })}
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
}
