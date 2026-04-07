import { Reveal } from './Reveal';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Sparkles, Zap, TrendingUp, Users, ArrowRight, Image, Music, Video, Wand2 } from 'lucide-react';

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
  { icon: Image, label: 'Image Gen' },
  { icon: Video, label: 'Video Gen' },
  { icon: Music, label: 'Audio Tools' },
  { icon: Wand2, label: 'SFX Engine' },
];

export function ValueProps() {
  return (
    <section className="relative pt-40 pb-32 sm:pt-48 sm:pb-40" style={{ background: '#000' }}>
      {/* Top fade */}
      <div
        className="absolute -top-40 left-0 right-0 h-80 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #000000)' }}
      />

      {/* Ambient glows */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1400px] h-[700px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 35% at 50% 20%, rgba(59,130,246,0.08) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-[1100px] mx-auto px-6 sm:px-8">
        {/* Badge */}
        <Reveal>
          <div className="text-center mb-8">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              The Platform
            </span>
          </div>
        </Reveal>

        {/* Heading — centered */}
        <Reveal>
          <h2
            className="text-center text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-extralight tracking-tight leading-[1.05] mb-6"
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

        {/* Subtitle — centered */}
        <Reveal>
          <p className="text-center text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-20" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Stop jumping between platforms. Your storefront, tools, and payments —{' '}
            <span className="font-semibold" style={{ color: '#818cf8' }}>unified.</span>
          </p>
        </Reveal>

        {/* Stats Row — centered */}
        <div className="grid grid-cols-3 gap-5 mb-20 max-w-3xl mx-auto">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -3 }}
              className="text-center py-7 px-5 rounded-2xl"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg mx-auto mb-4 flex items-center justify-center"
                style={{
                  background: `${stat.accent}12`,
                  border: `1px solid ${stat.accent}20`,
                }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.accent }} />
              </div>
              <p className="text-3xl sm:text-4xl font-bold tracking-tight mb-1" style={{ color: '#f0f0f0' }}>
                {stat.value}
              </p>
              <p className="text-[11px] uppercase tracking-[0.2em] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Start Selling — centered block */}
        <Reveal>
          <div className="text-center mb-10">
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-5" style={{ color: '#f0f0f0' }}>
              Start Selling<span style={{ color: '#3b82f6' }}>.</span>
            </h3>
            <div className="w-16 h-[2px] mx-auto mb-6 rounded-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
            <p className="text-base sm:text-lg leading-[1.8] max-w-xl mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              We built SellsPay for creators who are tired of stitching together five different services just to sell a preset pack.
            </p>
            <p className="text-base sm:text-lg leading-[1.8] max-w-xl mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Sell. Create with AI tools. Get paid instantly. No more going site to site.
            </p>
            <Link to="/auth" className="btn-premium inline-flex items-center gap-2.5 px-7 py-3 rounded-full text-sm font-semibold text-white">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Reveal>

        {/* AI Studio Banner — full width */}
        <Reveal>
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mt-20 mb-28 rounded-[28px] p-[1px] relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(139,92,246,0.25), rgba(34,211,238,0.15), rgba(255,255,255,0.05))',
            }}
          >
            <div
              className="rounded-[27px] relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #080d1a, #0a0810, #060812)' }}
            >
              {/* Ambient glows inside banner */}
              <div className="absolute -top-24 -left-24 w-72 h-72 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.18), transparent 60%)', filter: 'blur(40px)' }}
              />
              <div className="absolute -bottom-20 -right-20 w-64 h-64 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.14), transparent 60%)', filter: 'blur(40px)' }}
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(34,211,238,0.06), transparent 60%)', filter: 'blur(50px)' }}
              />

              {/* Banner content */}
              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 px-10 py-12 sm:px-14 sm:py-16">
                {/* Left text */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex items-center gap-2.5 mb-5 justify-center lg:justify-start">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      AI Studio
                    </span>
                  </div>

                  <h3 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3" style={{ color: '#f0f0f0' }}>
                    Create with AI.
                  </h3>
                  <p className="text-xl sm:text-2xl font-light mb-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Sell instantly.
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed max-w-lg mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Generate images, videos, audio & SFX — everything you need to build and sell digital products, powered by cutting-edge AI models.
                  </p>
                  <Link
                    to="/studio"
                    className="btn-premium inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-white"
                  >
                    Explore AI Studio
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Right — tool grid */}
                <div className="grid grid-cols-2 gap-3 flex-shrink-0 w-full lg:w-auto lg:max-w-[280px]">
                  {AI_TOOLS.map((tool, i) => (
                    <motion.div
                      key={tool.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                      whileHover={{ scale: 1.05 }}
                      className="flex flex-col items-center justify-center gap-2.5 py-6 px-4 rounded-2xl text-center"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <tool.icon className="w-5 h-5" style={{ color: '#818cf8' }} />
                      </div>
                      <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>{tool.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>

        {/* Reviews */}
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
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(90deg, transparent, ${review.accent}, transparent)` }}
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
