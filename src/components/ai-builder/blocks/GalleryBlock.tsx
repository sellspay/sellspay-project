 import type { GalleryProps } from './types';
 
 interface Props {
   id: string;
   props: GalleryProps;
 }
 
 export function GalleryBlock({ props }: Props) {
   const { title, items = [], columns = 3, aspectRatio = 'video' } = props;
 
   const colsClass = {
     2: 'grid-cols-1 md:grid-cols-2',
     3: 'grid-cols-2 md:grid-cols-3',
     4: 'grid-cols-2 md:grid-cols-4',
   }[columns];
 
   const aspectClass = {
     square: 'aspect-square',
     video: 'aspect-video',
     portrait: 'aspect-[3/4]',
   }[aspectRatio];
 
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
             className="text-2xl md:text-3xl font-bold mb-8 text-center"
             style={{ color: 'var(--ai-foreground)' }}
           >
             {title}
           </h2>
         )}
 
         <div className={`grid ${colsClass} gap-4`}>
           {items.map((item, index) => (
             <div
               key={item.id || index}
               className={`group relative overflow-hidden ${aspectClass}`}
               style={{ borderRadius: 'var(--ai-radius)' }}
             >
               {item.url ? (
                 <img
                   src={item.url}
                   alt={item.alt || ''}
                   className="w-full h-full object-cover transition-transform group-hover:scale-105"
                 />
               ) : (
                 <div
                   className="w-full h-full flex items-center justify-center"
                   style={{ backgroundColor: 'var(--ai-muted)' }}
                 >
                   <span style={{ color: 'var(--ai-muted-foreground)' }} className="text-sm">
                     Image
                   </span>
                 </div>
               )}
 
               {item.caption && (
                 <div
                   className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity"
                   style={{
                     background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                   }}
                 >
                   <p className="text-sm text-white">{item.caption}</p>
                 </div>
               )}
             </div>
           ))}
         </div>
       </div>
     </section>
   );
 }