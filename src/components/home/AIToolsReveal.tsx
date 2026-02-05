import React, { useLayoutEffect, useRef } from "react";
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

export function AIToolsReveal() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const headlineLineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const steps: Step[] = [
    { 
      bg: "#0a0a0a", 
      text: "#ffffff", 
      subtext: "rgba(255,255,255,0.70)",
      headline: ["Building", "made simple"],
      image: aiPanel1,
    },
    { 
      bg: "#ffffff", 
      text: "#111111", 
      subtext: "rgba(0,0,0,0.70)",
      headline: ["Generate SFX", "with prompts"],
    },
    { 
      bg: "#0a0a0a", 
      text: "#ffffff", 
      subtext: "rgba(255,255,255,0.70)",
      headline: ["Create", "images"],
    },
    { 
      bg: "#e76e50", 
      text: "#0a0a0a", 
      subtext: "rgba(10,10,10,0.75)",
      headline: ["Create", "Images"],
    },
    { 
      bg: "#50A9E7", 
      text: "#0a0a0a", 
      subtext: "rgba(10,10,10,0.75)",
      headline: ["Sell", "products"],
    },
    { 
      bg: "#0a0a0a", 
      text: "#ffffff", 
      subtext: "rgba(255,255,255,0.70)",
      headline: ["All in", "one"],
    },
  ];

  // Card colors for visual variety
  const cardColors = [
    '#1a1a1a',
    '#f5f5f5',
    '#1a1a1a',
    '#e76e50',
    '#50A9E7',
    '#1a1a1a',
  ];

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!section || !text || cards.length === 0) return;

    const panelCount = steps.length;
    // Use viewport-relative height for responsive card stacking
    const cardHeight = window.innerHeight * 0.6;

    // Set initial styles
    gsap.set(section, { backgroundColor: steps[0].bg });
    gsap.set(text.querySelector("[data-headline]"), { color: steps[0].text });

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
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${(panelCount - 1) * window.innerHeight}`,
        scrub: true,
        pin: section,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Get headline text elements
    const line1 = headlineLineRefs.current[0];
    const line2 = headlineLineRefs.current[1];

    // Animate each step
    for (let i = 0; i < panelCount - 1; i++) {
      const startTime = i;
      const nextCardIndex = i + 1;
      
      // Reposition all previously revealed cards into their stacked silhouette positions
      // Example: when card 2 becomes active, card1 -> -spacing, card0 -> -2*spacing
      tl.to(
        cards.slice(0, nextCardIndex),
        {
          duration: 1,
          y: (index: number) => getStackY(nextCardIndex, index),
          scale: (index: number) => getStackScale(nextCardIndex, index),
        },
        startTime
      );
      
      // Next card slides UP from below to the front
      tl.to(cards[nextCardIndex], {
        y: 0,
        scale: 1,
        duration: 1,
      }, startTime);
      
      // Bring the new card above the stack
      tl.set(cards[nextCardIndex], { zIndex: nextCardIndex + 10 }, startTime);
      
      // Change background color
      tl.to(section, { 
        backgroundColor: steps[i + 1].bg,
        duration: 0.3,
      }, startTime);
      
      // Change text color
      tl.to(text.querySelector("[data-headline]"), { 
        color: steps[i + 1].text,
        duration: 0.3,
      }, startTime);

      // Update headline text at midpoint of transition
      if (line1 && line2) {
        tl.call(() => {
          line1.textContent = steps[i + 1].headline[0];
          line2.textContent = steps[i + 1].headline[1];
        }, [], startTime + 0.15);
      }
    }

    tl.duration(panelCount - 1);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ScrollTrigger.getAll().forEach(st => st.kill());
      tl.kill();
    };
  }, []);

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
                Generate anything
              </span>
              <span 
                ref={(el) => { headlineLineRefs.current[1] = el; }}
                className="block"
              >
                from Simple prompts
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
                      backgroundColor: cardColors[idx],
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
                            color: cardColors[idx] === '#1a1a1a' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' 
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
