 import type { CTAStripProps } from './types';
 import { ArrowRight } from 'lucide-react';
 
 interface Props {
   id: string;
   props: CTAStripProps;
 }
 
 export function CTAStripBlock({ props }: Props) {
   const {
     headline,
     subheadline,
     ctaText,
     ctaUrl = '#',
     variant = 'default',
   } = props;
 
   const bgStyle = {
     default: { backgroundColor: 'var(--ai-accent)' },
     gradient: {
       background: 'linear-gradient(135deg, var(--ai-accent), hsl(280 70% 50%))',
     },
     outline: {
       backgroundColor: 'transparent',
       border: '2px solid var(--ai-accent)',
     },
   }[variant];
 
   const textColor = variant === 'outline' ? 'var(--ai-foreground)' : 'var(--ai-accent-foreground)';
 
   return (
     <section
       style={{
         backgroundColor: 'var(--ai-background)',
         padding: 'var(--ai-section-spacing) 2rem',
       }}
     >
       <div
         className="max-w-4xl mx-auto text-center"
         style={{
           ...bgStyle,
           borderRadius: 'var(--ai-radius)',
           padding: 'var(--ai-section-spacing) var(--ai-element-spacing)',
         }}
       >
         <h2
           className="text-2xl md:text-3xl font-bold mb-3"
           style={{ color: textColor }}
         >
           {headline}
         </h2>
 
         {subheadline && (
           <p
             className="text-base mb-6 max-w-xl mx-auto opacity-90"
             style={{ color: textColor }}
           >
             {subheadline}
           </p>
         )}
 
         <a
           href={ctaUrl}
           className="inline-flex items-center gap-2 px-8 py-3 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
           style={{
             backgroundColor: variant === 'outline' ? 'var(--ai-accent)' : 'var(--ai-background)',
             color: variant === 'outline' ? 'var(--ai-accent-foreground)' : 'var(--ai-foreground)',
             borderRadius: 'calc(var(--ai-radius) - 4px)',
           }}
         >
           {ctaText}
           <ArrowRight className="w-4 h-4" />
         </a>
       </div>
     </section>
   );
 }