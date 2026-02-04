import { Reveal } from './Reveal';
import { ShieldCheck, Zap, CreditCard } from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified Sellers',
    description: 'Every creator is vetted before they can list products on our platform.',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'All transactions are protected with Stripe-powered buyer protection.',
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'Download your purchases immediately after checkout. No waiting.',
  },
];

export function ValueProps() {
  return (
    <section className="py-20 sm:py-28 lg:py-36">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Section header */}
        <Reveal>
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why creators choose us
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              Built for trust, speed, and simplicity
            </p>
          </div>
        </Reveal>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={index * 100}>
                <div className="group text-center p-6 sm:p-8">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-border bg-card mb-6 group-hover:border-foreground/30 transition-colors duration-300">
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-foreground" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
