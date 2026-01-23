// Profile Editor Section Types

export type SectionType = 
  | 'text'
  | 'image'
  | 'image_with_text'
  | 'gallery'
  | 'video'
  | 'collection'
  | 'about_me'
  | 'headline'
  | 'sliding_banner'
  | 'divider'
  | 'testimonials'
  | 'faq'
  | 'newsletter'
  | 'slideshow'
  | 'basic_list'
  | 'featured_product'
  | 'logo_list'
  | 'contact_us'
  | 'footer';

// Style options for each section
export interface SectionStyleOptions {
  preset?: string;           // e.g., 'style1', 'style2', 'style3'
  backgroundColor?: string;   // solid color
  backgroundImage?: string;   // image URL
  backgroundOverlay?: number; // 0-100 opacity
  backgroundWidth?: 'contained' | 'full';
  colorScheme?: 'white' | 'light' | 'dark' | 'black' | 'highlight';
  sectionHeight?: 'small' | 'medium' | 'large';
}

export interface TextContent {
  title?: string;
  body: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface ImageContent {
  imageUrl: string;
  altText?: string;
  caption?: string;
  layout?: 'full' | 'medium' | 'small';
}

export interface ImageWithTextContent {
  imageUrl: string;
  title: string;
  body: string;
  imagePosition: 'left' | 'right';
  buttonText?: string;
  buttonUrl?: string;
}

export interface GalleryContent {
  images: {
    url: string;
    altText?: string;
  }[];
  columns: 2 | 3 | 4;
}

export interface VideoContent {
  videoUrl: string;
  title?: string;
  description?: string;
}

export interface CollectionContent {
  collectionId: string;
  displayStyle: 'grid' | 'slider';
}

export interface AboutMeContent {
  title: string;
  description: string;
  showAvatar: boolean;
}

export interface HeadlineContent {
  text: string;
  size: 'small' | 'medium' | 'large';
}

export interface SlidingBannerContent {
  text: string;
  speed: 'slow' | 'medium' | 'fast';
  backgroundColor?: string;
  textColor?: string;
}

export interface DividerContent {
  style: 'line' | 'space' | 'dots';
}

// New section content types
export interface TestimonialItem {
  id: string;
  avatar?: string;
  name: string;
  role?: string;
  quote: string;
}

export interface TestimonialsContent {
  title?: string;
  testimonials: TestimonialItem[];
  layout: 'grid' | 'slider' | 'stacked';
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQContent {
  title?: string;
  items: FAQItem[];
}

export interface NewsletterContent {
  title: string;
  subtitle?: string;
  buttonText: string;
  placeholder: string;
  successMessage?: string;
}

export interface SlideItem {
  id: string;
  imageUrl: string;
  caption?: string;
  linkUrl?: string;
}

export interface SlideshowContent {
  slides: SlideItem[];
  autoPlay: boolean;
  interval: number; // seconds
}

export interface ListItem {
  id: string;
  text: string;
  icon?: string;
}

export interface BasicListContent {
  title?: string;
  items: ListItem[];
  style: 'bullet' | 'numbered' | 'icon';
}

export interface FeaturedProductContent {
  productId: string;
  showDescription: boolean;
  showPrice: boolean;
  buttonText: string;
}

export interface LogoItem {
  id: string;
  imageUrl: string;
  altText?: string;
  linkUrl?: string;
}

export interface LogoListContent {
  title?: string;
  logos: LogoItem[];
  grayscale: boolean;
}

export interface ContactUsContent {
  title: string;
  subtitle?: string;
  email?: string;
  showForm: boolean;
  socialLinks: boolean;
}

// Footer section types
export interface FooterLink {
  id: string;
  label: string;
  url: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface FooterContent {
  text: string;
  showSocialLinks: boolean;
  columns: FooterColumn[];
  backgroundColor?: string;
}

export type SectionContent = 
  | TextContent 
  | ImageContent 
  | ImageWithTextContent 
  | GalleryContent 
  | VideoContent 
  | CollectionContent 
  | AboutMeContent 
  | HeadlineContent 
  | SlidingBannerContent
  | DividerContent
  | TestimonialsContent
  | FAQContent
  | NewsletterContent
  | SlideshowContent
  | BasicListContent
  | FeaturedProductContent
  | LogoListContent
  | ContactUsContent
  | FooterContent;

export interface ProfileSection {
  id: string;
  profile_id: string;
  section_type: SectionType;
  display_order: number;
  content: SectionContent;
  style_options: SectionStyleOptions;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface SectionTemplate {
  type: SectionType;
  name: string;
  description: string;
  icon: string;
  category: 'content' | 'media' | 'products' | 'social' | 'engagement' | 'layout';
  defaultContent: SectionContent;
  presets: SectionPreset[];
}

export interface SectionPreset {
  id: string;
  name: string;
  thumbnail?: string;
  styleOptions: SectionStyleOptions;
}

export const SECTION_CATEGORIES = [
  { id: 'content', name: 'Content', icon: 'Type' },
  { id: 'media', name: 'Media', icon: 'Image' },
  { id: 'products', name: 'Products', icon: 'ShoppingBag' },
  { id: 'social', name: 'Social Proof', icon: 'Users' },
  { id: 'engagement', name: 'Engagement', icon: 'MessageSquare' },
  { id: 'layout', name: 'Layout', icon: 'Layout' },
] as const;

export const SECTION_TEMPLATES: SectionTemplate[] = [
  // Content
  {
    type: 'text',
    name: 'Text',
    description: 'Add a text block with heading and body',
    icon: 'Type',
    category: 'content',
    defaultContent: {
      title: 'Your Heading',
      body: 'Add your text here...',
      alignment: 'left',
    } as TextContent,
    presets: [
      { id: 'style1', name: 'Clean', styleOptions: { colorScheme: 'white', sectionHeight: 'medium' } },
      { id: 'style2', name: 'Dark', styleOptions: { colorScheme: 'dark', sectionHeight: 'medium' } },
      { id: 'style3', name: 'Highlight', styleOptions: { colorScheme: 'highlight', sectionHeight: 'medium' } },
    ],
  },
  {
    type: 'headline',
    name: 'Headline',
    description: 'Large text headline',
    icon: 'Heading',
    category: 'content',
    defaultContent: {
      text: 'Your Headline Here',
      size: 'large',
    } as HeadlineContent,
    presets: [
      { id: 'style1', name: 'Bold', styleOptions: { colorScheme: 'white', sectionHeight: 'small' } },
      { id: 'style2', name: 'Dark', styleOptions: { colorScheme: 'dark', sectionHeight: 'small' } },
    ],
  },
  {
    type: 'sliding_banner',
    name: 'Sliding Banner',
    description: 'Scrolling text marquee banner',
    icon: 'MoveHorizontal',
    category: 'content',
    defaultContent: {
      text: '✨ Welcome to my store! ✨ Check out my latest products ✨ Follow for updates ✨',
      speed: 'medium',
    } as SlidingBannerContent,
    presets: [
      { id: 'style1', name: 'Default', styleOptions: { colorScheme: 'white', sectionHeight: 'small' } },
      { id: 'style2', name: 'Highlight', styleOptions: { colorScheme: 'highlight', sectionHeight: 'small' } },
      { id: 'style3', name: 'Dark', styleOptions: { colorScheme: 'dark', sectionHeight: 'small' } },
    ],
  },
  {
    type: 'about_me',
    name: 'About Me',
    description: 'Personal introduction section',
    icon: 'User',
    category: 'content',
    defaultContent: {
      title: 'About Me',
      description: 'Welcome to my store! Here you can find...',
      showAvatar: true,
    } as AboutMeContent,
    presets: [
      { id: 'style1', name: 'Card', styleOptions: { colorScheme: 'white', sectionHeight: 'medium' } },
      { id: 'style2', name: 'Full Width', styleOptions: { colorScheme: 'light', sectionHeight: 'large', backgroundWidth: 'full' } },
    ],
  },
  {
    type: 'basic_list',
    name: 'List',
    description: 'Simple bulleted or numbered list',
    icon: 'List',
    category: 'content',
    defaultContent: {
      title: 'Features',
      items: [
        { id: '1', text: 'First item' },
        { id: '2', text: 'Second item' },
        { id: '3', text: 'Third item' },
      ],
      style: 'bullet',
    } as BasicListContent,
    presets: [
      { id: 'style1', name: 'Simple', styleOptions: { colorScheme: 'white' } },
      { id: 'style2', name: 'Cards', styleOptions: { colorScheme: 'light' } },
    ],
  },
  // Media
  {
    type: 'image',
    name: 'Image',
    description: 'Add a single image',
    icon: 'Image',
    category: 'media',
    defaultContent: {
      imageUrl: '',
      altText: '',
      caption: '',
      layout: 'full',
    } as ImageContent,
    presets: [
      { id: 'style1', name: 'Full Width', styleOptions: { backgroundWidth: 'full' } },
      { id: 'style2', name: 'Contained', styleOptions: { backgroundWidth: 'contained' } },
    ],
  },
  {
    type: 'image_with_text',
    name: 'Image With Text',
    description: 'Image alongside text content',
    icon: 'LayoutList',
    category: 'media',
    defaultContent: {
      imageUrl: '',
      title: 'Make It Happen',
      body: 'Share your brand story with bold headlines. Choose a background image and add a button to link to your landing page.',
      imagePosition: 'left',
      buttonText: 'Shop Now',
      buttonUrl: '',
    } as ImageWithTextContent,
    presets: [
      { id: 'style1', name: 'Image Left', styleOptions: { colorScheme: 'white' } },
      { id: 'style2', name: 'Image Right', styleOptions: { colorScheme: 'white' } },
      { id: 'style3', name: 'Dark Mode', styleOptions: { colorScheme: 'dark' } },
    ],
  },
  {
    type: 'gallery',
    name: 'Gallery',
    description: 'Display multiple images in a grid',
    icon: 'LayoutGrid',
    category: 'media',
    defaultContent: {
      images: [],
      columns: 3,
    } as GalleryContent,
    presets: [
      { id: 'style1', name: '3 Columns', styleOptions: {} },
      { id: 'style2', name: '2 Columns', styleOptions: {} },
      { id: 'style3', name: '4 Columns', styleOptions: {} },
    ],
  },
  {
    type: 'video',
    name: 'Video',
    description: 'Embed a YouTube video',
    icon: 'Play',
    category: 'media',
    defaultContent: {
      videoUrl: '',
      title: 'Video Heading',
      description: '',
    } as VideoContent,
    presets: [
      { id: 'style1', name: 'Standard', styleOptions: { colorScheme: 'white' } },
      { id: 'style2', name: 'Theater', styleOptions: { colorScheme: 'black', sectionHeight: 'large' } },
    ],
  },
  {
    type: 'slideshow',
    name: 'Slideshow',
    description: 'Auto-rotating image carousel',
    icon: 'Images',
    category: 'media',
    defaultContent: {
      slides: [],
      autoPlay: true,
      interval: 5,
    } as SlideshowContent,
    presets: [
      { id: 'style1', name: 'Full Width', styleOptions: { backgroundWidth: 'full' } },
      { id: 'style2', name: 'Contained', styleOptions: { backgroundWidth: 'contained' } },
    ],
  },
  // Products
  {
    type: 'collection',
    name: 'Collection',
    description: 'Display products from a collection',
    icon: 'Layers',
    category: 'products',
    defaultContent: {
      collectionId: '',
      displayStyle: 'grid',
    } as CollectionContent,
    presets: [
      { id: 'style1', name: 'Grid', styleOptions: { colorScheme: 'white' } },
      { id: 'style2', name: 'Slider', styleOptions: { colorScheme: 'white' } },
    ],
  },
  {
    type: 'featured_product',
    name: 'Featured Product',
    description: 'Highlight a single product',
    icon: 'Star',
    category: 'products',
    defaultContent: {
      productId: '',
      showDescription: true,
      showPrice: true,
      buttonText: 'View Product',
    } as FeaturedProductContent,
    presets: [
      { id: 'style1', name: 'Card', styleOptions: { colorScheme: 'white' } },
      { id: 'style2', name: 'Hero', styleOptions: { colorScheme: 'dark', sectionHeight: 'large' } },
    ],
  },
  // Social Proof
  {
    type: 'testimonials',
    name: 'Testimonials',
    description: 'Customer testimonials with avatar',
    icon: 'Quote',
    category: 'social',
    defaultContent: {
      title: 'What People Say',
      testimonials: [],
      layout: 'grid',
    } as TestimonialsContent,
    presets: [
      { id: 'style1', name: 'Cards', styleOptions: { colorScheme: 'white' } },
      { id: 'style2', name: 'Slider', styleOptions: { colorScheme: 'light' } },
      { id: 'style3', name: 'Stacked', styleOptions: { colorScheme: 'white' } },
    ],
  },
  {
    type: 'logo_list',
    name: 'Logo List',
    description: 'Row of partner/client logos',
    icon: 'Building',
    category: 'social',
    defaultContent: {
      title: 'Featured In',
      logos: [],
      grayscale: true,
    } as LogoListContent,
    presets: [
      { id: 'style1', name: 'Grayscale', styleOptions: { colorScheme: 'white' } },
      { id: 'style2', name: 'Color', styleOptions: { colorScheme: 'white' } },
    ],
  },
  // Engagement
  {
    type: 'newsletter',
    name: 'Newsletter',
    description: 'Email signup form',
    icon: 'Mail',
    category: 'engagement',
    defaultContent: {
      title: 'Stay Updated',
      subtitle: 'Subscribe to get the latest updates',
      buttonText: 'Subscribe',
      placeholder: 'Enter your email',
      successMessage: 'Thanks for subscribing!',
    } as NewsletterContent,
    presets: [
      { id: 'style1', name: 'Simple', styleOptions: { colorScheme: 'white' } },
      { id: 'style2', name: 'With Background', styleOptions: { colorScheme: 'dark', sectionHeight: 'large' } },
    ],
  },
  {
    type: 'faq',
    name: 'FAQ',
    description: 'Expandable FAQ items',
    icon: 'HelpCircle',
    category: 'engagement',
    defaultContent: {
      title: 'Frequently Asked Questions',
      items: [],
    } as FAQContent,
    presets: [
      { id: 'style1', name: 'Accordion', styleOptions: { colorScheme: 'white' } },
      { id: 'style2', name: 'Cards', styleOptions: { colorScheme: 'light' } },
    ],
  },
  {
    type: 'contact_us',
    name: 'Contact',
    description: 'Contact form or info block',
    icon: 'Send',
    category: 'engagement',
    defaultContent: {
      title: 'Get In Touch',
      subtitle: 'Have questions? Reach out!',
      email: '',
      showForm: true,
      socialLinks: true,
    } as ContactUsContent,
    presets: [
      { id: 'style1', name: 'Form', styleOptions: { colorScheme: 'white' } },
      { id: 'style2', name: 'Info Only', styleOptions: { colorScheme: 'light' } },
    ],
  },
  // Layout
  {
    type: 'divider',
    name: 'Divider',
    description: 'Visual separator between sections',
    icon: 'Minus',
    category: 'layout',
    defaultContent: {
      style: 'line',
    } as DividerContent,
    presets: [
      { id: 'style1', name: 'Line', styleOptions: {} },
      { id: 'style2', name: 'Space', styleOptions: {} },
      { id: 'style3', name: 'Dots', styleOptions: {} },
    ],
  },
  {
    type: 'footer',
    name: 'Footer',
    description: 'Page footer with links and copyright',
    icon: 'LayoutGrid',
    category: 'layout',
    defaultContent: {
      text: '© 2026 Your Store. All rights reserved.',
      showSocialLinks: true,
      columns: [
        {
          id: '1',
          title: 'Quick Links',
          links: [
            { id: '1', label: 'Home', url: '/' },
            { id: '2', label: 'Products', url: '/products' },
          ],
        },
      ],
    } as FooterContent,
    presets: [
      { id: 'style1', name: 'Simple', styleOptions: { colorScheme: 'dark' } },
      { id: 'style2', name: 'Multi-Column', styleOptions: { colorScheme: 'dark' } },
      { id: 'style3', name: 'Minimal', styleOptions: { colorScheme: 'black' } },
    ],
  },
];
