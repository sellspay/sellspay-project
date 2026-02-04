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
  const pinRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);

  const steps: Step[] = [
    { bg: "#07070A", text: "#C9B8FF", subtext: "rgba(255,255,255,0.65)" },
    { bg: "#0A0F1D", text: "#7EE7FF", subtext: "rgba(255,255,255,0.65)" },
    { bg: "#16080B", text: "#FF7A90", subtext: "rgba(255,255,255,0.65)" },
    { bg: "#081013", text: "#7CFFB2", subtext: "rgba(255,255,255,0.65)" },
    { bg: "#10081A", text: "#D8A7FF", subtext: "rgba(255,255,255,0.65)" },
  ];

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const track = trackRef.current;
    const text = textRef.current;
    if (!section || !pin || !track || !text) return;

    const panelCount = steps.length;
    const panelHeight = pin.clientHeight;

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
        pin: pin,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Move the image stack up exactly one viewport per step
    tl.to(track, {
      y: -(panelCount - 1) * panelHeight,
    }, 0);

    // Background + text color changes per step
    for (let i = 1; i < panelCount; i++) {
      const t = i;
      tl.to(section, { backgroundColor: steps[i].bg }, t - 0.001);
      tl.to(text.querySelector("[data-title]"), { color: steps[i].text }, t - 0.001);
      tl.to(text.querySelector("[data-sub]"), { color: steps[i].subtext }, t - 0.001);
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
      {/* Pinned viewport - page STOPS here while scrub happens */}
      <div ref={pinRef} className="relative h-screen w-full overflow-hidden">
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
              className="mt-8 h-auto py-4 px-12 text-lg rounded-none"
            >
              Explore Tools
            </Button>
          </div>

          {/* Right card area */}
          <div className="relative flex flex-1 justify-center">
            <div className="relative w-[900px] max-w-full">
              {/* Glass frame - NO glow */}
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                <div className="m-[10px] rounded-[22px] border border-white/10 bg-black/30">
                  <div className="p-4">
                    {/* Reveal window */}
                    <div className="relative h-[520px] overflow-hidden rounded-[18px] bg-black/10">
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
