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
const STACK_OFFSET = 12;
const STACK_SCALE_STEP = 0.02;

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

      // Stack cards: LAST card starts on top (will be pushed down as we scroll)
      // Cards are rendered in DOM order 0,1,2,3,4,5
      // Initially: card 0 visible on top, cards 1-5 positioned below (off-screen)
      cards.forEach((card, i) => {
        // First card (i=0) is visible, others start below
        gsap.set(card, { 
          zIndex: panelCount - i, 
          yPercent: i === 0 ? 0 : 100,
          scale: 1
        });
      });

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

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: `+=${totalScrollDistance}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          colorTl.progress(self.progress);
          const totalTransitions = panelCount - 1;
          const stepP = 1 / totalTransitions;
          const clamped = Math.max(0, Math.min(1, self.progress));
          const base = Math.floor(clamped / stepP);
          const local = (clamped - base * stepP) / stepP;
          const activeIdx = local >= 0.3 ? Math.min(panelCount - 1, base + 1) : base;
          setHeadline(activeIdx);

          // Stack animation: push previous cards up and scale them down
          cards.forEach((card, i) => {
            if (i === 0) return; // First card stays put
            
            const cardProgress = (clamped - (i - 1) * stepP) / stepP;
            const clampedCardProgress = Math.max(0, Math.min(1, cardProgress));
            
            // Card slides up from 100% to 0%
            const yPercent = 100 - (clampedCardProgress * 100);
            gsap.set(card, { yPercent });
          });

          // Scale and offset previous cards as new ones stack on top
          cards.forEach((card, i) => {
            // How many cards are stacked on top of this one?
            const cardsAbove = cards.reduce((count, _, j) => {
              if (j <= i) return count;
              const cardProgress = (clamped - (j - 1) * stepP) / stepP;
              return cardProgress > 0.5 ? count + 1 : count;
            }, 0);
            
            if (cardsAbove > 0) {
              const scale = 1 - (cardsAbove * STACK_SCALE_STEP);
              const offsetY = -(cardsAbove * STACK_OFFSET);
              gsap.set(card, { 
                scale: Math.max(0.85, scale),
                y: offsetY
              });
            } else {
              gsap.set(card, { scale: 1, y: 0 });
            }
          });
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
              className="deck relative w-[85vw] sm:w-[75vw] md:w-[65vw] lg:w-[48vw] xl:w-[50vw] max-w-[800px] aspect-[16/10]"
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