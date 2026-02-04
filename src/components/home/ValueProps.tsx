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
    <section className="py-24 sm:py-32 lg:py-40 bg-background">
      <div className="px-6 sm:px-8 lg:px-12">
        {/* Section header - MASSIVE */}
        <Reveal>
          <div className="mb-16 sm:mb-24 max-w-4xl">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground tracking-tight mb-6">
              Why creators choose SellsPay
            </h2>
            <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed">
              Built for trust, speed, and simplicity. Everything you need to succeed.
            </p>
          </div>
        </Reveal>

        {/* Features grid - MASSIVE cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={index * 80}>
                <div className="group p-10 sm:p-12 lg:p-14 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-300 h-full">
                  {/* Icon - BIGGER */}
                  <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary/10 border border-primary/20 mb-8 group-hover:bg-primary/20 transition-colors duration-300">
                    <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                  </div>

                  {/* Title - BIGGER */}
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                    {feature.title}
                  </h3>

                  {/* Description - BIGGER */}
                  <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
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
