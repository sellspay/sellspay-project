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
 
 // Block component map
 const BLOCKS: Record<string, React.FC<{ id: string; props: any }>> = {
   hero: HeroBlock,
   bento_grid: BentoGridBlock,
   testimonials: TestimonialsBlock,
   faq: FAQBlock,
   cta_strip: CTAStripBlock,
   gallery: GalleryBlock,
   video_section: VideoSectionBlock,
   about: AboutBlock,
   stats: StatsBlock,
 };
 
 // Fallback block for unknown types
 function FallbackBlock({ id, props }: { id: string; props: { type?: string } }) {
   return (
     <section
       style={{
         backgroundColor: 'var(--ai-muted)',
         padding: 'var(--ai-section-spacing) 2rem',
       }}
     >
       <div className="max-w-3xl mx-auto text-center">
         <p style={{ color: 'var(--ai-muted-foreground)' }} className="text-sm">
           Unknown block type: {props.type || id}
         </p>
       </div>
     </section>
   );
 }
 
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
           const BlockComponent = BLOCKS[block.type] || FallbackBlock;
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