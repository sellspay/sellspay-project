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

          {/* Right card stack area */}
          <div className="relative flex flex-1 justify-center">
            <div className="relative w-[600px] max-w-full">
              {/* Viewport that clips the stack */}
              <div 
                ref={viewportRef} 
                className="relative h-[520px] overflow-hidden"
              >
                {/* TRACK: moves vertically to reveal stacked cards */}
                <div ref={trackRef} className="will-change-transform absolute inset-x-0 top-0">
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="absolute inset-x-0"
                      style={{
                        // Stack cards with offset - cards behind peek from top
                        top: `${idx * 520}px`,
                        zIndex: steps.length - idx,
                      }}
                    >
                      {/* The actual card - rounded, with shadow for depth */}
                      <div 
                        className="relative mx-auto h-[520px] w-full rounded-[24px] border border-white/15 overflow-hidden"
                        style={{
                          backgroundColor: step.bg === '#ffffff' ? '#f5f5f5' : 
                                          step.bg === '#e76e50' ? '#e76e50' :
                                          step.bg === '#50A9E7' ? '#50A9E7' : '#1a1a1a',
                          boxShadow: '0 20px 60px -15px rgba(0,0,0,0.5)',
                        }}
                      >
                        {/* Card content placeholder */}
                        <div className="h-full w-full flex items-center justify-center">
                          <span 
                            className="text-3xl font-medium"
                            style={{ 
                              color: step.bg === '#0a0a0a' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' 
                            }}
                          >
                            Panel {idx + 1}
                          </span>
                        </div>
                      </div>
                      
                      {/* Cards peeking behind - visual depth */}
                      {idx < steps.length - 1 && (
                        <>
                          <div 
                            className="absolute left-1/2 -translate-x-1/2 w-[92%] h-[30px] rounded-t-[20px] border border-white/10"
                            style={{
                              top: '-25px',
                              backgroundColor: steps[idx + 1]?.bg === '#ffffff' ? '#e5e5e5' : 
                                              steps[idx + 1]?.bg === '#e76e50' ? '#d85940' :
                                              steps[idx + 1]?.bg === '#50A9E7' ? '#4099d7' : '#141414',
                              zIndex: -1,
                            }}
                          />
                          {idx < steps.length - 2 && (
                            <div 
                              className="absolute left-1/2 -translate-x-1/2 w-[84%] h-[20px] rounded-t-[16px] border border-white/5"
                              style={{
                                top: '-45px',
                                backgroundColor: steps[idx + 2]?.bg === '#ffffff' ? '#d5d5d5' : 
                                                steps[idx + 2]?.bg === '#e76e50' ? '#c84930' :
                                                steps[idx + 2]?.bg === '#50A9E7' ? '#3089c7' : '#0e0e0e',
                                zIndex: -2,
                              }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Prompt box overlay */}
              <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center z-20">
                <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/15 bg-black/60 px-4 py-3 backdrop-blur-xl">
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
