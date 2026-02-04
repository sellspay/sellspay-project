import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Step = {
  bg: string;
  text: string;
  subtext: string;
  headline: string[];
};

export function AIToolsReveal() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const steps: Step[] = [
    { 
      bg: "#0a0a0a", 
      text: "#ffffff", 
      subtext: "rgba(255,255,255,0.70)",
      headline: ["AI Studio", "Tools"],
    },
    { 
      bg: "#ffffff", 
      text: "#111111", 
      subtext: "rgba(0,0,0,0.70)",
      headline: ["Generate", "Sounds"],
    },
    { 
      bg: "#0a0a0a", 
      text: "#ffffff", 
      subtext: "rgba(255,255,255,0.70)",
      headline: ["Isolate", "Vocals"],
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
      headline: ["Edit", "Videos"],
    },
    { 
      bg: "#0a0a0a", 
      text: "#ffffff", 
      subtext: "rgba(255,255,255,0.70)",
      headline: ["All In", "One Place"],
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
    const cardHeight = 640; // Taller rectangle

    // Set initial styles
    gsap.set(section, { backgroundColor: steps[0].bg });
    gsap.set(text.querySelector("[data-headline]"), { color: steps[0].text });

    // Set initial card positions
    cards.forEach((card, idx) => {
      gsap.set(card, {
        y: idx === 0 ? 0 : cardHeight,
        zIndex: idx,
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

    // Animate each step
    for (let i = 0; i < panelCount - 1; i++) {
      const startTime = i;
      const nextCardIndex = i + 1;
      
      // Next card slides UP from below
      tl.to(cards[nextCardIndex], {
        y: 0,
        duration: 1,
      }, startTime);
      
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
        <div className="mx-auto flex h-full max-w-7xl items-center px-8 gap-12">
          {/* Left text - MASSIVE typography */}
          <div
            ref={textRef}
            className="relative z-10 flex-1"
          >
            <h2 
              data-headline 
              className="text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black leading-[0.9] tracking-tight"
              style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif" }}
            >
              <span className="block">AI Studio</span>
              <span className="block">Tools</span>
            </h2>
          </div>

          {/* Right card stack area - Rectangle portrait cards */}
          <div className="relative flex-shrink-0">
            <div className="relative w-[420px] h-[640px] overflow-hidden rounded-[28px]">
              {/* Cards container */}
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  ref={(el) => { cardsRef.current[idx] = el; }}
                  className="absolute inset-0 will-change-transform"
                >
                  {/* The actual card */}
                  <div 
                    className="relative h-full w-full rounded-[28px] border border-white/15 overflow-hidden"
                    style={{
                      backgroundColor: cardColors[idx],
                      boxShadow: '0 -15px 50px -10px rgba(0,0,0,0.5)',
                    }}
                  >
                    {/* Card content placeholder */}
                    <div className="h-full w-full flex items-center justify-center">
                      <span 
                        className="text-2xl font-medium"
                        style={{ 
                          color: cardColors[idx] === '#1a1a1a' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' 
                        }}
                      >
                        Panel {idx + 1}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Prompt box overlay */}
              <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center z-50">
                <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/15 bg-black/70 px-4 py-3 backdrop-blur-xl">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-sm">
                    🔊
                  </div>
                  <div className="min-w-[200px] text-sm text-white/80">
                    Describe what you want…
                  </div>
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-sm">
                    ⬆️
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
