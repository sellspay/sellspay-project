 import { useAITheme } from './AIThemeProvider';
 import type { HeroProps } from './types';
 import { ArrowRight } from 'lucide-react';
 
 interface Props {
   id: string;
   props: HeroProps;
 }
 
 export function HeroBlock({ props }: Props) {
   const theme = useAITheme();
   const {
     headline = 'Your Headline Here',
     subheadline,
     ctaText,
     ctaUrl = '#',
     backgroundImage,
     backgroundVideo,
     overlayOpacity = 60,
     alignment = 'center',
     size = 'default',
   } = props;
 
   const heightClass = {
     default: 'min-h-[70vh]',
     large: 'min-h-[85vh]',
     fullscreen: 'min-h-screen',
   }[size];
 
   const alignClass = {
     left: 'text-left items-start',
     center: 'text-center items-center',
     right: 'text-right items-end',
   }[alignment];
 
   return (
     <section
       className={`relative ${heightClass} flex flex-col justify-center overflow-hidden`}
       style={{
         backgroundColor: 'var(--ai-background)',
         padding: 'var(--ai-section-spacing) 2rem',
       }}
     >
       {/* Background media */}
       {backgroundVideo ? (
         <video
           autoPlay
           muted
           loop
           playsInline
           className="absolute inset-0 w-full h-full object-cover"
           src={backgroundVideo}
         />
       ) : backgroundImage ? (
         <img
           src={backgroundImage}
           alt=""
           className="absolute inset-0 w-full h-full object-cover"
         />
       ) : null}
 
       {/* Overlay */}
       {(backgroundImage || backgroundVideo) && (
         <div
           className="absolute inset-0"
           style={{
             backgroundColor: theme.mode === 'dark' ? '#000' : '#fff',
             opacity: overlayOpacity / 100,
           }}
         />
       )}
 
       {/* Content */}
       <div className={`relative z-10 max-w-5xl mx-auto w-full flex flex-col gap-6 ${alignClass}`}>
         <h1
           className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
           style={{
             color: 'var(--ai-foreground)',
             fontFamily: 'var(--ai-font-family)',
           }}
         >
           {headline}
         </h1>
 
         {subheadline && (
           <p
             className="text-lg md:text-xl max-w-2xl leading-relaxed"
             style={{ color: 'var(--ai-muted-foreground)' }}
           >
             {subheadline}
           </p>
         )}
 
         {ctaText && (
           <a
             href={ctaUrl}
             className="inline-flex items-center gap-2 px-8 py-4 font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
             style={{
               backgroundColor: 'var(--ai-accent)',
               color: 'var(--ai-accent-foreground)',
               borderRadius: 'var(--ai-radius)',
             }}
           >
             {ctaText}
             <ArrowRight className="w-4 h-4" />
           </a>
         )}
       </div>
     </section>
   );
 }