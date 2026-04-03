import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Image, Video, Music, Sparkles, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import everythingYouNeedImg from '@/assets/everything-you-need.jpg';

interface FeatureTab {
  id: string;
  number: string;
  label: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tags: string[];
  link: string;
  image: string;
}

const tabs: FeatureTab[] = [
  {
    id: 'marketplace',
    number: '01',
    label: 'Marketplace',
    icon: <ShoppingBag className="h-5 w-5" />,
    title: 'Browse & Sell Digital Assets',
    description: 'Discover thousands of premium digital products from top creators worldwide. From LUTs to presets, sound effects to templates — find everything you need to level up your creative workflow.',
    tags: ['LUTs', 'Presets', 'Templates', 'Sound Packs'],
    link: '/products',
    image: everythingYouNeedImg,
  },
  {
    id: 'image-gen',
    number: '02',
    label: 'Image Generation',
    icon: <Image className="h-5 w-5" />,
    title: 'AI-Powered Product Visuals',
    description: "Build your store's hero in seconds with our AI image generation models. Create stunning product visuals, banners, and promotional art — no design skills needed.",
    tags: ['Text-to-Image', 'Product Shots', 'Banners', 'Thumbnails'],
    link: '/tools',
    image: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&q=80',
  },
  {
    id: 'video-gen',
    number: '03',
    label: 'Video Generation',
    icon: <Video className="h-5 w-5" />,
    title: 'Text & Image to Video',
    description: 'Transform static images into cinematic video clips or generate entirely new footage from text prompts. Perfect for promos, social content, and product showcases.',
    tags: ['Text-to-Video', 'Image-to-Video', 'Promos', 'Shorts'],
    link: '/tools',
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80',
  },
  {
    id: 'audio',
    number: '04',
    label: 'Audio Tools',
    icon: <Music className="h-5 w-5" />,
    title: 'Professional Audio Suite',
    description: 'Generate custom sound effects, isolate vocals from any track, split stems, and convert between formats. Studio-grade audio tools accessible to everyone.',
    tags: ['SFX Generator', 'Voice Isolator', 'Stem Splitter', 'Converter'],
    link: '/tools',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
  },
  {
    id: 'storefront',
    number: '05',
    label: 'AI Storefront',
    icon: <Sparkles className="h-5 w-5" />,
    title: 'Build Your Creator Page with AI',
    description: 'Describe your brand vibe and watch AI build a fully customized storefront. Unique layouts, color palettes, and sections — all generated in seconds.',
    tags: ['AI Builder', 'Custom Themes', 'Drag & Drop', 'Brand Kit'],
    link: '/ai-builder',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  },
];

export function FeatureTabsBar() {
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  const active = tabs[activeTab];
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTabClick = useCallback((i: number) => {
    setActiveTab(i);
    const container = scrollRef.current;
    if (!container) return;
    const button = container.children[i] as HTMLElement;
    if (!button) return;
    const scrollLeft = button.offsetLeft - container.offsetWidth / 2 + button.offsetWidth / 2;
    container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  }, []);

  return (
    <section className="py-24 sm:py-32 lg:py-40">
      <div className="px-6 sm:px-8 lg:px-12 xl:px-16 max-w-[1400px] mx-auto">
        {/* Section header */}
        <div className="mb-16 sm:mb-20">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-4">
            Platform
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-foreground tracking-tight leading-[1.05]">
            Everything you need
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mt-5 max-w-2xl leading-relaxed">
            One platform for selling, creating, and growing your digital brand.
          </p>
        </div>

        {/* CapCut-style numbered tabs */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide mb-14 sm:mb-16 snap-x snap-mandatory scroll-px-6 -mx-6 px-6"
        >
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(i)}
              className={`group relative flex items-center gap-3 px-6 py-4 rounded-xl border text-sm font-medium whitespace-nowrap transition-all duration-300 snap-center shrink-0 ${
                i === activeTab
                  ? 'bg-primary/10 text-foreground border-primary/30'
                  : 'bg-card/50 text-muted-foreground border-border/30 hover:border-border/60 hover:text-foreground'
              }`}
            >
              <span className={`text-xl font-black tabular-nums transition-colors ${
                i === activeTab ? 'text-primary' : 'text-muted-foreground/25'
              }`}>
                {tab.number}
              </span>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
          >
            {/* Left — text */}
            <div>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-6">
                {active.title}
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
                {active.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-10">
                {active.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 rounded-full text-xs font-semibold border border-border/40 bg-card/50 text-foreground/70 uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => navigate(active.link)}
                className="inline-flex items-center gap-2 text-primary font-semibold text-sm group/link hover:gap-3 transition-all duration-300"
              >
                Explore
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
              </button>
            </div>

            {/* Right — image */}
            <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-card border border-border/20">
              <img
                src={active.image}
                alt={active.title}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
              <div className="absolute inset-0 border border-border/10 rounded-2xl" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
