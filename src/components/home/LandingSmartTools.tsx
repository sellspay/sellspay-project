import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, ShoppingBag, Image, Video, Music, Code2 } from 'lucide-react';
import toolVocalImg from '@/assets/tool-vocal-isolator.jpg';
import toolStemImg from '@/assets/tool-stem-splitter.jpg';
import toolImageImg from '@/assets/tool-image-gen.jpg';
import toolSfxImg from '@/assets/tool-sfx-gen.jpg';
import everythingYouNeedImg from '@/assets/everything-you-need.jpg';

const features = [
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: ShoppingBag,
    title: 'Browse & sell digital assets',
    description: 'Discover thousands of premium digital products from top creators worldwide. LUTs, presets, sound effects, templates — all in one place.',
    image: everythingYouNeedImg,
  },
  {
    id: 'image',
    label: 'AI Image',
    icon: Image,
    title: 'Generate stunning visuals',
    description: 'Turn text prompts into product mockups, thumbnails, banners, and art. No design skills needed — just describe what you want.',
    image: toolImageImg,
  },
  {
    id: 'audio',
    label: 'Audio Tools',
    icon: Music,
    title: 'Professional audio suite',
    description: 'Isolate vocals, split stems, generate SFX from text, and more. Studio-grade audio tools accessible to everyone.',
    image: toolVocalImg,
  },
  {
    id: 'video',
    label: 'Video Generation',
    icon: Video,
    title: 'Text & image to video',
    description: 'Transform static images into cinematic clips or generate footage from text. Perfect for promos, social content, and product showcases.',
    image: toolStemImg,
  },
  {
    id: 'storefront',
    label: 'AI Storefront',
    icon: Code2,
    title: 'Build your page with AI',
    description: 'Describe your brand and watch AI generate a fully customized storefront with layouts, colors, and sections — all in seconds.',
    image: toolSfxImg,
  },
];

export function LandingSmartTools() {
  const [active, setActive] = useState(0);
  const current = features[active];
  const Icon = current.icon;

  return (
    <section className="py-28 sm:py-36 lg:py-44">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-foreground tracking-tight leading-[1.1] mb-5">
            Smart Editor & Generator
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Everything you need to create, sell, and grow — powered by AI.
          </p>
        </div>

        {/* Layout: left title, center preview, right tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr_1fr] gap-8 lg:gap-12 items-center">
          {/* Left — animated title + description */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="hidden lg:block"
            >
              <h3 className="text-3xl xl:text-4xl font-bold text-foreground tracking-tight leading-tight mb-4">
                {current.title}
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                {current.description}
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all duration-300"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Center — preview card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden bg-card border border-border/20 shadow-2xl shadow-background/80">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img
                    src={current.image}
                    alt={current.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                </div>
                {/* Floating label */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{current.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 lg:hidden">
                    {current.description}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Right — tab list */}
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible scrollbar-hide">
            {features.map((f, i) => {
              const TabIcon = f.icon;
              const isActive = i === active;
              return (
                <button
                  key={f.id}
                  onClick={() => setActive(i)}
                  className={`group flex items-center gap-3 px-5 py-3.5 rounded-xl text-left transition-all duration-300 shrink-0 ${
                    isActive
                      ? 'bg-primary/10 text-foreground'
                      : 'text-muted-foreground/60 hover:text-foreground hover:bg-card/50'
                  }`}
                >
                  <TabIcon className={`h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-primary' : ''}`} />
                  <span className={`text-sm font-semibold whitespace-nowrap transition-colors ${isActive ? 'text-foreground' : ''}`}>
                    {f.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="active-dot"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-primary hidden lg:block"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
