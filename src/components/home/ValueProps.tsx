import { Reveal } from './Reveal';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Sparkles, Zap, TrendingUp, Users, ArrowRight, Play, Image, Music, Video, Wand2 } from 'lucide-react';
import { useRef } from 'react';

const STATS = [
  { value: '10K+', label: 'Creators', icon: Users, accent: '#3b82f6' },
  { value: '99.9%', label: 'Uptime', icon: Zap, accent: '#8b5cf6' },
  { value: '50K+', label: 'Products Sold', icon: TrendingUp, accent: '#22d3ee' },
];

const REVIEWS = [
  {
    name: 'Alex Rivera',
    role: 'Video Editor · 2.4K sales',
    avatar: 'A',
    text: 'SellsPay replaced 5 different tools for me. Everything I need — storefront, AI tools, payments — in one place.',
    stars: 5,
    accent: '#3b82f6',
  },
  {
    name: 'Sarah Chen',
    role: 'Music Producer · 1.8K sales',
    avatar: 'S',
    text: 'The AI Studio alone is worth it. I generate stems, SFX, and visuals without leaving the platform.',
    stars: 5,
    accent: '#8b5cf6',
  },
  {
    name: 'Marcus Webb',
    role: 'Content Creator · 3.1K sales',
    avatar: 'M',
    text: 'Went from $0 to $2K/month selling presets. The built-in audience and tools make it effortless.',
    stars: 5,
    accent: '#22d3ee',
  },
];

const AI_TOOLS = [
  { icon: Image, label: 'Image Gen', desc: 'Create stunning visuals' },
  { icon: Video, label: 'Video Gen', desc: 'AI-powered videos' },
  { icon: Music, label: 'Audio Tools', desc: 'Produce & edit audio' },
  { icon: Wand2, label: 'SFX Engine', desc: 'Generate sound effects' },
];

function StatCard({ stat, index }: { stat: typeof STATS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const glowY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }}
      className="relative text-center py-8 px-6 rounded-2xl group cursor-default overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Hover glow */}
      <motion.div
        className="absolute w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          x: glowX,
          y: glowY,
          translateX: '-50%',
          translateY: '-50%',
          background: `radial-gradient(circle, ${stat.accent}22, transparent 70%)`,
        }}
      />
      <div className="relative z-10">
        <div
          className="w-10 h-10 rounded-xl mx-auto mb-4 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${stat.accent}18, ${stat.accent}08)`,
            border: `1px solid ${stat.accent}20`,
          }}
        >
          <stat.icon className="w-4.5 h-4.5" style={{ color: stat.accent }} />
        </div>
        <p className="text-4xl sm:text-5xl font-bold tracking-tight mb-1.5" style={{ color: '#f0f0f0' }}>
          {stat.value}
        </p>
        <p className="text-[11px] uppercase tracking-[0.2em] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {stat.label}
        </p>
      </div>
    </motion.div>
  );
}

export function ValueProps() {
  return (
    <section className="relative pt-40 pb-32 sm:pt-48 sm:pb-40" style={{ background: '#000' }}>
      {/* Top gradient that bleeds upward — no overflow-hidden so it shows over previous section */}
      <div
        className="absolute -top-40 left-0 right-0 h-80 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, #000000)',
        }}
      />

      {/* Ambient glows */}
      <div
        className="absolute top-20 left-1/2 -translate-x-1/2 w-[1400px] h-[700px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 35% at 50% 20%, rgba(59,130,246,0.08) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-1/2 -left-20 w-[500px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute bottom-20 right-0 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative z-10 px-6 sm:px-8 lg:px-12 max-w-[1200px] mx-auto">
        {/* Badge */}
        <Reveal>
          <div className="flex items-center gap-2 mb-10">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                boxShadow: '0 0 20px rgba(59,130,246,0.08)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              The Platform
            </span>
          </div>
        </Reveal>

        {/* Heading */}
        <Reveal>
          <h2
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-extralight tracking-tight leading-[1.05] mb-7"
            style={{ color: '#e8e8e8' }}
          >
            Thousands of creators{' '}
            <br className="hidden sm:block" />
            choose{' '}
            <span
              className="font-bold"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #6366f1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SellsPay
            </span>
          </h2>
        </Reveal>

        {/* Subtitle */}
        <Reveal>
          <p className="text-lg sm:text-xl max-w-2xl leading-relaxed mb-20" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Stop jumping between platforms. Your storefront, tools, and payments —{' '}
            <span className="font-semibold" style={{ color: '#818cf8' }}>unified.</span>
          </p>
        </Reveal>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-5 mb-28 max-w-3xl">
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>

        {/* Divider line */}
        <div className="mb-24">
          <div
            className="w-full h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
            }}
          />
        </div>

        {/* Two-column: Selling + AI Studio */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 mb-28">
          {/* Left — value prop */}
          <Reveal>
            <div className="flex flex-col justify-center">
              <h3 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6" style={{ color: '#f0f0f0' }}>
                Start Selling<span style={{ color: '#3b82f6' }}>.</span>
              </h3>
              <div
                className="w-20 h-[2px] mb-8 rounded-full"
                style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, transparent)' }}
              />
              <p className="text-base sm:text-lg leading-[1.8] mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                We built SellsPay for creators who are tired of stitching together five different services just to sell a preset pack.
              </p>
              <p className="text-base sm:text-lg leading-[1.8] mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Sell. Create with AI tools. Get paid instantly. No more going site to site.
              </p>
              <Link
                to="/auth"
                className="btn-premium inline-flex items-center gap-2.5 px-7 py-3 rounded-full text-sm font-semibold text-white self-start"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>

          {/* Right — AI Studio card */}
          <Reveal delay={100}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="rounded-[28px] p-[1px] relative overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(59,130,246,0.3), rgba(139,92,246,0.2), rgba(255,255,255,0.05))',
              }}
            >
              <div
                className="rounded-[27px] p-8 sm:p-10 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #0a0f1a, #080810)',
                }}
              >
                {/* Corner glow */}
                <div
                  className="absolute -top-20 -right-20 w-60 h-60 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(59,130,246,0.2), transparent 60%)',
                    filter: 'blur(30px)',
                  }}
                />
                <div
                  className="absolute -bottom-16 -left-16 w-48 h-48 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(139,92,246,0.12), transparent 60%)',
                    filter: 'blur(30px)',
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-6">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      AI Studio
                    </span>
                  </div>

                  <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ color: '#f0f0f0' }}>
                    Create with AI.
                  </h3>
                  <p className="text-xl font-light mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Sell instantly.
                  </p>
                  <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Generate images, videos, audio, SFX — everything you need to build and sell digital products, powered by cutting-edge AI.
                  </p>

                  {/* Tool chips */}
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {AI_TOOLS.map((tool) => (
                      <div
                        key={tool.label}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <tool.icon className="w-4 h-4 flex-shrink-0" style={{ color: '#818cf8' }} />
                        <div>
                          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{tool.label}</p>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{tool.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/studio"
                    className="btn-premium inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white"
                  >
                    Explore AI Studio
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </Reveal>
        </div>

        {/* Reviews header */}
        <Reveal>
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              What creators say
            </p>
            <h3
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #f0f0f0, rgba(255,255,255,0.6))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Loved by creators
            </h3>
          </div>
        </Reveal>

        {/* Review cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {REVIEWS.map((review, i) => (
            <Reveal key={review.name} delay={i * 100}>
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl p-7 h-full relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* Hover accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${review.accent}, transparent)`,
                  }}
                />

                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: review.stars }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[15px] leading-[1.7] mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  "{review.text}"
                </p>
                <div className="flex items-center gap-3 mt-auto">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${review.accent}40, ${review.accent}15)`,
                      border: `1px solid ${review.accent}30`,
                      color: review.accent,
                    }}
                  >
                    {review.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{review.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{review.role}</p>
                  </div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
