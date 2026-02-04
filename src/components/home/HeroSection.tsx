import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { ArrowRight, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import heroBg from '@/assets/hero-cinematic.jpg';

const floatingWords = ['Presets', 'LUTs', 'SFX', 'Templates', 'Overlays', 'Fonts', 'Tutorials'];

export default function HeroSection() {
  const { user } = useAuth();
  const [activeWord, setActiveWord] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWord(prev => (prev + 1) % floatingWords.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* MASSIVE Full-width cinematic background image */}
      <div className="absolute inset-0 -z-10">
        <img 
          src={heroBg} 
          alt="" 
          className="w-full h-full object-cover object-center"
        />
        {/* Gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />
      </div>

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="text-center flex flex-col items-center max-w-7xl mx-auto pt-20 pb-32">
          {/* Badge - Larger */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-primary/40 bg-primary/15 backdrop-blur-sm mb-10 sm:mb-12">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-base sm:text-lg text-primary font-semibold tracking-wide">
              The #1 Marketplace for Creators
            </span>
          </div>

          {/* MASSIVE headline - Elegant serif style */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[140px] font-bold tracking-tighter leading-[0.9] mb-10 sm:mb-12">
            <span className="text-foreground block font-light italic">
              Create with
            </span>
            <span className="text-foreground block mt-2 sm:mt-4">
              Premium{' '}
              <span 
                key={activeWord} 
                className="inline-block text-primary animate-fade-in"
              >
                {floatingWords[activeWord]}
              </span>
            </span>
          </h1>

          {/* Subtitle - Larger, more impactful */}
          <p className="text-xl sm:text-2xl md:text-3xl text-foreground/80 max-w-4xl mb-12 sm:mb-16 leading-relaxed font-light">
            Discover thousands of high-quality digital assets from professional creators. 
            Everything you need to level up your work.
          </p>

          {/* CTA Buttons - MASSIVE */}
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 w-full sm:w-auto">
            <Button 
              asChild 
              size="lg" 
              className="h-16 sm:h-18 px-12 sm:px-16 text-lg sm:text-xl rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold group shadow-2xl shadow-primary/30 transition-all duration-300 hover:scale-105"
            >
              <Link to="/products">
                Start Browsing
                <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            {!user ? (
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="h-16 sm:h-18 px-12 sm:px-16 text-lg sm:text-xl rounded-full border-2 border-foreground/30 bg-foreground/5 backdrop-blur-sm hover:bg-foreground/10 hover:border-foreground/50 font-semibold transition-all duration-300"
              >
                <Link to="/signup">
                  Create Account
                </Link>
              </Button>
            ) : (
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="h-16 sm:h-18 px-12 sm:px-16 text-lg sm:text-xl rounded-full border-2 border-foreground/30 bg-foreground/5 backdrop-blur-sm hover:bg-foreground/10 hover:border-foreground/50 font-semibold transition-all duration-300"
              >
                <Link to="/creators">
                  Meet Creators
                </Link>
              </Button>
            )}
          </div>

          {/* Stats row - Larger numbers */}
          <div className="flex items-center gap-10 sm:gap-16 mt-20 sm:mt-28 text-foreground/90">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">5,000+</div>
              <div className="text-base sm:text-lg text-muted-foreground mt-1">Digital Assets</div>
            </div>
            <div className="w-px h-16 bg-foreground/20" />
            <div className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">500+</div>
              <div className="text-base sm:text-lg text-muted-foreground mt-1">Pro Creators</div>
            </div>
            <div className="w-px h-16 bg-foreground/20" />
            <div className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">50k+</div>
              <div className="text-base sm:text-lg text-muted-foreground mt-1">Downloads</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground animate-bounce">
        <span className="text-sm font-medium">Scroll to explore</span>
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/50 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
