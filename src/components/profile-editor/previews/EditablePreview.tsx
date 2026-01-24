import React, { useState, useRef, useEffect } from 'react';
import { ProfileSection, TextContent, ImageContent, ImageWithTextContent, GalleryContent, VideoContent, HeadlineContent, DividerContent, NewsletterContent, TestimonialsContent, ContactUsContent, FAQContent, AboutMeContent, SlidingBannerContent, SlideshowContent, BasicListContent, FeaturedProductContent, LogoListContent, CollectionContent, FooterContent, CardSlideshowContent, BannerSlideshowContent } from '../types';
import { cn } from '@/lib/utils';
import { Image, Play, ChevronLeft, ChevronRight, Star, Mail, Phone, MessageSquare, ArrowRight, Check, Quote } from 'lucide-react';
import { getFontClassName, getCustomFontStyle, useCustomFont } from '../hooks/useCustomFont';

interface EditablePreviewProps {
  section: ProfileSection;
  onUpdate: (content: Partial<ProfileSection['content']>) => void;
}

// Inline Edit Component for editable text fields
interface InlineEditProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

const InlineEdit: React.FC<InlineEditProps> = ({ value, onChange, className, placeholder, multiline }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (tempValue !== value) {
      onChange(tempValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const Component = multiline ? 'textarea' : 'input';
    return (
      <Component
        ref={inputRef as any}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "bg-transparent border-b border-primary/50 outline-none w-full",
          multiline && "resize-none min-h-[60px]",
          className
        )}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-text hover:bg-muted/50 rounded px-1 -mx-1 transition-colors inline-block",
        !value && "text-muted-foreground italic",
        className
      )}
    >
      {value || placeholder || 'Click to edit'}
    </span>
  );
};

// Star Rating Component
const StarRating: React.FC<{ rating: number; onChange?: (r: number) => void; size?: 'sm' | 'md' }> = ({ 
  rating, 
  onChange,
  size = 'sm'
}) => {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30",
            onChange && "cursor-pointer hover:scale-110 transition-transform"
          )}
          onClick={() => onChange?.(star)}
        />
      ))}
    </div>
  );
};

// Image Placeholder Component
const ImagePlaceholder: React.FC<{ label?: string | number; className?: string }> = ({ label, className }) => (
  <div className={cn(
    "bg-muted/50 rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/20",
    className
  )}>
    {label !== undefined ? (
      <span className="text-muted-foreground/50 text-xs font-medium">{label}</span>
    ) : (
      <Image className="w-6 h-6 text-muted-foreground/30" />
    )}
  </div>
);

// ============ SECTION PREVIEWS ============

// Text Preview
function TextEditablePreview({ content, onUpdate }: { content: TextContent; onUpdate: (c: Partial<TextContent>) => void }) {
  const alignment = content.alignment || 'center';
  const fontClass = getFontClassName(content.font);
  const customFontStyle = getCustomFontStyle(content.customFont);
  
  // Inject custom font if needed
  useCustomFont(content.customFont);
  
  // Font size classes
  const fontSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  };
  
  // Font weight classes
  const fontWeightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
  };

  // Letter spacing map
  const letterSpacingMap = {
    tighter: '-0.04em',
    tight: '-0.02em',
    normal: '0em',
    wide: '0.02em',
    wider: '0.05em',
  };

  // Line height map
  const lineHeightMap = {
    tight: 1.1,
    normal: 1.35,
    relaxed: 1.6,
    loose: 1.9,
  };

  // Merge custom font style with text color and typography
  const combinedStyle = {
    ...customFontStyle,
    color: content.textColor || undefined,
    letterSpacing: letterSpacingMap[content.letterSpacing || 'normal'],
    lineHeight: lineHeightMap[content.lineHeight || 'normal'],
  };
  
  return (
    <div 
      className={cn(
        "space-y-2 p-4",
        alignment === 'center' && "text-center",
        alignment === 'right' && "text-right",
        alignment === 'left' && "text-left",
        fontClass,
        fontSizeClasses[content.fontSize || 'base'],
        fontWeightClasses[content.fontWeight || 'normal']
      )}
      style={combinedStyle}
    >
      {content.title && (
        <h3 className="text-lg font-semibold">
          <InlineEdit value={content.title} onChange={(v) => onUpdate({ title: v })} placeholder="Section Title" />
        </h3>
      )}
      <p style={{ color: content.textColor || undefined }}>
        <InlineEdit value={content.body} onChange={(v) => onUpdate({ body: v })} placeholder="Enter your text here..." multiline />
      </p>
    </div>
  );
}

// Image Preview
function ImageEditablePreview({ content, onUpdate }: { content: ImageContent; onUpdate: (c: Partial<ImageContent>) => void }) {
  return (
    <div className="space-y-2">
      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
        {content.imageUrl ? (
          <img src={content.imageUrl} alt={content.altText || ''} className="w-full h-full object-cover" />
        ) : (
          <ImagePlaceholder className="w-full h-full" />
        )}
      </div>
      {content.caption && (
        <p className="text-xs text-muted-foreground text-center">
          <InlineEdit value={content.caption} onChange={(v) => onUpdate({ caption: v })} placeholder="Image caption" />
        </p>
      )}
    </div>
  );
}

// Image With Text Preview
function ImageWithTextEditablePreview({ content, section, onUpdate }: { content: ImageWithTextContent; section: ProfileSection; onUpdate: (c: Partial<ImageWithTextContent>) => void }) {
  const preset = section.style_options?.preset || 'style1';
  const layout = content.layout || 'side-by-side';
  const imagePosition = content.imagePosition || 'left';

  // Hero Banner Layout
  if (preset === 'style1' || layout === 'hero') {
    return (
      <div className="relative aspect-[16/9] bg-muted rounded-lg overflow-hidden">
        {content.imageUrl ? (
          <img src={content.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/10" />
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white p-4 max-w-md">
            <h2 className="text-xl font-bold mb-2">
              <InlineEdit value={content.title || ''} onChange={(v) => onUpdate({ title: v })} placeholder="Hero Title" className="text-white" />
            </h2>
            <p className="text-sm opacity-90">
              <InlineEdit value={content.body || ''} onChange={(v) => onUpdate({ body: v })} placeholder="Hero description" className="text-white" />
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Overlay Text Layout
  if (preset === 'style4' || layout === 'overlay') {
    return (
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        {content.imageUrl ? (
          <img src={content.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/10" />
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h3 className="text-white font-semibold">
            <InlineEdit value={content.title || ''} onChange={(v) => onUpdate({ title: v })} placeholder="Title" className="text-white" />
          </h3>
          <p className="text-white/80 text-sm">
            <InlineEdit value={content.body || ''} onChange={(v) => onUpdate({ body: v })} placeholder="Description" className="text-white/80" />
          </p>
        </div>
      </div>
    );
  }

  // Side by Side Layout (style2 = Image Left, style3 = Image Right)
  const isImageRight = preset === 'style3' || imagePosition === 'right';
  return (
    <div className={cn("grid grid-cols-2 gap-4 items-center", isImageRight && "direction-rtl")}>
      <div className="aspect-square bg-muted rounded-lg overflow-hidden" style={{ direction: 'ltr' }}>
        {content.imageUrl ? (
          <img src={content.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImagePlaceholder className="w-full h-full" />
        )}
      </div>
      <div className="space-y-2" style={{ direction: 'ltr' }}>
        <h3 className="font-semibold">
          <InlineEdit value={content.title || ''} onChange={(v) => onUpdate({ title: v })} placeholder="Title" />
        </h3>
        <p className="text-sm text-muted-foreground">
          <InlineEdit value={content.body || ''} onChange={(v) => onUpdate({ body: v })} placeholder="Description" multiline />
        </p>
        {content.buttonText && (
          <span className="inline-block text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded">
            <InlineEdit value={content.buttonText} onChange={(v) => onUpdate({ buttonText: v })} placeholder="Button" className="text-primary-foreground" />
          </span>
        )}
      </div>
    </div>
  );
}

// Gallery Preview - FIXED to match menu thumbnails
function GalleryEditablePreview({ content, section }: { content: GalleryContent; section: ProfileSection }) {
  const preset = section.style_options?.preset || 'style1';
  const images = content.images || [];

  // Masonry Layout (style3) - One large left, smaller right
  if (preset === 'style3') {
    const slots = Array.from({ length: 4 }, (_, i) => images[i] || null);
    return (
      <div className="grid grid-cols-3 grid-rows-2 gap-2 aspect-[16/10]">
        {/* Large image spanning 2 rows on left */}
        <div className="row-span-2 rounded-lg overflow-hidden">
          {slots[0]?.url ? (
            <img src={slots[0].url} alt={slots[0].altText || ''} className="w-full h-full object-cover" />
          ) : (
            <ImagePlaceholder label={1} className="w-full h-full" />
          )}
        </div>
        {/* Top right images */}
        <div className="rounded-lg overflow-hidden">
          {slots[1]?.url ? (
            <img src={slots[1].url} alt={slots[1].altText || ''} className="w-full h-full object-cover" />
          ) : (
            <ImagePlaceholder label={2} className="w-full h-full" />
          )}
        </div>
        <div className="rounded-lg overflow-hidden">
          {slots[2]?.url ? (
            <img src={slots[2].url} alt={slots[2].altText || ''} className="w-full h-full object-cover" />
          ) : (
            <ImagePlaceholder label={3} className="w-full h-full" />
          )}
        </div>
        {/* Bottom right spanning 2 columns */}
        <div className="col-span-2 rounded-lg overflow-hidden">
          {slots[3]?.url ? (
            <img src={slots[3].url} alt={slots[3].altText || ''} className="w-full h-full object-cover" />
          ) : (
            <ImagePlaceholder label={4} className="w-full h-full" />
          )}
        </div>
      </div>
    );
  }

  // 2x3 Grid (style2) - 2 columns, 3 rows
  if (preset === 'style2') {
    const slots = Array.from({ length: 6 }, (_, i) => images[i] || null);
    return (
      <div className="grid grid-cols-2 gap-2">
        {slots.map((img, i) => (
          <div key={i} className="aspect-square rounded-lg overflow-hidden">
            {img?.url ? (
              <img src={img.url} alt={img.altText || ''} className="w-full h-full object-cover" />
            ) : (
              <ImagePlaceholder label={i + 1} className="w-full h-full" />
            )}
          </div>
        ))}
      </div>
    );
  }

  // Default 3x2 Grid (style1) - 3 columns, 2 rows
  const slots = Array.from({ length: 6 }, (_, i) => images[i] || null);
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((img, i) => (
        <div key={i} className="aspect-square rounded-lg overflow-hidden">
          {img?.url ? (
            <img src={img.url} alt={img.altText || ''} className="w-full h-full object-cover" />
          ) : (
            <ImagePlaceholder label={i + 1} className="w-full h-full" />
          )}
        </div>
      ))}
    </div>
  );
}

// Video Preview
function VideoEditablePreview({ content }: { content: VideoContent }) {
  // Extract thumbnail from YouTube URL if possible
  const getYoutubeThumbnail = (url: string) => {
    const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
  };
  
  const thumbnailUrl = getYoutubeThumbnail(content.videoUrl || '');
  
  return (
    <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <Play className="w-5 h-5 text-foreground ml-0.5" />
        </div>
      </div>
    </div>
  );
}

// Headline Preview
function HeadlineEditablePreview({ content, onUpdate }: { content: HeadlineContent; onUpdate: (c: Partial<HeadlineContent>) => void }) {
  const fontClass = getFontClassName(content.font);
  const customFontStyle = getCustomFontStyle(content.customFont);
  
  // Inject custom font if needed
  useCustomFont(content.customFont);
  
  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl',
  };
  
  const fontWeightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
  };

  // Letter spacing map
  const letterSpacingMap = {
    tighter: '-0.04em',
    tight: '-0.02em',
    normal: '0em',
    wide: '0.02em',
    wider: '0.05em',
  };

  // Line height map
  const lineHeightMap = {
    tight: 1.1,
    normal: 1.35,
    relaxed: 1.6,
    loose: 1.9,
  };

  // Text shadow map
  const textShadowMap: Record<string, string | undefined> = {
    none: undefined,
    soft: '0 1px 2px rgba(0,0,0,0.25)',
    medium: '0 4px 10px rgba(0,0,0,0.25)',
    strong: '0 10px 25px rgba(0,0,0,0.35)',
    glow: '0 0 14px rgba(255,255,255,0.35)',
  };

  // Merge custom font style with text color and typography
  const combinedStyle = {
    ...customFontStyle,
    color: content.textColor || undefined,
    letterSpacing: letterSpacingMap[content.letterSpacing || 'normal'],
    lineHeight: lineHeightMap[content.lineHeight || 'normal'],
    textShadow: textShadowMap[content.textShadow || 'none'],
  };
  
  return (
    <div 
      className={cn(
        "text-center py-4", 
        sizeClasses[content.size || 'medium'],
        fontClass,
        fontWeightClasses[content.fontWeight || 'bold']
      )}
      style={combinedStyle}
    >
      <span>
        <InlineEdit value={content.text} onChange={(v) => onUpdate({ text: v })} placeholder="Headline Text" />
      </span>
    </div>
  );
}

// Divider Preview
function DividerEditablePreview({ content, section }: { content: DividerContent; section: ProfileSection }) {
  const preset = section.style_options?.preset || 'style1';
  const style = content.style || 'line';

  if (style === 'space' || preset === 'style2') {
    return <div className="h-8" />;
  }

  if (style === 'dots' || preset === 'style3') {
    return (
      <div className="flex justify-center gap-2 py-4">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
      </div>
    );
  }

  if (style === 'thick') {
    return <hr className="border-t-4 border-muted-foreground/20 my-4" />;
  }

  if (style === 'gradient') {
    return <div className="h-1 my-4 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />;
  }

  if (style === 'wave') {
    return (
      <div className="py-4 flex justify-center">
        <svg viewBox="0 0 200 20" className="w-full h-5 text-muted-foreground/30">
          <path d="M0,10 Q25,0 50,10 T100,10 T150,10 T200,10" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  // Default line
  return <hr className="border-t border-muted-foreground/20 my-4" />;
}

// Newsletter Preview
function NewsletterEditablePreview({ content, onUpdate }: { content: NewsletterContent; onUpdate: (c: Partial<NewsletterContent>) => void }) {
  return (
    <div className="bg-muted/30 rounded-lg p-6 text-center space-y-3">
      <h3 className="font-semibold text-lg">
        <InlineEdit value={content.title || 'Subscribe to our newsletter'} onChange={(v) => onUpdate({ title: v })} placeholder="Newsletter Title" />
      </h3>
      <p className="text-sm text-muted-foreground">
        <InlineEdit value={content.subtitle || 'Get updates delivered to your inbox'} onChange={(v) => onUpdate({ subtitle: v })} placeholder="Subtitle" />
      </p>
      <div className="flex gap-2 max-w-sm mx-auto">
        <div className="flex-1 bg-background border rounded-md px-3 py-2 text-sm text-muted-foreground text-left">
          {content.placeholder || 'Enter your email'}
        </div>
        <span className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
          <InlineEdit value={content.buttonText || 'Subscribe'} onChange={(v) => onUpdate({ buttonText: v })} placeholder="Button" className="text-primary-foreground" />
        </span>
      </div>
    </div>
  );
}

// Testimonials Preview - FIXED with all layout variants
function TestimonialsEditablePreview({ content, section }: { content: TestimonialsContent; section: ProfileSection }) {
  const preset = section.style_options?.preset || 'style1';
  const layout = content.layout || 'grid';
  const items = content.testimonials || [];

  // Grid 6 (6 items in a row)
  if (preset === 'style4' || layout === 'grid-6') {
    const slots = Array.from({ length: 6 }, (_, i) => items[i] || null);
    return (
      <div className="grid grid-cols-6 gap-2">
        {slots.map((item, i) => (
          <div key={i} className="bg-muted/30 rounded-lg p-2 text-center">
            <div className="w-8 h-8 rounded-full bg-muted mx-auto mb-1 overflow-hidden">
              {item?.avatar ? (
                <img src={item.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted-foreground/20" />
              )}
            </div>
            <StarRating rating={item?.rating || 5} size="sm" />
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{item?.quote || 'Review'}</p>
          </div>
        ))}
      </div>
    );
  }

  // Slider Layout
  if (preset === 'style2' || layout === 'slider') {
    const currentItem = items[0] || { name: 'Customer Name', role: 'Customer', quote: 'Amazing product!', rating: 5 as const, avatar: undefined };
    return (
      <div className="relative">
        <div className="bg-muted/30 rounded-lg p-6 text-center max-w-md mx-auto">
          <Quote className="w-8 h-8 text-primary/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">"{currentItem.quote}"</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
              {currentItem.avatar ? (
                <img src={currentItem.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted-foreground/20" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{currentItem.name}</p>
              <StarRating rating={currentItem.rating || 5} size="sm" />
            </div>
          </div>
        </div>
        <button className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background shadow flex items-center justify-center">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background shadow flex items-center justify-center">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Stacked Layout
  if (preset === 'style3' || layout === 'stacked') {
  const displayItems = items.length > 0 ? items.slice(0, 3) : [
      { name: 'Customer', role: 'Verified Buyer', quote: 'Great experience!', rating: 5 as const, avatar: undefined }
    ];
    return (
      <div className="space-y-3">
        {displayItems.map((item, i) => (
          <div key={i} className="bg-muted/30 rounded-lg p-4 flex gap-3">
            <div className="w-12 h-12 rounded-full bg-muted shrink-0 overflow-hidden">
              {item.avatar ? (
                <img src={item.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted-foreground/20" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{item.name || 'Customer'}</span>
                <StarRating rating={item.rating || 5} size="sm" />
              </div>
              <p className="text-sm text-muted-foreground">{item.quote || 'Review text here'}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default Grid Layout (2 columns)
  const displayItems = items.length > 0 ? items.slice(0, 4) : [
    { name: 'John Doe', role: 'Customer', quote: 'Amazing product!', rating: 5 },
    { name: 'Jane Smith', role: 'Verified Buyer', quote: 'Highly recommend!', rating: 5 }
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {displayItems.map((item, i) => (
        <div key={i} className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
              {item.avatar ? (
                <img src={item.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted-foreground/20" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium">{item.name}</p>
              <StarRating rating={item.rating || 5} size="sm" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{item.quote}</p>
        </div>
      ))}
    </div>
  );
}

// Contact Preview - FIXED with all style variants
function ContactEditablePreview({ content, section, onUpdate }: { content: ContactUsContent; section: ProfileSection; onUpdate: (c: Partial<ContactUsContent>) => void }) {
  const preset = section.style_options?.preset || 'style1';

  // Split Layout
  if (preset === 'style2') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="font-semibold">
            <InlineEdit value={content.title || 'Get in Touch'} onChange={(v) => onUpdate({ title: v })} placeholder="Title" />
          </h3>
          <p className="text-sm text-muted-foreground">
            <InlineEdit value={content.subtitle || 'We\'d love to hear from you'} onChange={(v) => onUpdate({ subtitle: v })} placeholder="Subtitle" />
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {content.email || 'email@example.com'}</div>
          </div>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <div className="bg-background rounded border px-3 py-2 text-sm text-muted-foreground">Your name</div>
          <div className="bg-background rounded border px-3 py-2 text-sm text-muted-foreground">Your email</div>
          <div className="bg-background rounded border px-3 py-2 text-sm text-muted-foreground h-16">Message</div>
          <button className="w-full bg-primary text-primary-foreground rounded py-2 text-sm">Send</button>
        </div>
      </div>
    );
  }

  // Minimal Layout
  if (preset === 'style3') {
    return (
      <div className="text-center py-4 space-y-2">
        <h3 className="font-semibold">
          <InlineEdit value={content.title || 'Contact'} onChange={(v) => onUpdate({ title: v })} placeholder="Title" />
        </h3>
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {content.email || 'email@example.com'}</span>
        </div>
      </div>
    );
  }

  // Card Layout
  if (preset === 'style4') {
    return (
      <div className="bg-muted/30 rounded-lg p-6 max-w-md mx-auto text-center space-y-3">
        <MessageSquare className="w-10 h-10 text-primary mx-auto" />
        <h3 className="font-semibold">
          <InlineEdit value={content.title || 'Get in Touch'} onChange={(v) => onUpdate({ title: v })} placeholder="Title" />
        </h3>
        <p className="text-sm text-muted-foreground">
          <InlineEdit value={content.subtitle || 'We\'d love to hear from you'} onChange={(v) => onUpdate({ subtitle: v })} placeholder="Subtitle" />
        </p>
        <a className="inline-flex items-center gap-2 text-primary text-sm">
          {content.email || 'email@example.com'} <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  // Default Centered Layout
  return (
    <div className="text-center py-6 space-y-3">
      <h3 className="text-xl font-semibold">
        <InlineEdit value={content.title || 'Contact Us'} onChange={(v) => onUpdate({ title: v })} placeholder="Title" />
      </h3>
      <p className="text-sm text-muted-foreground">
        <InlineEdit value={content.subtitle || 'We\'d love to hear from you'} onChange={(v) => onUpdate({ subtitle: v })} placeholder="Subtitle" />
      </p>
      <div className="flex items-center justify-center gap-2 text-sm">
        <Mail className="w-4 h-4" />
        <span>{content.email || 'email@example.com'}</span>
      </div>
    </div>
  );
}

// FAQ Preview - FIXED with accordion and grid layouts
function FAQEditablePreview({ content, section }: { content: FAQContent; section: ProfileSection }) {
  const preset = section.style_options?.preset || 'style1';
  const layout = content.layout || 'accordion';
  const items = content.items || [];

  // Grid Layout (3x2)
  if (preset === 'style2' || layout === 'grid') {
    const slots = Array.from({ length: 6 }, (_, i) => items[i] || null);
    return (
      <div className="grid grid-cols-2 gap-3">
        {slots.map((item, i) => (
          <div key={i} className="bg-muted/30 rounded-lg p-3">
            <h4 className="font-medium text-sm mb-1">{item?.question || `Question ${i + 1}`}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{item?.answer || 'Answer text here...'}</p>
          </div>
        ))}
      </div>
    );
  }

  // Default Accordion Layout
  const displayItems = items.length > 0 ? items.slice(0, 4) : [
    { question: 'How does this work?', answer: 'It\'s simple and easy to use.' },
    { question: 'What are the features?', answer: 'Many great features included.' },
  ];
  return (
    <div className="space-y-2">
      {displayItems.map((item, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
            <span className="font-medium text-sm">{item.question}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      ))}
    </div>
  );
}

// About Me Preview
function AboutMeEditablePreview({ content, onUpdate }: { content: AboutMeContent; onUpdate: (c: Partial<AboutMeContent>) => void }) {
  return (
    <div className="flex gap-4 items-start">
      {content.showAvatar && (
        <div className="w-20 h-20 rounded-full bg-muted shrink-0 overflow-hidden">
          <div className="w-full h-full bg-muted-foreground/20 flex items-center justify-center">
            <Image className="w-8 h-8 text-muted-foreground/30" />
          </div>
        </div>
      )}
      <div className="flex-1 space-y-2">
        <h3 className="font-semibold">
          <InlineEdit value={content.title || 'About Me'} onChange={(v) => onUpdate({ title: v })} placeholder="Title" />
        </h3>
        <p className="text-sm text-muted-foreground">
          <InlineEdit value={content.description || 'Tell your story...'} onChange={(v) => onUpdate({ description: v })} placeholder="Your bio" multiline />
        </p>
      </div>
    </div>
  );
}

// Sliding Banner Preview
function SlidingBannerEditablePreview({ content, onUpdate }: { content: SlidingBannerContent; onUpdate: (c: Partial<SlidingBannerContent>) => void }) {
  const fontClass = getFontClassName(content.font);
  const customFontStyle = getCustomFontStyle(content.customFont);
  
  // Inject custom font if needed
  useCustomFont(content.customFont);
  
  const speedClasses = {
    slow: 'animate-[marquee_20s_linear_infinite]',
    medium: 'animate-[marquee_12s_linear_infinite]',
    fast: 'animate-[marquee_6s_linear_infinite]',
  };

  const fontSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  };

  const fontWeightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
  };

  const letterSpacingMap = {
    tighter: '-0.04em',
    tight: '-0.02em',
    normal: '0em',
    wide: '0.02em',
    wider: '0.05em',
  };

  const combinedStyle = {
    ...customFontStyle,
    color: content.textColor || undefined,
    letterSpacing: letterSpacingMap[content.letterSpacing || 'normal'],
  };

  return (
    <div 
      className="py-3 overflow-hidden rounded-lg"
      style={{ backgroundColor: content.backgroundColor || 'hsl(var(--muted) / 0.3)' }}
    >
      <div className={`flex gap-8 whitespace-nowrap ${speedClasses[content.speed || 'medium']}`}>
        {[1, 2, 3].map((i) => (
          <span 
            key={i} 
            className={cn(
              fontClass,
              fontSizeClasses[content.fontSize || 'base'],
              fontWeightClasses[content.fontWeight || 'medium']
            )}
            style={combinedStyle}
          >
            {content.text || '✨ Special Announcement • Limited Time Offer • Shop Now'}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
}

// Slideshow Preview
function SlideshowEditablePreview({ content }: { content: SlideshowContent }) {
  const slides = content.slides || [];
  const currentSlide = slides[0] || { imageUrl: '', caption: 'Slide 1' };

  return (
    <div className="relative">
      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
        {currentSlide.imageUrl ? (
          <img src={currentSlide.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImagePlaceholder className="w-full h-full" />
        )}
      </div>
      {/* Navigation Arrows */}
      <button className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow">
        <ChevronRight className="w-4 h-4" />
      </button>
      {/* Navigation Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {Array.from({ length: Math.min(slides.length || 3, 3) }).map((_, i) => (
          <div key={i} className={cn("w-2 h-2 rounded-full", i === 0 ? "bg-white" : "bg-white/50")} />
        ))}
      </div>
    </div>
  );
}

// Basic List Preview
function BasicListEditablePreview({ content, section }: { content: BasicListContent; section: ProfileSection }) {
  const preset = section.style_options?.preset || 'style1';
  const layout = content.layout || 'simple';
  const items = content.items || [];

  // Cards 3-Column
  if (preset === 'style1' || layout === 'cards-3col') {
    const slots = Array.from({ length: 3 }, (_, i) => items[i] || null);
    return (
      <div className="grid grid-cols-3 gap-3">
        {slots.map((item, i) => (
          <div key={i} className="bg-muted/30 rounded-lg p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 mx-auto mb-2 flex items-center justify-center">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-medium text-sm mb-1">{item?.text || `Item ${i + 1}`}</h4>
          </div>
        ))}
      </div>
    );
  }

  // Cards 2-Column
  if (preset === 'style2' || layout === 'cards-2col') {
    const slots = Array.from({ length: 4 }, (_, i) => items[i] || null);
    return (
      <div className="grid grid-cols-2 gap-3">
        {slots.map((item, i) => (
          <div key={i} className="bg-muted/30 rounded-lg p-3 flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 shrink-0 flex items-center justify-center">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{item?.text || `Item ${i + 1}`}</h4>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal Layout
  if (preset === 'style3' || layout === 'horizontal') {
    const slots = Array.from({ length: 4 }, (_, i) => items[i] || null);
    return (
      <div className="flex gap-4 justify-center">
        {slots.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            <span className="text-sm">{item?.text || `Item ${i + 1}`}</span>
          </div>
        ))}
      </div>
    );
  }

  // Simple List (default)
  const displayItems = items.length > 0 ? items.slice(0, 5) : [
    { text: 'First item' },
    { text: 'Second item' },
    { text: 'Third item' },
  ];
  return (
    <ul className="space-y-2 pl-4">
      {displayItems.map((item, i) => (
        <li key={i} className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-sm">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

// Featured Product Preview
function FeaturedProductEditablePreview({ content }: { content: FeaturedProductContent }) {
  return (
    <div className="bg-muted/30 rounded-lg p-4 flex gap-4">
      <div className="w-24 h-24 bg-muted rounded-lg shrink-0 overflow-hidden">
        <ImagePlaceholder className="w-full h-full" />
      </div>
      <div className="flex-1 space-y-2">
        <h3 className="font-semibold">Product Name</h3>
        {content.showDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">Product description here</p>
        )}
        <div className="flex items-center gap-3">
          {content.showPrice && <span className="font-bold text-primary">$29.99</span>}
          <button className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm">
            {content.buttonText || 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Logo List Preview
function LogoListEditablePreview({ content }: { content: LogoListContent }) {
  const logos = content.logos || [];
  const slots = Array.from({ length: 5 }, (_, i) => logos[i] || null);

  return (
    <div className="py-4">
      <div className="flex items-center justify-center gap-6">
        {slots.map((logo, i) => (
          <div 
            key={i} 
            className={cn(
              "w-16 h-10 bg-muted rounded flex items-center justify-center overflow-hidden",
              content.grayscale && "grayscale opacity-60"
            )}
          >
            {logo?.imageUrl ? (
              <img src={logo.imageUrl} alt={logo.altText || ''} className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-[10px] text-muted-foreground">Logo {i + 1}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Collection Preview - FIXED to show grid vs slider
function CollectionEditablePreview({ content }: { content: CollectionContent }) {
  const displayStyle = content.displayStyle || 'grid';

  // Slider Layout
  if (displayStyle === 'slider') {
    return (
      <div className="relative">
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-1/4 shrink-0">
              <div className="aspect-square bg-muted rounded-lg mb-2" />
              <div className="h-2 bg-muted rounded w-3/4 mb-1" />
              <div className="h-2 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
        <button className="absolute left-0 top-1/3 -translate-y-1/2 w-8 h-8 rounded-full bg-background shadow flex items-center justify-center">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="absolute right-0 top-1/3 -translate-y-1/2 w-8 h-8 rounded-full bg-background shadow flex items-center justify-center">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Grid Layout (default)
  return (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i}>
          <div className="aspect-square bg-muted rounded-lg mb-2" />
          <div className="h-2 bg-muted rounded w-3/4 mb-1" />
          <div className="h-2 bg-muted rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

// Footer Preview
function FooterEditablePreview({ content, onUpdate }: { content: FooterContent; onUpdate: (c: Partial<FooterContent>) => void }) {
  const columns = content.columns || [];

  return (
    <div className="bg-muted/30 rounded-lg p-6">
      <div className="grid grid-cols-4 gap-4 mb-4">
        {Array.from({ length: 4 }).map((_, i) => {
          const col = columns[i];
          return (
            <div key={i}>
              <h4 className="font-semibold text-sm mb-2">{col?.title || `Column ${i + 1}`}</h4>
              <div className="space-y-1">
                {(col?.links || [{ label: 'Link 1' }, { label: 'Link 2' }]).slice(0, 3).map((link, j) => (
                  <p key={j} className="text-xs text-muted-foreground">{link.label}</p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t pt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          <InlineEdit value={content.text || '© 2024 Your Company'} onChange={(v) => onUpdate({ text: v })} placeholder="Copyright text" />
        </p>
        {content.showSocialLinks && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-muted" />
            <div className="w-6 h-6 rounded-full bg-muted" />
            <div className="w-6 h-6 rounded-full bg-muted" />
          </div>
        )}
      </div>
    </div>
  );
}

// Card Slideshow Preview
function CardSlideshowEditablePreview({ content }: { content: CardSlideshowContent }) {
  const cards = content.cards || [];

  return (
    <div className="relative">
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => {
          const card = cards[i] || { title: `Card ${i + 1}`, description: 'Card description', imageUrl: undefined };
          return (
            <div key={i} className="w-1/3 shrink-0 bg-muted/30 rounded-lg p-4">
              <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlaceholder className="w-full h-full" />
                )}
              </div>
              <h4 className="font-medium text-sm mb-1">{card.title}</h4>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </div>
          );
        })}
      </div>
      <button className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background shadow flex items-center justify-center">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background shadow flex items-center justify-center">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// Banner Slideshow Preview
function BannerSlideshowEditablePreview({ content }: { content: BannerSlideshowContent }) {
  const slides = content.slides || [];
  const currentSlide = slides[0] || { title: 'Banner Title', subtitle: 'Banner subtitle', imageUrl: '' };

  return (
    <div className="relative">
      <div className="aspect-[21/9] bg-muted rounded-lg overflow-hidden relative">
        {currentSlide.imageUrl ? (
          <img src={currentSlide.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-2">{currentSlide.title}</h2>
            <p className="text-sm opacity-80">{currentSlide.subtitle}</p>
          </div>
        </div>
      </div>
      <button className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow">
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {Array.from({ length: Math.min(slides.length || 3, 3) }).map((_, i) => (
          <div key={i} className={cn("w-2 h-2 rounded-full", i === 0 ? "bg-white" : "bg-white/50")} />
        ))}
      </div>
    </div>
  );
}

// ============ MAIN COMPONENT ============

export function EditablePreview({ section, onUpdate }: EditablePreviewProps) {
  const content = section.content as any;

  switch (section.section_type) {
    case 'text':
      return <TextEditablePreview content={content as TextContent} onUpdate={onUpdate} />;
    case 'image':
      return <ImageEditablePreview content={content as ImageContent} onUpdate={onUpdate} />;
    case 'image_with_text':
      return <ImageWithTextEditablePreview content={content as ImageWithTextContent} section={section} onUpdate={onUpdate} />;
    case 'gallery':
      return <GalleryEditablePreview content={content as GalleryContent} section={section} />;
    case 'video':
      return <VideoEditablePreview content={content as VideoContent} />;
    case 'headline':
      return <HeadlineEditablePreview content={content as HeadlineContent} onUpdate={onUpdate} />;
    case 'divider':
      return <DividerEditablePreview content={content as DividerContent} section={section} />;
    case 'newsletter':
      return <NewsletterEditablePreview content={content as NewsletterContent} onUpdate={onUpdate} />;
    case 'testimonials':
      return <TestimonialsEditablePreview content={content as TestimonialsContent} section={section} />;
    case 'contact_us':
      return <ContactEditablePreview content={content as ContactUsContent} section={section} onUpdate={onUpdate} />;
    case 'faq':
      return <FAQEditablePreview content={content as FAQContent} section={section} />;
    case 'about_me':
      return <AboutMeEditablePreview content={content as AboutMeContent} onUpdate={onUpdate} />;
    case 'sliding_banner':
      return <SlidingBannerEditablePreview content={content as SlidingBannerContent} onUpdate={onUpdate} />;
    case 'slideshow':
      return <SlideshowEditablePreview content={content as SlideshowContent} />;
    case 'basic_list':
      return <BasicListEditablePreview content={content as BasicListContent} section={section} />;
    case 'featured_product':
      return <FeaturedProductEditablePreview content={content as FeaturedProductContent} />;
    case 'logo_list':
      return <LogoListEditablePreview content={content as LogoListContent} />;
    case 'collection':
      return <CollectionEditablePreview content={content as CollectionContent} />;
    case 'footer':
      return <FooterEditablePreview content={content as FooterContent} onUpdate={onUpdate} />;
    case 'card_slideshow':
      return <CardSlideshowEditablePreview content={content as CardSlideshowContent} />;
    case 'banner_slideshow':
      return <BannerSlideshowEditablePreview content={content as BannerSlideshowContent} />;
    default:
      return (
        <div className="p-4 bg-muted/30 rounded-lg text-center text-muted-foreground">
          <p className="text-sm">Preview for "{section.section_type}" section</p>
        </div>
      );
  }
}
