import { Link } from 'react-router-dom';
import { Search, BookOpen, Headphones, Users, ArrowRight, MessageSquare, Newspaper, UserPlus, Shield, HelpCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const supportCards = [
  {
    icon: Users,
    title: 'Ask the Community',
    description: 'Join our community to connect, collaborate, and get support on your projects.',
    link: '/community',
  },
  {
    icon: BookOpen,
    title: 'Documentation & FAQ',
    description: 'Learn and build with our guides, best practices, and in-depth docs.',
    link: '/faq',
  },
  {
    icon: Headphones,
    title: 'SellsPay Support',
    description: 'Direct support for paying users. Get help with your account, billing, and platform issues.',
    link: 'mailto:support@sellspay.com',
    external: true,
  },
];

const involvedLinks = [
  {
    icon: Newspaper,
    title: 'Platform Updates',
    description: 'News from the SellsPay engineering team.',
    link: '/community/updates',
    linkLabel: 'SellsPay Changelog',
  },
  {
    icon: UserPlus,
    title: 'Hire Professionals',
    description: 'Get help from our network of experts.',
    link: '/hire-professionals',
    linkLabel: 'Browse Editors',
  },
  {
    icon: MessageSquare,
    title: 'Become a Creator',
    description: 'Start selling your digital products today.',
    link: '/settings',
    linkLabel: 'Apply Now',
  },
  {
    icon: Shield,
    title: 'Refund Policy',
    description: 'Understand our refund and dispute process.',
    link: '/refunds',
    linkLabel: 'View Policy',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero with subtle gradient glow */}
      <section className="relative pt-24 sm:pt-32 pb-20 text-center px-4 overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/[0.06] blur-[120px]" />
          <div className="absolute top-20 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/[0.04] blur-[100px]" />
          <div className="absolute top-10 right-1/4 w-[250px] h-[250px] rounded-full bg-accent/[0.03] blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-10">
            Help & Support
          </h1>

          {/* Search bar — glassmorphic */}
          <div className="max-w-xl mx-auto relative">
            <div
              className={`
                relative flex items-center rounded-2xl transition-all duration-300
                bg-white/[0.04] backdrop-blur-xl
                border
                ${searchFocused ? 'border-primary/40 shadow-[0_0_24px_-4px_hsl(217_91%_60%/0.15)]' : 'border-white/[0.08]'}
              `}
            >
              <Search className="absolute left-4 h-[18px] w-[18px] text-muted-foreground" />
              <input
                type="text"
                placeholder="Ask anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full bg-transparent pl-12 pr-12 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <HelpCircle className="absolute right-4 h-[18px] w-[18px] text-muted-foreground/50" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Support Cards — 3 col glassmorphic */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {supportCards.map((card, i) => {
            const Icon = card.icon;
            const inner = (
              <motion.div
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={cardVariants}
                className="group relative rounded-2xl p-6 h-full flex flex-col gap-4
                  bg-white/[0.03] backdrop-blur-md
                  border border-white/[0.06]
                  hover:border-primary/20 hover:bg-white/[0.05]
                  transition-all duration-300 cursor-pointer"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-b from-primary/[0.04] to-transparent" />

                <div className="relative z-10 flex flex-col gap-3 flex-1">
                  <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  <h3 className="text-[15px] font-semibold tracking-tight">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                </div>
              </motion.div>
            );

            if (card.external) {
              return (
                <a key={card.title} href={card.link} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              );
            }
            return (
              <Link key={card.title} to={card.link}>
                {inner}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Get Involved */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-28">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl font-bold text-center mb-14"
        >
          Get involved
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-10">
          {involvedLinks.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-20px' }}
                variants={cardVariants}
                className="space-y-2"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-muted-foreground/70" />
                  <h3 className="text-[15px] font-semibold tracking-tight">{item.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-[26px]">
                  {item.description}
                </p>
                <Link
                  to={item.link}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pl-[26px] group/link"
                >
                  {item.linkLabel}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
