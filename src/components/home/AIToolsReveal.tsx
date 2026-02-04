import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function AIToolsReveal() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement | null>(null);

  // This ties the animation to THIS section's scroll position
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"], // when section enters viewport -> when it leaves
  });

  // Smooth the progress so it feels premium
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 22 });

  // BACKGROUND COLOR changes ON SCROLL
  const bg = useTransform(
    p,
    [0, 0.35, 0.7, 1],
    ["#05060B", "#0B1020", "#140A18", "#070A12"]
  );

  // Accent/text color changes ON SCROLL
  const accent = useTransform(
    p,
    [0, 0.35, 0.7, 1],
    ["#7C5CFF", "#3DBBFF", "#FF4C9A", "#FF6A2A"]
  );

  // Card motion (parallax / depth) driven by scroll
  const cardY1 = useTransform(p, [0, 1], [40, -40]);
  const cardY2 = useTransform(p, [0, 1], [20, -20]);
  const cardY3 = useTransform(p, [0, 1], [10, -10]);

  const cardRot1 = useTransform(p, [0, 1], [-2, 2]);
  const cardRot2 = useTransform(p, [0, 1], [2, -2]);

  // Optional: subtle overall scale when section is centered
  const frameScale = useTransform(p, [0.15, 0.5, 0.85], [0.98, 1, 0.98]);

  return (
    <section ref={ref} className="relative min-h-[90vh] overflow-hidden">
      {/* Scroll-driven background */}
      <motion.div className="absolute inset-0" style={{ backgroundColor: bg }} />

      {/* vignette */}
      <div className="pointer-events-none absolute inset-0 opacity-50 [background:radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.75)_100%)]" />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-20 md:grid-cols-2 md:items-center lg:py-28">
        {/* Left text */}
        <div>
          <motion.h1
            className="text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl"
            style={{ color: accent }}
          >
            AI Studio
          </motion.h1>

          <motion.p
            className="mt-4 text-lg leading-relaxed text-white/80 md:text-xl"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Professional AI tools for modern creators. Generate SFX, isolate vocals, 
            create images, and more — all in one place.
          </motion.p>

          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Button
              size="lg"
              onClick={() => navigate('/tools')}
              className="h-auto py-4 px-12 text-lg rounded-none"
            >
              Explore Tools
            </Button>
          </motion.div>
        </div>

        {/* Right frame */}
        <motion.div
          className="relative"
          style={{ scale: frameScale }}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <GlassFrame>
            <div className="relative h-[320px] w-full overflow-hidden rounded-[22px] md:h-[380px]">
              {/* Cards with parallax (placeholders - replace with your PNGs) */}
              <motion.img
                src="/placeholder.svg"
                className="absolute left-4 top-4 h-[120px] w-[180px] rounded-2xl object-cover bg-white/10 md:left-6 md:top-6 md:h-[140px] md:w-[200px]"
                style={{ y: cardY1, rotate: cardRot1 }}
                alt="Tool 1"
              />
              <motion.img
                src="/placeholder.svg"
                className="absolute right-4 top-4 h-[120px] w-[180px] rounded-2xl object-cover bg-white/10 md:right-6 md:top-6 md:h-[140px] md:w-[200px]"
                style={{ y: cardY2, rotate: cardRot2 }}
                alt="Tool 2"
              />
              <motion.img
                src="/placeholder.svg"
                className="absolute left-4 bottom-20 h-[120px] w-[180px] rounded-2xl object-cover bg-white/10 md:left-6 md:h-[140px] md:w-[200px]"
                style={{ y: cardY2 }}
                alt="Tool 3"
              />
              <motion.img
                src="/placeholder.svg"
                className="absolute right-4 bottom-20 h-[120px] w-[180px] rounded-2xl object-cover bg-white/10 md:right-6 md:h-[140px] md:w-[200px]"
                style={{ y: cardY3 }}
                alt="Tool 4"
              />

              {/* prompt box (reveals once) */}
              <PromptBox accent={accent} />
            </div>
          </GlassFrame>
        </motion.div>
      </div>
    </section>
  );
}

function GlassFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-[28px] border border-white/15 bg-white/5 p-4 shadow-[0_0_90px_rgba(255,255,255,0.10)] backdrop-blur-xl">
      {/* inner border */}
      <div className="pointer-events-none absolute inset-2 rounded-[22px] border border-white/10" />
      {/* shine sweep */}
      <motion.div
        className="pointer-events-none absolute -inset-24 opacity-20"
        animate={{ x: ["-30%", "130%"] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
          transform: "rotate(10deg)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function PromptBox({ accent }: { accent: MotionValue<string> }) {
  return (
    <motion.div
      className="absolute bottom-4 left-1/2 w-[92%] max-w-[560px] -translate-x-1/2 rounded-2xl border border-white/15 bg-black/35 px-5 py-4 text-white/85 shadow-[0_15px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
            🔊
          </div>
          <motion.div style={{ color: accent }} className="text-base font-medium">
            Generate your SFX…
          </motion.div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
          ⬆️
        </div>
      </div>
    </motion.div>
  );
}
