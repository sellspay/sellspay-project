import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
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
  DividerContent,
  SECTION_TEMPLATES,
} from './types';

interface SectionEditorProps {
  section: ProfileSection;
  collections: { id: string; name: string }[];
  onUpdate: (section: ProfileSection) => void;
  onClose: () => void;
}

export function SectionEditor({
  section,
  collections,
  onUpdate,
  onClose,
}: SectionEditorProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const template = SECTION_TEMPLATES.find((t) => t.type === section.section_type);

  const updateContent = <T extends object>(updates: Partial<T>) => {
    onUpdate({
      ...section,
      content: { ...section.content, ...updates },
    });
  };

  const handleImageUpload = async (
    file: File,
    onSuccess: (url: string) => void
  ) => {
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

      const { data } = supabase.storage
        .from('product-media')
        .getPublicUrl(fileName);

      onSuccess(data.publicUrl);
      toast.success('Image uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
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
          />
        );
      case 'about_me':
        return <AboutMeEditor content={section.content as AboutMeContent} onChange={updateContent} />;
      case 'headline':
        return <HeadlineEditor content={section.content as HeadlineContent} onChange={updateContent} />;
      case 'divider':
        return <DividerEditor content={section.content as DividerContent} onChange={updateContent} />;
      default:
        return <p className="text-muted-foreground">Editor not available for this section type</p>;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h3 className="font-semibold text-foreground">{template?.name || 'Edit Section'}</h3>
          <p className="text-sm text-muted-foreground">{template?.description}</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">{renderEditor()}</div>
      </ScrollArea>
    </div>
  );
}

// Individual section editors

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
          rows={6}
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
                className="w-full max-h-64 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => onChange({ imageUrl: '' })}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-full h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
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
        <Label>Alt Text</Label>
        <Input
          value={content.altText || ''}
          onChange={(e) => onChange({ altText: e.target.value })}
          placeholder="Describe the image"
        />
      </div>
      <div>
        <Label>Caption</Label>
        <Input
          value={content.caption || ''}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Optional caption"
        />
      </div>
      <div>
        <Label>Layout</Label>
        <Select
          value={content.layout || 'full'}
          onValueChange={(value) => onChange({ layout: value as 'full' | 'medium' | 'small' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Width</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="small">Small</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ImageWithTextEditor({
  content,
  onChange,
  onUpload,
  uploading,
}: {
  content: ImageWithTextContent;
  onChange: (updates: Partial<ImageWithTextContent>) => void;
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
                alt=""
                className="w-full max-h-48 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
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
                {uploading ? 'Uploading...' : 'Upload image'}
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
      <div>
        <Label>Title</Label>
        <Input
          value={content.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>
      <div>
        <Label>Body</Label>
        <Textarea
          value={content.body}
          onChange={(e) => onChange({ body: e.target.value })}
          rows={4}
        />
      </div>
      <div>
        <Label>Button Text (optional)</Label>
        <Input
          value={content.buttonText || ''}
          onChange={(e) => onChange({ buttonText: e.target.value })}
          placeholder="e.g., Shop Now"
        />
      </div>
      <div>
        <Label>Button URL</Label>
        <Input
          value={content.buttonUrl || ''}
          onChange={(e) => onChange({ buttonUrl: e.target.value })}
          placeholder="https://..."
        />
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

  const addImage = (url: string) => {
    onChange({
      images: [...content.images, { url, altText: '' }],
    });
  };

  const removeImage = (index: number) => {
    onChange({
      images: content.images.filter((_, i) => i !== index),
    });
  };

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
        <div className={`grid gap-2 mt-2 grid-cols-${content.columns}`} style={{ gridTemplateColumns: `repeat(${content.columns}, 1fr)` }}>
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
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(idx)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
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
              onUpload(file, addImage);
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
          value={content.videoUrl}
          onChange={(e) => onChange({ videoUrl: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>
      <div>
        <Label>Title (optional)</Label>
        <Input
          value={content.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>
      <div>
        <Label>Description (optional)</Label>
        <Textarea
          value={content.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}

function CollectionEditor({
  content,
  onChange,
  collections,
}: {
  content: CollectionContent;
  onChange: (updates: Partial<CollectionContent>) => void;
  collections: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Collection</Label>
        <Select
          value={content.collectionId || ''}
          onValueChange={(value) => onChange({ collectionId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a collection" />
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
          value={content.displayStyle}
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
          value={content.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={content.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={4}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Show Avatar</Label>
        <Switch
          checked={content.showAvatar}
          onCheckedChange={(checked) => onChange({ showAvatar: checked })}
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
        <Label>Headline Text</Label>
        <Input
          value={content.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </div>
      <div>
        <Label>Size</Label>
        <Select
          value={content.size}
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
          value={content.style}
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
