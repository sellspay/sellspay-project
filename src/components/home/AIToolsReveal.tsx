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
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);

  const steps: Step[] = [
    { bg: "#0a0a0a", text: "#C9B8FF", subtext: "rgba(255,255,255,0.70)" }, // 1 gray
    { bg: "#ffffff", text: "#111111", subtext: "rgba(0,0,0,0.70)" },       // 2 white
    { bg: "#0a0a0a", text: "#C9B8FF", subtext: "rgba(255,255,255,0.70)" }, // 3 gray
    { bg: "#e76e50", text: "#0a0a0a", subtext: "rgba(10,10,10,0.75)" },    // 4 light red
    { bg: "#50A9E7", text: "#0a0a0a", subtext: "rgba(10,10,10,0.75)" },    // 5 light blue
    { bg: "#0a0a0a", text: "#C9B8FF", subtext: "rgba(255,255,255,0.70)" }, // 6 gray end
  ];

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const text = textRef.current;
    if (!section || !viewport || !track || !text) return;

    const panelCount = steps.length;
    const panelHeight = viewport.clientHeight; // Use viewport height (520px)

    // Set initial styles
    gsap.set(section, { backgroundColor: steps[0].bg });
    gsap.set(text.querySelector("[data-title]"), { color: steps[0].text });
    gsap.set(text.querySelector("[data-sub]"), { color: steps[0].subtext });

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

    // Animate each step: panel moves + colors change TOGETHER
    for (let i = 0; i < panelCount - 1; i++) {
      const startTime = i;
      const endTime = i + 1;
      
      // Move track to next panel
      tl.to(track, {
        y: -(i + 1) * panelHeight,
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

          {/* Right card area */}
          <div className="relative flex flex-1 justify-center">
            <div className="relative w-[900px] max-w-full">
              {/* Glass frame - clean, no glow */}
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                <div className="m-[10px] rounded-[22px] border border-white/10 bg-black/30">
                  <div className="p-4">
                    {/* Reveal window - viewport ref here */}
                    <div 
                      ref={viewportRef} 
                      className="relative h-[520px] overflow-hidden rounded-[18px] bg-black/10"
                    >
                      {/* TRACK: stack of panels, moves up/down with scroll */}
                      <div ref={trackRef} className="will-change-transform">
                        {steps.map((_, idx) => (
                          <div
                            key={idx}
                            className="h-[520px] w-full p-3"
                          >
                            {/* Replace with real collage/cards per step */}
                            <div className="h-full w-full rounded-2xl bg-white/10 flex items-center justify-center">
                              <span className="text-white/40 text-2xl font-medium">
                                Panel {idx + 1}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Prompt box overlay */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
                        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/15 bg-black/40 px-4 py-3 backdrop-blur-xl">
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
