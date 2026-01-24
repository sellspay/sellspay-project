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
  
  return (
    <div 
      className={cn(
        alignment === 'center' && 'text-center',
        alignment === 'right' && 'text-right',
        alignment === 'left' && 'text-left',
        fontClass
      )}
      style={customFontStyle}
    >
      {content.title && (
        <h3 className="text-xl font-semibold mb-2">{content.title}</h3>
      )}
      <p className="text-muted-foreground whitespace-pre-wrap">{content.body}</p>
    </div>
  );
});
TextPreview.displayName = 'TextPreview';

// Image Section Preview
const ImagePreview = memo(({ content }: { content: ImageContent }) => {
  if (!content.imageUrl) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">No image selected</span>
      </div>
    );
  }
  
  return (
    <figure className={`${content.layout === 'small' ? 'max-w-md mx-auto' : content.layout === 'medium' ? 'max-w-2xl mx-auto' : ''}`}>
      <img
        src={content.imageUrl}
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

// Gallery Preview
const GalleryPreview = memo(({ content }: { content: GalleryContent }) => {
  if (content.images.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">No images in gallery</span>
      </div>
    );
  }
  
  return (
    <div className={`grid gap-4 grid-cols-${content.columns}`} style={{ gridTemplateColumns: `repeat(${content.columns}, 1fr)` }}>
      {content.images.map((img, i) => (
        <img
          key={i}
          src={img.url}
          alt={img.altText || ''}
          className="w-full aspect-square object-cover rounded-lg"
        />
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

// About Me Preview
const AboutMePreview = memo(({ content }: { content: AboutMeContent }) => (
  <div className="flex flex-col md:flex-row gap-6 items-start">
    {content.showAvatar && (
      <Avatar className="h-20 w-20 flex-shrink-0">
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
  const sizeClasses = {
    small: 'text-2xl',
    medium: 'text-3xl md:text-4xl',
    large: 'text-4xl md:text-5xl lg:text-6xl',
  };
  
  return (
    <h2 className={`font-bold text-center ${sizeClasses[content.size]}`}>
      {content.text}
    </h2>
  );
});
HeadlinePreview.displayName = 'HeadlinePreview';

// Sliding Banner Preview
const SlidingBannerPreview = memo(({ content }: { content: SlidingBannerContent }) => {
  const speedClasses = {
    slow: 'animate-[marquee_20s_linear_infinite]',
    medium: 'animate-[marquee_12s_linear_infinite]',
    fast: 'animate-[marquee_6s_linear_infinite]',
  };
  
  return (
    <div className="overflow-hidden py-2 bg-primary/10 rounded-lg">
      <div className={`whitespace-nowrap ${speedClasses[content.speed]}`}>
        <span className="inline-block px-4 text-foreground font-medium">
          {content.text}
        </span>
        <span className="inline-block px-4 text-foreground font-medium">
          {content.text}
        </span>
      </div>
      <style>{`
        @keyframes marquee {
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

// Basic List Preview
const BasicListPreview = memo(({ content }: { content: BasicListContent }) => (
  <div>
    {content.title && (
      <h3 className="text-xl font-semibold mb-4">{content.title}</h3>
    )}
    <ul className={content.style === 'numbered' ? 'list-decimal' : content.style === 'bullet' ? 'list-disc' : ''} style={{ listStylePosition: 'inside' }}>
      {content.items.map((item, index) => (
        <li key={item.id} className="py-1 text-muted-foreground">
          {item.text}
        </li>
      ))}
    </ul>
  </div>
));
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
      return <ImagePreview content={section.content as ImageContent} />;
    case 'image_with_text':
      return <ImageWithTextPreview section={section} />;
    case 'gallery':
      return <GalleryPreview content={section.content as GalleryContent} />;
    case 'video':
      return <VideoPreview content={section.content as VideoContent} />;
    case 'collection':
      return <CollectionPreview content={section.content as CollectionContent} />;
    case 'about_me':
      return <AboutMePreview content={section.content as AboutMeContent} />;
    case 'headline':
      return <HeadlinePreview content={section.content as HeadlineContent} />;
    case 'sliding_banner':
      return <SlidingBannerPreview content={section.content as SlidingBannerContent} />;
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
      return <BasicListPreview content={section.content as BasicListContent} />;
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
