import { useState } from 'react';
import { Reveal } from './Reveal';
import { ShieldCheck, Zap, CreditCard, Download, Users, Award, ChevronDown, Plus } from 'lucide-react';
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
    <section className="py-24 sm:py-32 lg:py-40 bg-background">
      <div className="px-6 sm:px-8 lg:px-12 xl:px-16">
        {/* Section header - MASSIVE */}
        <Reveal>
          <div className="mb-16 sm:mb-24 max-w-5xl">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground tracking-tight mb-6">
              Why creators choose SellsPay
            </h2>
            <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed">
              Built for trust, speed, and simplicity. Everything you need to succeed.
            </p>
          </div>
        </Reveal>

        {/* Interactive Feature Accordions - Premium design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-t border-border">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isExpanded = expandedIndex === index;
            
            return (
              <Reveal key={feature.title} delay={index * 60}>
                <div 
                  className={`border-b border-border ${index % 2 === 0 ? 'lg:border-r' : ''} cursor-pointer group`}
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between p-8 sm:p-10 lg:p-12">
                    <div className="flex items-center gap-6">
                      {/* Stat Number - Premium accent */}
                      <div className="flex flex-col items-center min-w-[80px]">
                        <span className="text-4xl sm:text-5xl font-bold text-primary tracking-tight">
                          {feature.stat}
                        </span>
                        <span className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                          {feature.statLabel}
                        </span>
                      </div>
                      
                      {/* Title */}
                      <div>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                          {feature.title}
                        </h3>
                        <p className="text-base sm:text-lg text-muted-foreground mt-1 hidden sm:block">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Expand Icon */}
                    <div className={`p-3 border border-border transition-all duration-300 ${isExpanded ? 'bg-primary border-primary rotate-45' : 'group-hover:border-primary/50'}`}>
                      <Plus className={`h-5 w-5 transition-colors ${isExpanded ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </div>
                  </div>
                  
                  {/* Expandable Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-8 sm:px-10 lg:px-12 pb-10 lg:pb-12">
                          <div className="flex items-start gap-6 pt-4 border-t border-border/50">
                            {/* Icon */}
                            <div className="p-4 bg-primary/10 border border-primary/20">
                              <Icon className="h-8 w-8 text-primary" />
                            </div>
                            
                            {/* Details */}
                            <div className="flex-1">
                              <p className="text-lg sm:text-xl text-foreground/90 leading-relaxed">
                                {feature.details}
                              </p>
                            </div>
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
