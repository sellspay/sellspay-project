import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import aiPanel1 from "@/assets/ai-panel-1.png";

type Step = {
  bg: string;
  text: string;
  subtext: string;
  headline: string[];
  image?: string;
};

// Keep these outside the component so React re-renders don't recreate arrays
// and accidentally desync animation logic.
const STEPS: Step[] = [
  {
    bg: "#0a0a0a",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.70)",
    // Panel 1
    headline: ["Building Made", "Simple"],
    image: aiPanel1,
  },
  {
    bg: "#ffffff",
    text: "#111111",
    subtext: "rgba(0,0,0,0.70)",
    // Panel 2
    headline: ["Sell", "products"],
  },
  {
    bg: "#0a0a0a",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.70)",
    // Panel 3
    headline: ["Audio Made", "Simple"],
  },
  {
    bg: "#e76e50",
    text: "#0a0a0a",
    subtext: "rgba(10,10,10,0.75)",
    // Panel 4
    headline: ["Generate", "Videos"],
  },
  {
    bg: "#50A9E7",
    text: "#0a0a0a",
    subtext: "rgba(10,10,10,0.75)",
    // Panel 5
    headline: ["Generate", "images"],
  },
  {
    bg: "#0a0a0a",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.70)",
    // Panel 6
    headline: ["All in", "one"],
  },
];

const CARD_COLORS = ["#1a1a1a", "#f5f5f5", "#1a1a1a", "#e76e50", "#50A9E7", "#1a1a1a"];

export function AIToolsReveal() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const headlineLineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const activeHeadlineIndexRef = useRef<number>(-1);

  // React-driven headline avoids DOM textContent race conditions while scrubbing.
  const [headlineLines, setHeadlineLines] = useState<[string, string]>([
    STEPS[0].headline[0],
    STEPS[0].headline[1],
  ]);

  // React 18 StrictMode runs effects twice in dev; guard so we don't register
  // duplicate ScrollTriggers (which causes “glitching”/stuck updates).
  const didInitRef = useRef(false);

  const steps = useMemo(() => STEPS, []);

  useLayoutEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const section = sectionRef.current;
    const text = textRef.current;
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!section || !text || cards.length === 0) return;

    const panelCount = steps.length;
    // Use viewport-relative height for responsive card stacking
    const cardHeight = window.innerHeight * 0.6;

    const headlineEl = text.querySelector("[data-headline]") as HTMLElement | null;

    // Set initial styles
    gsap.set(section, { backgroundColor: steps[0].bg });
    if (headlineEl) gsap.set(headlineEl, { color: steps[0].text });

    // Stack silhouette values (small offsets so you see the edges behind)
    const stackSpacing = 22;
    const scaleStep = 0.025;

    const getStackY = (activeIndex: number, cardIndex: number) =>
      -(activeIndex - cardIndex) * stackSpacing;

    const getStackScale = (activeIndex: number, cardIndex: number) =>
      1 - (activeIndex - cardIndex) * scaleStep;

    // Set initial card positions
    cards.forEach((card, idx) => {
      gsap.set(card, {
        y: idx === 0 ? 0 : cardHeight,
        scale: 1,
        // newer cards should be on top
        zIndex: idx + 1,
      });
    });

    // Timeline scrubbed by scroll
    const animationDuration = 0.6; // How long the actual animation takes
    const pauseDuration = 0.4; // Dead space / pause between animations
    const stepDuration = animationDuration + pauseDuration; // Total time per step
    
    const setHeadline = (idx: number) => {
      const line1 = steps[idx]?.headline?.[0] ?? "";
      const line2 = steps[idx]?.headline?.[1] ?? "";
      if (activeHeadlineIndexRef.current === idx) return;
      activeHeadlineIndexRef.current = idx;
      setHeadlineLines([line1, line2]);
    };

    // Ensure we start at panel 1.
    setHeadline(0);

    // Hide headline until we actually render the first “reveal”.
    // This prevents seeing text before the pinned sequence begins.
    const line1ElInit = headlineLineRefs.current[0];
    const line2ElInit = headlineLineRefs.current[1];
    if (line1ElInit && line2ElInit) {
      gsap.set([line1ElInit, line2ElInit], { opacity: 0, y: 10 });
    }

    // Use *timeline time* (not raw ScrollTrigger progress) so the headline switch
    // happens during the animation part of each step, not during the pause.
    const updateHeadlineFromProgress = (progress: number, timeline: gsap.core.Timeline) => {
      const clamped = Math.max(0, Math.min(1, progress));
      const totalTime = timeline.duration();
      const t = clamped * totalTime;

      const stepIndex = Math.max(0, Math.min(panelCount - 1, Math.floor(t / stepDuration)));
      const withinStep = t - stepIndex * stepDuration;
      const animT = Math.min(1, withinStep / animationDuration); // 0..1 (pause clamps to 1)

      // Swap once the next panel is visibly moving in (not after it's already done).
      // 0.35 = ~35% through the animation portion.
      const idx = animT >= 0.35 ? stepIndex + 1 : stepIndex;
      setHeadline(Math.min(panelCount - 1, idx));
    };

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${(panelCount - 1) * stepDuration * window.innerHeight}`,
        scrub: true,
        pin: section,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => updateHeadlineFromProgress(self.progress, tl),
        onRefresh: (self) => updateHeadlineFromProgress(self.progress, tl),
      },
    });

    // Animate each step
    for (let i = 0; i < panelCount - 1; i++) {
      const startTime = i * stepDuration;
      const nextCardIndex = i + 1;
      
      // Reposition all previously revealed cards into their stacked silhouette positions
      // Example: when card 2 becomes active, card1 -> -spacing, card0 -> -2*spacing
      tl.to(
        cards.slice(0, nextCardIndex),
        {
          duration: animationDuration,
          y: (index: number) => getStackY(nextCardIndex, index),
          scale: (index: number) => getStackScale(nextCardIndex, index),
        },
        startTime
      );
      
      // Next card slides UP from below to the front
      tl.to(cards[nextCardIndex], {
        y: 0,
        scale: 1,
        duration: animationDuration,
      }, startTime);
      
      // Bring the new card above the stack
      tl.set(cards[nextCardIndex], { zIndex: nextCardIndex + 10 }, startTime);
      
      // Change background color
      tl.to(section, { 
        backgroundColor: steps[i + 1].bg,
        duration: animationDuration * 0.5,
      }, startTime);
      
      // Change text color
      if (headlineEl) {
        tl.to(
          headlineEl,
          {
            color: steps[i + 1].text,
            duration: animationDuration * 0.5,
          },
          startTime
        );
      }

      // Add a real pause segment so the timeline time matches stepDuration.
      // Without this, the timeline compresses time (no tween during the pause),
      // and any "time -> panel index" mapping becomes incorrect.
      tl.to(
        {},
        {
          duration: pauseDuration,
        },
        startTime + animationDuration
      );
    }

    // Animate headline lines when they change.
    // Use overwrite to prevent animation build-up when scrubbing quickly.
    const line1El = headlineLineRefs.current[0];
    const line2El = headlineLineRefs.current[1];
    if (line1El && line2El) {
      gsap.set([line1El, line2El], { willChange: "transform,opacity" });
    }

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      // IMPORTANT: don't kill *all* triggers on the page; only ours.
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  // Drive the “reveal” of the two headline lines when their text changes.
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
    <section ref={sectionRef} className="relative w-full">
      {/* Full viewport pinned area */}
      <div className="relative h-screen w-full overflow-hidden">
        {/* Responsive container for proper spacing */}
        <div className="absolute inset-0 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-0 px-4 lg:px-0">
          
          {/* Text - stacked on mobile, left side on desktop */}
          <div
            ref={textRef}
            className="lg:absolute lg:left-[4%] xl:left-[5%] lg:top-1/2 lg:-translate-y-1/2 z-10 text-center lg:text-left lg:max-w-[35%] xl:max-w-[40%]"
          >
            <h2 
              data-headline 
              className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5rem] xl:text-[6rem] 2xl:text-[7rem] font-black leading-[0.9] tracking-[-0.02em]"
              style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif" }}
            >
              <span 
                ref={(el) => { headlineLineRefs.current[0] = el; }}
                className="block"
              >
                {headlineLines[0]}
              </span>
              <span 
                ref={(el) => { headlineLineRefs.current[1] = el; }}
                className="block"
              >
                {headlineLines[1]}
              </span>
            </h2>
          </div>

          {/* Card - below text on mobile, right side on desktop */}
          <div className="lg:absolute lg:right-[3%] xl:right-[4%] lg:top-1/2 lg:-translate-y-1/2">
            <div className="relative w-[90vw] sm:w-[80vw] md:w-[70vw] lg:w-[50vw] xl:w-[52vw] max-w-[850px] aspect-[16/10]">
              {/* Cards container */}
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  ref={(el) => { cardsRef.current[idx] = el; }}
                  className="absolute inset-0 will-change-transform"
                >
                  {/* The actual card */}
                  <div 
                    className="relative h-full w-full rounded-[20px] sm:rounded-[28px] lg:rounded-[32px] border border-white/10 overflow-hidden"
                    style={{
                      backgroundColor: CARD_COLORS[idx],
                      boxShadow: '0 -20px 60px -15px rgba(0,0,0,0.6)',
                    }}
                  >
                    {/* Card content - image or placeholder */}
                    {step.image ? (
                      <img 
                        src={step.image} 
                        alt={step.headline.join(' ')} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <span 
                          className="text-xl sm:text-2xl lg:text-3xl font-medium"
                          style={{ 
                            color: CARD_COLORS[idx] === '#1a1a1a' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' 
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
