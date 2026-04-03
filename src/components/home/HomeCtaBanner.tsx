import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { Button } from '@/components/ui/button';
import ctaBanner from '@/assets/cta-banner.jpg';

export function HomeCtaBanner() {
  return (
    <Reveal>
      <section className="px-6 sm:px-8 lg:px-10 pb-12">
        <div className="relative overflow-hidden rounded-2xl">
          <img
            src={ctaBanner}
            alt="Start creating"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
          <div className="relative z-10 px-8 sm:px-12 py-14 sm:py-20 max-w-xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight leading-tight mb-4">
              Everything you need to create. Start selling without limits today.
            </h2>
            <Button asChild size="lg" className="rounded-full px-8 font-bold">
              <Link to="/pricing">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
