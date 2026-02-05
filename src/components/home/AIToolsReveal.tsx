 import React, { useLayoutEffect, useRef, useState } from "react";
 import gsap from "gsap";
 import { ScrollTrigger } from "gsap/ScrollTrigger";
 
 gsap.registerPlugin(ScrollTrigger);
 
 import aiPanel1 from "@/assets/ai-panel-1.png";
 import aiPanel5 from "@/assets/ai-panel-5.png";
 
 type Step = {
   bg: string;
   text: string;
   headline: string[];
   image?: string;
 };
 
 const STEPS: Step[] = [
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
     bg: "#0a0a0a",
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
 
 export function AIToolsReveal() {
   const sectionRef = useRef<HTMLDivElement | null>(null);
   const textRef = useRef<HTMLDivElement | null>(null);
   const deckRef = useRef<HTMLDivElement | null>(null);
   const headlineLineRefs = useRef<(HTMLSpanElement | null)[]>([]);
   const activeHeadlineIndexRef = useRef<number>(-1);
   const [isMobile, setIsMobile] = useState(false);
 
   const [headlineLines, setHeadlineLines] = useState<[string, string]>([
     STEPS[0].headline[0],
     STEPS[0].headline[1],
   ]);
 
   const panelCount = STEPS.length;
   const stepDistance = isMobile ? STEP_DISTANCE_MOBILE : STEP_DISTANCE_DESKTOP;
 
   useLayoutEffect(() => {
     const checkMobile = () => setIsMobile(window.innerWidth < 1024);
     checkMobile();
     window.addEventListener("resize", checkMobile);
     return () => window.removeEventListener("resize", checkMobile);
   }, []);
 
   useLayoutEffect(() => {
     const section = sectionRef.current;
     const deck = deckRef.current;
     if (!section || !deck) return;
 
     const ctx = gsap.context(() => {
       const text = textRef.current;
       const cards = gsap.utils.toArray<HTMLDivElement>(".deck .card");
       if (!text || cards.length === 0) return;
 
       const headlineEl = text.querySelector("[data-headline]") as HTMLElement | null;
       const totalScrollDistance = (panelCount - 1) * stepDistance;
 
       gsap.set(section, { backgroundColor: STEPS[0].bg });
       if (headlineEl) gsap.set(headlineEl, { color: STEPS[0].text });
 
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
         const line1 = STEPS[idx]?.headline?.[0] ?? "";
         const line2 = STEPS[idx]?.headline?.[1] ?? "";
         if (activeHeadlineIndexRef.current === idx) return;
         activeHeadlineIndexRef.current = idx;
         setHeadlineLines([line1, line2]);
       };
       setHeadline(0);
 
       const colorTl = gsap.timeline({ paused: true });
       for (let i = 0; i < panelCount; i++) {
         const progress = i / (panelCount - 1);
         colorTl.to(section, { backgroundColor: STEPS[i].bg, duration: 0.05 }, progress);
         if (headlineEl) {
           colorTl.to(headlineEl, { color: STEPS[i].text, duration: 0.05 }, progress);
         }
       }
 
        // Build deterministic “deck stack” timeline.
        // NOTE: We only use a .call() for zIndex changes (no transform writes mid-scrub).
        const stackTl = gsap.timeline({ paused: true, defaults: { ease: "none" } });

        const setActiveZ = (activeIdx: number) => {
          // keep base order for everyone
          cards.forEach((c, i) => gsap.set(c, { zIndex: i + 1 }));
          // active card must be above all
          gsap.set(cards[activeIdx], { zIndex: panelCount + 10 });
        };

        const deckTweensAtStep = (activeIdx: number, pos: number) => {
          // 1) Cards ABOVE the active (already revealed, behind it)
          for (let i = 0; i < activeIdx; i++) {
            const fromTop = activeIdx - i; // 1,2,3...
            const y = -fromTop * STACK_Y;
            const scale = Math.max(0.86, TOP_CARD_SCALE - fromTop * STACK_SCALE);
            stackTl.to(cards[i], { yPercent: 0, y, scale, duration: 1 }, pos);
          }

          // 2) Active card comes to center
          stackTl.to(
            cards[activeIdx],
            { yPercent: 0, y: 0, scale: TOP_CARD_SCALE, duration: 1 },
            pos
          );

          // 3) Cards BELOW active stay waiting below
          for (let i = activeIdx + 1; i < panelCount; i++) {
            stackTl.to(cards[i], { yPercent: 110, y: 0, scale: 1, duration: 1 }, pos);
          }
        };

        // Step 0 state
        setActiveZ(0);
        deckTweensAtStep(0, 0);

        // Build steps 1..N-1
        for (let step = 1; step < panelCount; step++) {
          const pos = step - 1;
          stackTl.call(() => setActiveZ(step), [], pos);
          deckTweensAtStep(step, pos);
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
           colorTl.progress(self.progress);
 
           // Headline updates only (no transforms) to keep things stable
           const totalTransitions = panelCount - 1;
           const stepP = 1 / totalTransitions;
           const clamped = Math.max(0, Math.min(1, self.progress));
           const base = Math.floor(clamped / stepP);
           const local = (clamped - base * stepP) / stepP;
           const activeIdx = local >= 0.3 ? Math.min(panelCount - 1, base + 1) : base;
           setHeadline(activeIdx);
         },
       });
 
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
   }, [panelCount, stepDistance]);
 
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
     <section ref={sectionRef} className="relative w-full will-change-transform">
       <div className="relative min-h-[100svh] w-full overflow-hidden">
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
           <div className="lg:absolute lg:right-[3%] xl:right-[4%] lg:top-1/2 lg:-translate-y-1/2 order-2 lg:order-none w-full lg:w-auto flex justify-center lg:block">
             <div
               ref={deckRef}
              className="deck relative w-[85vw] sm:w-[75vw] md:w-[65vw] lg:w-[48vw] xl:w-[50vw] max-w-[800px] aspect-[16/10] overflow-visible"
             >
               {STEPS.map((step, idx) => (
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
                     {step.image ? (
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