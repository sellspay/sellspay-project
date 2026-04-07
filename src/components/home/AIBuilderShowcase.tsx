import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import showcase1 from '@/assets/ai-builder-showcase-1.jpg';
import showcase2 from '@/assets/ai-builder-showcase-2.jpg';
import showcase3 from '@/assets/ai-builder-showcase-3.jpg';

const examples = [
  {
    image: showcase1,
    label: 'Code + Preview',
    description: 'AI writes your storefront code in real-time',
  },
  {
    image: showcase2,
    label: 'Multiple Vibes',
    description: 'Luxury, cyberpunk, editorial — any style you want',
  },
  {
    image: showcase3,
    label: 'Instant Generation',
    description: 'Describe your vision, watch it come to life',
  },
];

export function AIBuilderShowcase() {
  return (
    <section className="relative py-24 sm:py-32 lg:py-40 overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16 sm:mb-20 lg:mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm mb-6">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium tracking-widest uppercase text-white/60">AI-Powered</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05] mb-6">
            <span className="block">Vibe Code</span>
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Your Storefront
            </span>
          </h2>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-white/50 leading-relaxed">
            Describe your dream storefront and our AI Builder generates it instantly.
            No templates. No limits. Just your vision, brought to life with code.
          </p>
        </motion.div>

        {/* Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mb-16 sm:mb-20">
          {examples.map((ex, i) => (
            <motion.div
              key={ex.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02]"
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={ex.image}
                  alt={ex.label}
                  loading="lazy"
                  width={1280}
                  height={800}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Label badge */}
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                  <span className="text-[11px] font-semibold tracking-wide uppercase text-white/80">{ex.label}</span>
                </div>
              </div>

              {/* Info bar */}
              <div className="p-5">
                <p className="text-sm text-white/40 leading-relaxed">{ex.description}</p>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl ring-1 ring-purple-500/20" />
            </motion.div>
          ))}
        </div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-14"
        >
          {[
            { icon: Wand2, text: 'Prompt-to-Site' },
            { icon: Zap, text: 'Instant Preview' },
            { icon: Sparkles, text: 'One-Click Publish' },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm"
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
          className="text-center"
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
