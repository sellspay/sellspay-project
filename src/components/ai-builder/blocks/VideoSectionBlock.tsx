 import { useState } from 'react';
 import type { VideoSectionProps } from './types';
 import { Play } from 'lucide-react';
 
 interface Props {
   id: string;
   props: VideoSectionProps;
 }
 
 export function VideoSectionBlock({ props }: Props) {
   const {
     title,
     videoUrl,
     poster,
     autoplay = false,
     loop = true,
     overlay = true,
   } = props;
   const [isPlaying, setIsPlaying] = useState(autoplay);
 
   // Check if it's a YouTube URL
   const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');
   const youtubeId = isYouTube
     ? videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
     : null;
 
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
             className="text-2xl md:text-3xl font-bold mb-8 text-center"
             style={{ color: 'var(--ai-foreground)' }}
           >
             {title}
           </h2>
         )}
 
         <div
           className="relative aspect-video overflow-hidden"
           style={{ borderRadius: 'var(--ai-radius)' }}
         >
           {isYouTube && youtubeId ? (
             <iframe
               src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}${loop ? `&playlist=${youtubeId}` : ''}&mute=1`}
               className="w-full h-full"
               allow="autoplay; encrypted-media"
               allowFullScreen
             />
           ) : videoUrl ? (
             <>
               <video
                 src={videoUrl}
                 poster={poster}
                 autoPlay={autoplay}
                 loop={loop}
                 muted
                 playsInline
                 controls={isPlaying}
                 className="w-full h-full object-cover"
                 onClick={() => setIsPlaying(true)}
               />
 
               {overlay && !isPlaying && (
                 <button
                   onClick={() => setIsPlaying(true)}
                   className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40"
                 >
                   <div
                     className="w-16 h-16 rounded-full flex items-center justify-center"
                     style={{ backgroundColor: 'var(--ai-accent)' }}
                   >
                     <Play
                       className="w-6 h-6 ml-1"
                       style={{ color: 'var(--ai-accent-foreground)' }}
                       fill="currentColor"
                     />
                   </div>
                 </button>
               )}
             </>
           ) : (
             <div
               className="w-full h-full flex items-center justify-center"
               style={{ backgroundColor: 'var(--ai-muted)' }}
             >
               <Play className="w-12 h-12" style={{ color: 'var(--ai-muted-foreground)' }} />
             </div>
           )}
         </div>
       </div>
     </section>
   );
 }