import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import showcaseCode from '@/assets/showcase-code-preview.jpg';
import showcaseVibes from '@/assets/showcase-multiple-vibes.jpg';
import showcaseGen from '@/assets/showcase-instant-gen.jpg';

export function AIBuilderShowcase() {
  return (
    <section className="relative py-24 sm:py-32 lg:py-40 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full bg-purple-600/[0.04] blur-[150px]" />
      </div>

      <div className="relative z-10 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14 sm:mb-16 px-6"
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

        {/* ─── Cinematic Bento Grid ─── */}
        <div className="px-3 sm:px-5 lg:px-6 max-w-[1600px] mx-auto">
          {/* Row 1: Large hero card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7 }}
            className="group relative rounded-2xl overflow-hidden border border-white/[0.06] mb-4"
            style={{ background: '#080808' }}
          >
            <div className="relative aspect-[21/9] overflow-hidden">
              <img
                src={showcaseGen}
                alt="AI instant generation — describe your vision and watch it materialize"
                loading="lazy"
                width={1920}
                height={1080}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/60 via-transparent to-transparent" />
            </div>

            {/* Overlay content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[11px] font-bold tracking-widest uppercase text-purple-400">Prompt to Storefront</span>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 max-w-lg">
                Type a vision. Get a storefront.
              </h3>
              <p className="text-sm text-white/40 max-w-md">
                Our AI transforms plain-English descriptions into fully-functional, production-ready storefronts in seconds.
              </p>
            </div>
          </motion.div>

          {/* Row 2: Two equal cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group relative rounded-2xl overflow-hidden border border-white/[0.06]"
              style={{ background: '#080808' }}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={showcaseCode}
                  alt="Live code editor with real-time storefront preview"
                  loading="lazy"
                  width={1920}
                  height={1080}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/20 to-transparent" />
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400">Live Code + Preview</span>
                </div>
                <p className="text-sm text-white/40 leading-relaxed">
                  Watch AI write production-grade code in real-time with an instant split-screen preview of your storefront.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group relative rounded-2xl overflow-hidden border border-white/[0.06]"
              style={{ background: '#080808' }}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={showcaseVibes}
                  alt="Multiple storefront design styles generated by AI"
                  loading="lazy"
                  width={1920}
                  height={1080}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/20 to-transparent" />
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-fuchsia-400">Infinite Aesthetics</span>
                </div>
                <p className="text-sm text-white/40 leading-relaxed">
                  Luxury, cyberpunk, editorial, minimalist — generate any design style with a single prompt.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Feature pills + CTA */}
        <div className="mt-14 sm:mt-16 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
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
      </div>
    </section>
  );
}
