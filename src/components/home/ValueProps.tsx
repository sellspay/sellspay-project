import { Reveal } from './Reveal';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, TrendingUp, Users, ArrowRight, Image, Music, Video, Wand2, ShieldCheck, CreditCard, Globe, Lock, Mic, Scissors, AudioLines, Volume2 } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import studioImageGen from '@/assets/home/studio-image-gen.jpg';
import studioVideoGen from '@/assets/home/studio-video-gen.mp4.asset.json';
import studioMotionSync from '@/assets/home/studio-motion-sync.mp4.asset.json';

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
const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'SSL Secured', desc: '256-bit encryption' },
  { icon: CreditCard, label: 'Stripe Powered', desc: 'PCI compliant' },
  { icon: Globe, label: 'Global Payouts', desc: '190+ countries' },
  { icon: Lock, label: 'Secure Files', desc: 'Encrypted delivery' },
];

type ToolId = 'image-gen' | 'video-gen' | 'audio-tools' | 'sfx-engine' | 'motion-sync';

const TOOL_ITEMS: { id: ToolId; icon: any; label: string; tag: string | null }[] = [
  { id: 'image-gen', icon: Image, label: 'AI Image Generator', tag: 'New' },
  { id: 'video-gen', icon: Video, label: 'AI Video Generator', tag: 'New' },
  { id: 'audio-tools', icon: Music, label: 'Audio Tools', tag: null },
  { id: 'sfx-engine', icon: Wand2, label: 'SFX Engine', tag: null },
  { id: 'motion-sync', icon: Sparkles, label: 'Motion Sync', tag: 'New' },
];

const AUDIO_TOOLS_LIST = [
  { icon: Mic, label: 'Text to Speech', desc: 'Convert text to natural voices' },
  { icon: AudioLines, label: 'Voice Cloning', desc: 'Clone any voice in seconds' },
  { icon: Scissors, label: 'Audio Cutter', desc: 'Trim and split audio files' },
  { icon: Volume2, label: 'Music Generator', desc: 'AI-powered music creation' },
];

const SFX_EXAMPLES = [
  { label: 'Explosion', waveform: '██▓▒░░▒▓█▓▒░' },
  { label: 'Rain', waveform: '▒░▒░▒░▒░▒░▒░' },
  { label: 'Laser Blast', waveform: '█▓▒░░░░░░░░░' },
  { label: 'Footsteps', waveform: '█░░█░░█░░█░░' },
  { label: 'Thunder', waveform: '▒▓██▓▒░░▒▓█▓' },
];

/* ─── Tool Content Panels ─── */
function ToolContent({ activeId }: { activeId: ToolId }) {
  const contentMap: Record<ToolId, { title: string; desc: string; link: string }> = {
    'image-gen': {
      title: 'AI Image Generator',
      desc: 'Create stunning images from text prompts — photorealistic renders, concept art, illustrations, and more.',
      link: '/studio/image-generator',
    },
    'video-gen': {
      title: 'AI Video Generator',
      desc: 'Create stunning cinematic videos from text prompts with consistent character animation, facial identity, and realistic movement.',
      link: '/studio/video-generator',
    },
    'audio-tools': {
      title: 'Audio Tools',
      desc: 'A complete suite of AI-powered audio tools — text-to-speech, voice cloning, music generation, and editing.',
      link: '/studio/audio-tools',
    },
    'sfx-engine': {
      title: 'SFX Engine',
      desc: 'Generate custom sound effects instantly — explosions, ambient textures, UI sounds, and cinematic audio.',
      link: '/studio/sfx-engine',
    },
    'motion-sync': {
      title: 'Motion Sync',
      desc: 'Transfer motion from reference videos to generate new scenes with consistent animation and realistic movement.',
      link: '/studio/motion-sync',
    },
  };

  const info = contentMap[activeId];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 relative overflow-hidden"
      >
        {/* Media background */}
        {activeId === 'video-gen' && (
          <video
            src={studioVideoGen.url}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {activeId === 'motion-sync' && (
          <video
            src={studioMotionSync.url}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {activeId === 'image-gen' && (
          <img
            src={studioImageGen}
            alt="AI Image Generator preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {activeId === 'audio-tools' && (
          <div className="absolute inset-0 flex items-center justify-center p-8"
            style={{ background: 'linear-gradient(135deg, #0a0a1a, #0d1117)' }}
          >
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              {AUDIO_TOOLS_LIST.map((tool) => (
                <div
                  key={tool.label}
                  className="flex flex-col items-center gap-2 p-5 rounded-2xl text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
                  >
                    <tool.icon className="w-5 h-5" style={{ color: '#60a5fa' }} />
                  </div>
                  <p className="text-xs font-semibold text-white/70">{tool.label}</p>
                  <p className="text-[10px] text-white/35 leading-relaxed">{tool.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeId === 'sfx-engine' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8"
            style={{ background: 'linear-gradient(135deg, #0a0a1a, #0d1117)' }}
          >
            {SFX_EXAMPLES.map((sfx) => (
              <div
                key={sfx.label}
                className="flex items-center gap-4 w-full max-w-sm px-5 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}
                >
                  <Volume2 className="w-4 h-4" style={{ color: '#a78bfa' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/70">{sfx.label}</p>
                </div>
                <span className="text-xs font-mono tracking-tighter text-white/20 flex-shrink-0">{sfx.waveform}</span>
              </div>
            ))}
          </div>
        )}

        {/* Gradient overlay + info */}
        <div className="absolute inset-0 z-10 p-8 lg:p-10 flex flex-col justify-end"
          style={{ background: activeId === 'audio-tools' || activeId === 'sfx-engine'
            ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)'
            : 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)'
          }}
        >
          <h3
            className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-2"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            {info.title}
          </h3>
          <p className="text-sm max-w-md leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {info.desc}
          </p>
          <Link to={info.link} className="mt-3 text-sm font-medium inline-flex items-center gap-1" style={{ color: '#60a5fa' }}>
            {info.title} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Main Component ─── */
export function ValueProps() {
  const [activeTool, setActiveTool] = useState<ToolId>('video-gen');

  return (
    <section className="relative py-32 sm:py-40" style={{ background: '#000' }}>
      <div className="absolute -top-40 left-0 right-0 h-80 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #000000)' }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8">
        {/* Heading */}
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

        {/* Large preview card */}
        <Reveal>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[20px] overflow-hidden relative"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.03)',
            }}
          >
            <div className="flex flex-col lg:flex-row" style={{ height: 'clamp(360px, 38vw, 460px)' }}>
              {/* Left sidebar */}
              <div
                className="lg:w-[280px] flex-shrink-0 p-7 lg:p-8 flex flex-col justify-between"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    AI Studio Tools
                  </p>
                  <div className="space-y-1">
                    {TOOL_ITEMS.map((tool) => {
                      const isActive = tool.id === activeTool;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => setActiveTool(tool.id)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left cursor-pointer"
                          style={{
                            background: isActive
                              ? 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))'
                              : 'transparent',
                            border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                          }}
                        >
                          <tool.icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? '#818cf8' : 'rgba(255,255,255,0.4)' }} />
                          <span className="text-sm font-medium" style={{ color: isActive ? '#e0e7ff' : 'rgba(255,255,255,0.55)' }}>
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
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Link
                  to="/login"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-110 hover:scale-[1.03] active:scale-[0.98] w-full"
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

              {/* Right — dynamic content */}
              <ToolContent activeId={activeTool} />
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
