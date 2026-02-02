import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import sellspayLogo from '@/assets/sellspay-s-logo.png';

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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0f]">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        {/* Primary gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-[150px]" />
        
        {/* Accent orbs */}
        <div className="absolute top-20 right-20 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute bottom-20 left-20 w-[250px] h-[250px] bg-blue-500/10 rounded-full blur-[60px] animate-pulse" style={{ animationDuration: '7s' }} />
        
        {/* Grid overlay for depth */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0a0a0f_70%)]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="flex flex-col items-center text-center">
          
          {/* Logo section with glass container */}
          <div className="relative mb-8 sm:mb-12">
            {/* Glass backdrop */}
            <div className="absolute inset-0 -m-6 sm:-m-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl" />
            
            {/* Logo */}
            <div className="relative p-4 sm:p-6">
              <img 
                src={sellspayLogo} 
                alt="Sellspay" 
                className="h-20 sm:h-28 lg:h-36 w-auto mx-auto"
              />
            </div>
            
            {/* Decorative corner accents */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-primary/50 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-primary/50 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-cyan-400/50 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-cyan-400/50 rounded-br-lg" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">The Creator Marketplace</span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 sm:mb-8">
            <span className="text-white">Level Up Your</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Creative Workflow
            </span>
          </h1>

          {/* Subtitle with rotating words */}
          <p className="text-lg sm:text-xl lg:text-2xl text-white/60 max-w-2xl mb-10 sm:mb-12 leading-relaxed">
            Discover premium{' '}
            <span className="text-white font-semibold" key={activeWord}>
              {floatingWords[activeWord]}
            </span>{' '}
            crafted by
            <br className="hidden sm:block" />
            professional creators worldwide.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="h-14 px-8 text-lg rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/25 group border-0"
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
                className="h-14 px-8 text-lg rounded-full border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white"
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
                className="h-14 px-8 text-lg rounded-full border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white group"
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

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
