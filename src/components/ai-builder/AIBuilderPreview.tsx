 import { useEffect, useRef } from 'react';
 import { Wand2 } from 'lucide-react';
 import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
 
 interface AIBuilderPreviewProps {
   layout: {
     sections: any[];
     theme: Record<string, any>;
     header: Record<string, any>;
   };
   isEmpty: boolean;
 }
 
 export function AIBuilderPreview({ layout, isEmpty }: AIBuilderPreviewProps) {
   const containerRef = useRef<HTMLDivElement>(null);
 
   if (isEmpty) {
     return (
       <div className="h-full flex items-center justify-center">
         <div className="text-center space-y-6 max-w-md px-8">
           {/* Decorative canvas */}
           <div className="relative mx-auto w-32 h-32">
             <div className="absolute inset-0 border-2 border-dashed border-border/50 rounded-3xl" />
             <div className="absolute inset-4 border border-dashed border-border/30 rounded-2xl" />
             <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                 <Wand2 className="w-6 h-6 text-muted-foreground/50" />
               </div>
             </div>
           </div>
           
           <div className="space-y-2">
             <h3 className="text-lg font-medium text-muted-foreground">Your Canvas Awaits</h3>
             <p className="text-sm text-muted-foreground/60">
               Start with "Build My Store" or describe your vision in the chat.
             </p>
           </div>
         </div>
       </div>
     );
   }
 
   return (
     <div ref={containerRef} className="h-full overflow-y-auto">
       <div className="min-h-full bg-background">
         {/* Render sections */}
         {layout.sections.map((section, index) => (
           <SectionRenderer key={section.id || index} section={section} />
         ))}
       </div>
     </div>
   );
 }
 
 // Simple section renderer - maps section types to preview components
 function SectionRenderer({ section }: { section: any }) {
   const { section_type, content, style_options } = section;
   
   const colorScheme = style_options?.colorScheme || 'dark';
   const bgClass = colorScheme === 'black' ? 'bg-black' : colorScheme === 'dark' ? 'bg-zinc-900' : 'bg-background';
   const textClass = colorScheme === 'black' || colorScheme === 'dark' ? 'text-white' : 'text-foreground';
 
   const containerStyle: React.CSSProperties = {};
   if (style_options?.showBackground && style_options?.containerBackgroundColor) {
     containerStyle.backgroundColor = style_options.containerBackgroundColor;
   }
   if (style_options?.borderStyle === 'solid' && style_options?.borderColor) {
     containerStyle.border = `1px solid ${style_options.borderColor}`;
   }
 
   switch (section_type) {
     case 'headline':
       return (
         <div className={`py-20 px-8 ${bgClass} ${textClass}`} style={containerStyle}>
           <div className="max-w-4xl mx-auto text-center space-y-4">
             <h1 
               className="text-4xl md:text-6xl font-bold"
               style={{
                 fontFamily: content?.font === 'serif' ? 'Georgia, serif' : undefined,
                 textShadow: content?.textShadow === 'glow' ? '0 0 40px rgba(255,255,255,0.3)' : undefined,
               }}
             >
               {content?.text || content?.title || 'Your Headline'}
             </h1>
             {content?.subtitle && (
               <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                 {content.subtitle}
               </p>
             )}
           </div>
         </div>
       );
 
     case 'about_me':
       return (
         <div className={`py-16 px-8 ${bgClass}`} style={containerStyle}>
           <div className={`max-w-3xl mx-auto rounded-2xl p-8 ${textClass}`} style={{
             backgroundColor: style_options?.containerBackgroundColor || 'rgba(255,255,255,0.05)',
             backdropFilter: 'blur(10px)',
           }}>
             <h2 className="text-2xl font-semibold mb-4">{content?.title || 'About Me'}</h2>
             <p className="text-muted-foreground leading-relaxed">
               {content?.description || 'Tell your story here...'}
             </p>
           </div>
         </div>
       );
 
     case 'testimonials':
       const testimonials = content?.testimonials || [];
       return (
         <div className={`py-16 px-8 ${bgClass}`} style={containerStyle}>
           <div className="max-w-5xl mx-auto">
             {content?.title && (
               <h2 className={`text-2xl font-semibold mb-8 text-center ${textClass}`}>{content.title}</h2>
             )}
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {testimonials.slice(0, 3).map((t: any, i: number) => (
                 <div 
                   key={t.id || i} 
                   className={`p-6 rounded-xl ${textClass}`}
                   style={{
                     backgroundColor: style_options?.containerBackgroundColor || 'rgba(255,255,255,0.05)',
                   }}
                 >
                   <p className="text-sm mb-4 opacity-80">"{t.quote}"</p>
                   <div className="font-medium">{t.name}</div>
                   {t.role && <div className="text-xs text-muted-foreground">{t.role}</div>}
                 </div>
               ))}
             </div>
           </div>
         </div>
       );
 
     case 'image_with_text':
       return (
         <div className={`py-16 px-8 ${bgClass}`} style={containerStyle}>
           <div className={`max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center ${textClass}`}>
             <div className="flex-1 space-y-4">
               <h2 className="text-2xl font-semibold">{content?.title || 'Section Title'}</h2>
               <p className="text-muted-foreground">{content?.body || 'Your content here...'}</p>
               {content?.buttonText && (
                 <button 
                   className="px-6 py-2 rounded-lg font-medium"
                   style={{
                     backgroundColor: content?.buttonColor || 'hsl(var(--primary))',
                     color: content?.buttonTextColor || 'white',
                   }}
                 >
                   {content.buttonText}
                 </button>
               )}
             </div>
             <div className="flex-1">
               <div className="aspect-video bg-muted/20 rounded-xl flex items-center justify-center">
                 {content?.imageUrl ? (
                   <img src={content.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                 ) : (
                   <span className="text-muted-foreground text-sm">Image placeholder</span>
                 )}
               </div>
             </div>
           </div>
         </div>
       );
 
     case 'text':
       return (
         <div className={`py-12 px-8 ${bgClass}`} style={containerStyle}>
           <div className={`max-w-3xl mx-auto ${textClass}`} style={{ textAlign: content?.alignment || 'left' }}>
             {content?.title && <h2 className="text-2xl font-semibold mb-4">{content.title}</h2>}
             <p className="text-muted-foreground leading-relaxed">{content?.body || ''}</p>
           </div>
         </div>
       );
 
     case 'faq':
       const items = content?.items || [];
       return (
         <div className={`py-16 px-8 ${bgClass}`} style={containerStyle}>
           <div className="max-w-3xl mx-auto">
             {content?.title && (
               <h2 className={`text-2xl font-semibold mb-8 text-center ${textClass}`}>{content.title}</h2>
             )}
             <div className="space-y-4">
               {items.map((item: any, i: number) => (
                 <div 
                   key={item.id || i} 
                   className={`p-5 rounded-xl ${textClass}`}
                   style={{
                     backgroundColor: style_options?.containerBackgroundColor || 'rgba(255,255,255,0.05)',
                   }}
                 >
                   <h3 className="font-medium mb-2">{item.question}</h3>
                   <p className="text-sm text-muted-foreground">{item.answer}</p>
                 </div>
               ))}
             </div>
           </div>
         </div>
       );
 
     default:
       return (
         <div className={`py-12 px-8 ${bgClass}`} style={containerStyle}>
           <div className={`max-w-3xl mx-auto text-center ${textClass}`}>
             <p className="text-muted-foreground text-sm">
               Section: {section_type}
             </p>
           </div>
         </div>
       );
   }
 }