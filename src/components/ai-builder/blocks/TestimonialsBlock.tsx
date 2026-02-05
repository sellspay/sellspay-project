 import { useAITheme } from './AIThemeProvider';
 import type { TestimonialsProps } from './types';
 import { Star, Quote } from 'lucide-react';
 
 interface Props {
   id: string;
   props: TestimonialsProps;
 }
 
 export function TestimonialsBlock({ props }: Props) {
   const theme = useAITheme();
   const { title, items = [], layout = 'grid' } = props;
 
   return (
     <section
       style={{
         backgroundColor: 'var(--ai-background)',
         padding: 'var(--ai-section-spacing) 2rem',
       }}
     >
       <div className="max-w-6xl mx-auto">
         {title && (
           <h2
             className="text-2xl md:text-3xl font-bold mb-10 text-center"
             style={{ color: 'var(--ai-foreground)' }}
           >
             {title}
           </h2>
         )}
 
         <div
           className={
             layout === 'stacked'
               ? 'space-y-6 max-w-2xl mx-auto'
               : 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
           }
         >
           {items.map((item, index) => (
             <div
               key={item.id || index}
               className="relative overflow-hidden"
               style={{
                 backgroundColor: 'var(--ai-muted)',
                 borderRadius: 'var(--ai-radius)',
                 padding: 'var(--ai-element-spacing)',
               }}
             >
               {/* Quote icon */}
               <Quote
                 className="absolute top-4 right-4 w-8 h-8 opacity-10"
                 style={{ color: 'var(--ai-accent)' }}
               />
 
               {/* Rating */}
               {item.rating && (
                 <div className="flex gap-0.5 mb-3">
                   {Array.from({ length: 5 }).map((_, i) => (
                     <Star
                       key={i}
                       className={`w-4 h-4 ${i < item.rating! ? 'fill-current' : ''}`}
                       style={{
                         color: i < item.rating! ? 'var(--ai-accent)' : 'var(--ai-border)',
                       }}
                     />
                   ))}
                 </div>
               )}
 
               {/* Quote */}
               <p
                 className="text-sm leading-relaxed mb-4"
                 style={{ color: 'var(--ai-foreground)' }}
               >
                 "{item.quote}"
               </p>
 
               {/* Author */}
               <div className="flex items-center gap-3">
                 {item.avatar ? (
                   <img
                     src={item.avatar}
                     alt={item.name}
                     className="w-10 h-10 rounded-full object-cover"
                   />
                 ) : (
                   <div
                     className="w-10 h-10 rounded-full flex items-center justify-center font-medium"
                     style={{
                       backgroundColor: 'var(--ai-accent)',
                       color: 'var(--ai-accent-foreground)',
                     }}
                   >
                     {item.name.charAt(0).toUpperCase()}
                   </div>
                 )}
                 <div>
                   <p
                     className="font-medium text-sm"
                     style={{ color: 'var(--ai-foreground)' }}
                   >
                     {item.name}
                   </p>
                   {item.role && (
                     <p
                       className="text-xs"
                       style={{ color: 'var(--ai-muted-foreground)' }}
                     >
                       {item.role}
                     </p>
                   )}
                 </div>
               </div>
             </div>
           ))}
         </div>
       </div>
     </section>
   );
 }