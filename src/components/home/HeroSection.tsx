import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import heroCosmicBg from '@/assets/hero-cosmic-bg.png';

const floatingWords = ['Presets', 'LUTs', 'SFX', 'Templates', 'Overlays', 'Fonts'];

export default function HeroSection() {
  const { user } = useAuth();
  const [activeWord, setActiveWord] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWord((prev) => (prev + 1) % floatingWords.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Cosmic background image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src={heroCosmicBg} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        
        {/* Refined gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Premium sub-label */}
          <div className="mb-6">
            <span className="inline-block px-4 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground border border-border/50 bg-background/50 backdrop-blur-sm">
              The Creator's Marketplace
            </span>
          </div>

          {/* Main headline - refined typography */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            <span className="text-foreground">Level Up Your</span>
            <br />
            <span className="relative inline-block mt-2">
              <span 
                className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-lg"
              >
                Creative Workflow
              </span>
              {/* Elegant underline */}
              <span className="absolute -bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            </span>
          </h1>

          {/* Subtitle with rotating words - cleaner */}
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
            Discover premium{' '}
            <span 
              className="text-foreground font-medium transition-opacity duration-300" 
              key={activeWord}
            >
              {floatingWords[activeWord]}
            </span>{' '}
            crafted by professional creators worldwide.
          </p>

          {/* CTA Buttons - refined styling */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 sm:h-14 px-8 text-base rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-xl shadow-foreground/10 group"
            >
              <Link to="/products">
                Explore Store
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            {!user ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 sm:h-14 px-8 text-base rounded-full border border-border/60 bg-background/50 backdrop-blur-sm hover:bg-background/80"
              >
                <Link to="/signup">
                  Join for Free
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 sm:h-14 px-8 text-base rounded-full border border-border/60 bg-background/50 backdrop-blur-sm hover:bg-background/80"
              >
                <Link to="/creators">
                  Meet Creators
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
    </section>
  );
}