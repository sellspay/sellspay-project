import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import heroBg from '@/assets/hero-bg.png';
import heroLogo from '@/assets/hero-logo.png';

export default function HeroSection() {
  const { user } = useAuth();

  return (
    <div
      className="relative z-10 w-full bg-cover bg-center"
      style={{ backgroundImage: `url(${heroBg})` }}
    >
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/60 to-background/70" />

      {/* Content */}
      <div className="relative z-20 w-full px-6 py-12 lg:py-16 flex flex-col lg:flex-row items-center justify-between gap-8 max-w-7xl mx-auto">
        {/* Left: Text Content */}
        <div className="w-full lg:w-1/3 flex flex-col justify-start pt-6">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
              Welcome to EditorsParadise
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl leading-relaxed font-light">
              Access cutting-edge audio tools and premium creator products. Explore by type and see what the community loves.
            </p>
          </div>
          {!user && (
            <Button
              asChild
              className="w-fit mt-8 px-6 py-2 bg-foreground text-background hover:bg-foreground/90 rounded-full font-medium"
            >
              <Link to="/signup">Join for free</Link>
            </Button>
          )}
          {user && (
            <Button
              asChild
              className="w-fit mt-8 px-6 py-2 bg-foreground text-background hover:bg-foreground/90 rounded-full font-medium"
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
            className="w-[42rem] drop-shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
