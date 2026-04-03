import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const stats = [
  { value: '50K+', label: 'Downloads' },
  { value: '500+', label: 'Creators' },
  { value: '4.9', label: 'Average Rating' },
  { value: '180+', label: 'Countries' },
];

export function LandingFooterCta() {
  return (
    <section className="py-20 sm:py-28 border-t border-border/10">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-4 mb-20 sm:mb-28">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-2">
                {s.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight mb-4">
            <span className="text-primary">SellsPay</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-md mx-auto">
            Create smarter, sell faster
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            Try online for free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
