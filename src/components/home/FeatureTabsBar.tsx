import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Image, Video, Music, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureTab {
  id: string;
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
    label: 'Marketplace',
    icon: <ShoppingBag className="h-4 w-4" />,
    title: 'Browse & Sell Digital Assets',
    description: 'Discover thousands of premium digital products from top creators worldwide. From LUTs to presets, sound effects to templates — find everything you need to level up your creative workflow.',
    tags: ['LUTs', 'Presets', 'Templates', 'Sound Packs'],
    link: '/products',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
  },
  {
    id: 'image-gen',
    label: 'Image Generation',
    icon: <Image className="h-4 w-4" />,
    title: 'AI-Powered Product Visuals',
    description: "Build your store's hero in seconds with our AI image generation models. Create stunning product visuals, banners, and promotional art — no design skills needed.",
    tags: ['Text-to-Image', 'Product Shots', 'Banners', 'Thumbnails'],
    link: '/tools',
    image: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&q=80',
  },
  {
    id: 'video-gen',
    label: 'Video Generation',
    icon: <Video className="h-4 w-4" />,
    title: 'Text & Image to Video',
    description: 'Transform static images into cinematic video clips or generate entirely new footage from text prompts. Perfect for promos, social content, and product showcases.',
    tags: ['Text-to-Video', 'Image-to-Video', 'Promos', 'Shorts'],
    link: '/tools',
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80',
  },
  {
    id: 'audio',
    label: 'Audio Tools',
    icon: <Music className="h-4 w-4" />,
    title: 'Professional Audio Suite',
    description: 'Generate custom sound effects, isolate vocals from any track, split stems, and convert between formats. Studio-grade audio tools accessible to everyone.',
    tags: ['SFX Generator', 'Voice Isolator', 'Stem Splitter', 'Converter'],
    link: '/tools',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
  },
  {
    id: 'storefront',
    label: 'AI Storefront',
    icon: <Sparkles className="h-4 w-4" />,
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

  return (
    <section className="py-20 sm:py-28 lg:py-32">
      <div className="px-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto">
        {/* Section header */}
        <div className="mb-12 sm:mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Platform Features
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground tracking-tight">
            Everything you need
          </h2>
        </div>

        {/* Tab buttons row */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-12 sm:mb-16">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-full border text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                i === activeTab
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                  : 'bg-transparent text-muted-foreground border-primary/40 hover:border-primary/70 hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
              <ArrowRight className="h-3.5 w-3.5 opacity-60" />
            </button>
          ))}
        </div>

        {/* Content area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
          >
            {/* Left — text */}
            <div>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight mb-5">
                {active.title}
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
                {active.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {active.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-border bg-card text-foreground/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => navigate(active.link)}
                className="text-primary font-medium text-sm flex items-center gap-2 group hover:gap-3 transition-all"
              >
                Learn More
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Right — image */}
            <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-card border border-border">
              <img
                src={active.image}
                alt={active.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
