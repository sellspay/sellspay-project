import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { ArrowRight, Play, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        {/* Primary gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Radial gradient from center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(var(--background))_70%)]" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 right-[15%] w-3 h-3 bg-primary rounded-full animate-bounce opacity-60" style={{ animationDuration: '3s' }} />
      <div className="absolute top-40 left-[10%] w-2 h-2 bg-accent rounded-full animate-bounce opacity-40" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      <div className="absolute bottom-32 right-[25%] w-4 h-4 bg-primary/50 rounded-full animate-bounce opacity-50" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
      <div className="absolute bottom-20 left-[20%] w-2 h-2 bg-accent/60 rounded-full animate-bounce opacity-30" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-sm">
            <Star className="h-4 w-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-primary">The #1 Marketplace for Editors</span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Level Up Your</span>
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
                Creative Workflow
              </span>
              {/* Underline decoration */}
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 8.5C50 2.5 100 2.5 150 8.5C200 14.5 250 2.5 298 8.5"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="300" y2="0">
                    <stop stopColor="hsl(var(--primary))" />
                    <stop offset="1" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          {/* Subtitle with rotating words */}
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Discover premium{' '}
            <span className="inline-block w-[140px] text-left">
              <span 
                key={activeWord}
                className="text-foreground font-semibold animate-fade-in"
              >
                {floatingWords[activeWord]}
              </span>
            </span>
            crafted by
            <br className="hidden sm:block" />
            professional creators worldwide.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button
              asChild
              size="lg"
              className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 group"
            >
              <Link to="/products">
                Explore Store
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            {!user ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg rounded-full border-2 hover:bg-foreground/5"
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
                className="h-14 px-8 text-lg rounded-full border-2 hover:bg-foreground/5 group"
              >
                <Link to="/creators">
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Meet Creators
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}