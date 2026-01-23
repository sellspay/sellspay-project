import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import heroBg from '@/assets/hero-bg.png';
import heroLogo from '@/assets/hero-logo.png';

export default function HeroSection() {
  const { user } = useAuth();

  return (
    <div
      className="relative w-full bg-cover bg-center min-h-[480px] lg:min-h-[540px]"
      style={{ backgroundImage: `url(${heroBg})` }}
    >
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/60 to-background/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 h-full">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-16 lg:py-20">
          {/* Left: Text Content */}
          <div className="w-full lg:w-2/5 flex flex-col">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight mb-6">
              Welcome to<br />EditorsParadise
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed mb-8">
              Access cutting-edge audio tools and premium creator products. Explore by type and see what the community loves.
            </p>
            {!user && (
              <Button
                asChild
                size="lg"
                className="w-fit px-8 py-3 bg-foreground text-background hover:bg-foreground/90 rounded-full font-medium text-base"
              >
                <Link to="/signup">Join for free</Link>
              </Button>
            )}
            {user && (
              <Button
                asChild
                size="lg"
                className="w-fit px-8 py-3 bg-foreground text-background hover:bg-foreground/90 rounded-full font-medium text-base"
              >
                <Link to="/products">Browse Products</Link>
              </Button>
            )}
          </div>

          {/* Right: Hero Logo Image */}
          <div className="hidden lg:flex flex-1 items-center justify-end">
            <img
              src={heroLogo}
              alt="EditorsParadise"
              className="w-full max-w-2xl drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
