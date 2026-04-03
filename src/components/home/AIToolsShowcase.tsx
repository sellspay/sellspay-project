import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { ArrowUpRight, Wand2, Music, Code2, Image, Mic, Scissors, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toolVocalImg from '@/assets/tool-vocal-isolator.jpg';
import toolStemImg from '@/assets/tool-stem-splitter.jpg';
import toolImageImg from '@/assets/tool-image-gen.jpg';
import toolSfxImg from '@/assets/tool-sfx-gen.jpg';

const categories = [
  {
    id: 'audio',
    number: '01',
    label: 'Audio',
    icon: Music,
    tools: [
      {
        label: 'Vocal Isolator',
        desc: 'Extract clean vocals from any track instantly with AI-powered source separation.',
        path: '/tools',
        image: toolVocalImg,
        icon: Mic,
      },
      {
        label: 'Stem Splitter',
        desc: 'Split any song into individual stems — drums, bass, vocals, and instruments.',
        path: '/tools',
        image: toolStemImg,
        icon: Scissors,
      },
      {
        label: 'AI SFX Generator',
        desc: 'Generate custom sound effects from text descriptions. Perfect for video, games, and podcasts.',
        path: '/studio',
        image: toolSfxImg,
        icon: Layers,
      },
    ],
  },
  {
    id: 'image',
    number: '02',
    label: 'Image',
    icon: Image,
    tools: [
      {
        label: 'AI Image Generator',
        desc: 'Turn text prompts into stunning visuals. Create product mockups, thumbnails, and art in seconds.',
        path: '/studio',
        image: toolImageImg,
        icon: Image,
      },
    ],
  },
  {
    id: 'code',
    number: '03',
    label: 'Code',
    icon: Code2,
    tools: [
      {
        label: 'VibeCoder',
        desc: 'Describe your storefront idea and watch AI build it live — layouts, styles, and content.',
        path: '/ai-builder',
        image: toolSfxImg,
        icon: Code2,
      },
    ],
  },
];

export function AIToolsShowcase() {
  const [activeCategory, setActiveCategory] = useState('audio');

  const activeCat = categories.find((c) => c.id === activeCategory) || categories[0];

  return (
    <Reveal>
      <section className="px-6 sm:px-8 lg:px-10 pb-16 sm:pb-20">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
              Smart Tools
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              AI Editing Tools
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mt-3 max-w-lg leading-relaxed">
              The reliable and essential AI tools for audio, image, and code.
            </p>
          </div>
          <Link
            to="/studio"
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 shrink-0"
          >
            Try Online <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* CapCut-style numbered tabs + content */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-10">
          {/* Left: Category tabs */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`group relative flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all duration-300 shrink-0 ${
                    isActive
                      ? 'bg-primary/10 border border-primary/25'
                      : 'bg-card/50 border border-border/20 hover:border-border/50 hover:bg-card'
                  }`}
                >
                  <span
                    className={`text-2xl sm:text-3xl font-black tabular-nums transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground/30'
                    }`}
                  >
                    {cat.number}
                  </span>
                  <div className="flex flex-col">
                    <span
                      className={`text-base sm:text-lg font-bold transition-colors ${
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {cat.label}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      {cat.tools.length} tool{cat.tools.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <Icon
                    className={`h-5 w-5 ml-auto transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right: Tool cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {activeCat.tools.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <Link
                    key={tool.label}
                    to={tool.path}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/30 bg-card hover:border-primary/30 transition-all duration-500"
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={tool.image}
                        alt={tool.label}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

                      {/* Floating icon */}
                      <div className="absolute top-4 left-4 p-2.5 rounded-xl bg-background/80 backdrop-blur-sm border border-border/30">
                        <ToolIcon className="h-4 w-4 text-primary" />
                      </div>

                      {/* Arrow */}
                      <div className="absolute top-4 right-4 p-2 rounded-full bg-primary/0 group-hover:bg-primary/10 transition-all duration-300">
                        <ArrowUpRight className="h-4 w-4 text-foreground/0 group-hover:text-primary transition-all duration-300" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {tool.label}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {tool.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </Reveal>
  );
}
