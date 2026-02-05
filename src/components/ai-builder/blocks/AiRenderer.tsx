 import React from 'react';
 import { AIThemeProvider } from './AIThemeProvider';
 import type { AILayout, AITheme } from './types';
 
 // Block components
 import { HeroBlock } from './HeroBlock';
 import { BentoGridBlock } from './BentoGridBlock';
 import { TestimonialsBlock } from './TestimonialsBlock';
 import { FAQBlock } from './FAQBlock';
 import { CTAStripBlock } from './CTAStripBlock';
 import { GalleryBlock } from './GalleryBlock';
 import { VideoSectionBlock } from './VideoSectionBlock';
 import { AboutBlock } from './AboutBlock';
 import { StatsBlock } from './StatsBlock';
import { FeaturedProductsBlock } from './FeaturedProductsBlock';
 
// Valid block types - used for validation
export const VALID_BLOCK_TYPES = new Set([
  'hero',
  'bento_grid',
  'testimonials',
  'faq',
  'cta_strip',
  'gallery',
  'video_section',
  'about',
  'stats',
  'featured_products',
  'collection_grid',
  // Legacy section type aliases
  'headline',
  'basic_list',
  'image_with_text',
  'text',
  'about_me',
  'featured_product',
  'collection',
]);

// Block component map - maps type to component (using any for flexibility with legacy formats)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BLOCKS: Record<string, React.FC<{ id: string; props: any }>> = {
   hero: HeroBlock,
  headline: HeroBlock,
   bento_grid: BentoGridBlock,
  basic_list: BentoGridBlock,
   testimonials: TestimonialsBlock,
   faq: FAQBlock,
   cta_strip: CTAStripBlock,
   gallery: GalleryBlock,
   video_section: VideoSectionBlock,
   about: AboutBlock,
  about_me: AboutBlock,
  text: AboutBlock,
  image_with_text: AboutBlock,
   stats: StatsBlock,
  featured_products: FeaturedProductsBlock,
  featured_product: FeaturedProductsBlock,
  collection_grid: FeaturedProductsBlock,
  collection: FeaturedProductsBlock,
 };
 
 interface AiRendererProps {
   layout: AILayout;
 }
 
 /**
 * AiRenderer - renders a complete AI-generated layout with theme support.
 * Maps block types to components and wraps in theme provider.
 */
 export function AiRenderer({ layout }: AiRendererProps) {
   const { theme, blocks } = layout;
 
   return (
     <AIThemeProvider theme={theme}>
       <main
         className="min-h-screen"
         style={{
           backgroundColor: 'var(--ai-background)',
           fontFamily: 'var(--ai-font-family)',
         }}
       >
         {blocks.map((block) => {
          const BlockComponent = BLOCKS[block.type];
          
          // Skip unknown block types silently (log in dev only)
          if (!BlockComponent) {
            if (import.meta.env.DEV) {
              console.warn('[AiRenderer] Unknown block type:', block.type, block);
            }
            return null;
          }
          
           return (
             <BlockComponent
               key={block.id}
               id={block.id}
               props={{ ...block.props, type: block.type }}
             />
           );
         })}
       </main>
     </AIThemeProvider>
   );
 }
 
 /**
 * Helper to convert legacy section format to new block format
 */
 export function convertLegacySectionsToBlocks(
   sections: Array<{ id?: string; section_type: string; content?: any; style_options?: any }>
 ): AILayout['blocks'] {
   return sections.map((section, index) => ({
     id: section.id || `section-${index}`,
     type: mapLegacyTypeToBlockType(section.section_type),
     props: mapLegacyContentToProps(section.section_type, section.content, section.style_options),
   }));
 }
 
 // Map legacy section_type to new block type
 function mapLegacyTypeToBlockType(sectionType: string): string {
   const mapping: Record<string, string> = {
     headline: 'hero',
     about_me: 'about',
     testimonials: 'testimonials',
     image_with_text: 'about',
     text: 'about',
     faq: 'faq',
    basic_list: 'bento_grid',
    featured_product: 'featured_products',
    collection: 'featured_products',
    gallery: 'gallery',
   };
   return mapping[sectionType] || sectionType;
 }
 
 // Map legacy content to new block props
 function mapLegacyContentToProps(
   sectionType: string,
   content: any = {},
   styleOptions: any = {}
 ): Record<string, unknown> {
   switch (sectionType) {
     case 'headline':
       return {
         headline: content.text || content.title || 'Headline',
         subheadline: content.subtitle || '',
         ctaText: content.buttonText || '',
         alignment: 'center',
         size: 'default',
       };
     case 'about_me':
       return {
         title: content.title || 'About Me',
         description: content.description || '',
         layout: 'center',
       };
     case 'testimonials':
       return {
         title: content.title || '',
         items: (content.testimonials || []).map((t: any, i: number) => ({
           id: t.id || `testimonial-${i}`,
           quote: t.quote || '',
           name: t.name || '',
           role: t.role || '',
         })),
         layout: 'grid',
       };
     case 'faq':
       return {
         title: content.title || 'FAQ',
         items: (content.items || []).map((item: any, i: number) => ({
           id: item.id || `faq-${i}`,
           question: item.question || '',
           answer: item.answer || '',
         })),
         layout: 'accordion',
       };
     default:
       return content;
   }
 }