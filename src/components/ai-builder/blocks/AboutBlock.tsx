 import type { AboutProps } from './types';
 
 interface Props {
   id: string;
   props: AboutProps;
 }
 
 export function AboutBlock({ props }: Props) {
   const { title = 'About', description, image, layout = 'left' } = props;
 
   const isCenter = layout === 'center';
   const isReversed = layout === 'right';
 
   if (isCenter) {
     return (
       <section
         style={{
           backgroundColor: 'var(--ai-background)',
           padding: 'var(--ai-section-spacing) 2rem',
         }}
       >
         <div className="max-w-3xl mx-auto text-center">
           {image && (
             <img
               src={image}
               alt=""
               className="w-24 h-24 rounded-full object-cover mx-auto mb-6"
             />
           )}
 
           <h2
             className="text-2xl md:text-3xl font-bold mb-4"
             style={{ color: 'var(--ai-foreground)' }}
           >
             {title}
           </h2>
 
           <p
             className="text-base leading-relaxed"
             style={{ color: 'var(--ai-muted-foreground)' }}
           >
             {description}
           </p>
         </div>
       </section>
     );
   }
 
   return (
     <section
       style={{
         backgroundColor: 'var(--ai-background)',
         padding: 'var(--ai-section-spacing) 2rem',
       }}
     >
       <div
         className={`max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 ${
           isReversed ? 'md:flex-row-reverse' : ''
         }`}
       >
         {image && (
           <div
             className="w-full md:w-1/3 aspect-square overflow-hidden shrink-0"
             style={{ borderRadius: 'var(--ai-radius)' }}
           >
             <img
               src={image}
               alt=""
               className="w-full h-full object-cover"
             />
           </div>
         )}
 
         <div className={`flex-1 ${image ? '' : 'max-w-2xl mx-auto'}`}>
           <h2
             className="text-2xl md:text-3xl font-bold mb-4"
             style={{ color: 'var(--ai-foreground)' }}
           >
             {title}
           </h2>
 
           <p
             className="text-base leading-relaxed"
             style={{ color: 'var(--ai-muted-foreground)' }}
           >
             {description}
           </p>
         </div>
       </div>
     </section>
   );
 }