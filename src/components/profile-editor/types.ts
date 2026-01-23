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
  | 'divider';

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

export interface DividerContent {
  style: 'line' | 'space' | 'dots';
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
  | DividerContent;

export interface ProfileSection {
  id: string;
  profile_id: string;
  section_type: SectionType;
  display_order: number;
  content: SectionContent;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface SectionTemplate {
  type: SectionType;
  name: string;
  description: string;
  icon: string;
  defaultContent: SectionContent;
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    type: 'text',
    name: 'Text',
    description: 'Add a text block with heading and body',
    icon: 'Type',
    defaultContent: {
      title: 'Your Heading',
      body: 'Add your text here...',
      alignment: 'left',
    } as TextContent,
  },
  {
    type: 'image',
    name: 'Image',
    description: 'Add a single image',
    icon: 'Image',
    defaultContent: {
      imageUrl: '',
      altText: '',
      caption: '',
      layout: 'full',
    } as ImageContent,
  },
  {
    type: 'image_with_text',
    name: 'Image With Text',
    description: 'Image alongside text content',
    icon: 'LayoutList',
    defaultContent: {
      imageUrl: '',
      title: 'Make It Happen',
      body: 'Share your brand story with bold headlines. Choose a background image and add a button to link to your landing page.',
      imagePosition: 'left',
      buttonText: 'Shop Now',
      buttonUrl: '',
    } as ImageWithTextContent,
  },
  {
    type: 'gallery',
    name: 'Gallery',
    description: 'Display multiple images in a grid',
    icon: 'LayoutGrid',
    defaultContent: {
      images: [],
      columns: 3,
    } as GalleryContent,
  },
  {
    type: 'video',
    name: 'Video',
    description: 'Embed a YouTube video',
    icon: 'Play',
    defaultContent: {
      videoUrl: '',
      title: 'Video Heading',
      description: '',
    } as VideoContent,
  },
  {
    type: 'collection',
    name: 'Collection',
    description: 'Display products from a collection',
    icon: 'Layers',
    defaultContent: {
      collectionId: '',
      displayStyle: 'grid',
    } as CollectionContent,
  },
  {
    type: 'about_me',
    name: 'About Me',
    description: 'Personal introduction section',
    icon: 'User',
    defaultContent: {
      title: 'About Me',
      description: 'Welcome to my store! Here you can find...',
      showAvatar: true,
    } as AboutMeContent,
  },
  {
    type: 'headline',
    name: 'Headline',
    description: 'Large text headline',
    icon: 'Heading',
    defaultContent: {
      text: 'Your Headline Here',
      size: 'large',
    } as HeadlineContent,
  },
  {
    type: 'divider',
    name: 'Divider',
    description: 'Visual separator between sections',
    icon: 'Minus',
    defaultContent: {
      style: 'line',
    } as DividerContent,
  },
];
