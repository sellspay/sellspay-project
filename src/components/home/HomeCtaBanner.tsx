import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import ctaBanner from '@/assets/cta-banner.jpg';

export function HomeCtaBanner() {
  return (
    <Reveal>
      <section className="px-6 sm:px-8 lg:px-10 pb-12">
        <div className="relative overflow-hidden rounded-2xl border border-border/20">
          <img
            src={ctaBanner}
            alt="Start creating"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
          <div className="relative z-10 px-8 sm:px-12 lg:px-16 py-16 sm:py-24 max-w-2xl">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 w-fit mb-5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">Start Today</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
              Everything you need to create & sell
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
              Join thousands of creators building their business on SellsPay. No upfront costs, no limits.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="rounded-full px-8 font-bold shadow-lg shadow-primary/20">
                <Link to="/pricing">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 font-bold border-border/50">
                <Link to="/explore">Browse Assets</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
