 import React, { useLayoutEffect, useRef, useState } from "react";
import { useEffect } from "react";
 import gsap from "gsap";
 import { ScrollTrigger } from "gsap/ScrollTrigger";
import { supabase } from "@/integrations/supabase/client";
 
 gsap.registerPlugin(ScrollTrigger);
 
 import aiPanel1 from "@/assets/ai-panel-1.png";
 import aiPanel5 from "@/assets/ai-panel-5.png";
 
interface PanelMedia {
  url: string | null;
  type: 'image' | 'video';
}

 type Step = {
   bg: string;
   text: string;
   headline: string[];
   image?: string;
  media?: PanelMedia;
 };
 
const DEFAULT_STEPS: Step[] = [
   {
     bg: "#0a0a0a",
     text: "#ffffff",
     headline: ["Building Made", "Simple"],
     image: aiPanel1,
   },
   {
     bg: "#ffffff",
     text: "#111111",
     headline: ["Sell", "products"],
   },
   {
     bg: "#0a0a0a",
     text: "#ffffff",
     headline: ["Audio Made", "Simple"],
   },
   {
     bg: "#e76e50",
     text: "#0a0a0a",
     headline: ["Generate", "Videos"],
   },
   {
     bg: "#50A9E7",
     text: "#0a0a0a",
     headline: ["Generate", "images"],
     image: aiPanel5,
   },
   {
    bg: "#0a0a0a",  // Matches first step for seamless loop
     text: "#ffffff",
     headline: ["All in", "one"],
   },
 ];
 
const CARD_COLORS = ["#1a1a1a", "#f5f5f5", "#1a1a1a", "#e76e50", "#50A9E7", "#1a1a1a"];
 const STEP_DISTANCE_DESKTOP = 500;
 const STEP_DISTANCE_MOBILE = 300;
 const STACK_Y = 14;
 const STACK_SCALE = 0.02;
 const TOP_CARD_SCALE = 0.97;
const HOLD_RATIO = 0.4; // 40% of each step is a "pause" before next panel
 
 export function AIToolsReveal() {
   const sectionRef = useRef<HTMLDivElement | null>(null);
   const textRef = useRef<HTMLDivElement | null>(null);
   const deckRef = useRef<HTMLDivElement | null>(null);
   const headlineLineRefs = useRef<(HTMLSpanElement | null)[]>([]);
   const activeHeadlineIndexRef = useRef<number>(-1);
   const [isMobile, setIsMobile] = useState(false);
  const [steps, setSteps] = useState<Step[]>(DEFAULT_STEPS);
  const [panelMediaLoaded, setPanelMediaLoaded] = useState(false);
 
   const [headlineLines, setHeadlineLines] = useState<[string, string]>([
    DEFAULT_STEPS[0].headline[0],
    DEFAULT_STEPS[0].headline[1],
   ]);
 
  const panelCount = steps.length;
   const stepDistance = isMobile ? STEP_DISTANCE_MOBILE : STEP_DISTANCE_DESKTOP;

  // Fetch panel media from database
  useEffect(() => {
    const fetchPanelMedia = async () => {
      try {
        const { data, error } = await supabase
          .from('site_content')
          .select(`
            reveal_panel_1_media_url,
            reveal_panel_1_media_type,
            reveal_panel_2_media_url,
            reveal_panel_2_media_type,
            reveal_panel_3_media_url,
            reveal_panel_3_media_type,
            reveal_panel_4_media_url,
            reveal_panel_4_media_type,
            reveal_panel_5_media_url,
            reveal_panel_5_media_type,
            reveal_panel_6_media_url,
            reveal_panel_6_media_type
          `)
          .eq('id', 'main')
          .maybeSingle();

        if (error || !data) {
          console.error('Failed to fetch panel media:', error);
          setPanelMediaLoaded(true);
          return;
        }

        // Merge database media with default steps
        const updatedSteps = DEFAULT_STEPS.map((step, idx) => {
          const panelNum = idx + 1;
          const urlKey = `reveal_panel_${panelNum}_media_url` as keyof typeof data;
          const typeKey = `reveal_panel_${panelNum}_media_type` as keyof typeof data;
          const mediaUrl = data[urlKey] as string | null;
          const mediaType = (data[typeKey] as 'image' | 'video') || 'image';

          if (mediaUrl) {
            return {
              ...step,
              media: { url: mediaUrl, type: mediaType },
              // Clear default image if custom media is set
              image: undefined,
            };
          }
          return step;
        });

        setSteps(updatedSteps);
        setPanelMediaLoaded(true);
      } catch (err) {
        console.error('Error fetching panel media:', err);
        setPanelMediaLoaded(true);
      }
    };

    fetchPanelMedia();
  }, []);
 
   useLayoutEffect(() => {
     const checkMobile = () => setIsMobile(window.innerWidth < 1024);
     checkMobile();
     window.addEventListener("resize", checkMobile);
     return () => window.removeEventListener("resize", checkMobile);
   }, []);
 
   useLayoutEffect(() => {
     const section = sectionRef.current;
     const deck = deckRef.current;
    if (!section || !deck || !panelMediaLoaded) return;
 
     const ctx = gsap.context(() => {
       const text = textRef.current;
       const cards = gsap.utils.toArray<HTMLDivElement>(".deck .card");
       if (!text || cards.length === 0) return;
 
       const headlineEl = text.querySelector("[data-headline]") as HTMLElement | null;
       const totalScrollDistance = (panelCount - 1) * stepDistance;
 
        gsap.set(section, { backgroundColor: steps[0].bg });
        if (headlineEl) gsap.set(headlineEl, { color: steps[0].text });
 
        // Initial deck state: unrevealed cards live below and slide up as you scroll.
        // Keep base stacking order, but force the active card above the rest per step.
        cards.forEach((card, i) => {
          gsap.set(card, {
            zIndex: i + 1,
            yPercent: i === 0 ? 0 : 110,
            y: 0,
            scale: i === 0 ? TOP_CARD_SCALE : 1,
            willChange: "transform",
          });
        });
        // Ensure card 0 is on top at start
        gsap.set(cards[0], { zIndex: panelCount + 10 });
 
       const setHeadline = (idx: number) => {
          const line1 = steps[idx]?.headline?.[0] ?? "";
          const line2 = steps[idx]?.headline?.[1] ?? "";
         if (activeHeadlineIndexRef.current === idx) return;
         activeHeadlineIndexRef.current = idx;
         setHeadlineLines([line1, line2]);
       };
       setHeadline(0);
 
       const colorTl = gsap.timeline({ paused: true, defaults: { ease: "none" } });

       // Timeline structure: each step takes 1 unit of time
       // First 60% is the transition, last 40% is hold
       for (let i = 0; i < panelCount; i++) {
         const stepStart = i;
         const animDuration = 1 - HOLD_RATIO; // 0.6
         colorTl.to(
           section,
           {
              backgroundColor: steps[i].bg,
             duration: animDuration,
             immediateRender: false,
           },
           stepStart
         );

         if (headlineEl) {
           colorTl.to(
             headlineEl,
             {
                color: steps[i].text,
               duration: animDuration,
               immediateRender: false,
             },
             stepStart
           );
         }
       }
 
        // Build deterministic “deck stack” timeline.
        const stackTl = gsap.timeline({ paused: true, defaults: { ease: "none" } });

        // zIndex must be deterministic from scroll progress to make reverse scrubbing layer correctly.
       const applyZDuringScrub = (p: number) => {
         const totalSteps = panelCount - 1;
         const f = p * totalSteps;
         const rawStep = Math.floor(f);
         const stepProgress = f - rawStep;
         
         // Account for hold period: transition happens in first 60% of each step
         const animPortion = 1 - HOLD_RATIO;
         const t = stepProgress <= animPortion ? stepProgress / animPortion : 1;

         const current = Math.max(0, Math.min(panelCount - 1, rawStep));
         const next = Math.max(0, Math.min(panelCount - 1, rawStep + 1));

         // during transition, the incoming card must be on top
         const topIdx = t > 0.0001 ? next : current;

         cards.forEach((card, i) => {
           let z = 0;
           if (i === topIdx) z = 10000;
           else if (i <= current) z = 9000 - (current - i);
           else z = 1000 - i;

           gsap.set(card, { zIndex: z });
         });
        };

        const deckTweensAtStep = (activeIdx: number, pos: number, duration: number) => {
          // 1) Cards ABOVE the active (already revealed, behind it)
          for (let i = 0; i < activeIdx; i++) {
            const fromTop = activeIdx - i; // 1,2,3...
            const y = -fromTop * STACK_Y;
            const scale = Math.max(0.86, TOP_CARD_SCALE - fromTop * STACK_SCALE);
            stackTl.to(cards[i], { yPercent: 0, y, scale, duration }, pos);
          }

          // 2) Active card comes to center
          stackTl.to(
            cards[activeIdx],
            { yPercent: 0, y: 0, scale: TOP_CARD_SCALE, duration },
            pos
          );

          // 3) Cards BELOW active stay waiting below
          for (let i = activeIdx + 1; i < panelCount; i++) {
            stackTl.to(cards[i], { yPercent: 110, y: 0, scale: 1, duration }, pos);
          }
        };

        const animDuration = 1 - HOLD_RATIO; // 0.6

        // Step 0 state (transforms only)
        deckTweensAtStep(0, 0, animDuration);

        // Build steps 1..N-1 (transforms only)
        for (let step = 1; step < panelCount; step++) {
          const pos = (step - 1) + (1 - HOLD_RATIO); // Start after previous hold
          deckTweensAtStep(step, pos, animDuration);
        }
 
       // Drive both the stack + background/text colors from one ScrollTrigger
       ScrollTrigger.create({
         trigger: section,
         start: "top top",
         end: `+=${totalScrollDistance}`,
         pin: true,
         pinSpacing: true,
         anticipatePin: 1,
         invalidateOnRefresh: true,
         scrub: true,
         onUpdate: (self) => {
           stackTl.progress(self.progress);
          colorTl.time(self.progress * panelCount);
 
           // Headline updates only (no transforms) to keep things stable
           const totalTransitions = panelCount - 1;
           const stepP = 1 / totalTransitions;
           const clamped = Math.max(0, Math.min(1, self.progress));
           const base = Math.floor(clamped / stepP);
           const local = (clamped - base * stepP) / stepP;
           const activeIdx = local >= 0.3 ? Math.min(panelCount - 1, base + 1) : base;
           setHeadline(activeIdx);

           // Fractional z-index for perfect forward/reverse layering
           applyZDuringScrub(self.progress);
         },
       });

        // Ensure correct stacking on first paint (before ScrollTrigger emits updates)
        applyZDuringScrub(0);
 
       const line1El = headlineLineRefs.current[0];
       const line2El = headlineLineRefs.current[1];
       if (line1El && line2El) {
         gsap.set([line1El, line2El], { willChange: "transform,opacity" });
       }
 
       const onResize = () => ScrollTrigger.refresh();
       window.addEventListener("resize", onResize);
       if (document.readyState === "complete") {
         ScrollTrigger.refresh();
       } else {
         window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
       }
 
       return () => {
         window.removeEventListener("resize", onResize);
       };
     }, sectionRef);
 
     return () => ctx.revert();
  }, [panelCount, stepDistance, steps, panelMediaLoaded]);
 
   useLayoutEffect(() => {
     const line1 = headlineLineRefs.current[0];
     const line2 = headlineLineRefs.current[1];
     if (!line1 || !line2) return;
     gsap.killTweensOf([line1, line2]);
     gsap.fromTo(
       [line1, line2],
       { y: 10, opacity: 0 },
       { y: 0, opacity: 1, duration: 0.25, ease: "power2.out", overwrite: "auto", stagger: 0.03 }
     );
   }, [headlineLines[0], headlineLines[1]]);
 
    return (
      <section
        ref={sectionRef}
        className="ai-tools-reveal relative w-full will-change-transform overflow-x-clip"
        style={{ overflowY: "visible" }}
      >
        {/*
          IMPORTANT:
          Avoid mixing `overflow-x-hidden` with `overflow-y-visible` on the same element.
          Per CSS overflow rules, that combination can compute to `overflow-y:auto` and create
          an unintended inner scrollbar during the deck's vertical stacking animation.
        */}
        <div className="relative min-h-[100svh] w-full overflow-visible">
         <div className="absolute inset-0 flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-0 px-4 sm:px-6 lg:px-0 py-8 lg:py-0">
           <div
             ref={textRef}
             className="lg:absolute lg:left-[4%] xl:left-[5%] lg:top-1/2 lg:-translate-y-1/2 z-10 text-center lg:text-left w-full lg:w-auto lg:max-w-[35%] xl:max-w-[40%] order-1 lg:order-none"
           >
             <h2
               data-headline
               className="text-[2rem] sm:text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] xl:text-[5rem] 2xl:text-[6rem] font-black leading-[0.95] tracking-[-0.02em]"
               style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif" }}
             >
               <span ref={(el) => { headlineLineRefs.current[0] = el; }} className="block">
                 {headlineLines[0]}
               </span>
               <span ref={(el) => { headlineLineRefs.current[1] = el; }} className="block">
                 {headlineLines[1]}
               </span>
             </h2>
           </div>
            <div className="lg:absolute lg:right-[3%] xl:right-[4%] lg:top-1/2 lg:-translate-y-1/2 order-2 lg:order-none w-full lg:w-auto flex justify-center lg:block overflow-x-clip overflow-y-visible">
             <div
               ref={deckRef}
              className="deck relative w-[85vw] sm:w-[75vw] md:w-[65vw] lg:w-[48vw] xl:w-[50vw] max-w-[800px] aspect-[16/10] overflow-visible"
             >
               {steps.map((step, idx) => (
                 <div
                   key={idx}
                   className="card absolute inset-0 will-change-transform"
                   style={{ 
                     transform: "translate3d(0,0,0)",
                     transformOrigin: "center top"
                   }}
                 >
                   <div
                     className="h-full w-full rounded-[16px] sm:rounded-[20px] md:rounded-[24px] lg:rounded-[28px] border border-white/10 overflow-hidden shadow-2xl"
                     style={{ backgroundColor: CARD_COLORS[idx] }}
                   >
                  {step.media?.url ? (
                    step.media.type === 'video' ? (
                      <video
                        src={step.media.url}
                        className="h-full w-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={step.media.url}
                        alt={step.headline.join(" ")}
                        className="h-full w-full object-cover"
                        loading="eager"
                        decoding="async"
                      />
                    )
                  ) : step.image ? (
                       <img
                         src={step.image}
                         alt={step.headline.join(" ")}
                         className="h-full w-full object-cover"
                         loading="eager"
                         decoding="async"
                       />
                     ) : (
                       <div className="h-full w-full flex items-center justify-center">
                         <span
                           className="text-base sm:text-xl md:text-2xl lg:text-3xl font-medium"
                           style={{
                             color: CARD_COLORS[idx] === "#1a1a1a" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                           }}
                         >
                           Panel {idx + 1}
                         </span>
                       </div>
                     )}
                   </div>
                 </div>
               ))}
             </div>
           </div>
         </div>
       </div>
     </section>
   );
 }