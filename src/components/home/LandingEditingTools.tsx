import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Mic, Scissors, Layers, Image, Wand2 } from 'lucide-react';
import toolVocalImg from '@/assets/tool-vocal-isolator.jpg';
import toolStemImg from '@/assets/tool-stem-splitter.jpg';
import toolImageImg from '@/assets/tool-image-gen.jpg';
import toolSfxImg from '@/assets/tool-sfx-gen.jpg';

const categories = [
  {
    number: '01',
    label: 'Audio',
    tools: [
      { name: 'Vocal Isolator', desc: 'Extract clean vocals from any track instantly with AI source separation.', image: toolVocalImg, icon: Mic, link: '/tools' },
      { name: 'Stem Splitter', desc: 'Split songs into individual stems — drums, bass, vocals, instruments.', image: toolStemImg, icon: Scissors, link: '/tools' },
      { name: 'AI SFX Generator', desc: 'Generate custom sound effects from text. For video, games, podcasts.', image: toolSfxImg, icon: Layers, link: '/studio' },
    ],
  },
  {
    number: '02',
    label: 'Image',
    tools: [
      { name: 'AI Image Generator', desc: 'Turn text into stunning visuals. Product mockups, thumbnails, art.', image: toolImageImg, icon: Image, link: '/studio' },
      { name: 'Background Remover', desc: 'Remove image backgrounds instantly with one click. No watermark.', image: toolVocalImg, icon: Wand2, link: '/studio' },
    ],
  },
  {
    number: '03',
    label: 'Video',
    tools: [
      { name: 'Text to Video', desc: 'Generate video from text prompts. Perfect for promos and social content.', image: toolStemImg, icon: Wand2, link: '/studio' },
      { name: 'Image to Video', desc: 'Animate static images into cinematic video clips with AI.', image: toolSfxImg, icon: Image, link: '/studio' },
    ],
  },
  {
    number: '04',
    label: 'Storefront',
    tools: [
      { name: 'AI Page Builder', desc: 'Describe your brand and AI builds a fully customized storefront.', image: toolImageImg, icon: Wand2, link: '/ai-builder' },
    ],
  },
];

export function LandingEditingTools() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = categories[activeIdx];

  return (
    <section className="py-28 sm:py-36 lg:py-44 bg-card/30">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-foreground tracking-tight leading-[1.1] mb-5">
            AI Editing Tools
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
            The reliable and essential AI tools for audio, image, video, and code.
          </p>
          <Link
            to="/studio"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            Try online
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Numbered category tabs */}
        <div className="flex justify-center gap-2 mt-14 mb-12 overflow-x-auto scrollbar-hide">
          {categories.map((cat, i) => (
            <button
              key={cat.number}
              onClick={() => setActiveIdx(i)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 shrink-0 ${
                i === activeIdx
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className={`tabular-nums ${i === activeIdx ? 'text-background/60' : 'text-muted-foreground/40'}`}>
                {cat.number}
              </span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tool cards grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.number}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            {/* Left: tool list — Right: first tool preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tool list */}
              <div className="flex flex-col gap-4">
                {active.tools.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <Link
                      key={tool.name}
                      to={tool.link}
                      className="group flex items-start gap-4 p-5 sm:p-6 rounded-2xl border border-border/20 bg-background hover:border-primary/20 transition-all duration-300"
                    >
                      <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                        <ToolIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                            {tool.name}
                          </h4>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {tool.desc}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Preview image */}
              <div className="relative rounded-2xl overflow-hidden border border-border/10">
                <div className="aspect-[4/3] relative">
                  <img
                    src={active.tools[0].image}
                    alt={active.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
