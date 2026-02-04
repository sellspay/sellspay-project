import { Reveal } from './Reveal';
import { ShieldCheck, Zap, CreditCard, Download, Users, Award } from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified Sellers',
    description: 'Every creator is vetted before listing products on our platform.',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'All transactions protected with Stripe-powered buyer protection.',
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'Download your purchases immediately after checkout.',
  },
  {
    icon: Download,
    title: 'Unlimited Downloads',
    description: 'Re-download your purchased files anytime, forever.',
  },
  {
    icon: Users,
    title: 'Creator Support',
    description: 'Direct messaging with creators for questions and support.',
  },
  {
    icon: Award,
    title: 'Quality Guaranteed',
    description: 'Every product reviewed for quality before publishing.',
  },
];

export function ValueProps() {
  return (
    <section className="py-20 sm:py-28 lg:py-36 bg-background">
      <div className="px-4 sm:px-8 lg:px-12">
        {/* Section header - LEFT aligned */}
        <Reveal>
          <div className="mb-14 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground tracking-tight mb-4">
              Why creators choose SellsPay
            </h2>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl">
              Built for trust, speed, and simplicity. Everything you need to succeed.
            </p>
          </div>
        </Reveal>

        {/* Features grid - BIGGER cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={index * 80}>
                <div className="group p-8 sm:p-10 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-300">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                    <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
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
