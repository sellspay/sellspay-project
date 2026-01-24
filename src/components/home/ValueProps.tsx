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
    title: 'Vetted Creators Only',
    description: 'Every seller goes through our verification process before listing. We check portfolios, verify identities, and ensure quality standards. No exceptions.',
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[800px] bg-primary/8 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Premium Stats Bar */}
        <Reveal>
          <div className="relative mb-20">
            {/* Glass bar container */}
            <div className="premium-glass-bar relative rounded-2xl p-[1px] bg-gradient-to-r from-primary/40 via-white/10 to-primary/20">
              <div className="relative rounded-2xl bg-[rgba(15,15,18,0.75)] backdrop-blur-xl overflow-hidden">
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
                
                <div className="relative grid grid-cols-3">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div 
                        key={stat.label} 
                        className={`relative px-4 py-10 lg:py-14 text-center ${
                          index < stats.length - 1 ? 'border-r border-white/[0.06]' : ''
                        }`}
                      >
                        {/* Icon with breathe animation */}
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-5 animate-icon-breathe">
                          <Icon className="h-5 w-5 text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
                        </div>
                        {/* Number with premium typography */}
                        <div className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground tracking-tight mb-2 tabular-nums">
                          {stat.value}
                        </div>
                        {/* Label with refined styling */}
                        <div className="text-[11px] text-muted-foreground/65 uppercase tracking-[0.18em] font-medium">
                          {stat.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Section header */}
        <Reveal delay={50}>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Why Creators Trust Us
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built on security, transparency, and creator-first principles
            </p>
          </div>
        </Reveal>

        {/* Trust points - asymmetric layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left: Large featured premium card */}
          <Reveal delay={100} className="lg:col-span-5">
            <div className="group premium-card relative h-full rounded-[20px] bg-[rgba(15,15,18,0.72)] backdrop-blur-[14px] border border-white/[0.06] overflow-hidden transition-all duration-[240ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:shadow-[0_26px_80px_rgba(0,0,0,0.65),0_0_0_1px_rgba(168,85,247,0.14)]">
              {/* Gradient border glow */}
              <div className="absolute inset-0 rounded-[20px] p-[1px] bg-gradient-to-br from-primary/55 via-white/[0.08] to-primary/25 pointer-events-none [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [-webkit-mask-composite:xor]" />
              
              {/* Purple bloom */}
              <div className="absolute -inset-[40%] bg-[radial-gradient(circle_at_20%_10%,rgba(168,85,247,0.20),transparent_55%)] blur-[30px] opacity-90 pointer-events-none" />
              
              {/* Inner top highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
              
              {/* Sweep animation element */}
              <div className="sweep absolute -inset-[40%_-60%] bg-[linear-gradient(120deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)] -translate-x-[30%] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:animate-sweep" />
              
              {/* Content */}
              <div className="relative z-10 p-8 lg:p-10">
                {/* Icon with breathe + hover scale */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/30 flex items-center justify-center mb-8 transition-transform duration-300 group-hover:scale-110 animate-icon-breathe">
                  <ShieldCheck className="h-8 w-8 text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)]" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 leading-tight">
                  {trustPoints[0].title}
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  {trustPoints[0].description}
                </p>
                
                {/* Trust badge */}
                <div className="flex items-center gap-2 text-sm text-primary/80">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="tracking-wide">KYC Verified • Portfolio Reviewed</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right: Stacked premium cards */}
          <div className="lg:col-span-7 space-y-6">
            {trustPoints.slice(1).map((point, index) => {
              const Icon = point.icon;
              return (
                <Reveal key={point.title} delay={200 + index * 100}>
                  <div className="group premium-card relative rounded-[16px] bg-[rgba(15,15,18,0.65)] backdrop-blur-[14px] border border-white/[0.05] overflow-hidden transition-all duration-[240ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(168,85,247,0.12)]">
                    {/* Gradient border */}
                    <div className="absolute inset-0 rounded-[16px] p-[1px] bg-gradient-to-br from-primary/40 via-white/[0.06] to-primary/20 pointer-events-none [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [-webkit-mask-composite:xor] opacity-60 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Inner top highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                    
                    {/* Sweep */}
                    <div className="sweep absolute -inset-[40%_-60%] bg-[linear-gradient(120deg,transparent_40%,rgba(255,255,255,0.05)_50%,transparent_60%)] -translate-x-[30%] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:animate-sweep" />
                    
                    {/* Content */}
                    <div className="relative z-10 flex items-start gap-5 p-6 lg:p-8">
                      <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-primary/40 animate-icon-breathe">
                        <Icon className="h-6 w-6 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
                      </div>
                      <div className="flex-1">
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
            
            {/* Trust footer strip */}
            <Reveal delay={400}>
              <div className="flex items-center justify-center gap-6 py-4 text-xs text-muted-foreground/60 tracking-wide">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  Powered by Stripe
                </span>
                <span className="w-px h-3 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                <span>Fraud Monitoring</span>
                <span className="w-px h-3 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                <span>Buyer Guarantee</span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
      
      {/* CSS for animations */}
      <style>{`
        @keyframes icon-breathe {
          0%, 100% { transform: translateY(0); opacity: 0.85; }
          50% { transform: translateY(-2px); opacity: 1; }
        }
        .animate-icon-breathe {
          animation: icon-breathe 2.6s ease-in-out infinite;
        }
        
        @keyframes sweep {
          from { transform: translateX(-30%); }
          to { transform: translateX(30%); }
        }
        .group:hover .group-hover\\:animate-sweep {
          animation: sweep 900ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
      `}</style>
    </section>
  );
}
