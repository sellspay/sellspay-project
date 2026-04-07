import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Zap, ArrowRight, Code2, Palette, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import showcase1 from '@/assets/ai-builder-showcase-1.jpg';
import showcase2 from '@/assets/ai-builder-showcase-2.jpg';
import showcase3 from '@/assets/ai-builder-showcase-3.jpg';

const examples = [
  {
    image: showcase1,
    icon: Code2,
    label: 'Code + Preview',
    description: 'Watch AI write production-ready storefront code in real-time with a live split-screen preview.',
    accent: 'from-blue-500 to-cyan-400',
    accentBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  },
  {
    image: showcase2,
    icon: Palette,
    label: 'Multiple Vibes',
    description: 'Luxury, cyberpunk, editorial, minimalist — generate any aesthetic with a single prompt.',
    accent: 'from-purple-500 to-fuchsia-400',
    accentBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  },
  {
    image: showcase3,
    icon: BrainCircuit,
    label: 'Instant Generation',
    description: 'Describe your vision in plain English and watch a fully-functional storefront materialize.',
    accent: 'from-fuchsia-500 to-pink-400',
    accentBg: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400',
  },
];

const stats = [
  { value: '10s', label: 'Avg. generation' },
  { value: '∞', label: 'Design styles' },
  { value: '0', label: 'Code required' },
];

export function AIBuilderShowcase() {
  return (
    <section className="relative py-24 sm:py-32 lg:py-40 overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full bg-purple-500/[0.03] blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 w-[800px] h-[400px] rounded-full bg-blue-500/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-8 px-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm mb-6">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium tracking-widest uppercase text-white/60">AI-Powered</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05] mb-5">
            <span className="block">Vibe Code</span>
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Your Storefront
            </span>
          </h2>

          <p className="max-w-xl mx-auto text-base text-white/45 leading-relaxed">
            Describe your dream storefront and our AI Builder generates it instantly.
            No templates. No limits. Just your vision, brought to life with code.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center gap-10 sm:gap-16 mb-14 sm:mb-16 px-6"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground">{s.value}</div>
              <div className="text-[11px] uppercase tracking-wider text-white/30 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Showcase Grid — edge-to-edge with subtle padding */}
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
            {examples.map((ex, i) => (
              <motion.div
                key={ex.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0a0a0a] flex flex-col"
              >
                {/* Accent top line */}
                <div className={`h-[2px] bg-gradient-to-r ${ex.accent} opacity-60`} />

                {/* Image */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={ex.image}
                    alt={ex.label}
                    loading="lazy"
                    width={1280}
                    height={720}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/40 via-transparent to-transparent" />

                  {/* Label badge */}
                  <div className={`absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-md ${ex.accentBg}`}>
                    <ex.icon className="w-3 h-3" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">{ex.label}</span>
                  </div>
                </div>

                {/* Info bar */}
                <div className="px-5 pb-5 pt-2 flex-1 flex items-start">
                  <p className="text-[13px] text-white/45 leading-relaxed">{ex.description}</p>
                </div>

                {/* Hover border glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl ring-1 ring-white/[0.08]" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mt-14 sm:mt-16 mb-10 px-6"
        >
          {[
            { icon: Wand2, text: 'Prompt-to-Site' },
            { icon: Zap, text: 'Instant Preview' },
            { icon: Sparkles, text: 'One-Click Publish' },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm"
            >
              <Icon className="w-3.5 h-3.5 text-purple-400/80" />
              <span className="text-xs font-medium text-white/50 tracking-wide">{text}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center px-6"
        >
          <Button
            asChild
            className="h-14 px-10 text-sm font-bold tracking-wider rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/20 transition-all duration-300 group"
          >
            <Link to="/ai-builder">
              Start Building
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <p className="mt-4 text-xs text-white/30">No code required · Free to start</p>
        </motion.div>
      </div>
    </section>
  );
}
