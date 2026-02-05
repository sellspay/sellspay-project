import React, { useLayoutEffect, useEffect, useMemo, useRef, useState } from "react";
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
    headline: ["Building Made", "Simple"],
    image: aiPanel1,
  },
  {
    bg: "#ffffff",
    text: "#111111",
    subtext: "rgba(0,0,0,0.70)",
    headline: ["Sell", "products"],
  },
  {
    bg: "#0a0a0a",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.70)",
    headline: ["Audio Made", "Simple"],
  },
  {
    bg: "#e76e50",
    text: "#0a0a0a",
    subtext: "rgba(10,10,10,0.75)",
    headline: ["Generate", "Videos"],
  },
  {
    bg: "#50A9E7",
    text: "#0a0a0a",
    subtext: "rgba(10,10,10,0.75)",
    headline: ["Generate", "images"],
  },
  {
    bg: "#0a0a0a",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.70)",
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
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const [headlineLines, setHeadlineLines] = useState<[string, string]>([
    STEPS[0].headline[0],
    STEPS[0].headline[1],
  ]);

  const steps = useMemo(() => STEPS, []);

  useLayoutEffect(() => {
    // Kill any existing timeline before creating a new one (handles StrictMode + navigation)
    if (tlRef.current) {
      tlRef.current.scrollTrigger?.kill();
      tlRef.current.kill();
      tlRef.current = null;
    }

    const section = sectionRef.current;
    const text = textRef.current;
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!section || !text || cards.length === 0) return;

    const panelCount = steps.length;
    const cardHeight = window.innerHeight * 0.6;

    const headlineEl = text.querySelector("[data-headline]") as HTMLElement | null;

    // Set initial styles
    gsap.set(section, { backgroundColor: steps[0].bg });
    if (headlineEl) gsap.set(headlineEl, { color: steps[0].text });

    // Stack silhouette values
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
        zIndex: idx + 1,
      });
    });

    const animationDuration = 0.6;
    const pauseDuration = 0.4;
    const stepDuration = animationDuration + pauseDuration;

    const setHeadline = (idx: number) => {
      const line1 = steps[idx]?.headline?.[0] ?? "";
      const line2 = steps[idx]?.headline?.[1] ?? "";
      if (activeHeadlineIndexRef.current === idx) return;
      activeHeadlineIndexRef.current = idx;
      setHeadlineLines([line1, line2]);
    };

    setHeadline(0);

    const updateHeadlineFromProgress = (progress: number) => {
      const totalTransitions = panelCount - 1;
      const stepP = 1 / totalTransitions;
      const clamped = Math.max(0, Math.min(1, progress));

      const base = Math.max(0, Math.min(totalTransitions - 1, Math.floor(clamped / stepP)));
      const local = (clamped - base * stepP) / stepP;

      const idx = local >= 0.8 ? base + 1 : base;
      setHeadline(Math.min(panelCount - 1, idx));
    };

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${(panelCount - 1) * stepDuration * window.innerHeight}`,
        scrub: 0.5,
        pin: section,
        pinSpacing: true,
        pinType: "transform",
        invalidateOnRefresh: true,
        onUpdate: (self) => updateHeadlineFromProgress(self.progress),
        onRefresh: (self) => {
          updateHeadlineFromProgress(self.progress);
        },
      },
    });

    tlRef.current = tl;

    // Animate each step
    for (let i = 0; i < panelCount - 1; i++) {
      const startTime = i * stepDuration;
      const nextCardIndex = i + 1;

      tl.to(
        cards.slice(0, nextCardIndex),
        {
          duration: animationDuration,
          y: (index: number) => getStackY(nextCardIndex, index),
          scale: (index: number) => getStackScale(nextCardIndex, index),
        },
        startTime
      );

      tl.to(
        cards[nextCardIndex],
        {
          y: 0,
          scale: 1,
          duration: animationDuration,
        },
        startTime
      );

      tl.set(cards[nextCardIndex], { zIndex: nextCardIndex + 10 }, startTime);

      tl.to(
        section,
        {
          backgroundColor: steps[i + 1].bg,
          duration: animationDuration * 0.5,
        },
        startTime
      );

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

      tl.to({}, { duration: pauseDuration }, startTime + animationDuration);
    }

    const line1El = headlineLineRefs.current[0];
    const line2El = headlineLineRefs.current[1];
    if (line1El && line2El) {
      gsap.set([line1El, line2El], { willChange: "transform,opacity" });
    }

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (tlRef.current) {
        tlRef.current.scrollTrigger?.kill();
        tlRef.current.kill();
        tlRef.current = null;
      }
    };
  }, [steps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tlRef.current) {
        tlRef.current.scrollTrigger?.kill();
        tlRef.current.kill();
        tlRef.current = null;
      }
      activeHeadlineIndexRef.current = -1;
    };
  }, []);

  // Animate headline text changes
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
      <div className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-0 px-4 lg:px-0">
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
                ref={(el) => {
                  headlineLineRefs.current[0] = el;
                }}
                className="block"
              >
                {headlineLines[0]}
              </span>
              <span
                ref={(el) => {
                  headlineLineRefs.current[1] = el;
                }}
                className="block"
              >
                {headlineLines[1]}
              </span>
            </h2>
          </div>

          <div className="lg:absolute lg:right-[3%] xl:right-[4%] lg:top-1/2 lg:-translate-y-1/2">
            <div className="relative w-[90vw] sm:w-[80vw] md:w-[70vw] lg:w-[50vw] xl:w-[52vw] max-w-[850px] aspect-[16/10]">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  ref={(el) => {
                    cardsRef.current[idx] = el;
                  }}
                  className="absolute inset-0 will-change-transform"
                >
                  <div
                    className="relative h-full w-full rounded-[20px] sm:rounded-[28px] lg:rounded-[32px] border border-white/10 overflow-hidden"
                    style={{
                      backgroundColor: CARD_COLORS[idx],
                      boxShadow: "0 -20px 60px -15px rgba(0,0,0,0.6)",
                    }}
                  >
                    {step.image ? (
                      <img
                        src={step.image}
                        alt={step.headline.join(" ")}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <span
                          className="text-xl sm:text-2xl lg:text-3xl font-medium"
                          style={{
                            color:
                              CARD_COLORS[idx] === "#1a1a1a"
                                ? "rgba(255,255,255,0.15)"
                                : "rgba(0,0,0,0.15)",
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