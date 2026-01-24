import { Reveal } from './Reveal';
import { ShieldCheck, Lock, Zap } from 'lucide-react';

const valueProps = [
  {
    icon: ShieldCheck,
    title: 'Verified Creators',
    description: 'Every seller is vetted and verified before they can list products on our platform.',
  },
  {
    icon: Lock,
    title: 'Secure Payments',
    description: 'Your transactions are protected by industry-standard encryption and fraud detection.',
  },
  {
    icon: Zap,
    title: 'Instant Downloads',
    description: 'Get your files immediately after purchase. No waiting, no hassle.',
  },
];

export function ValueProps() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <Reveal className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Why Creators Trust Us
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with security and reliability at the core
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            return (
              <Reveal key={prop.title} delay={index * 100} blur>
                <div className="group relative p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/30 transition-all duration-300">
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {prop.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {prop.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
