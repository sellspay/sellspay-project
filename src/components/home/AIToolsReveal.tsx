import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { supabase } from "@/integrations/supabase/client";

gsap.registerPlugin(ScrollTrigger);

import aiPanel1 from "@/assets/ai-panel-1.png";
import aiPanel2 from "@/assets/ai-panel-2.png";
import aiPanel3 from "@/assets/ai-panel-3.png";
import aiPanel5 from "@/assets/ai-panel-5.png";
import aiPanel6 from "@/assets/ai-panel-6.png";

interface PanelMedia {
  url: string | null;
  type: 'image' | 'video';
}

type Step = {
  bg: string;
  text: string;
  headline: string[];
  subtitle?: string;
  image?: string;
  media?: PanelMedia;
};

const REVEAL_SURFACE = "hsl(0 0% 0%)";
const REVEAL_FOREGROUND = "hsl(0 0% 95%)";

const DEFAULT_STEPS: Step[] = [
  {
    bg: REVEAL_SURFACE,
    text: REVEAL_FOREGROUND,
    headline: ["Building Made", "Simple"],
    subtitle: "Design and launch your storefront in minutes with our AI-powered builder. No coding required — just describe your vision and watch it come to life.",
    image: aiPanel1,
  },
  {
    bg: REVEAL_SURFACE,
    text: REVEAL_FOREGROUND,
    headline: ["Sell", "products"],
    subtitle: "List digital products, set your pricing, and start earning. From presets to sound packs — sell anything to a global audience instantly.",
    image: aiPanel2,
  },
  {
    bg: REVEAL_SURFACE,
    text: REVEAL_FOREGROUND,
    headline: ["Audio Made", "Simple"],
    subtitle: "Isolate vocals, split stems, and generate sound effects with studio-grade AI tools. Professional audio processing at the click of a button.",
    image: aiPanel3,
  },
  {
    bg: REVEAL_SURFACE,
    text: REVEAL_FOREGROUND,
    headline: ["Generate", "Videos"],
    subtitle: "Turn text prompts into cinematic videos. Create product demos, social content, and promotional clips powered by cutting-edge AI models.",
  },
  {
    bg: REVEAL_SURFACE,
    text: REVEAL_FOREGROUND,
    headline: ["Generate", "images"],
    subtitle: "Build your store's hero in seconds with our AI image generation models. Create stunning product visuals, banners, and promotional art — no design skills needed.",
    image: aiPanel5,
  },
  {
    bg: REVEAL_SURFACE,
    text: REVEAL_FOREGROUND,
    headline: ["All in", "one"],
    subtitle: "One platform for everything — storefronts, AI tools, marketplace, and community. Stop juggling apps and build your entire creative business here.",
    image: aiPanel6,
  },
];

const STEP_DISTANCE_DESKTOP = 550;
const STEP_DISTANCE_MOBILE = 350;
const STACK_Y = 14;
const STACK_SCALE = 0.02;
const TOP_CARD_SCALE = 0.97;
const HOLD_RATIO = 0.35;
const ENTRY_BUFFER = 250;
const EXIT_BUFFER = 350;

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
  const [activeSubtitle, setActiveSubtitle] = useState<string | undefined>(DEFAULT_STEPS[0].subtitle);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

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
      const textContainer = text; // Apply text color to entire container so subtitle inherits
      const totalScrollDistance = ENTRY_BUFFER + (panelCount - 1) * stepDistance + EXIT_BUFFER;
      const animDuration = 1 - HOLD_RATIO; // 0.6

      // Set initial states
      gsap.set(section, { backgroundColor: steps[0].bg });
      gsap.set(textContainer, { color: steps[0].text });

      cards.forEach((card, i) => {
        gsap.set(card, {
          zIndex: i + 1,
          yPercent: i === 0 ? 0 : 110,
          y: 0,
          scale: i === 0 ? TOP_CARD_SCALE : 1,
          willChange: "transform",
        });
      });
      gsap.set(cards[0], { zIndex: panelCount + 10 });

      const setHeadline = (idx: number) => {
        const line1 = steps[idx]?.headline?.[0] ?? "";
        const line2 = steps[idx]?.headline?.[1] ?? "";
        const sub = steps[idx]?.subtitle;
        if (activeHeadlineIndexRef.current === idx) return;
        activeHeadlineIndexRef.current = idx;
        setHeadlineLines([line1, line2]);
        setActiveSubtitle(sub);
        setActiveStepIndex(idx);
      };
      setHeadline(0);

      // ── Single unified timeline for cards ──
      const mainTl = gsap.timeline({ paused: true, defaults: { ease: "none" } });

      // Step 0 initial state
      for (let i = 0; i < panelCount; i++) {
        if (i === 0) {
          mainTl.set(cards[i], { yPercent: 0, y: 0, scale: TOP_CARD_SCALE }, 0);
        } else {
          mainTl.set(cards[i], { yPercent: 110, y: 0, scale: 1 }, 0);
        }
      }
      // Tiny hold for step 0
      mainTl.to({}, { duration: animDuration }, 0);

      // Steps 1..N-1: cards + colors transition together
      for (let step = 1; step < panelCount; step++) {
        const pos = (step - 1) + animDuration;

        // Cards above active stack behind
        for (let i = 0; i < step; i++) {
          const fromTop = step - i;
          const y = -fromTop * STACK_Y;
          const scale = Math.max(0.86, TOP_CARD_SCALE - fromTop * STACK_SCALE);
          mainTl.to(cards[i], { yPercent: 0, y, scale, duration: animDuration }, pos);
        }
        // Active card slides in
        mainTl.to(cards[step], { yPercent: 0, y: 0, scale: TOP_CARD_SCALE, duration: animDuration }, pos);
        // Cards below stay waiting
        for (let i = step + 1; i < panelCount; i++) {
          mainTl.to(cards[i], { yPercent: 110, y: 0, scale: 1, duration: animDuration }, pos);
        }
      }

      // zIndex helper
      const applyZDuringScrub = (p: number) => {
        const totalDur = mainTl.duration();
        const time = p * totalDur;
        let currentStep = 0;
        for (let s = panelCount - 1; s >= 1; s--) {
          const stepPos = (s - 1) + animDuration;
          const stepEnd = stepPos + animDuration;
          if (time >= stepEnd) { currentStep = s; break; }
          if (time >= stepPos) { currentStep = s - 1; break; }
        }
        let topIdx = currentStep;
        for (let s = 1; s < panelCount; s++) {
          const stepPos = (s - 1) + animDuration;
          const stepEnd = stepPos + animDuration;
          if (time > stepPos && time <= stepEnd) {
            topIdx = s;
            break;
          }
        }

        cards.forEach((card, i) => {
          let z = 0;
          if (i === topIdx) z = 10000;
          else if (i <= currentStep) z = 9000 - (currentStep - i);
          else z = 1000 - i;
          gsap.set(card, { zIndex: z });
        });
      };

      // Drive everything from one ScrollTrigger
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: `+=${totalScrollDistance}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 0,
        invalidateOnRefresh: true,
        scrub: 0.6,
        onUpdate: (self) => {
          const coreScrollDistance = (panelCount - 1) * stepDistance;
          const entryRatio = ENTRY_BUFFER / totalScrollDistance;
          const exitRatio = EXIT_BUFFER / totalScrollDistance;
          const coreRatio = coreScrollDistance / totalScrollDistance;

          let coreProgress = 0;
          if (self.progress <= entryRatio) {
            coreProgress = 0;
          } else if (self.progress >= (1 - exitRatio)) {
            coreProgress = 1;
          } else {
            coreProgress = (self.progress - entryRatio) / coreRatio;
          }
          coreProgress = Math.max(0, Math.min(1, coreProgress));

          // Drive the single unified timeline
          mainTl.progress(coreProgress);

          // Headline text updates
          const totalTransitions = panelCount - 1;
          const stepP = 1 / totalTransitions;
          const clamped = Math.max(0, Math.min(1, coreProgress));
          const base = Math.min(totalTransitions - 1, Math.floor(clamped / stepP));
          const local = (clamped - base * stepP) / stepP;
          const switchPoint = (1 - HOLD_RATIO) * 0.7;
          const activeIdx = local >= switchPoint ? Math.min(panelCount - 1, base + 1) : base;
          setHeadline(activeIdx);

          applyZDuringScrub(coreProgress);
        },
      });

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
      { y: 24, opacity: 0, filter: "blur(4px)" },
      { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "power3.out", overwrite: "auto", stagger: 0.08 }
    );
  }, [headlineLines[0], headlineLines[1]]);

  return (
    <section
      ref={sectionRef}
      className="ai-tools-reveal relative w-full will-change-transform overflow-x-clip"
      style={{ overflowY: "visible", backgroundColor: "#000000" }}
    >
      {/* Subtle radial glow behind active card area */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 65% 50%, rgba(255,255,255,0.015) 0%, transparent 70%)",
        }}
      />
      <div className="relative min-h-[100svh] w-full overflow-visible">
        <div className="absolute inset-0 flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-0 px-4 sm:px-6 lg:px-0 py-8 lg:py-0">
          <div
            ref={textRef}
            className="lg:absolute lg:left-[3%] xl:left-[4%] lg:top-1/2 lg:-translate-y-1/2 z-10 text-center lg:text-left w-full lg:w-auto lg:max-w-[28%] xl:max-w-[30%] order-1 lg:order-none"
            style={{ color: REVEAL_FOREGROUND }}
          >
            {/* Step counter */}
            <div className="mb-4 sm:mb-6 flex items-center gap-3 justify-center lg:justify-start">
              <span
                className="text-xs sm:text-sm font-mono tracking-[0.2em] uppercase"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {String(activeStepIndex + 1).padStart(2, "0")} / {String(panelCount).padStart(2, "0")}
              </span>
              <span
                className="hidden sm:block h-px flex-1 max-w-[60px]"
                style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
              />
            </div>
            <h2
              data-headline
              className="text-[2.5rem] sm:text-[3.2rem] md:text-[3.8rem] lg:text-[5rem] xl:text-[6rem] 2xl:text-[7rem] font-extrabold leading-[0.95] tracking-[-0.03em]"
              style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif", color: "#ffffff" }}
            >
              <span ref={(el) => { headlineLineRefs.current[0] = el; }} className="block will-change-transform">
                {headlineLines[0]}
              </span>
              <span ref={(el) => { headlineLineRefs.current[1] = el; }} className="block will-change-transform">
                {headlineLines[1]}
              </span>
            </h2>
            {activeSubtitle && (
              <p
                data-subtitle
                key={activeSubtitle}
                className="mt-4 sm:mt-6 text-[13px] sm:text-sm lg:text-[15px] max-w-sm leading-[1.7] font-normal"
                style={{
                  fontFamily: "'Inter', -apple-system, sans-serif",
                  color: "rgba(255,255,255,0.5)",
                  animation: "subtitleFadeIn 0.5s ease-out both",
                }}
              >
                {activeSubtitle}
              </p>
            )}
            {/* Step dots */}
            <div className="mt-6 sm:mt-8 flex items-center gap-2 justify-center lg:justify-start">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: activeStepIndex === i ? 24 : 6,
                    height: 6,
                    backgroundColor: activeStepIndex === i ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.15)",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="lg:absolute lg:right-[2%] xl:right-[3%] lg:top-1/2 lg:-translate-y-1/2 order-2 lg:order-none w-full lg:w-auto flex justify-center lg:justify-end overflow-x-clip overflow-y-visible">
            <div
              ref={deckRef}
              className="deck relative w-[90vw] sm:w-[85vw] md:w-[80vw] lg:w-[60vw] xl:w-[62vw] max-w-[1050px] aspect-[16/10] overflow-visible"
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
                    className="h-full w-full rounded-[16px] sm:rounded-[20px] md:rounded-[24px] lg:rounded-[28px] overflow-hidden"
                    style={{
                      backgroundColor: "#0a0a0a",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05) inset",
                    }}
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
                        <span className="text-base sm:text-xl md:text-2xl lg:text-3xl font-light tracking-wide" style={{ color: "rgba(255,255,255,0.1)" }}>
                          {step.headline.join(" ")}
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

// Inject keyframe animation for subtitle
if (typeof document !== "undefined" && !document.getElementById("reveal-subtitle-style")) {
  const style = document.createElement("style");
  style.id = "reveal-subtitle-style";
  style.textContent = `
    @keyframes subtitleFadeIn {
      from { opacity: 0; transform: translateY(8px); filter: blur(2px); }
      to   { opacity: 1; transform: translateY(0);   filter: blur(0); }
    }
  `;
  document.head.appendChild(style);
}
