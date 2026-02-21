import { Link } from 'react-router-dom';
import { Search, MessageCircle, BookOpen, Headphones, Newspaper, Handshake, Users, Gift, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const supportCards = [
  {
    icon: Users,
    title: 'Community',
    description: 'Join our community to connect, collaborate, and get support on your projects.',
    link: '/community',
    linkLabel: 'Visit Community',
  },
  {
    icon: BookOpen,
    title: 'Documentation & FAQ',
    description: 'Learn and build with our guides, best practices, and frequently asked questions.',
    link: '/faq',
    linkLabel: 'Browse FAQ',
  },
  {
    icon: Headphones,
    title: 'Contact Support',
    description: 'Direct support for paying users. Get help with your account, billing, and platform issues.',
    link: 'mailto:support@sellspay.com',
    linkLabel: 'Email Support',
    external: true,
  },
];

const involvedLinks = [
  {
    title: 'Platform Updates',
    description: 'News from the SellsPay team.',
    link: '/community/updates',
    linkLabel: 'View Updates',
  },
  {
    title: 'Hire Professionals',
    description: 'Get help from our network of experts.',
    link: '/hire-professionals',
    linkLabel: 'Browse Editors',
  },
  {
    title: 'Become a Creator',
    description: 'Start selling your digital products today.',
    link: '/settings',
    linkLabel: 'Apply Now',
  },
  {
    title: 'Refund Policy',
    description: 'Understand our refund and dispute process.',
    link: '/refunds',
    linkLabel: 'View Policy',
  },
];

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="pt-20 pb-16 text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8">
          Help & Support
        </h1>

        {/* Search bar */}
        <div className="max-w-lg mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Ask anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
      </section>

      {/* Support Cards */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {supportCards.map((card) => {
            const Icon = card.icon;
            const content = (
              <div
                key={card.title}
                className="group rounded-xl border border-border bg-card p-6 hover:border-primary/30 hover:bg-card/80 transition-all duration-200 flex flex-col gap-3"
              >
                <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <h3 className="text-base font-semibold">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
              </div>
            );

            if (card.external) {
              return (
                <a key={card.title} href={card.link} target="_blank" rel="noopener noreferrer">
                  {content}
                </a>
              );
            }
            return (
              <Link key={card.title} to={card.link}>
                {content}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Get Involved */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <h2 className="text-2xl font-bold text-center mb-10">Get involved</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {involvedLinks.map((item) => (
            <div key={item.title} className="space-y-1.5">
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <Link
                to={item.link}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                {item.linkLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
