import { Reveal } from './Reveal';
import { ShieldCheck, Lock, Zap, BadgeCheck, CreditCard, Clock, CheckCircle2 } from 'lucide-react';

const stats = [
  { value: '100%', label: 'Verified Sellers', icon: BadgeCheck },
  { value: '256-bit', label: 'SSL Encryption', icon: Lock },
  { value: '<1min', label: 'Download Time', icon: Clock },
];

const trustPoints = [
  {
    icon: ShieldCheck,
    title: 'Vetted Creators',
    description: 'Every seller verified before listing',
    accent: 'from-violet-500 to-purple-600',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'Stripe-powered with buyer protection',
    accent: 'from-purple-500 to-fuchsia-500',
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'Download immediately, no queues',
    accent: 'from-fuchsia-500 to-pink-500',
  },
];

export function ValueProps() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-[100px] sm:blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-80 h-48 sm:h-80 bg-violet-500/10 rounded-full blur-[80px] sm:blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Section header */}
        <Reveal>
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Why Choose Us
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-3 sm:mb-4">
              Built for <span className="bg-gradient-to-r from-primary via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Trust & Speed</span>
            </h2>
          </div>
        </Reveal>

        {/* Premium horizontal feature display */}
        <Reveal delay={100}>
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2" />
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-4">
              {trustPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <div 
                    key={point.title} 
                    className="group relative"
                  >
                    {/* Main content */}
                    <div className="relative flex flex-col items-center text-center p-4 sm:p-8">
                      {/* Floating icon with gradient ring */}
                      <div className="relative mb-4 sm:mb-6">
                        {/* Outer glow */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${point.accent} rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500 scale-150`} />
                        
                        {/* Icon container */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center group-hover:border-primary/50 transition-all duration-300 group-hover:scale-110">
                          <div className={`absolute inset-1 rounded-full bg-gradient-to-br ${point.accent} opacity-10 group-hover:opacity-20 transition-opacity`} />
                          <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary relative z-10" />
                        </div>
                        
                        {/* Step number */}
                        <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-primary/30">
                          {index + 1}
                        </div>
                      </div>

                      {/* Text content */}
                      <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1 sm:mb-2 group-hover:text-primary transition-colors duration-300">
                        {point.title}
                      </h3>
                      <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-[200px]">
                        {point.description}
                      </p>

                      {/* Hover underline */}
                      <div className={`mt-4 h-0.5 w-0 group-hover:w-16 bg-gradient-to-r ${point.accent} rounded-full transition-all duration-500`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* Stats strip */}
        <Reveal delay={200}>
          <div className="mt-12 sm:mt-20 relative">
            {/* Glass container */}
            <div className="relative rounded-2xl backdrop-blur-xl bg-card/30 border border-primary/10 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer bg-[length:200%_100%]" />
              
              <div className="relative grid grid-cols-3 divide-x divide-primary/10">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="group px-2 sm:px-4 py-5 sm:py-8 lg:py-10 text-center hover:bg-primary/5 transition-colors duration-300">
                      <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent tracking-tight mb-0.5 sm:mb-1">
                        {stat.value}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium leading-tight">
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
