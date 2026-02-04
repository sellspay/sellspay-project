import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    <section className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Dramatic gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        {/* Subtle warm glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center flex flex-col items-center max-w-6xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8 sm:mb-10">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm sm:text-base text-primary font-medium tracking-wide">
              The #1 Marketplace for Creators
            </span>
          </div>

          {/* MASSIVE headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[120px] font-bold tracking-tighter leading-[0.95] mb-8 sm:mb-10">
            <span className="text-foreground block">
              Premium Digital
            </span>
            <span className="text-foreground block mt-2">
              Assets for{' '}
              <span 
                key={activeWord} 
                className="inline-block text-primary animate-fade-in"
              >
                {floatingWords[activeWord]}
              </span>
            </span>
          </h1>

          {/* Subtitle - larger */}
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mb-10 sm:mb-14 leading-relaxed">
            Discover thousands of high-quality assets from professional editors and designers. 
            Everything you need to level up your creative work.
          </p>

          {/* CTA Buttons - BIGGER */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full sm:w-auto">
            <Button 
              asChild 
              size="lg" 
              className="h-14 sm:h-16 px-10 sm:px-14 text-base sm:text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold group shadow-lg shadow-primary/25"
            >
              <Link to="/products">
                Start Browsing
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            {!user ? (
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="h-14 sm:h-16 px-10 sm:px-14 text-base sm:text-lg rounded-full border-2 border-border hover:bg-card hover:border-foreground/30 font-semibold"
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
                className="h-14 sm:h-16 px-10 sm:px-14 text-base sm:text-lg rounded-full border-2 border-border hover:bg-card hover:border-foreground/30 font-semibold"
              >
                <Link to="/creators">
                  Meet Creators
                </Link>
              </Button>
            )}
          </div>

          {/* Quick stats under CTA */}
          <div className="flex items-center gap-8 sm:gap-12 mt-14 sm:mt-20 text-muted-foreground">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">5,000+</div>
              <div className="text-sm sm:text-base">Assets</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">500+</div>
              <div className="text-sm sm:text-base">Creators</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">50k+</div>
              <div className="text-sm sm:text-base">Downloads</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
