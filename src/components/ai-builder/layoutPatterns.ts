 /**
  * Internal layout patterns for AI Builder.
  * These are NOT templates users see - they are internal strategies the AI selects from.
  */
 
 export interface LayoutPattern {
   id: string;
   name: string;
   description: string;
   sections: Array<{
     type: string;
     purpose: string;
   }>;
   bestFor: string[];
 }
 
 export const LAYOUT_PATTERNS: LayoutPattern[] = [
   {
     id: 'creator_storefront',
     name: 'Creator Storefront',
     description: 'Classic creator store with products, social proof, and conversion elements',
     sections: [
       { type: 'headline', purpose: 'Hero with brand statement' },
       { type: 'collection', purpose: 'Featured products' },
       { type: 'basic_list', purpose: 'Benefits/features bento' },
       { type: 'testimonials', purpose: 'Social proof' },
       { type: 'faq', purpose: 'Common questions' },
       { type: 'newsletter', purpose: 'Email capture CTA' },
     ],
     bestFor: ['creators', 'influencers', 'content creators', 'youtubers'],
   },
   {
     id: 'product_launch',
     name: 'Product Launch Page',
     description: 'High-conversion single product focus with strong offer',
     sections: [
       { type: 'headline', purpose: 'Big headline with product name' },
       { type: 'featured_product', purpose: 'Product showcase' },
       { type: 'basic_list', purpose: 'Feature grid' },
       { type: 'image_with_text', purpose: 'Comparison/benefits' },
       { type: 'testimonials', purpose: 'Reviews' },
       { type: 'newsletter', purpose: 'Pricing/offer CTA' },
     ],
     bestFor: ['product launch', 'new release', 'single product', 'sales page'],
   },
   {
     id: 'portfolio',
     name: 'Portfolio / Brand Page',
     description: 'Showcase work and establish brand presence',
     sections: [
       { type: 'headline', purpose: 'Hero with name/title' },
       { type: 'gallery', purpose: 'Work samples' },
       { type: 'about_me', purpose: 'Bio and story' },
       { type: 'basic_list', purpose: 'Highlight projects' },
       { type: 'testimonials', purpose: 'Client testimonials' },
       { type: 'contact_us', purpose: 'Contact CTA' },
     ],
     bestFor: ['portfolio', 'artist', 'designer', 'freelancer', 'brand'],
   },
   {
     id: 'saas_landing',
     name: 'SaaS-Style Landing',
     description: 'Modern software/tool landing page',
     sections: [
       { type: 'headline', purpose: 'Value proposition hero' },
       { type: 'basic_list', purpose: 'Feature bento grid' },
       { type: 'image_with_text', purpose: 'Use cases' },
       { type: 'logo_list', purpose: 'Trusted by logos' },
       { type: 'testimonials', purpose: 'User testimonials' },
       { type: 'newsletter', purpose: 'Signup CTA' },
     ],
     bestFor: ['saas', 'software', 'tool', 'app', 'digital tool'],
   },
   {
     id: 'minimal_sales',
     name: 'Minimal Sales Page',
     description: 'Clean, focused sales page with minimal distraction',
     sections: [
       { type: 'headline', purpose: 'Direct hero' },
       { type: 'collection', purpose: 'Product list' },
       { type: 'basic_list', purpose: 'Guarantee/trust' },
       { type: 'faq', purpose: 'Objection handling' },
       { type: 'newsletter', purpose: 'Final CTA' },
     ],
     bestFor: ['minimal', 'simple', 'clean', 'focused'],
   },
   {
     id: 'content_hub',
     name: 'Content Creator Hub',
     description: 'Hub for content, products, and community',
     sections: [
       { type: 'headline', purpose: 'Welcome hero' },
       { type: 'slideshow', purpose: 'Latest content' },
       { type: 'collection', purpose: 'Products/merch' },
       { type: 'newsletter', purpose: 'Email capture' },
       { type: 'about_me', purpose: 'About the creator' },
     ],
     bestFor: ['content hub', 'youtube', 'podcast', 'blog'],
   },
   {
     id: 'education',
     name: 'Education / Course Page',
     description: 'Course or educational product landing',
     sections: [
       { type: 'headline', purpose: 'Course hero' },
       { type: 'basic_list', purpose: 'Curriculum overview' },
       { type: 'image_with_text', purpose: 'Benefits/outcomes' },
       { type: 'testimonials', purpose: 'Student results' },
       { type: 'faq', purpose: 'Course FAQs' },
       { type: 'newsletter', purpose: 'Enrollment CTA' },
     ],
     bestFor: ['course', 'education', 'tutorial', 'coaching', 'learning'],
   },
   {
     id: 'agency',
     name: 'Agency / Service Page',
     description: 'Professional services landing',
     sections: [
       { type: 'headline', purpose: 'Agency hero' },
       { type: 'basic_list', purpose: 'Services grid' },
       { type: 'image_with_text', purpose: 'Process timeline' },
       { type: 'gallery', purpose: 'Case studies' },
       { type: 'testimonials', purpose: 'Client reviews' },
       { type: 'contact_us', purpose: 'Contact CTA' },
     ],
     bestFor: ['agency', 'services', 'consulting', 'freelance'],
   },
   {
     id: 'community',
     name: 'Community Page',
     description: 'Community-focused with membership emphasis',
     sections: [
       { type: 'headline', purpose: 'Community hero' },
       { type: 'basic_list', purpose: 'Membership benefits' },
       { type: 'testimonials', purpose: 'Member testimonials' },
       { type: 'faq', purpose: 'Membership FAQs' },
       { type: 'newsletter', purpose: 'Join CTA' },
     ],
     bestFor: ['community', 'membership', 'discord', 'group'],
   },
   {
     id: 'visual_experimental',
     name: 'Visual / Experimental',
     description: 'Bold, visual-first design',
     sections: [
       { type: 'headline', purpose: 'Full-bleed hero' },
       { type: 'gallery', purpose: 'Visual showcase' },
       { type: 'sliding_banner', purpose: 'Marquee text' },
       { type: 'about_me', purpose: 'Minimal about' },
       { type: 'newsletter', purpose: 'CTA' },
     ],
     bestFor: ['visual', 'experimental', 'artistic', 'bold', 'creative'],
   },
 ];
 
 /**
  * Get the pattern registry summary for AI context.
  * This is passed to the AI to help it choose patterns intelligently.
  */
 export function getPatternRegistrySummary(): string {
   return LAYOUT_PATTERNS.map(p => 
     `- ${p.id}: ${p.description} (best for: ${p.bestFor.join(', ')})`
   ).join('\n');
 }