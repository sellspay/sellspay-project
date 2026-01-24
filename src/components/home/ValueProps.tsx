import { Reveal } from './Reveal';
import { ShieldCheck, Lock, Zap, BadgeCheck, CreditCard, Clock } from 'lucide-react';

const stats = [
  { value: '100%', label: 'Verified Sellers', icon: BadgeCheck },
  { value: '256-bit', label: 'SSL Encryption', icon: Lock },
  { value: '<1min', label: 'Download Time', icon: Clock },
];

const trustPoints = [
  {
    icon: ShieldCheck,
    title: 'Vetted Creators Only',
    description: 'Every seller goes through our verification process before listing. No exceptions.',
  },
  {
    icon: CreditCard,
    title: 'Secure Transactions',
    description: 'Stripe-powered payments with fraud protection and buyer guarantees.',
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'Download your files immediately. No waiting, no approval queues.',
  },
];

export function ValueProps() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Stats row - horizontal emphasis */}
        <Reveal>
          <div className="relative mb-20">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent rounded-2xl" />
            <div className="relative grid grid-cols-3 divide-x divide-border/50">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="px-4 py-8 lg:py-12 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground tracking-tight mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* Trust points - asymmetric layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left: Large featured point */}
          <Reveal delay={100} className="lg:col-span-5">
            <div className="group relative h-full p-8 lg:p-10 rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 hover:border-primary/30 transition-all duration-500 overflow-hidden">
              {/* Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 leading-tight">
                  Vetted Creators Only
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Every seller goes through our verification process before listing. We check portfolios, verify identities, and ensure quality standards. No exceptions.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Right: Stacked smaller points */}
          <div className="lg:col-span-7 space-y-6">
            {trustPoints.slice(1).map((point, index) => {
              const Icon = point.icon;
              return (
                <Reveal key={point.title} delay={200 + index * 100}>
                  <div className="group relative p-6 lg:p-8 rounded-2xl bg-card/50 border border-border/30 hover:bg-card hover:border-primary/20 transition-all duration-300">
                    <div className="flex items-start gap-5">
                      <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {point.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {point.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
