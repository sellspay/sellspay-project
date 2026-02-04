import { Check, Store, Palette, Zap, Globe, CreditCard, BarChart3 } from 'lucide-react';
import { Reveal } from './Reveal';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const sellerBenefits = [
  {
    icon: Store,
    title: 'Your Own Storefront',
    description: 'Create a beautiful branded page to showcase your products',
  },
  {
    icon: Palette,
    title: 'Built-in AI Tools',
    description: 'Access professional creative tools without extra subscriptions',
  },
  {
    icon: CreditCard,
    title: 'Instant Payouts',
    description: 'Get paid fast with multiple payout options worldwide',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track views, sales, and earnings in real-time',
  },
];

const quickStats = [
  { value: '0%', label: 'Platform fees for Enterprise' },
  { value: '180+', label: 'Countries supported' },
  { value: '24/7', label: 'Creator support' },
];

export function AIStudioPromo() {
  const navigate = useNavigate();

  return (
    <Reveal>
      <section className="relative py-24 sm:py-32 lg:py-40 overflow-hidden">
        <div className="relative z-10 px-6 sm:px-8 lg:px-16">
          <div className="max-w-7xl mx-auto">
            
            {/* Main Headline */}
            <div className="text-center mb-16 sm:mb-20">
              <h2 
                className="text-foreground leading-[1.15] tracking-tight mb-6"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                <span className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl">Thousands of creators</span>
                <span className="block mt-2">
                  <span className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl">choose </span>
                  <span 
                    className="text-primary text-6xl sm:text-7xl lg:text-8xl xl:text-9xl"
                    style={{ fontFamily: "'Georgia', serif" }}
                  >SellsPay</span>
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Stop juggling multiple platforms. Sell your digital products, access AI tools, 
                and manage your business — all in one place.
              </p>
            </div>

            {/* All-in-One Value Props */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-16 sm:mb-20">
              {['Sell', 'Create', 'Analyze', 'Grow'].map((item, index) => (
                <div 
                  key={index}
                  className="relative p-6 sm:p-8 rounded-2xl bg-card/50 border border-border/50 text-center group hover:border-primary/30 transition-colors"
                >
                  <span className="text-2xl sm:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Benefits Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 sm:mb-20">
              {sellerBenefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-primary/30 transition-colors"
                >
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 sm:gap-16 mb-16 sm:mb-20">
              {quickStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Placeholder Section - Ready for your elements */}
            <div className="mb-16 sm:mb-20">
              <div className="p-8 sm:p-12 rounded-3xl border-2 border-dashed border-border/50 bg-card/20 text-center">
                <Globe className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  Additional promotional elements coming soon
                </p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  Placeholder for custom content
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Button 
                onClick={() => navigate('/signup')}
                size="lg"
                className="px-12 h-14 text-lg font-semibold"
              >
                Start Selling Today
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                No monthly fees to get started • Only pay when you sell
              </p>
            </div>

          </div>
        </div>
      </section>
    </Reveal>
  );
}
