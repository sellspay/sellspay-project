import React, { memo } from 'react';
import { ProfileSection, TextContent, ImageContent, ImageWithTextContent, GalleryContent, VideoContent, CollectionContent, AboutMeContent, HeadlineContent, SlidingBannerContent, DividerContent, TestimonialsContent, FAQContent, NewsletterContent, SlideshowContent, BasicListContent, FeaturedProductContent, LogoListContent, ContactUsContent, FooterContent } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronRight, ChevronLeft, Quote, Mail, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFontClassName, getCustomFontStyle, useCustomFont } from '../hooks/useCustomFont';

interface SectionPreviewContentProps {
  section: ProfileSection;
}

// Text Section Preview
const TextPreview = memo(({ content }: { content: TextContent }) => {
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
        alignment === 'center' && 'text-center',
        alignment === 'right' && 'text-right',
        alignment === 'left' && 'text-left',
        fontClass,
        fontSizeClasses[content.fontSize || 'base'],
        fontWeightClasses[content.fontWeight || 'normal']
      )}
      style={combinedStyle}
    >
      {content.title && (
        <h3 className="text-xl font-semibold mb-2">{content.title}</h3>
      )}
      <p className="whitespace-pre-wrap" style={{ color: content.textColor || undefined }}>{content.body}</p>
    </div>
  );
});
TextPreview.displayName = 'TextPreview';

// Image Section Preview - supports single, 2-split, and 4-split layouts
const ImagePreview = memo(({ section }: { section: ProfileSection }) => {
  const content = section.content as ImageContent;
  const preset = section.style_options?.preset;
  const imageCount = content.imageCount || 1;
  
  // Parse images - imageUrl can be a single URL or comma-separated for multi-image
  const images = content.imageUrl 
    ? content.imageUrl.split(',').map(url => url.trim()).filter(Boolean)
    : [];

  // Placeholder component for empty slots
  const ImagePlaceholder = ({ index, className }: { index: number; className?: string }) => (
    <div className={cn(
      "bg-muted/50 rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/20",
      className
    )}>
      <span className="text-muted-foreground/50 text-sm font-medium">Image {index}</span>
    </div>
  );

  // 4 Images Grid (style4)
  if (preset === 'style4' || imageCount === 4) {
    const slots = Array.from({ length: 4 }, (_, i) => images[i] || null);
    return (
      <div className="grid grid-cols-2 gap-2">
        {slots.map((url, i) => (
          <div key={i} className="aspect-square rounded-lg overflow-hidden">
            {url ? (
              <img src={url} alt={content.altText || ''} className="w-full h-full object-cover" />
            ) : (
              <ImagePlaceholder index={i + 1} className="w-full h-full" />
            )}
          </div>
        ))}
      </div>
    );
  }

  // 2 Images Split (style3)
  if (preset === 'style3' || imageCount === 2) {
    const slots = Array.from({ length: 2 }, (_, i) => images[i] || null);
    return (
      <div className="flex gap-2">
        {slots.map((url, i) => (
          <div key={i} className="flex-1 aspect-video rounded-lg overflow-hidden">
            {url ? (
              <img src={url} alt={content.altText || ''} className="w-full h-full object-cover" />
            ) : (
              <ImagePlaceholder index={i + 1} className="w-full h-full" />
            )}
          </div>
        ))}
      </div>
    );
  }

  // Centered (style2) - medium width
  if (preset === 'style2' || content.layout === 'medium') {
    if (!images[0]) {
      return (
        <div className="max-w-2xl mx-auto aspect-video bg-muted rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground">No image selected</span>
        </div>
      );
    }
    return (
      <figure className="max-w-2xl mx-auto">
        <img
          src={images[0]}
          alt={content.altText || ''}
          className="w-full h-auto rounded-lg"
        />
        {content.caption && (
          <figcaption className="mt-2 text-sm text-center text-muted-foreground">
            {content.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // Full Width (default/style1)
  if (!images[0]) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">No image selected</span>
      </div>
    );
  }
  
  return (
    <figure className={`${content.layout === 'small' ? 'max-w-md mx-auto' : ''}`}>
      <img
        src={images[0]}
        alt={content.altText || ''}
        className="w-full h-auto rounded-lg"
      />
      {content.caption && (
        <figcaption className="mt-2 text-sm text-center text-muted-foreground">
          {content.caption}
        </figcaption>
      )}
    </figure>
  );
});
ImagePreview.displayName = 'ImagePreview';

// Image With Text Preview - uses preset to guarantee the correct layout is rendered
const ImageWithTextPreview = memo(({ section }: { section: ProfileSection }) => {
  const content = section.content as ImageWithTextContent;
  const preset = section.style_options?.preset;

  const resolvedLayout: ImageWithTextContent['layout'] =
    (preset === 'style1' ? 'hero' : preset === 'style4' ? 'overlay' : 'side-by-side');
  const resolvedImagePosition: ImageWithTextContent['imagePosition'] =
    (preset === 'style3' ? 'right' : 'left');

  const layout = content.layout || resolvedLayout || 'side-by-side';
  const imagePosition = content.imagePosition || resolvedImagePosition;
  
  // Compute the button href based on link type
  const getButtonHref = () => {
    if (!content.buttonText) return undefined;
    switch (content.buttonLinkType) {
      case 'product':
        return content.buttonProductId ? `/product/${content.buttonProductId}` : undefined;
      case 'profile':
        return '/profile';
      case 'external':
      default:
        return content.buttonUrl || undefined;
    }
  };
  
  const buttonHref = getButtonHref();
  const ButtonElement = buttonHref ? (
    <Button asChild>
      <a href={buttonHref} target={content.buttonLinkType === 'external' ? '_blank' : '_self'} rel="noopener noreferrer">
        {content.buttonText}
      </a>
    </Button>
  ) : content.buttonText ? (
    <Button>{content.buttonText}</Button>
  ) : null;
  
  // Hero Banner layout (style1)
  if (layout === 'hero') {
    return (
      <div className="relative min-h-[300px] rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
        {content.imageUrl && (
          <img src={content.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[300px] text-center p-8">
          <h3 className="text-3xl font-bold mb-4">{content.title}</h3>
          <p className="text-muted-foreground mb-6 max-w-lg">{content.body}</p>
          {ButtonElement}
        </div>
      </div>
    );
  }
  
  // Overlay Text layout (style4)
  if (layout === 'overlay') {
    return (
      <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted-foreground/20">
        {content.imageUrl && (
          <img src={content.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background/90 to-transparent">
          <h3 className="text-2xl font-bold mb-2">{content.title}</h3>
          <p className="text-muted-foreground mb-4">{content.body}</p>
          {ButtonElement && React.cloneElement(ButtonElement, { variant: 'secondary' })}
        </div>
      </div>
    );
  }
  
  // Side-by-side layout (style2 & style3)
  return (
    <div className={`flex flex-col md:flex-row gap-8 items-center ${imagePosition === 'right' ? 'md:flex-row-reverse' : ''}`}>
      <div className="flex-1">
        {content.imageUrl ? (
          <img src={content.imageUrl} alt="" className="w-full h-auto rounded-lg" />
        ) : (
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-2xl font-bold mb-4">{content.title}</h3>
        <p className="text-muted-foreground mb-6">{content.body}</p>
        {ButtonElement}
      </div>
    </div>
  );
});
ImageWithTextPreview.displayName = 'ImageWithTextPreview';

// Gallery Preview - Updated to handle presets (Issue #5 fix)
const GalleryPreview = memo(({ section }: { section: ProfileSection }) => {
  const content = section.content as GalleryContent;
  const preset = section.style_options?.preset || 'style1';
  const images = content.images || [];

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">No images in gallery</span>
      </div>
    );
  }

  // Image placeholder component
  const ImagePlaceholder = ({ label, className }: { label?: number; className?: string }) => (
    <div className={cn(
      "bg-muted/50 rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/20",
      className
    )}>
      {label !== undefined ? (
        <span className="text-muted-foreground/50 text-xs font-medium">{label}</span>
      ) : null}
    </div>
  );

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
});
GalleryPreview.displayName = 'GalleryPreview';

// Video Preview
const VideoPreview = memo(({ content }: { content: VideoContent }) => {
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };
  
  const videoId = content.videoUrl ? getYouTubeId(content.videoUrl) : null;
  
  return (
    <div>
      {content.title && (
        <h3 className="text-xl font-semibold mb-4">{content.title}</h3>
      )}
      {videoId ? (
        <div className="aspect-video rounded-lg overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground">Enter a YouTube URL</span>
        </div>
      )}
      {content.description && (
        <p className="mt-4 text-muted-foreground">{content.description}</p>
      )}
    </div>
  );
});
VideoPreview.displayName = 'VideoPreview';

// Collection Preview
const CollectionPreview = memo(({ content }: { content: CollectionContent }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Product {i}</span>
      </div>
    ))}
  </div>
));
CollectionPreview.displayName = 'CollectionPreview';

// About Me Preview - Updated to support custom image (Issue #3 fix)
const AboutMePreview = memo(({ content }: { content: AboutMeContent }) => (
  <div className="flex flex-col md:flex-row gap-6 items-start">
    {content.showAvatar && (
      <Avatar className="h-20 w-20 flex-shrink-0">
        {content.imageUrl ? (
          <AvatarImage src={content.imageUrl} alt="About me" className="object-cover" />
        ) : null}
        <AvatarFallback className="text-2xl bg-primary/10">A</AvatarFallback>
      </Avatar>
    )}
    <div>
      <h3 className="text-xl font-semibold mb-2">{content.title}</h3>
      <p className="text-muted-foreground whitespace-pre-wrap">{content.description}</p>
    </div>
  </div>
));
AboutMePreview.displayName = 'AboutMePreview';

// Headline Preview
const HeadlinePreview = memo(({ content }: { content: HeadlineContent }) => {
  const fontClass = getFontClassName(content.font);
  const customFontStyle = getCustomFontStyle(content.customFont);
  
  // Inject custom font if needed
  useCustomFont(content.customFont);
  
  const sizeClasses = {
    small: 'text-2xl',
    medium: 'text-3xl md:text-4xl',
    large: 'text-4xl md:text-5xl lg:text-6xl',
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
    <h2 
      className={cn(
        "text-center",
        sizeClasses[content.size],
        fontClass,
        fontWeightClasses[content.fontWeight || 'bold']
      )}
      style={combinedStyle}
    >
      {content.text}
    </h2>
  );
});
HeadlinePreview.displayName = 'HeadlinePreview';

// Sliding Banner Preview - with visible marquee animation
const SlidingBannerPreview = memo(({ content, preset }: { content: SlidingBannerContent; preset?: string }) => {
  const fontClass = getFontClassName(content.font);
  const customFontStyle = getCustomFontStyle(content.customFont);
  
  // Inject custom font if needed
  useCustomFont(content.customFont);
  
  const speedDuration = {
    slow: '20s',
    medium: '12s',
    fast: '6s',
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

  // Highlight style for style2 preset - static centered banner
  const isHighlight = preset === 'style2';
  
  if (isHighlight) {
    return (
      <div 
        className="py-4 rounded-lg text-center"
        style={{ 
          background: content.backgroundColor || 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(45 100% 60% / 0.2))'
        }}
      >
        <span 
          className={cn(
            fontClass,
            fontSizeClasses[content.fontSize || 'lg'],
            fontWeightClasses[content.fontWeight || 'bold']
          )}
          style={combinedStyle}
        >
          {content.text}
        </span>
      </div>
    );
  }
  
  return (
    <div 
      className="overflow-hidden py-3 rounded-lg"
      style={{ backgroundColor: content.backgroundColor || 'hsl(var(--primary) / 0.1)' }}
    >
      <div 
        className="flex whitespace-nowrap"
        style={{
          animation: `sliding-banner-marquee ${speedDuration[content.speed]} linear infinite`,
        }}
      >
        {/* Repeat text 4 times to ensure seamless loop */}
        {[0, 1, 2, 3].map((i) => (
          <span 
            key={i}
            className={cn(
              "inline-block px-8",
              fontClass,
              fontSizeClasses[content.fontSize || 'base'],
              fontWeightClasses[content.fontWeight || 'medium']
            )}
            style={combinedStyle}
          >
            {content.text}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes sliding-banner-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
});
SlidingBannerPreview.displayName = 'SlidingBannerPreview';

// Divider Preview
const DividerPreview = memo(({ content }: { content: DividerContent }) => {
  if (content.style === 'space') {
    return <div className="h-8" />;
  }
  
  if (content.style === 'dots') {
    return (
      <div className="flex justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
      </div>
    );
  }
  
  return <hr className="border-t border-border" />;
});
DividerPreview.displayName = 'DividerPreview';

// Testimonials Preview
const TestimonialsPreview = memo(({ content }: { content: TestimonialsContent }) => {
  if (content.testimonials.length === 0) {
    return (
      <div className="text-center py-8">
        {content.title && (
          <h3 className="text-xl font-semibold mb-4">{content.title}</h3>
        )}
        <p className="text-muted-foreground">No testimonials added yet</p>
      </div>
    );
  }
  
  return (
    <div>
      {content.title && (
        <h3 className="text-xl font-semibold mb-6 text-center">{content.title}</h3>
      )}
      <div className={`grid gap-6 ${content.layout === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : ''}`}>
        {content.testimonials.map((testimonial) => (
          <div key={testimonial.id} className="bg-background/50 rounded-lg p-6 border">
            <Quote className="h-8 w-8 text-muted-foreground/30 mb-4" />
            <p className="text-foreground mb-4">{testimonial.quote}</p>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {testimonial.avatar ? (
                  <AvatarImage src={testimonial.avatar} />
                ) : (
                  <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="font-medium text-sm">{testimonial.name}</p>
                {testimonial.role && (
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
TestimonialsPreview.displayName = 'TestimonialsPreview';

// FAQ Preview
const FAQPreview = memo(({ content }: { content: FAQContent }) => {
  if (content.items.length === 0) {
    return (
      <div className="text-center py-8">
        {content.title && (
          <h3 className="text-xl font-semibold mb-4">{content.title}</h3>
        )}
        <p className="text-muted-foreground">No FAQ items added yet</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      {content.title && (
        <h3 className="text-xl font-semibold mb-6 text-center">{content.title}</h3>
      )}
      <Accordion type="single" collapsible className="w-full">
        {content.items.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
});
FAQPreview.displayName = 'FAQPreview';

// Newsletter Preview
const NewsletterPreview = memo(({ content }: { content: NewsletterContent }) => (
  <div className="text-center max-w-md mx-auto">
    <Mail className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
    <h3 className="text-xl font-semibold mb-2">{content.title}</h3>
    {content.subtitle && (
      <p className="text-muted-foreground mb-6">{content.subtitle}</p>
    )}
    <div className="flex gap-2">
      <Input placeholder={content.placeholder} className="flex-1" />
      <Button>{content.buttonText}</Button>
    </div>
  </div>
));
NewsletterPreview.displayName = 'NewsletterPreview';

// Slideshow Preview
const SlideshowPreview = memo(({ content }: { content: SlideshowContent }) => {
  if (content.slides.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">No slides added yet</span>
      </div>
    );
  }
  
  return (
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
      <img
        src={content.slides[0]?.imageUrl}
        alt=""
        className="w-full h-full object-cover"
      />
      {content.slides[0]?.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-white">{content.slides[0].caption}</p>
        </div>
      )}
      {content.slides.length > 1 && (
        <>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
});
SlideshowPreview.displayName = 'SlideshowPreview';

// Basic List Preview - supports simple, 3-col cards, 2-col cards, and horizontal layouts
const BasicListPreview = memo(({ section }: { section: ProfileSection }) => {
  const content = section.content as BasicListContent;
  const preset = section.style_options?.preset;
  const layout = content.layout || 'simple';
  
  // Determine layout from preset if not explicitly set
  const resolvedLayout = 
    preset === 'style1' ? 'cards-3col' :
    preset === 'style2' ? 'cards-2col' :
    preset === 'style3' ? 'horizontal' :
    layout;

  // Item placeholder for cards that need images
  const ListItemCard = ({ item, showImage = true }: { item: typeof content.items[0]; showImage?: boolean }) => (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors">
      {showImage && (
        <div className="aspect-video bg-muted flex items-center justify-center">
          {item.icon ? (
            <span className="text-3xl">{item.icon}</span>
          ) : (
            <span className="text-muted-foreground text-sm">Add image</span>
          )}
        </div>
      )}
      <div className="p-4">
        <h4 className="font-medium text-foreground">{item.text || 'Add a title'}</h4>
        <p className="text-sm text-muted-foreground mt-1">Add description here</p>
      </div>
    </div>
  );

  // 3 Column Cards Layout
  if (resolvedLayout === 'cards-3col') {
    const items = content.items.length > 0 ? content.items : [
      { id: '1', text: 'First item' },
      { id: '2', text: 'Second item' },
      { id: '3', text: 'Third item' },
    ];
    return (
      <div>
        {content.title && (
          <h3 className="text-xl font-semibold mb-6 text-center">{content.title}</h3>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.slice(0, 6).map((item) => (
            <ListItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    );
  }

  // 2 Column Cards Layout
  if (resolvedLayout === 'cards-2col') {
    const items = content.items.length > 0 ? content.items : [
      { id: '1', text: 'First item' },
      { id: '2', text: 'Second item' },
    ];
    return (
      <div>
        {content.title && (
          <h3 className="text-xl font-semibold mb-6 text-center">{content.title}</h3>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.slice(0, 4).map((item) => (
            <ListItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    );
  }

  // Horizontal List Layout
  if (resolvedLayout === 'horizontal') {
    const items = content.items.length > 0 ? content.items : [
      { id: '1', text: 'First item' },
      { id: '2', text: 'Second item' },
      { id: '3', text: 'Third item' },
    ];
    return (
      <div>
        {content.title && (
          <h3 className="text-xl font-semibold mb-6">{content.title}</h3>
        )}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                {item.icon ? (
                  <span className="text-2xl">{item.icon}</span>
                ) : (
                  <span className="text-muted-foreground text-xs">Image</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{item.text || 'Add a title'}</h4>
                <p className="text-sm text-muted-foreground">Add description here</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Simple list (default)
  return (
    <div>
      {content.title && (
        <h3 className="text-xl font-semibold mb-4">{content.title}</h3>
      )}
      <ul className={content.style === 'numbered' ? 'list-decimal' : content.style === 'bullet' ? 'list-disc' : ''} style={{ listStylePosition: 'inside' }}>
        {content.items.map((item) => (
          <li key={item.id} className="py-1 text-muted-foreground">
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
});
BasicListPreview.displayName = 'BasicListPreview';

// Featured Product Preview
const FeaturedProductPreview = memo(({ content }: { content: FeaturedProductContent }) => (
  <div className="flex flex-col md:flex-row gap-8 items-center max-w-3xl mx-auto">
    <div className="flex-1">
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">Product Image</span>
      </div>
    </div>
    <div className="flex-1">
      <h3 className="text-2xl font-bold mb-2">Featured Product</h3>
      {content.showDescription && (
        <p className="text-muted-foreground mb-4">Product description goes here...</p>
      )}
      {content.showPrice && (
        <p className="text-xl font-semibold mb-4">$29.99</p>
      )}
      <Button>{content.buttonText}</Button>
    </div>
  </div>
));
FeaturedProductPreview.displayName = 'FeaturedProductPreview';

// Logo List Preview
const LogoListPreview = memo(({ content }: { content: LogoListContent }) => (
  <div className="text-center">
    {content.title && (
      <h3 className="text-lg font-medium mb-6 text-muted-foreground">{content.title}</h3>
    )}
    {content.logos.length === 0 ? (
      <p className="text-muted-foreground">No logos added yet</p>
    ) : (
      <div className="flex flex-wrap justify-center items-center gap-8">
        {content.logos.map((logo) => (
          <img
            key={logo.id}
            src={logo.imageUrl}
            alt={logo.altText || ''}
            className={`h-12 object-contain ${content.grayscale ? 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all' : ''}`}
          />
        ))}
      </div>
    )}
  </div>
));
LogoListPreview.displayName = 'LogoListPreview';

// Contact Us Preview
const ContactUsPreview = memo(({ content }: { content: ContactUsContent }) => (
  <div className="text-center max-w-md mx-auto">
    <Send className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
    <h3 className="text-xl font-semibold mb-2">{content.title}</h3>
    {content.subtitle && (
      <p className="text-muted-foreground mb-6">{content.subtitle}</p>
    )}
    {content.showForm && (
      <div className="space-y-4">
        <Input placeholder="Your name" />
        <Input placeholder="Your email" type="email" />
        <textarea
          className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Your message"
        />
        <Button className="w-full">Send Message</Button>
      </div>
    )}
    {content.email && !content.showForm && (
      <a href={`mailto:${content.email}`} className="text-primary hover:underline">
        {content.email}
      </a>
    )}
  </div>
));
ContactUsPreview.displayName = 'ContactUsPreview';

// Footer Preview
const FooterPreview = memo(({ content }: { content: FooterContent }) => (
  <div className="bg-card text-foreground rounded-lg p-6 border border-border">
    {content.columns.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {content.columns.map((column) => (
          <div key={column.id}>
            <h4 className="font-semibold mb-3">{column.title}</h4>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.id}>
                  <a 
                    href={link.url} 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )}
    
    {content.showSocialLinks && (
      <div className="flex justify-center gap-4 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 transition-colors" />
        ))}
      </div>
    )}
    
    <div className="text-center text-sm text-muted-foreground border-t border-border pt-4">
      {content.text}
    </div>
  </div>
));
FooterPreview.displayName = 'FooterPreview';

// Main Section Preview Content Component
export const SectionPreviewContent = memo(({ section }: SectionPreviewContentProps) => {
  switch (section.section_type) {
    case 'text':
      return <TextPreview content={section.content as TextContent} />;
    case 'image':
      return <ImagePreview section={section} />;
    case 'image_with_text':
      return <ImageWithTextPreview section={section} />;
    case 'gallery':
      return <GalleryPreview section={section} />;
    case 'video':
      return <VideoPreview content={section.content as VideoContent} />;
    case 'collection':
      return <CollectionPreview content={section.content as CollectionContent} />;
    case 'about_me':
      return <AboutMePreview content={section.content as AboutMeContent} />;
    case 'headline':
      return <HeadlinePreview content={section.content as HeadlineContent} />;
    case 'sliding_banner':
      return <SlidingBannerPreview content={section.content as SlidingBannerContent} preset={section.style_options?.preset} />;
    case 'divider':
      return <DividerPreview content={section.content as DividerContent} />;
    case 'testimonials':
      return <TestimonialsPreview content={section.content as TestimonialsContent} />;
    case 'faq':
      return <FAQPreview content={section.content as FAQContent} />;
    case 'newsletter':
      return <NewsletterPreview content={section.content as NewsletterContent} />;
    case 'slideshow':
      return <SlideshowPreview content={section.content as SlideshowContent} />;
    case 'basic_list':
      return <BasicListPreview section={section} />;
    case 'featured_product':
      return <FeaturedProductPreview content={section.content as FeaturedProductContent} />;
    case 'logo_list':
      return <LogoListPreview content={section.content as LogoListContent} />;
    case 'contact_us':
      return <ContactUsPreview content={section.content as ContactUsContent} />;
    case 'footer':
      return <FooterPreview content={section.content as FooterContent} />;
    default:
      return <div className="text-muted-foreground">Unknown section type</div>;
  }
});

SectionPreviewContent.displayName = 'SectionPreviewContent';
