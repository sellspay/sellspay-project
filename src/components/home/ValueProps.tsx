import { Reveal } from './Reveal';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, TrendingUp, Users, ArrowRight, Image, Music, Video, Wand2, ShieldCheck, CreditCard, Globe, Lock } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

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
  { icon: Image, label: 'Image Gen' },
  { icon: Video, label: 'Video Gen' },
  { icon: Music, label: 'Audio Tools' },
  { icon: Wand2, label: 'SFX Engine' },
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
        {/* AI Studio Card — rounded with gradient border */}
        <Reveal>
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="rounded-[32px] p-[1px] relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(59,130,246,0.35), rgba(139,92,246,0.25), rgba(34,211,238,0.15), rgba(255,255,255,0.05))',
            }}
          >
            <div
              className="rounded-[31px] relative overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #080d1a, #0a0810, #060812)' }}
            >
              {/* Ambient glows */}
              <div className="absolute -top-32 -left-32 w-[500px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 55%)', filter: 'blur(60px)' }} />
              <div className="absolute -bottom-24 -right-24 w-96 h-96 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12), transparent 55%)', filter: 'blur(60px)' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.05), transparent 60%)', filter: 'blur(40px)' }} />

              {/* Content */}
              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-14 px-10 py-16 sm:px-16 sm:py-20 lg:px-20">
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex items-center gap-2.5 mb-7 justify-center lg:justify-start">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 4px 20px rgba(59,130,246,0.3)' }}>
                      <Sparkles className="w-4.5 h-4.5 text-white" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.5)' }}>AI Studio</span>
                  </div>
                  <h3 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4" style={{ color: '#f0f0f0' }}>
                    Create with AI.
                  </h3>
                  <p className="text-xl sm:text-2xl font-light mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Sell instantly.
                  </p>
                  <p className="text-base leading-relaxed max-w-lg mb-10 mx-auto lg:mx-0" style={{ color: 'rgba(255,255,255,0.42)' }}>
                    Generate images, videos, audio & SFX — everything you need to build and sell digital products, powered by cutting-edge AI models.
                  </p>
                  <Link to="/studio" className="btn-premium inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-semibold text-white">
                    Explore AI Studio
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 flex-shrink-0 w-full lg:w-auto lg:max-w-[300px]">
                  {AI_TOOLS.map((tool, i) => (
                    <motion.div
                      key={tool.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                      whileHover={{ scale: 1.04, y: -2 }}
                      className="flex flex-col items-center justify-center gap-3 py-7 px-5 rounded-2xl text-center"
                      style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <tool.icon className="w-5 h-5" style={{ color: '#818cf8' }} />
                      </div>
                      <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>{tool.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>

      {/* Trust Badges — back in container */}
      <div className="relative z-10 max-w-[1100px] mx-auto px-6 sm:px-8">
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
