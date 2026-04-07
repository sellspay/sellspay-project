import { Reveal } from './Reveal';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Image, Music, Video, Wand2, ShieldCheck, CreditCard, Globe, Lock, Mic, Scissors, AudioLines, Volume2 } from 'lucide-react';
import { useState } from 'react';
import studioImageGen from '@/assets/home/studio-image-gen.jpg';
import studioVideoGenHQ from '@/assets/home/studio-kungfu-fast.mp4.asset.json';
import studioMotionSync from '@/assets/home/studio-motion-sync.mp4.asset.json';

/* ─── Data ─── */
const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'SSL Secured', desc: '256-bit encryption' },
  { icon: CreditCard, label: 'Stripe Powered', desc: 'PCI compliant' },
  { icon: Globe, label: 'Global Payouts', desc: '190+ countries' },
  { icon: Lock, label: 'Secure Files', desc: 'Encrypted delivery' },
];

type ToolId = 'image-gen' | 'video-gen' | 'audio-tools' | 'sfx-engine' | 'motion-sync';

const TOOL_ITEMS: { id: ToolId; icon: any; label: string; tag: string | null }[] = [
  { id: 'video-gen', icon: Video, label: 'AI Video Generator', tag: 'New' },
  { id: 'image-gen', icon: Image, label: 'AI Image Generator', tag: 'New' },
  { id: 'audio-tools', icon: Music, label: 'Audio Tools', tag: null },
  { id: 'sfx-engine', icon: Wand2, label: 'SFX Engine', tag: null },
  { id: 'motion-sync', icon: Sparkles, label: 'Motion Sync', tag: 'New' },
];

const AUDIO_TOOLS_LIST = [
  { icon: Mic, label: 'Text to Speech', desc: 'Natural voices' },
  { icon: AudioLines, label: 'Voice Cloning', desc: 'Clone any voice' },
  { icon: Scissors, label: 'Audio Cutter', desc: 'Trim & split' },
  { icon: Volume2, label: 'Music Generator', desc: 'AI music' },
];

const SFX_EXAMPLES = [
  { label: 'Explosion', waveform: '██▓▒░░▒▓█▓▒░' },
  { label: 'Rain', waveform: '▒░▒░▒░▒░▒░▒░' },
  { label: 'Laser Blast', waveform: '█▓▒░░░░░░░░░' },
  { label: 'Footsteps', waveform: '█░░█░░█░░█░░' },
  { label: 'Thunder', waveform: '▒▓██▓▒░░▒▓█▓' },
];

const TOOL_CONTENT: Record<ToolId, { title: string; desc: string; link: string }> = {
  'video-gen': {
    title: 'AI Video Generator',
    desc: 'Create stunning cinematic videos from text prompts with consistent character animation, facial identity, and realistic movement.',
    link: '/studio/video-generator',
  },
  'image-gen': {
    title: 'AI Image Generator',
    desc: 'Create stunning images from text prompts — photorealistic renders, concept art, illustrations, and more.',
    link: '/studio/image-generator',
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

/* ─── Main Component ─── */
export function ValueProps() {
  const [activeTool, setActiveTool] = useState<ToolId>('video-gen');
  const info = TOOL_CONTENT[activeTool];

  return (
    <section className="relative py-32 sm:py-40" style={{ background: '#000' }}>
      <div className="absolute -top-40 left-0 right-0 h-80 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #000000)' }}
      />

      <div className="relative z-10 max-w-[1300px] mx-auto px-6 sm:px-8">
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

        {/* Full-bleed card */}
        <Reveal>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[20px] overflow-hidden relative"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 8px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
              height: 'clamp(420px, 42vw, 560px)',
            }}
          >
            {/* Media layer */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTool}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
              >
                {activeTool === 'video-gen' && (
                  <video
                    src={studioVideoGenHQ.url}
                    autoPlay loop muted playsInline
                    className="w-full h-full object-cover"
                  />
                )}
                {activeTool === 'motion-sync' && (
                  <video
                    src={studioMotionSync.url}
                    autoPlay loop muted playsInline
                    className="w-full h-full object-cover"
                  />
                )}
                {activeTool === 'image-gen' && (
                  <img src={studioImageGen} alt="AI Image Generator" className="w-full h-full object-cover" />
                )}
                {activeTool === 'audio-tools' && (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #070b14, #0c1220, #070b14)' }}
                  >
                    <div className="grid grid-cols-2 gap-4 max-w-md px-8">
                      {AUDIO_TOOLS_LIST.map((tool) => (
                        <div key={tool.label} className="flex flex-col items-center gap-2.5 p-6 rounded-2xl"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
                          >
                            <tool.icon className="w-5 h-5" style={{ color: '#60a5fa' }} />
                          </div>
                          <p className="text-xs font-semibold text-white/70">{tool.label}</p>
                          <p className="text-[10px] text-white/35">{tool.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTool === 'sfx-engine' && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-8"
                    style={{ background: 'linear-gradient(135deg, #070b14, #0c1220, #070b14)' }}
                  >
                    {SFX_EXAMPLES.map((sfx) => (
                      <div key={sfx.label} className="flex items-center gap-4 w-full max-w-sm px-5 py-3.5 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}
                        >
                          <Volume2 className="w-4 h-4" style={{ color: '#a78bfa' }} />
                        </div>
                        <p className="text-xs font-semibold text-white/70 flex-1">{sfx.label}</p>
                        <span className="text-xs font-mono tracking-tighter text-white/20">{sfx.waveform}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Gradient overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.15) 60%, transparent 80%)',
              }}
            />

            {/* Top — tool selector pills */}
            <div className="absolute top-0 left-0 right-0 z-20 p-5">
              <div className="flex flex-wrap gap-2">
                {TOOL_ITEMS.map((tool) => {
                  const isActive = tool.id === activeTool;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer"
                      style={{
                        background: isActive
                          ? 'rgba(255,255,255,0.15)'
                          : 'rgba(0,0,0,0.4)',
                        border: isActive
                          ? '1px solid rgba(255,255,255,0.25)'
                          : '1px solid rgba(255,255,255,0.08)',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <tool.icon className="w-3.5 h-3.5" />
                      {tool.label}
                      {tool.tag && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(59,130,246,0.25)', color: '#60a5fa' }}
                        >
                          {tool.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom — info + CTA */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-8 lg:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTool}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-3"
                    style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                  >
                    {info.title}
                  </h3>
                  <p className="text-sm sm:text-base max-w-lg leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {info.desc}
                  </p>
                  <div className="flex items-center gap-4">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 hover:scale-[1.03] active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 30%, #1d4ed8 70%, #1e3a8a 100%)',
                        boxShadow: '0 4px 20px rgba(59,130,246,0.4), inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.2)',
                        border: '1px solid rgba(96,165,250,0.5)',
                      }}
                    >
                      Try it Free <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link to={info.link} className="text-sm font-medium inline-flex items-center gap-1" style={{ color: '#60a5fa' }}>
                      Learn more <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
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
