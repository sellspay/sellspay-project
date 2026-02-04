import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(ScrollTrigger);

type Step = {
  bg: string;
  text: string;
  subtext: string;
};

export function AIToolsReveal() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const steps: Step[] = [
    { bg: "#0a0a0a", text: "#C9B8FF", subtext: "rgba(255,255,255,0.70)" }, // 1 gray
    { bg: "#ffffff", text: "#111111", subtext: "rgba(0,0,0,0.70)" },       // 2 white
    { bg: "#0a0a0a", text: "#C9B8FF", subtext: "rgba(255,255,255,0.70)" }, // 3 gray
    { bg: "#e76e50", text: "#0a0a0a", subtext: "rgba(10,10,10,0.75)" },    // 4 light red
    { bg: "#50A9E7", text: "#0a0a0a", subtext: "rgba(10,10,10,0.75)" },    // 5 light blue
    { bg: "#0a0a0a", text: "#C9B8FF", subtext: "rgba(255,255,255,0.70)" }, // 6 gray end
  ];

  // Card colors for visual variety
  const cardColors = [
    '#1a1a1a', // gray card
    '#f5f5f5', // white card  
    '#1a1a1a', // gray card
    '#e76e50', // red card
    '#50A9E7', // blue card
    '#1a1a1a', // gray card
  ];

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!section || !text || cards.length === 0) return;

    const panelCount = steps.length;
    const cardHeight = 520;

    // Set initial styles
    gsap.set(section, { backgroundColor: steps[0].bg });
    gsap.set(text.querySelector("[data-title]"), { color: steps[0].text });
    gsap.set(text.querySelector("[data-sub]"), { color: steps[0].subtext });

    // Set initial card positions:
    // - First card (idx 0) is visible at y: 0
    // - All other cards start BELOW (off-screen) at y: cardHeight
    // - Z-index: HIGHER for later cards so they stack ON TOP
    cards.forEach((card, idx) => {
      gsap.set(card, {
        y: idx === 0 ? 0 : cardHeight, // First card visible, rest below
        zIndex: idx, // Higher index = higher z-index = stacks on top
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

    // Animate each step: next card slides UP from below to stack ON TOP
    for (let i = 0; i < panelCount - 1; i++) {
      const startTime = i;
      const nextCardIndex = i + 1;
      
      // Next card slides UP from below (y: cardHeight -> y: 0)
      tl.to(cards[nextCardIndex], {
        y: 0,
        duration: 1,
      }, startTime);
      
      // Change colors at same time
      tl.to(section, { 
        backgroundColor: steps[i + 1].bg,
        duration: 0.3,
      }, startTime);
      tl.to(text.querySelector("[data-title]"), { 
        color: steps[i + 1].text,
        duration: 0.3,
      }, startTime);
      tl.to(text.querySelector("[data-sub]"), { 
        color: steps[i + 1].subtext,
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
        <div className="mx-auto flex h-full max-w-6xl items-center px-6">
          {/* Left text */}
          <div
            ref={textRef}
            className="relative z-10 w-[420px] shrink-0"
          >
            <h2 data-title className="text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl">
              AI Studio
            </h2>
            <p data-sub className="mt-4 text-lg leading-relaxed md:text-xl">
              Professional AI tools for modern creators. Generate SFX, isolate vocals,
              create images — all in one place.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/tools")}
              className="mt-8 h-auto py-4 px-12 text-lg"
            >
              Explore Tools
            </Button>
          </div>

          {/* Right card stack area */}
          <div className="relative flex flex-1 justify-center">
            <div className="relative w-[500px] h-[520px] overflow-hidden rounded-[24px]">
              {/* Cards container - all cards positioned absolutely */}
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  ref={(el) => { cardsRef.current[idx] = el; }}
                  className="absolute inset-0 will-change-transform"
                >
                  {/* The actual card */}
                  <div 
                    className="relative h-full w-full rounded-[24px] border border-white/15 overflow-hidden"
                    style={{
                      backgroundColor: cardColors[idx],
                      boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.4)',
                    }}
                  >
                    {/* Card content placeholder */}
                    <div className="h-full w-full flex items-center justify-center">
                      <span 
                        className="text-3xl font-medium"
                        style={{ 
                          color: cardColors[idx] === '#1a1a1a' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' 
                        }}
                      >
                        Panel {idx + 1}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Prompt box overlay */}
              <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center z-50">
                <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/15 bg-black/70 px-4 py-3 backdrop-blur-xl">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                    🔊
                  </div>
                  <div className="min-w-[280px] text-sm text-white/80">
                    Describe what you want to create…
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
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
