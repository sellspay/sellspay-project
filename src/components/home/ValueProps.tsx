import { Reveal } from './Reveal';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Sparkles, Zap, TrendingUp, Users, ArrowRight } from 'lucide-react';

const STATS = [
  { value: '10K+', label: 'Creators', icon: Users },
  { value: '99.9%', label: 'Uptime', icon: Zap },
  { value: '50K+', label: 'Products Sold', icon: TrendingUp },
];

const REVIEWS = [
  {
    name: 'Alex Rivera',
    role: 'Video Editor',
    avatar: 'A',
    text: 'SellsPay replaced 5 different tools for me. Everything I need — storefront, AI tools, payments — in one place.',
    stars: 5,
  },
  {
    name: 'Sarah Chen',
    role: 'Music Producer',
    avatar: 'S',
    text: 'The AI Studio alone is worth it. I generate stems, SFX, and visuals without leaving the platform.',
    stars: 5,
  },
  {
    name: 'Marcus Webb',
    role: 'Content Creator',
    avatar: 'M',
    text: 'Went from $0 to $2K/month selling presets. The built-in audience and tools make it effortless.',
    stars: 5,
  },
];

export function ValueProps() {
  return (
    <section className="relative py-32 sm:py-40 overflow-hidden" style={{ background: '#000' }}>
      {/* Ambient glow effects */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 50% at 50% 100%, rgba(168,85,247,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 px-6 sm:px-8 lg:px-12 max-w-[1200px] mx-auto">
        {/* Badge */}
        <Reveal>
          <div className="flex items-center gap-2 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(168,85,247,0.15))',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <Sparkles className="w-3 h-3 text-blue-400" />
              The Platform
            </span>
          </div>
        </Reveal>

        {/* Giant heading */}
        <Reveal>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-extralight tracking-tight leading-[1.05] mb-6"
            style={{ color: '#f0f0f0' }}
          >
            Thousands of creators{' '}
            <br className="hidden sm:block" />
            choose{' '}
            <span
              className="font-bold"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
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
          <p className="text-lg sm:text-xl max-w-2xl leading-relaxed mb-16" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Stop jumping between platforms. Your storefront, tools, and payments —{' '}
            <span className="font-medium" style={{ color: '#3b82f6' }}>unified.</span>
          </p>
        </Reveal>

        {/* Stats Row */}
        <Reveal>
          <div className="grid grid-cols-3 gap-4 mb-20 max-w-2xl">
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -2 }}
                className="text-center py-6 px-4 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <stat.icon className="w-5 h-5 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <p className="text-3xl sm:text-4xl font-bold tracking-tight mb-1" style={{ color: '#f0f0f0' }}>
                  {stat.value}
                </p>
                <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </Reveal>

        {/* Two-column content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 mb-24">
          {/* Left — value prop */}
          <Reveal>
            <div>
              <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-5" style={{ color: '#f0f0f0' }}>
                Start Selling
              </h3>
              <div
                className="w-16 h-0.5 mb-6 rounded-full"
                style={{ background: 'linear-gradient(90deg, #3b82f6, transparent)' }}
              />
              <p className="text-base sm:text-lg leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                We built SellsPay for creators who are tired of stitching together five different services just to sell a preset pack.
              </p>
              <p className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Sell. Create with AI tools. Get paid instantly. No more going site to site.
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 group"
                style={{ color: '#3b82f6' }}
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>

          {/* Right — AI Studio promo card */}
          <Reveal delay={100}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl p-8 relative overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(59,130,246,0.08), rgba(168,85,247,0.06), rgba(0,0,0,0.4))',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              }}
            >
              <div
                className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 100% 0%, rgba(59,130,246,0.15), transparent 60%)',
                }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    AI Studio
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4" style={{ color: '#f0f0f0' }}>
                  Create with AI.{' '}
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Sell instantly.</span>
                </h3>
                <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Generate images, videos, audio, SFX — everything you need to build and sell digital products, powered by cutting-edge AI models.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['Image Gen', 'Video Gen', 'Audio Tools', 'SFX', 'Vocal Isolation'].map((tool) => (
                    <span
                      key={tool}
                      className="px-3 py-1 rounded-full text-[11px] font-medium"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {tool}
                    </span>
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
            </motion.div>
          </Reveal>
        </div>

        {/* Reviews */}
        <Reveal>
          <div className="mb-6 flex items-center gap-3">
            <h3 className="text-lg font-semibold tracking-tight" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Loved by creators
            </h3>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REVIEWS.map((review, i) => (
            <Reveal key={review.name} delay={i * 80}>
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl p-6 h-full"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: review.stars }).map((_, s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  "{review.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(168,85,247,0.3))',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {review.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{review.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{review.role}</p>
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
