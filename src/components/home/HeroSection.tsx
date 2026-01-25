import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { ArrowRight, Play } from 'lucide-react';
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
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Cosmic background image */}
      <div className="absolute inset-0 z-0">
        {/* Background image */}
        <img 
          src={heroCosmicBg} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: 'auto' }}
          loading="eager"
          fetchPriority="high"
        />
        
        {/* Bottom fade to background */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 right-[15%] w-3 h-3 bg-primary rounded-full animate-bounce opacity-60 z-10" style={{ animationDuration: '3s' }} />
      <div className="absolute top-40 left-[10%] w-2 h-2 bg-accent rounded-full animate-bounce opacity-40 z-10" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      <div className="absolute bottom-32 right-[25%] w-4 h-4 bg-primary/50 rounded-full animate-bounce opacity-50 z-10" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
      <div className="absolute bottom-20 left-[20%] w-2 h-2 bg-accent/60 rounded-full animate-bounce opacity-30 z-10" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Main headline with brand name for Google verification */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6">
            <span className="block text-lg sm:text-xl font-semibold text-primary tracking-widest uppercase mb-2">
              EditorsParadise
            </span>
            <span className="text-foreground drop-shadow-lg">Level Up Your</span>
            <br />
            <span className="relative inline-block">
              <span 
                className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl"
                style={{
                  textShadow: '0 0 40px rgba(168, 85, 247, 0.5), 0 0 80px rgba(168, 85, 247, 0.3)',
                  filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))'
                }}
              >
                Creative Workflow
              </span>
              {/* Glow effect layer */}
              <span 
                className="absolute inset-0 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent blur-sm opacity-50"
                aria-hidden="true"
              >
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
                  className="drop-shadow-lg"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.8))' }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="300" y2="0">
                    <stop stopColor="#a855f7" />
                    <stop offset="0.5" stopColor="#d946ef" />
                    <stop offset="1" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          {/* Subtitle with rotating words */}
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Discover premium <span className="text-foreground font-semibold animate-fade-in" key={activeWord}>{floatingWords[activeWord]}</span> crafted by
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