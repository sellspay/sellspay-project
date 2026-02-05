 import type { BlockRegistryEntry } from './types';
 
 /**
 * Block Registry - defines all available blocks for the AI Builder.
 * The AI uses this to understand what blocks are available and their default props.
 */
 export const BLOCK_REGISTRY: BlockRegistryEntry[] = [
   {
     type: 'hero',
     name: 'Hero Section',
     description: 'Large hero section with headline, subheadline, CTA, and optional background media',
     category: 'hero',
     maxPerPage: 1,
     defaultProps: {
       headline: 'Your Headline Here',
       subheadline: '',
       ctaText: 'Get Started',
       alignment: 'center',
       size: 'default',
       overlayOpacity: 60,
     },
   },
   {
    type: 'featured_products',
    name: 'Featured Products',
    description: 'Product grid or carousel showing featured items from the store',
    category: 'content',
    maxPerPage: 2,
    defaultProps: {
      title: 'Featured Products',
      subtitle: '',
      layout: 'grid',
      columns: 3,
      productIds: [],
    },
  },
  {
    type: 'collection_grid',
    name: 'Collection Grid',
    description: 'Display products from a specific collection',
    category: 'content',
    maxPerPage: 2,
    defaultProps: {
      title: '',
      collectionId: '',
      columns: 3,
    },
  },
  {
     type: 'bento_grid',
     name: 'Bento Grid',
     description: 'Grid of feature/benefit cards with icons, titles, and descriptions',
     category: 'content',
     maxPerPage: 2,
     defaultProps: {
       title: '',
       items: [],
     },
   },
   {
     type: 'testimonials',
     name: 'Testimonials',
     description: 'Customer testimonials with quotes, names, roles, and optional avatars/ratings',
     category: 'social-proof',
     maxPerPage: 2,
     defaultProps: {
       title: 'What People Say',
       items: [],
       layout: 'grid',
     },
   },
   {
     type: 'faq',
     name: 'FAQ',
     description: 'Frequently asked questions section with accordion or grid layout',
     category: 'content',
     maxPerPage: 1,
     defaultProps: {
       title: 'Frequently Asked Questions',
       items: [],
       layout: 'accordion',
     },
   },
   {
     type: 'cta_strip',
     name: 'CTA Strip',
     description: 'Call-to-action banner with headline, subheadline, and button',
     category: 'conversion',
     maxPerPage: 2,
     defaultProps: {
       headline: 'Ready to get started?',
       ctaText: 'Start Now',
       variant: 'default',
     },
   },
   {
     type: 'gallery',
     name: 'Gallery',
     description: 'Image gallery grid with captions',
     category: 'media',
     maxPerPage: 2,
     defaultProps: {
       title: '',
       items: [],
       columns: 3,
       aspectRatio: 'video',
     },
   },
   {
     type: 'video_section',
     name: 'Video Section',
     description: 'Video player section with title, supports YouTube and direct video URLs',
     category: 'media',
     maxPerPage: 2,
     defaultProps: {
       title: '',
       videoUrl: '',
       autoplay: false,
       loop: true,
     },
   },
   {
     type: 'about',
     name: 'About Section',
     description: 'About section with title, description, and optional image',
     category: 'content',
     maxPerPage: 1,
     defaultProps: {
       title: 'About',
       description: '',
       layout: 'left',
     },
   },
   {
     type: 'stats',
     name: 'Stats',
     description: 'Statistics display with numbers, labels, and optional icons',
     category: 'social-proof',
     maxPerPage: 1,
     defaultProps: {
       items: [],
       layout: 'row',
     },
   },
 ];
 
 /**
 * Get a summary of the block registry for AI context
 */
 export function getBlockRegistrySummary(): string {
   return BLOCK_REGISTRY.map(
     (b) => `- ${b.type}: ${b.description} (max: ${b.maxPerPage || 'unlimited'})`
   ).join('\n');
 }
 
 /**
 * Get block schema for AI to understand props
 */
 export function getBlockSchemas(): Record<string, BlockRegistryEntry> {
   return Object.fromEntries(BLOCK_REGISTRY.map((b) => [b.type, b]));
 }