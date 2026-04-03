import { useState } from 'react';
import { Reveal } from './Reveal';
import { ShieldCheck, Zap, CreditCard, Download, Users, Award, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified Sellers',
    description: 'Every creator is vetted before listing products on our platform.',
    details: 'We manually review every creator application, verify their identity, and ensure they meet our quality standards before they can sell on SellsPay.',
    stat: '100%',
    statLabel: 'Verified'
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'All transactions protected with Stripe-powered buyer protection.',
    details: 'Your payment information is encrypted and never stored on our servers. Every purchase is backed by our buyer protection guarantee.',
    stat: '256-bit',
    statLabel: 'Encryption'
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'Download your purchases immediately after checkout.',
    details: 'No waiting, no delays. The moment your payment is confirmed, your files are ready to download. Start creating immediately.',
    stat: '<1s',
    statLabel: 'Delivery'
  },
  {
    icon: Download,
    title: 'Unlimited Downloads',
    description: 'Re-download your purchased files anytime, forever.',
    details: 'Lost your files? No problem. Every purchase is linked to your account permanently. Download again whenever you need.',
    stat: '∞',
    statLabel: 'Downloads'
  },
  {
    icon: Users,
    title: 'Creator Support',
    description: 'Direct messaging with creators for questions and support.',
    details: 'Have a question about a product? Message the creator directly. Our community is built on collaboration and support.',
    stat: '24/7',
    statLabel: 'Available'
  },
  {
    icon: Award,
    title: 'Quality Guaranteed',
    description: 'Every product reviewed for quality before publishing.',
    details: 'Our team reviews every product submission to ensure it meets our quality standards. If it doesn\'t meet expectations, get a full refund.',
    stat: '5-Star',
    statLabel: 'Quality'
  },
];

export function ValueProps() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <section className="py-28 sm:py-36 lg:py-44 bg-background">
      <div className="px-6 sm:px-8 lg:px-12 xl:px-16 max-w-[1400px] mx-auto">
        {/* Section header */}
        <Reveal>
          <div className="mb-20 sm:mb-28">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-4">
              Trust & Security
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-foreground tracking-tight leading-[1.05] mb-6">
              Why creators choose SellsPay
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Built for trust, speed, and simplicity. Everything you need to succeed.
            </p>
          </div>
        </Reveal>

        {/* Feature grid — CapCut clean card style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border/30 border border-border/30 rounded-2xl overflow-hidden">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isExpanded = expandedIndex === index;
            
            return (
              <Reveal key={feature.title} delay={index * 50}>
                <div 
                  className="bg-background cursor-pointer group"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between p-8 sm:p-10">
                    <div className="flex items-center gap-5 sm:gap-6">
                      {/* Stat */}
                      <div className="flex flex-col items-center min-w-[72px]">
                        <span className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                          {feature.stat}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mt-1 font-semibold">
                          {feature.statLabel}
                        </span>
                      </div>
                      
                      {/* Title + desc */}
                      <div>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-foreground group-hover:text-primary transition-colors duration-200">
                          {feature.title}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground mt-1 hidden sm:block leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Expand toggle */}
                    <div className={`p-2.5 rounded-lg border transition-all duration-300 ${
                      isExpanded 
                        ? 'bg-primary border-primary rotate-45' 
                        : 'border-border/40 group-hover:border-primary/40'
                    }`}>
                      <Plus className={`h-4 w-4 transition-colors ${
                        isExpanded ? 'text-primary-foreground' : 'text-muted-foreground/50 group-hover:text-primary'
                      }`} />
                    </div>
                  </div>
                  
                  {/* Expandable */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-8 sm:px-10 pb-8 sm:pb-10">
                          <div className="flex items-start gap-5 pt-5 border-t border-border/30">
                            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
                              {feature.details}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
