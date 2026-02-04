import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { ArrowRight, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

const floatingWords = ['Presets', 'LUTs', 'SFX', 'Templates', 'Overlays', 'Fonts'];

export default function HeroSection() {
  const { user } = useAuth();
  const [activeWord, setActiveWord] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWord(prev => (prev + 1) % floatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center">
      {/* Clean minimal background */}
      <div className="absolute inset-0 -z-10">
        {/* Subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
        {/* Very subtle noise texture effect via gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(0_0%_20%/0.3),transparent)]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center flex flex-col items-center">
          {/* Small label */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-card/50 mb-6 sm:mb-8">
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              The marketplace for creators
            </span>
          </div>

          {/* Main headline - Artlist style large typography */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6 sm:mb-8 leading-[1.1]">
            <span className="text-foreground">
              Premium digital assets
            </span>
            <br />
            <span className="text-foreground">
              for{' '}
              <span 
                key={activeWord} 
                className="inline-block text-muted-foreground animate-fade-in"
              >
                {floatingWords[activeWord]}
              </span>
            </span>
          </h1>

          {/* Subtitle - clean and minimal */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 sm:mb-12 leading-relaxed">
            Discover thousands of high-quality assets created by professional editors and designers worldwide.
          </p>

          {/* CTA Buttons - Artlist style */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <Button 
              asChild 
              size="lg" 
              className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium group"
            >
              <Link to="/products">
                Browse Store
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            {!user ? (
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg rounded-full border-border hover:bg-card hover:border-foreground/20 font-medium"
              >
                <Link to="/signup">
                  Start Free
                </Link>
              </Button>
            ) : (
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg rounded-full border-border hover:bg-card hover:border-foreground/20 font-medium group"
              >
                <Link to="/creators">
                  <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                  Meet Creators
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
