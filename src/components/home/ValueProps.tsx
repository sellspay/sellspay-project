import { Reveal } from './Reveal';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, TrendingUp, Users, ArrowRight, Image, Music, Video, Wand2, ShieldCheck, CreditCard, Globe, Lock } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import aiStudioHero from '@/assets/home/ai-studio-hero.jpg';

/* ─── Animated Counter Hook ─── */
function useAnimatedCounter(end: number, duration = 2000, ref?: React.RefObject<HTMLElement | null>) {
  const [count, setCount] = useState(0);
  const inView = useInView(ref as any, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    let raf: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);

  return count;
}

/* ─── Data ─── */
const STATS = [
  { value: 10, suffix: 'K+', label: 'Creators', icon: Users, accent: '#3b82f6' },
  { value: 999, suffix: '', label: 'Uptime', icon: Zap, accent: '#8b5cf6', isDecimal: true },
  { value: 50, suffix: 'K+', label: 'Products Sold', icon: TrendingUp, accent: '#22d3ee' },
];

const AI_TOOLS = [
  { icon: Image, label: 'AI Image Generator', tag: 'New', active: false },
  { icon: Video, label: 'AI Video Generator', tag: 'New', active: true },
  { icon: Music, label: 'Audio Tools', tag: null, active: false },
  { icon: Wand2, label: 'SFX Engine', tag: null, active: false },
  { icon: Sparkles, label: 'Motion Sync', tag: 'New', active: false },
];

const SOCIAL_PROOF = [
  { user: 'Jake M.', action: 'just purchased', item: 'Cinematic LUT Pack', time: '2m ago' },
  { user: 'Emily R.', action: 'just sold', item: 'Lo-Fi Beat Kit', time: '5m ago' },
  { user: 'Carlos D.', action: 'just purchased', item: 'Vocal Preset Bundle', time: '8m ago' },
  { user: 'Mia K.', action: 'just created', item: 'AI Generated SFX Pack', time: '12m ago' },
  { user: 'Noah L.', action: 'just sold', item: 'Transition Pack Pro', time: '15m ago' },
  { user: 'Ava T.', action: 'just purchased', item: 'Color Grade Collection', time: '18m ago' },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'SSL Secured', desc: '256-bit encryption' },
  { icon: CreditCard, label: 'Stripe Powered', desc: 'PCI compliant' },
  { icon: Globe, label: 'Global Payouts', desc: '190+ countries' },
  { icon: Lock, label: 'Secure Files', desc: 'Encrypted delivery' },
];

/* ─── Animated Stat Card ─── */
function AnimatedStatCard({ stat, index }: { stat: typeof STATS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const count = useAnimatedCounter(stat.isDecimal ? 999 : stat.value, 2200, ref);
  const display = stat.isDecimal ? (count / 10).toFixed(1) : count;
  const suffix = stat.isDecimal ? '%' : stat.suffix;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -3 }}
      className="text-center py-7 px-5 rounded-2xl"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="w-9 h-9 rounded-lg mx-auto mb-4 flex items-center justify-center"
        style={{ background: `${stat.accent}12`, border: `1px solid ${stat.accent}20` }}
      >
        <stat.icon className="w-4 h-4" style={{ color: stat.accent }} />
      </div>
      <p className="text-3xl sm:text-4xl font-bold tracking-tight mb-1 tabular-nums" style={{ color: '#f0f0f0' }}>
        {display}{suffix}
      </p>
      <p className="text-[11px] uppercase tracking-[0.2em] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {stat.label}
      </p>
    </motion.div>
  );
}

/* ─── Social Proof Ticker ─── */
function SocialProofTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % SOCIAL_PROOF.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const item = SOCIAL_PROOF[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex justify-center mb-20"
    >
      <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ backgroundColor: '#22c55e' }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: '#22c55e' }} />
        </span>
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-sm"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          <span style={{ color: 'rgba(255,255,255,0.8)' }} className="font-medium">{item.user}</span>
          {' '}{item.action}{' '}
          <span style={{ color: '#818cf8' }} className="font-medium">{item.item}</span>
          <span className="ml-2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.time}</span>
        </motion.span>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─── */
export function ValueProps() {
  return (
    <section className="relative py-32 sm:py-40" style={{ background: '#000' }}>
      <div className="absolute -top-40 left-0 right-0 h-80 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #000000)' }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8">
        {/* Heading — centered Kling style */}
        <Reveal>
          <div className="text-center mb-12">
            <h2
              className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-tight leading-[1.15] text-white"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              Get all the leading AI creation tools
            </h2>
            <p className="mt-4 text-base sm:text-lg max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Make any image, video, audio or SFX you want online with the leading AI models, all in one place.
            </p>
          </div>
        </Reveal>

        {/* Large preview card — Kling style */}
        <Reveal>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[24px] overflow-hidden relative"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex flex-col lg:flex-row min-h-[420px] lg:min-h-[480px]">
              {/* Left sidebar — tool list */}
              <div
                className="lg:w-[320px] flex-shrink-0 p-8 lg:p-10 flex flex-col justify-between"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    AI Studio Tools
                  </p>
                  <div className="space-y-1">
                    {AI_TOOLS.map((tool) => (
                      <div
                        key={tool.label}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                        style={{
                          background: tool.active
                            ? 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))'
                            : 'transparent',
                          border: tool.active ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                        }}
                      >
                        <tool.icon className="w-4 h-4 flex-shrink-0" style={{ color: tool.active ? '#818cf8' : 'rgba(255,255,255,0.4)' }} />
                        <span className="text-sm font-medium" style={{ color: tool.active ? '#e0e7ff' : 'rgba(255,255,255,0.55)' }}>
                          {tool.label}
                        </span>
                        {tool.tag && (
                          <span
                            className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}
                          >
                            {tool.tag}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to="/login"
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-110 hover:scale-[1.03] active:scale-[0.98] w-full"
                  style={{
                    background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 30%, #1d4ed8 70%, #1e3a8a 100%)',
                    boxShadow: '0 4px 20px rgba(59,130,246,0.4), 0 1px 3px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(96,165,250,0.5)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  Explore AI Studio
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Right — hero content + image */}
              <div className="flex-1 relative overflow-hidden">
                {/* Info overlay */}
                <div className="absolute inset-0 z-10 p-8 lg:p-10 flex flex-col justify-end"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)' }}
                >
                  <h3
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-3"
                    style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                  >
                    AI Video Generator
                  </h3>
                  <p className="text-sm sm:text-base max-w-md leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Create stunning cinematic videos from text prompts with consistent character animation, facial identity, and realistic movement.
                  </p>
                  <Link to="/studio" className="mt-3 text-sm font-medium inline-flex items-center gap-1" style={{ color: '#60a5fa' }}>
                    AI Video Generator <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Background image */}
                <img
                  src={aiStudioHero}
                  alt="AI Studio preview"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>

      {/* Trust Badges */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8 mt-20">
        <Reveal>
          <div className="text-center">
            <div className="w-full h-px mb-12" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {TRUST_BADGES.map((badge, i) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="flex flex-col items-center gap-2.5 py-5"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <badge.icon className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>{badge.label}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{badge.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}