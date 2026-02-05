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
const STEP_DISTANCE = 500;

export function AIToolsReveal() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const headlineLineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const activeHeadlineIndexRef = useRef<number>(-1);

  const [headlineLines, setHeadlineLines] = useState<[string, string]>([
    STEPS[0].headline[0],
    STEPS[0].headline[1],
  ]);

  const panelCount = STEPS.length;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const deck = deckRef.current;
    if (!section || !deck) return;

    const ctx = gsap.context(() => {
      const text = textRef.current;
      const cards = gsap.utils.toArray<HTMLDivElement>(".deck .card");
      if (!text || cards.length === 0) return;

      const headlineEl = text.querySelector("[data-headline]") as HTMLElement | null;
      const totalScrollDistance = (panelCount - 1) * STEP_DISTANCE;

      gsap.set(section, { backgroundColor: STEPS[0].bg });
      if (headlineEl) gsap.set(headlineEl, { color: STEPS[0].text });

      // Stack cards: first card on top (highest z-index)
      cards.forEach((card, i) => {
        gsap.set(card, { zIndex: cards.length - i, yPercent: 0 });
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
        },
      });

      // Each card slides up to reveal the next (except last)
      cards.slice(0, -1).forEach((card, i) => {
        gsap.to(card, {
          yPercent: -110,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: () => `top+=${i * STEP_DISTANCE} top`,
            end: () => `top+=${(i + 1) * STEP_DISTANCE} top`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
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
  }, [panelCount]);

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
          <div className="lg:absolute lg:right-[3%] xl:right-[4%] lg:top-1/2 lg:-translate-y-1/2">
            <div
              ref={deckRef}
              className="deck relative w-[90vw] sm:w-[80vw] md:w-[70vw] lg:w-[50vw] xl:w-[52vw] max-w-[850px] aspect-[16/10]"
            >
              {STEPS.map((step, idx) => (
                <div
                  key={idx}
                  className="card absolute inset-0 will-change-transform"
                  style={{ transform: "translate3d(0,0,0)" }}
                >
                  <div
                    className="h-full w-full rounded-[20px] sm:rounded-[28px] lg:rounded-[32px] border border-white/10 overflow-hidden shadow-2xl"
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