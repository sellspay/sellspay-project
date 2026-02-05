 import { useState } from 'react';
 import { useAITheme } from './AIThemeProvider';
 import type { FAQProps } from './types';
 import { ChevronDown } from 'lucide-react';
 
 interface Props {
   id: string;
   props: FAQProps;
 }
 
 export function FAQBlock({ props }: Props) {
   const { title, items = [], layout = 'accordion' } = props;
   const [openIndex, setOpenIndex] = useState<number | null>(0);
 
   if (layout === 'grid') {
     return (
       <section
         style={{
           backgroundColor: 'var(--ai-background)',
           padding: 'var(--ai-section-spacing) 2rem',
         }}
       >
         <div className="max-w-5xl mx-auto">
           {title && (
             <h2
               className="text-2xl md:text-3xl font-bold mb-10 text-center"
               style={{ color: 'var(--ai-foreground)' }}
             >
               {title}
             </h2>
           )}
 
           <div className="grid md:grid-cols-2 gap-6">
             {items.map((item, index) => (
               <div
                 key={item.id || index}
                 style={{
                   backgroundColor: 'var(--ai-muted)',
                   borderRadius: 'var(--ai-radius)',
                   padding: 'var(--ai-element-spacing)',
                 }}
               >
                 <h3
                   className="font-semibold mb-2"
                   style={{ color: 'var(--ai-foreground)' }}
                 >
                   {item.question}
                 </h3>
                 <p
                   className="text-sm leading-relaxed"
                   style={{ color: 'var(--ai-muted-foreground)' }}
                 >
                   {item.answer}
                 </p>
               </div>
             ))}
           </div>
         </div>
       </section>
     );
   }
 
   // Accordion layout
   return (
     <section
       style={{
         backgroundColor: 'var(--ai-background)',
         padding: 'var(--ai-section-spacing) 2rem',
       }}
     >
       <div className="max-w-3xl mx-auto">
         {title && (
           <h2
             className="text-2xl md:text-3xl font-bold mb-10 text-center"
             style={{ color: 'var(--ai-foreground)' }}
           >
             {title}
           </h2>
         )}
 
         <div className="space-y-3">
           {items.map((item, index) => {
             const isOpen = openIndex === index;
             return (
               <div
                 key={item.id || index}
                 style={{
                   backgroundColor: 'var(--ai-muted)',
                   borderRadius: 'var(--ai-radius)',
                   overflow: 'hidden',
                 }}
               >
                 <button
                   onClick={() => setOpenIndex(isOpen ? null : index)}
                   className="w-full flex items-center justify-between text-left transition-colors"
                   style={{
                     padding: 'var(--ai-element-spacing)',
                     color: 'var(--ai-foreground)',
                   }}
                 >
                   <span className="font-medium pr-4">{item.question}</span>
                   <ChevronDown
                     className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                     style={{ color: 'var(--ai-muted-foreground)' }}
                   />
                 </button>
 
                 {isOpen && (
                   <div
                     className="text-sm leading-relaxed"
                     style={{
                       padding: '0 var(--ai-element-spacing) var(--ai-element-spacing)',
                       color: 'var(--ai-muted-foreground)',
                     }}
                   >
                     {item.answer}
                   </div>
                 )}
               </div>
             );
           })}
         </div>
       </div>
     </section>
   );
 }