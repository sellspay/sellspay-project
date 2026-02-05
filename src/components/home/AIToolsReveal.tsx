import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import aiPanel1 from "@/assets/ai-panel-1.png";
import aiPanel5 from "@/assets/ai-panel-5.png";

type Step = {
  bg: string;
  text: string;
  subtext: string;
  headline: string[];
  image?: string;
};

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
    image: aiPanel5,
  },
  {
    bg: "#0a0a0a",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.70)",
    headline: ["All in", "one"],
  },
];

const CARD_COLORS = ["#1a1a1a", "#f5f5f5", "#1a1a1a", "#e76e50", "#50A9E7", "#1a1a1a"];

// Deck stack configuration - intentional offset + scale + opacity per level
const DECK = {
  stackSpacing: 14,
  scaleStep: 0.015,
  opacityLevels: [1, 0.55, 0.30, 0.18, 0.10],
  entryY: 60,
  entryScale: 0.96,
};

export function AIToolsReveal() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const headlineLineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const activeHeadlineIndexRef = useRef<number>(-1);
  const activeCardIndexRef = useRef<number>(0);

  const [headlineLines, setHeadlineLines] = useState<[string, string]>([
    STEPS[0].headline[0],
    STEPS[0].headline[1],
  ]);

  const steps = useMemo(() => STEPS, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const text = textRef.current;
      const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
      if (!text || cards.length === 0) return;

      ScrollTrigger.getById("ai-tools-reveal")?.kill();

      const panelCount = steps.length;
      const headlineEl = text.querySelector("[data-headline]") as HTMLElement | null;

      // Set initial styles
      gsap.set(section, { backgroundColor: steps[0].bg });
      if (headlineEl) gsap.set(headlineEl, { color: steps[0].text });

      // Apply deck stack - card at activeIndex is on top, others stack below
      const applyDeckStack = (activeIndex: number, animate = true) => {
        if (activeCardIndexRef.current === activeIndex && animate) return;
        activeCardIndexRef.current = activeIndex;

        cards.forEach((card, idx) => {
          const distance = idx - activeIndex;

          if (distance < 0) {
            // Cards already passed - hidden above
            gsap.set(card, {
              y: -DECK.entryY,
              scale: DECK.entryScale,
              opacity: 0,
              zIndex: idx,
              pointerEvents: "none",
            });
          } else if (distance === 0) {
            // Active card - full visibility on top
            const props = { y: 0, scale: 1, opacity: 1 };
            if (animate) {
              gsap.to(card, { ...props, duration: 0.45, ease: "power2.out" });
            } else {
              gsap.set(card, props);
            }
            gsap.set(card, { zIndex: 100 + cards.length - idx, pointerEvents: "auto" });
          } else {
            // Cards behind active - stacked deck formation
            const level = Math.min(distance, DECK.opacityLevels.length - 1);
            const stackY = distance * DECK.stackSpacing;
            const stackScale = Math.max(0.9, 1 - distance * DECK.scaleStep);
            const stackOpacity = DECK.opacityLevels[level] ?? 0;

            const props = { y: stackY, scale: stackScale, opacity: stackOpacity };
            if (animate) {
              gsap.to(card, { ...props, duration: 0.45, ease: "power2.out" });
            } else {
              gsap.set(card, props);
            }
            gsap.set(card, { zIndex: 50 - distance, pointerEvents: "none" });
          }
        });
      };

      // Initialize deck with card 0 active
      applyDeckStack(0, false);

      const setHeadline = (idx: number) => {
        const line1 = steps[idx]?.headline?.[0] ?? "";
        const line2 = steps[idx]?.headline?.[1] ?? "";
        if (activeHeadlineIndexRef.current === idx) return;
        activeHeadlineIndexRef.current = idx;
        setHeadlineLines([line1, line2]);
      };

      setHeadline(0);

      // Update active card and headline based on scroll progress
      const updateFromProgress = (progress: number) => {
        const totalTransitions = panelCount - 1;
        const stepP = 1 / totalTransitions;
        const clamped = Math.max(0, Math.min(1, progress));

        const base = Math.max(0, Math.min(totalTransitions - 1, Math.floor(clamped / stepP)));
        const local = (clamped - base * stepP) / stepP;

        // Switch at ~30% into each segment for snappy feel
        const activeIdx = local >= 0.3 ? Math.min(panelCount - 1, base + 1) : base;

        setHeadline(activeIdx);
        applyDeckStack(activeIdx, true);
      };

      const scrollPerPanel = window.innerHeight * 0.8;
      const totalScrollDistance = (panelCount - 1) * scrollPerPanel;

      // Background color timeline
      const colorTl = gsap.timeline({ paused: true });
      for (let i = 0; i < panelCount; i++) {
        const progress = i / (panelCount - 1);
        colorTl.to(section, { backgroundColor: steps[i].bg, duration: 0.05 }, progress);
        if (headlineEl) {
          colorTl.to(headlineEl, { color: steps[i].text, duration: 0.05 }, progress);
        }
      }

      const st = ScrollTrigger.create({
        id: "ai-tools-reveal",
        trigger: section,
        start: "top top",
        end: `+=${totalScrollDistance}`,
        scrub: 0.3,
        pin: section,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
        preventOverlaps: true,
        onUpdate: (self) => {
          updateFromProgress(self.progress);
          colorTl.progress(self.progress);
        },
        onRefresh: (self) => {
          updateFromProgress(self.progress);
          colorTl.progress(self.progress);
        },
      });

      // Headline line animation setup
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
        st.kill();
        colorTl.kill();
      };
    }, sectionRef);

    return () => ctx.revert();
  }, [steps]);

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
    <section ref={sectionRef} className="relative w-full will-change-transform">
      <div className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-0 px-4 lg:px-0">
          {/* Text */}
          <div
            ref={textRef}
            className="lg:absolute lg:left-[4%] xl:left-[5%] lg:top-1/2 lg:-translate-y-1/2 z-10 text-center lg:text-left lg:max-w-[35%] xl:max-w-[40%]"
          >
            <h2
              data-headline
              className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5rem] xl:text-[6rem] 2xl:text-[7rem] font-black leading-[0.9] tracking-[-0.02em]"
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

          {/* Card deck */}
          <div className="lg:absolute lg:right-[3%] xl:right-[4%] lg:top-1/2 lg:-translate-y-1/2">
            <div className="relative w-[90vw] sm:w-[80vw] md:w-[70vw] lg:w-[50vw] xl:w-[52vw] max-w-[850px] aspect-[16/10]">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  ref={(el) => { cardsRef.current[idx] = el; }}
                  className="absolute inset-0 will-change-transform origin-center"
                  style={{
                    opacity: idx === 0 ? 1 : DECK.opacityLevels[Math.min(idx, DECK.opacityLevels.length - 1)],
                    transform: idx === 0
                      ? "translateY(0) scale(1)"
                      : `translateY(${idx * DECK.stackSpacing}px) scale(${Math.max(0.9, 1 - idx * DECK.scaleStep)})`,
                    zIndex: idx === 0 ? 100 : 50 - idx,
                  }}
                >
                  <div
                    className="relative h-full w-full rounded-[20px] sm:rounded-[28px] lg:rounded-[32px] border border-white/10 overflow-hidden shadow-2xl"
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
                          className="text-xl sm:text-2xl lg:text-3xl font-medium"
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