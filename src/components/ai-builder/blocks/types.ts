 // AI Builder Block System Types
 
 export interface AITheme {
   mode: 'dark' | 'light';
   accent: string; // HSL values like "262 83% 58%"
   radius: number; // in px
   spacing: 'compact' | 'balanced' | 'roomy';
   font: 'inter' | 'geist' | 'system' | 'serif';
 }
 
 export interface BlockProps<T = Record<string, unknown>> {
   id: string;
   props: T;
   theme: AITheme;
 }
 
 // Hero Block
 export interface HeroProps {
   headline: string;
   subheadline?: string;
   ctaText?: string;
   ctaUrl?: string;
   backgroundImage?: string;
   backgroundVideo?: string;
   overlayOpacity?: number; // 0-100
   alignment?: 'left' | 'center' | 'right';
   size?: 'default' | 'large' | 'fullscreen';
 }
 
 // Bento Grid Block
 export interface BentoGridProps {
   title?: string;
   items: Array<{
     id: string;
     title: string;
     description?: string;
     icon?: string;
     span?: 'normal' | 'wide' | 'tall';
     image?: string;
   }>;
 }
 
 // Featured Products Block
 export interface FeaturedProductsProps {
   title?: string;
   subtitle?: string;
   productIds?: string[];
   layout?: 'grid' | 'carousel' | 'list';
   columns?: 2 | 3 | 4;
 }
 
 // Testimonials Block
 export interface TestimonialsProps {
   title?: string;
   items: Array<{
     id: string;
     quote: string;
     name: string;
     role?: string;
     avatar?: string;
     rating?: number;
   }>;
   layout?: 'grid' | 'carousel' | 'stacked';
 }
 
 // FAQ Block
 export interface FAQProps {
   title?: string;
   items: Array<{
     id: string;
     question: string;
     answer: string;
   }>;
   layout?: 'accordion' | 'grid';
 }
 
 // CTA Strip Block
 export interface CTAStripProps {
   headline: string;
   subheadline?: string;
   ctaText: string;
   ctaUrl?: string;
   variant?: 'default' | 'gradient' | 'outline';
 }
 
 // Gallery Block
 export interface GalleryProps {
   title?: string;
   items: Array<{
     id: string;
     url: string;
     alt?: string;
     caption?: string;
   }>;
   columns?: 2 | 3 | 4;
   aspectRatio?: 'square' | 'video' | 'portrait';
 }
 
 // Video Section Block
 export interface VideoSectionProps {
   title?: string;
   videoUrl: string;
   poster?: string;
   autoplay?: boolean;
   loop?: boolean;
   overlay?: boolean;
 }
 
 // About Section Block
 export interface AboutProps {
   title?: string;
   description: string;
   image?: string;
   layout?: 'left' | 'right' | 'center';
   showSocials?: boolean;
 }
 
 // Stats Block
 export interface StatsProps {
   items: Array<{
     id: string;
     value: string;
     label: string;
     icon?: string;
   }>;
   layout?: 'row' | 'grid';
 }
 
 // Block Registry Entry
 export interface BlockRegistryEntry {
   type: string;
   name: string;
   description: string;
   category: 'hero' | 'content' | 'social-proof' | 'conversion' | 'media';
   maxPerPage?: number;
   defaultProps: Record<string, unknown>;
 }
 
 // Full Layout Type
 export interface AILayout {
   theme: AITheme;
   blocks: Array<{
     id: string;
     type: string;
     props: Record<string, unknown>;
   }>;
 }