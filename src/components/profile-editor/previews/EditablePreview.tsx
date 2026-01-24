import React, { useState, useRef, useEffect } from 'react';
import { ProfileSection, TextContent, ImageContent, ImageWithTextContent, GalleryContent, VideoContent, HeadlineContent, DividerContent, AboutMeContent, SlidingBannerContent, NewsletterContent, FAQContent, TestimonialsContent, ContactUsContent, FooterContent } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Star, Mail, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EditablePreviewProps {
  section: ProfileSection;
  onUpdate: (updates: Partial<ProfileSection['content']>) => void;
}

// Inline editable text component
function InlineEdit({
  value,
  onChange,
  placeholder,
  multiline = false,
  className,
  as: Component = 'span',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const baseClass = "bg-transparent border-none outline-none ring-2 ring-primary/50 rounded px-1 w-full text-inherit font-inherit";
    
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(baseClass, "resize-none min-h-[60px]", className)}
          rows={3}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(baseClass, className)}
      />
    );
  }

  const displayValue = value || placeholder;
  const isEmpty = !value;

  return (
    <Component
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-text hover:ring-2 hover:ring-primary/30 rounded px-1 transition-all",
        isEmpty && "text-muted-foreground/50 italic",
        className
      )}
      title="Click to edit"
    >
      {displayValue}
    </Component>
  );
}

// Image With Text Editable Preview
function ImageWithTextEditablePreview({ 
  section, 
  onUpdate 
}: { 
  section: ProfileSection; 
  onUpdate: (updates: Partial<ImageWithTextContent>) => void;
}) {
  const content = section.content as ImageWithTextContent;
  const preset = section.style_options?.preset;
  const resolvedLayout: ImageWithTextContent['layout'] =
    (preset === 'style1' ? 'hero' : preset === 'style4' ? 'overlay' : 'side-by-side');
  const layout = content.layout || resolvedLayout || 'side-by-side';

  if (layout === 'hero') {
    return (
      <div className="relative min-h-[200px] rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
        {content.imageUrl && (
          <img src={content.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[200px] text-center p-6">
          <InlineEdit value={content.title} onChange={(title) => onUpdate({ title })} placeholder="Enter title..." className="text-2xl font-bold mb-3 block w-full" as="h3" />
          <InlineEdit value={content.body} onChange={(body) => onUpdate({ body })} placeholder="Enter description..." multiline className="text-muted-foreground mb-4 max-w-lg block" as="p" />
          {content.buttonText && (
            <Button size="sm"><InlineEdit value={content.buttonText} onChange={(buttonText) => onUpdate({ buttonText })} placeholder="Button text" /></Button>
          )}
        </div>
      </div>
    );
  }

  const imagePosition = content.imagePosition || 'left';
  return (
    <div className={cn("flex gap-4 items-center", imagePosition === 'right' && "flex-row-reverse")}>
      <div className="w-1/3 flex-shrink-0">
        {content.imageUrl ? (
          <img src={content.imageUrl} alt="" className="w-full h-24 object-cover rounded-lg" />
        ) : (
          <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">No image</div>
        )}
      </div>
      <div className="flex-1 space-y-2">
        <InlineEdit value={content.title} onChange={(title) => onUpdate({ title })} placeholder="Enter title..." className="text-lg font-semibold block" as="h3" />
        <InlineEdit value={content.body} onChange={(body) => onUpdate({ body })} placeholder="Enter description..." multiline className="text-sm text-muted-foreground block" as="p" />
        {content.buttonText && (
          <Button size="sm" variant="outline"><InlineEdit value={content.buttonText} onChange={(buttonText) => onUpdate({ buttonText })} placeholder="Button" /></Button>
        )}
      </div>
    </div>
  );
}

function TextEditablePreview({ content, onUpdate }: { content: TextContent; onUpdate: (updates: Partial<TextContent>) => void; }) {
  return (
    <div className={`text-${content.alignment || 'left'}`}>
      <InlineEdit value={content.title || ''} onChange={(title) => onUpdate({ title })} placeholder="Add a heading..." className="text-xl font-semibold mb-2 block" as="h3" />
      <InlineEdit value={content.body || ''} onChange={(body) => onUpdate({ body })} placeholder="Enter your text..." multiline className="text-muted-foreground block" as="p" />
    </div>
  );
}

function ImageEditablePreview({ content, onUpdate }: { content: ImageContent; onUpdate: (updates: Partial<ImageContent>) => void; }) {
  return (
    <figure className="text-center">
      {content.imageUrl ? (
        <img src={content.imageUrl} alt={content.altText || ''} className="w-full max-h-40 object-cover rounded-lg" />
      ) : (
        <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">No image - use settings below to upload</div>
      )}
      <InlineEdit value={content.caption || ''} onChange={(caption) => onUpdate({ caption })} placeholder="Add a caption..." className="mt-2 text-sm text-muted-foreground block" as="p" />
    </figure>
  );
}

function HeadlineEditablePreview({ content, onUpdate }: { content: HeadlineContent; onUpdate: (updates: Partial<HeadlineContent>) => void; }) {
  const sizeClasses = { small: 'text-xl', medium: 'text-2xl', large: 'text-3xl' };
  return (
    <div className="text-center py-2">
      <InlineEdit value={content.text} onChange={(text) => onUpdate({ text })} placeholder="Enter headline..." className={cn("font-bold block", sizeClasses[content.size || 'medium'])} as="h2" />
    </div>
  );
}

function GalleryEditablePreview({ content, section }: { content: GalleryContent; section: ProfileSection; }) {
  const preset = section.style_options?.preset;
  const columns = content.columns || 3;
  const rows = content.rows || 2;
  const slotCount = preset === 'style1' || preset === 'style2' ? 6 : columns * rows;
  const slots = Array.from({ length: slotCount }, (_, i) => content.images[i] || null);

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {slots.map((img, idx) => (
        <div key={idx} className="aspect-square bg-muted rounded overflow-hidden">
          {img?.url ? (
            <img src={img.url} alt={img.altText || ''} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-border">{idx + 1}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function VideoEditablePreview({ content }: { content: VideoContent; }) {
  const getYouTubeId = (url: string) => url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)?.[1];
  const videoId = content.videoUrl ? getYouTubeId(content.videoUrl) : null;
  return (
    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
      {videoId ? (
        <iframe src={`https://www.youtube.com/embed/${videoId}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">No video - enter YouTube URL in settings</div>
      )}
    </div>
  );
}

function DividerEditablePreview({ content }: { content: DividerContent; }) {
  if (content.style === 'space') return <div className="h-8" />;
  if (content.style === 'dots') return <div className="flex justify-center gap-2 py-4">{[1,2,3].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />)}</div>;
  if (content.style === 'thick') return <hr className="border-t-4 border-border my-4" />;
  if (content.style === 'gradient') return <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent my-4" />;
  if (content.style === 'wave') return <div className="h-4 my-4 flex items-center"><svg viewBox="0 0 100 10" className="w-full h-4 text-muted-foreground/30"><path d="M0 5 Q 12.5 0 25 5 T 50 5 T 75 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="1" /></svg></div>;
  return <hr className="border-border my-4" />;
}

function NewsletterEditablePreview({ content, onUpdate }: { content: NewsletterContent; onUpdate: (updates: Partial<NewsletterContent>) => void; }) {
  return (
    <div className="text-center max-w-md mx-auto">
      <Mail className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
      <InlineEdit value={content.title} onChange={(title) => onUpdate({ title })} placeholder="Title..." className="text-lg font-semibold mb-1 block" as="h3" />
      <InlineEdit value={content.subtitle || ''} onChange={(subtitle) => onUpdate({ subtitle })} placeholder="Subtitle..." className="text-sm text-muted-foreground mb-4 block" as="p" />
      <div className="flex gap-2">
        <Input placeholder={content.placeholder} className="flex-1" disabled />
        <Button size="sm"><InlineEdit value={content.buttonText} onChange={(buttonText) => onUpdate({ buttonText })} placeholder="Subscribe" /></Button>
      </div>
    </div>
  );
}

function TestimonialsEditablePreview({ content }: { content: TestimonialsContent; }) {
  if (content.testimonials.length === 0) return <div className="text-center py-4 text-muted-foreground">No testimonials - add them in settings</div>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {content.testimonials.slice(0, 2).map((t) => (
        <div key={t.id} className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="flex gap-1 mb-2">{[1,2,3,4,5].map(s => <Star key={s} className={cn("w-3 h-3", s <= (t.rating || 5) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />)}</div>
          <p className="text-muted-foreground mb-2 line-clamp-2">{t.quote}</p>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">{t.avatar ? <AvatarImage src={t.avatar} /> : <AvatarFallback className="text-xs">{t.name[0]}</AvatarFallback>}</Avatar>
            <span className="text-xs font-medium">{t.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactEditablePreview({ content, onUpdate }: { content: ContactUsContent; onUpdate: (updates: Partial<ContactUsContent>) => void; }) {
  return (
    <div className="text-center max-w-sm mx-auto">
      <Send className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
      <InlineEdit value={content.title} onChange={(title) => onUpdate({ title })} placeholder="Title..." className="text-lg font-semibold mb-1 block" as="h3" />
      <InlineEdit value={content.subtitle || ''} onChange={(subtitle) => onUpdate({ subtitle })} placeholder="Subtitle..." className="text-sm text-muted-foreground mb-3 block" as="p" />
      {content.showForm && <Button size="sm" className="w-full">Send Message</Button>}
    </div>
  );
}

export function EditablePreview({ section, onUpdate }: EditablePreviewProps) {
  switch (section.section_type) {
    case 'text': return <TextEditablePreview content={section.content as TextContent} onUpdate={onUpdate} />;
    case 'image': return <ImageEditablePreview content={section.content as ImageContent} onUpdate={onUpdate} />;
    case 'image_with_text': return <ImageWithTextEditablePreview section={section} onUpdate={onUpdate} />;
    case 'headline': return <HeadlineEditablePreview content={section.content as HeadlineContent} onUpdate={onUpdate} />;
    case 'gallery': return <GalleryEditablePreview content={section.content as GalleryContent} section={section} />;
    case 'video': return <VideoEditablePreview content={section.content as VideoContent} />;
    case 'divider': return <DividerEditablePreview content={section.content as DividerContent} />;
    case 'newsletter': return <NewsletterEditablePreview content={section.content as NewsletterContent} onUpdate={onUpdate} />;
    case 'testimonials': return <TestimonialsEditablePreview content={section.content as TestimonialsContent} />;
    case 'contact_us': return <ContactEditablePreview content={section.content as ContactUsContent} onUpdate={onUpdate} />;
    default: return <div className="text-center text-muted-foreground py-4">Use the settings below to edit this section</div>;
  }
}
