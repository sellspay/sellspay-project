 import { useEffect, useRef } from 'react';
 import davinciLogo from '@/assets/logos/davinci-resolve.png';
 import premiereLogo from '@/assets/logos/premiere-pro.png';
 import afterEffectsLogo from '@/assets/logos/after-effects.png';
 import openaiLogo from '@/assets/logos/openai-full.png';
 import soraLogo from '@/assets/logos/sora-color.png';
 import klingLogo from '@/assets/logos/kling-full.png';
 import pikaLogo from '@/assets/logos/pika.png';
 import veo3Logo from '@/assets/logos/veo3.png';
 
 const logos = [
   { name: 'DaVinci Resolve', src: davinciLogo },
   { name: 'Premiere Pro', src: premiereLogo },
   { name: 'After Effects', src: afterEffectsLogo },
   { name: 'OpenAI', src: openaiLogo },
   { name: 'Sora', src: soraLogo },
   { name: 'Kling AI', src: klingLogo },
   { name: 'Pika', src: pikaLogo },
   { name: 'Veo 3', src: veo3Logo },
 ];
 
 export default function SlidingBanner() {
   const trackRef = useRef<HTMLDivElement>(null);
   const contentRef = useRef<HTMLDivElement>(null);
   const styleRef = useRef<HTMLStyleElement | null>(null);
 
   useEffect(() => {
     const track = trackRef.current;
     const originalContent = contentRef.current;
     if (!track || !originalContent) return;
 
     const SPEED = 50; // pixels per second
     const animName = 'marquee-scroll-' + Math.random().toString(36).slice(2, 9);
 
     const init = () => {
       // Stop old animation during rebuild
       track.style.animation = 'none';
 
       // Remove old clones (keep only the original)
       const clones = track.querySelectorAll('[data-clone]');
       clones.forEach((clone) => clone.remove());
 
       // Measure original content width
       const contentWidth = originalContent.offsetWidth;
       const viewportWidth = track.parentElement?.offsetWidth || window.innerWidth;
 
       // Clone until track is at least 2x viewport width
       const clonesNeeded = Math.ceil((viewportWidth * 2) / contentWidth);
       for (let i = 0; i < clonesNeeded; i++) {
         const clone = originalContent.cloneNode(true) as HTMLElement;
         clone.setAttribute('data-clone', 'true');
         track.appendChild(clone);
       }
 
       // Calculate animation duration based on content width
       const duration = contentWidth / SPEED;
 
       // Remove old style if exists
       if (styleRef.current) {
         styleRef.current.remove();
       }
 
       // Create new keyframes with exact pixel value
       const style = document.createElement('style');
       style.textContent = `
         @keyframes ${animName} {
           from { transform: translate3d(0, 0, 0); }
           to { transform: translate3d(${-contentWidth}px, 0, 0); }
         }
       `;
       document.head.appendChild(style);
       styleRef.current = style;
 
       // Apply animation
       track.style.animation = `${animName} ${duration}s linear infinite`;
     };
 
     // Wait for images to load before measuring
     const images = originalContent.querySelectorAll('img');
     let loadedCount = 0;
     const totalImages = images.length;
 
     const checkAllLoaded = () => {
       loadedCount++;
       if (loadedCount >= totalImages) {
         init();
       }
     };
 
     images.forEach((img) => {
       if (img.complete) {
         checkAllLoaded();
       } else {
         img.addEventListener('load', checkAllLoaded);
         img.addEventListener('error', checkAllLoaded);
       }
     });
 
     // If no images or all already loaded
     if (totalImages === 0 || loadedCount >= totalImages) {
       init();
     }
 
     // Rebuild on resize
     const handleResize = () => init();
     window.addEventListener('resize', handleResize);
 
     return () => {
       window.removeEventListener('resize', handleResize);
       if (styleRef.current) {
         styleRef.current.remove();
       }
     };
   }, []);
 
   return (
     <div
       style={{ overflow: 'hidden', width: '100%' }}
       className="relative py-4 sm:py-5 border-y border-border/30"
     >
       {/* Edge fade masks */}
       <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
       <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
 
       {/* Track: width max-content, animated by JS with exact pixels */}
       <div
         ref={trackRef}
         style={{
           display: 'flex',
           width: 'max-content',
           willChange: 'transform',
         }}
       >
         {/* Original content group - measured for animation */}
         <div
           ref={contentRef}
           style={{
             display: 'flex',
             alignItems: 'center',
             gap: '40px',
             paddingRight: '40px',
             flex: '0 0 auto',
           }}
         >
           {logos.map((logo, index) => (
             <img
               key={index}
               src={logo.src}
               alt={logo.name}
               style={{
                 height: '28px',
                 width: 'auto',
                 objectFit: 'contain',
                 filter: 'grayscale(1) invert(1)',
                 opacity: 0.6,
                 flex: '0 0 auto',
               }}
             />
           ))}
         </div>
       </div>
     </div>
   );
 }
