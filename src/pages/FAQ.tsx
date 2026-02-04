import { useState, useMemo } from 'react';
import { Search, ChevronDown, ExternalLink, MessageCircle, Mail, HelpCircle, Sparkles, CreditCard, Users, Store, Wrench, Shield, BookOpen, Headphones, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/home/Reveal';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: typeof HelpCircle;
  description: string;
  gradient: string;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    description: 'Learn the basics of the platform',
    gradient: 'from-emerald-500 to-teal-600',
    items: [
      {
        question: 'What is SellsPay?',
        answer: 'SellsPay is the ultimate marketplace for video editors, motion designers, and content creators. We connect creators who sell digital products (LUTs, presets, templates, sound effects) with buyers looking for high-quality assets to enhance their content.',
      },
      {
        question: 'How do I create an account?',
        answer: 'Click the "Sign Up" button in the top navigation bar. You can create an account using your email address. After signing up, you\'ll have immediate access to browse products, follow creators, and make purchases.',
      },
      {
        question: 'Is SellsPay free to use?',
        answer: 'Yes! Creating an account and browsing products is completely free. You only pay when you purchase products. If you want to sell products, there\'s no monthly fee – we only take a small platform fee when you make a sale.',
      },
      {
        question: 'What can I find on the platform?',
        answer: 'Our marketplace features LUTs & color grades, video presets, motion graphics templates, sound effects & music, transitions & overlays, fonts & graphics, editing tutorials, and much more. All created by professional editors and designers.',
      },
      {
        question: 'How do I find creators to follow?',
        answer: 'Visit the Creators page to discover verified creators. You can also explore products and follow creators whose work you love. Following a creator lets you see their new releases and stay updated on their content.',
      },
      {
        question: 'What devices are supported?',
        answer: 'SellsPay works on any device with a modern web browser – desktop, laptop, tablet, or mobile phone. The digital products you purchase can be downloaded and used on any compatible editing software.',
      },
    ],
  },
  {
    id: 'for-creators',
    title: 'For Creators',
    icon: Users,
    description: 'Start selling your digital products',
    gradient: 'from-violet-500 to-purple-600',
    items: [
      {
        question: 'How do I become a creator?',
        answer: 'To become a verified creator, go to Settings and click "Apply to become a Creator". Fill out the application with your details, portfolio, and social links. Our team reviews applications within 48-72 hours.',
      },
      {
        question: 'What are the requirements to sell?',
        answer: 'You need to be a verified creator, have a connected Stripe account for payments, and comply with our content guidelines. We accept creators with original, high-quality digital products for video editing and content creation.',
      },
      {
        question: 'How do I get verified?',
        answer: 'Verification is part of the creator application process. We verify your identity and review your portfolio to ensure quality. Verified creators get a badge on their profile and products, building trust with buyers.',
      },
      {
        question: 'What product types can I sell?',
        answer: 'You can sell LUTs, color presets, video templates, motion graphics, sound effects, music, transitions, overlays, fonts, graphics packs, tutorials, and any digital asset for content creation.',
      },
      {
        question: 'How do I set up my creator profile?',
        answer: 'After becoming a verified creator, customize your profile with a banner, avatar, bio, and social links. Use the Profile Editor to add custom sections, showcase your best work, and create collections to organize your products.',
      },
      {
        question: 'Can I customize my profile page?',
        answer: 'Absolutely! Our Profile Editor lets you add custom sections like featured products, collections, about sections, and more. You can rearrange sections, choose colors, and make your profile uniquely yours.',
      },
    ],
  },
  {
    id: 'selling',
    title: 'Selling & Store',
    icon: Store,
    description: 'Manage your products and sales',
    gradient: 'from-sky-500 to-blue-600',
    items: [
      {
        question: 'How do I create and list products?',
        answer: 'Go to your Dashboard and click "Create Product". Add your product name, description, pricing, cover image, and upload your files. You can save as draft or publish immediately. Products go through a quick review before appearing in search.',
      },
      {
        question: 'What file types are supported?',
        answer: 'We support all common file types: ZIP, RAR, MP4, MOV, WAV, MP3, PNG, JPG, PSD, AI, and more. Maximum total file size is 5GB per product. You can upload multiple files that together do not exceed this limit.',
      },
      {
        question: 'How does pricing work?',
        answer: 'You set your own prices in USD. Choose between one-time purchase, free download, or subscription-only access. You can also offer subscriber discounts on paid products. Minimum price for paid products is $1.',
      },
      {
        question: 'What is the platform fee?',
        answer: 'We charge a 15% platform fee on each sale. This covers payment processing, hosting, customer support, and platform maintenance. You keep 85% of every sale.',
      },
      {
        question: 'How do payouts work?',
        answer: 'Payouts are processed automatically through Stripe. Funds from sales are available for payout after a short holding period (typically 2-7 days). You can set up instant or scheduled payouts in your Stripe dashboard.',
      },
      {
        question: 'How do I connect Stripe?',
        answer: 'Go to Settings and click "Connect Stripe" to start the onboarding process. You\'ll create or connect a Stripe account, verify your identity, and add your bank details. Once complete, you can start receiving payments.',
      },
    ],
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions & Billing',
    icon: CreditCard,
    description: 'Recurring revenue and subscriber management',
    gradient: 'from-amber-500 to-orange-600',
    items: [
      {
        question: 'What are subscription plans?',
        answer: 'Subscription plans let you offer recurring access to your content. Subscribers pay monthly for benefits you define – like free access to certain products, exclusive discounts, or subscriber-only content.',
      },
      {
        question: 'How do I create subscription tiers?',
        answer: 'Go to Dashboard > Subscription Plans and click "Create Plan". Set your monthly price, name, description, and select which products subscribers get access to. You can create multiple tiers with different benefits.',
      },
      {
        question: 'What benefits can I offer subscribers?',
        answer: 'You can offer: free access to selected products, percentage discounts on other products, early access to new releases, subscriber-only products, and exclusive content not available to non-subscribers.',
      },
      {
        question: 'How do subscribers access content?',
        answer: 'When a user subscribes to your plan, they automatically get access to included benefits. Free products in their plan show as "Included in Subscription" and can be downloaded without additional payment.',
      },
      {
        question: 'Can buyers cancel anytime?',
        answer: 'Yes, subscribers can cancel at any time from their Settings page. They retain access until the end of their current billing period. No refunds are given for partial months.',
      },
      {
        question: 'How do creator payouts work for subscriptions?',
        answer: 'Subscription revenue follows the same payout process as one-time purchases. The 15% platform fee applies, and funds are deposited to your connected Stripe account on your payout schedule.',
      },
    ],
  },
  {
    id: 'ai-tools',
    title: 'AI Tools & Credits',
    icon: Sparkles,
    description: 'Powerful AI-powered editing tools',
    gradient: 'from-pink-500 to-rose-600',
    items: [
      {
        question: 'What are AI Tools?',
        answer: 'AI Tools are powerful features for audio and video editing. They include Voice Isolator, SFX Generator, Music Splitter, Audio Converter, and more. These tools use advanced AI to help you create professional content faster.',
      },
      {
        question: 'How do credits work?',
        answer: 'Each AI tool usage costs 1 credit. Credits are used when you process a file through one of our AI tools. You can see your credit balance in the top navigation bar or in your account settings.',
      },
      {
        question: 'What\'s included in free tier?',
        answer: 'Free accounts get 3 credits to start. This lets you try out our AI tools and see the quality before committing. You can purchase more credits or subscribe to our Pro plan for unlimited access.',
      },
      {
        question: 'What tools require credits?',
        answer: 'All AI-powered tools require credits: Voice Isolator, Music Splitter, SFX Generator, SFX Isolator, Waveform Generator, and more. Basic tools like Audio Converter and Audio Joiner don\'t require credits.',
      },
      {
        question: 'Do credits expire?',
        answer: 'No, credits never expire. Any credits you purchase or receive are yours to use whenever you want. Your credit balance stays in your account until you use them.',
      },
      {
        question: 'How do I get more credits?',
        answer: 'You can purchase credit packs from the Pricing page, or subscribe to our Pro Tools plan for unlimited monthly usage. Pro subscribers save significantly compared to buying credits individually.',
      },
    ],
  },
  {
    id: 'for-buyers',
    title: 'For Buyers',
    icon: Store,
    description: 'Purchasing and downloading products',
    gradient: 'from-cyan-500 to-blue-600',
    items: [
      {
        question: 'How do I purchase products?',
        answer: 'Browse products, click on one you like, and click the "Buy Now" or "Add to Cart" button. You\'ll be taken to a secure Stripe checkout to complete your payment. After payment, you can download your files immediately.',
      },
      {
        question: 'Where do I find my downloads?',
        answer: 'All your purchased products appear in your Profile under "Library" or "Purchases". You can re-download products anytime – there\'s no download limit. Files are available permanently after purchase.',
      },
      {
        question: 'How do refunds work?',
        answer: 'Digital products are generally non-refundable due to their nature. However, if you experience technical issues or receive a product that doesn\'t match its description, contact us and we\'ll help resolve the issue.',
      },
      {
        question: 'Can I save products for later?',
        answer: 'Yes! Click the bookmark icon on any product to save it to your wishlist. Access your saved products anytime from your Profile. You\'ll also see when saved products go on sale.',
      },
      {
        question: 'How do I follow creators?',
        answer: 'Click the "Follow" button on any creator\'s profile or product page. You\'ll see their new releases in your feed and get notified about new products. Unfollow anytime from their profile.',
      },
      {
        question: 'How do subscriptions work as a buyer?',
        answer: 'Subscribe to a creator\'s plan to unlock benefits like free products and discounts. Go to a creator\'s profile, select a subscription tier, and complete checkout. Manage subscriptions from your Settings page.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Security',
    icon: Shield,
    description: 'Manage your account settings',
    gradient: 'from-indigo-500 to-violet-600',
    items: [
      {
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page and enter your email. You\'ll receive a link to create a new password. If you don\'t see the email, check your spam folder.',
      },
      {
        question: 'How do I update my email?',
        answer: 'Go to Settings and update your email in the Account section. You\'ll need to verify the new email address before it becomes active. Your login will update to the new email.',
      },
      {
        question: 'Is two-factor authentication available?',
        answer: 'Yes! During the creator application process, you can set up two-factor authentication for added security. We recommend enabling 2FA especially if you\'re a creator handling payments.',
      },
      {
        question: 'How do I delete my account?',
        answer: 'Contact our support team to request account deletion. Note that this is irreversible – all your data, purchases, and products will be permanently removed. Any active subscriptions will be canceled.',
      },
      {
        question: 'How is my data protected?',
        answer: 'We use industry-standard encryption and security practices. Payment information is handled securely by Stripe – we never store your card details. Your personal data is protected and never sold to third parties.',
      },
    ],
  },
  {
    id: 'community',
    title: 'Community',
    icon: Users,
    description: 'Connect with other creators',
    gradient: 'from-fuchsia-500 to-pink-600',
    items: [
      {
        question: 'How do I join the Discord?',
        answer: 'Visit our Community page and click "Join Discord" or go directly to discord.gg/xQAzE4bWgu. The Discord is free to join and gives you access to our community of 10,000+ creators.',
      },
      {
        question: 'What are community threads?',
        answer: 'Community threads are discussion posts where you can ask questions, share work, get feedback, and connect with other creators. Post threads from the Community page – it\'s like a creative forum.',
      },
      {
        question: 'How do I report inappropriate content?',
        answer: 'Click the three-dot menu on any product, profile, or comment and select "Report". Describe the issue and our moderation team will review it within 24 hours. We take violations seriously.',
      },
      {
        question: 'Can I collaborate with other creators?',
        answer: 'Absolutely! Use our Discord #collaborations channel or community threads to find collaborators. Many creators team up on product bundles, tutorials, and cross-promotion.',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Support',
    icon: Headphones,
    description: 'Troubleshooting common issues',
    gradient: 'from-slate-500 to-slate-700',
    items: [
      {
        question: 'My download isn\'t working',
        answer: 'First, check your internet connection and try again. If using mobile, try downloading on desktop. Clear your browser cache if issues persist. Still stuck? Contact support with your order details.',
      },
      {
        question: 'Video preview not loading',
        answer: 'Video previews require a stable connection. Try refreshing the page or switching browsers. If on slow connection, wait for the preview to buffer. Some ad blockers can interfere – try disabling them temporarily.',
      },
      {
        question: 'Payment failed, what now?',
        answer: 'Check that your card details are correct and has sufficient funds. Try a different payment method if available. Some banks block international transactions – you may need to approve it with your bank.',
      },
      {
        question: 'How do I contact support?',
        answer: 'Join our Discord for fastest response from the community and team. For account-specific issues, email support through the Help page. Creators get priority support with faster response times.',
      },
    ],
  },
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('getting-started');

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return faqCategories;
    }

    const query = searchQuery.toLowerCase();
    return faqCategories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [searchQuery]);

  const activeItems = useMemo(() => {
    if (searchQuery.trim()) {
      return filteredCategories.flatMap((cat) => cat.items);
    }
    return filteredCategories.find((cat) => cat.id === activeCategory)?.items || [];
  }, [filteredCategories, activeCategory, searchQuery]);

  const activeCategoryData = faqCategories.find((cat) => cat.id === activeCategory);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section - Immersive Premium Design */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Layered Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.3),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--accent)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--primary)/0.1),transparent_50%)]" />

        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <Reveal>
            {/* Floating Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-8 hover:bg-primary/15 hover:border-primary/30 transition-all duration-300 cursor-default">
              <div className="relative">
                <HelpCircle className="h-4 w-4 text-primary" />
                <div className="absolute inset-0 animate-ping">
                  <HelpCircle className="h-4 w-4 text-primary opacity-50" />
                </div>
              </div>
              <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Help Center
              </span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            {/* Icon - Floating Style */}
            <div className="mb-10 flex justify-center">
              <div className="relative group">
                {/* Glow layers */}
                <div className="absolute inset-0 blur-[60px] bg-primary/50 rounded-full scale-150 group-hover:scale-[1.75] transition-transform duration-700" />
                <div className="absolute inset-0 blur-3xl bg-gradient-to-br from-primary to-accent opacity-40 rounded-full scale-125 group-hover:opacity-60 transition-all duration-500" />

                {/* Main Icon Container */}
                <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 shadow-2xl shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-500 group-hover:scale-105">
                  <HelpCircle className="h-16 w-16 text-primary-foreground drop-shadow-lg" />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight">
              How can we{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
                  help?
                </span>
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 blur-lg opacity-50" />
              </span>
            </h1>
          </Reveal>

          <Reveal delay={300}>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              Find answers to common questions about
              <span className="text-foreground font-medium"> our platform.</span>
            </p>
          </Reveal>

          <Reveal delay={400}>
            {/* Search Bar - Premium Style */}
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-50" />
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for answers..."
                  className="pl-16 pr-6 py-8 text-lg rounded-2xl border-border/50 bg-card/80 backdrop-blur-xl focus-visible:ring-primary shadow-2xl shadow-background/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </Reveal>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Category Quick Links */}
      <section className="relative py-8 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="flex flex-wrap justify-center gap-3">
              {faqCategories.slice(0, 6).map((cat) => {
                const isActive = activeCategory === cat.id && !searchQuery;
                const Icon = cat.icon;

                return (
                  <Button
                    key={cat.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "relative rounded-xl px-5 h-11 font-medium transition-all duration-300 overflow-hidden",
                      isActive
                        ? "text-white shadow-lg"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setSearchQuery('');
                    }}
                  >
                    {isActive && (
                      <div className={cn("absolute inset-0 bg-gradient-to-r", cat.gradient)} />
                    )}
                    <span className="relative flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {cat.title}
                    </span>
                  </Button>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        <div className="absolute right-0 top-1/3 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-4 gap-10">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Reveal>
                <nav className="sticky top-24 space-y-2">
                  {faqCategories.map((category) => {
                    const isActive = activeCategory === category.id && !searchQuery;
                    const matchCount = searchQuery
                      ? filteredCategories.find((c) => c.id === category.id)?.items.length || 0
                      : 0;
                    const Icon = category.icon;

                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setActiveCategory(category.id);
                          setSearchQuery('');
                        }}
                        className={cn(
                          'group w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left transition-all duration-300',
                          isActive
                            ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-xl transition-all",
                          isActive
                            ? "bg-white/20"
                            : "bg-muted group-hover:bg-primary/10"
                        )}>
                          <Icon className="h-5 w-5 flex-shrink-0" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm block truncate">{category.title}</span>
                          {!isActive && (
                            <span className="text-xs text-muted-foreground">{category.items.length} articles</span>
                          )}
                        </div>
                        {searchQuery && matchCount > 0 && (
                          <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                            {matchCount}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </Reveal>
            </div>

            {/* FAQ Content */}
            <div className="lg:col-span-3">
              {searchQuery && (
                <Reveal>
                  <div className="mb-8">
                    <p className="text-muted-foreground text-lg">
                      <span className="text-foreground font-semibold">{activeItems.length}</span> result{activeItems.length !== 1 ? 's' : ''} for "<span className="text-primary">{searchQuery}</span>"
                    </p>
                  </div>
                </Reveal>
              )}

              {!searchQuery && activeCategoryData && (
                <Reveal>
                  <div className="mb-8">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r text-white mb-4",
                      activeCategoryData.gradient
                    )}>
                      <activeCategoryData.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{activeCategoryData.title}</span>
                    </div>
                    <p className="text-muted-foreground text-lg">{activeCategoryData.description}</p>
                  </div>
                </Reveal>
              )}

              {activeItems.length === 0 ? (
                <Reveal>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative text-center py-20 px-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 rounded-3xl">
                      <div className="inline-flex p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6">
                        <HelpCircle className="h-12 w-12 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-3">No results found</h3>
                      <p className="text-muted-foreground text-lg mb-6">
                        Try a different search term or browse categories
                      </p>
                      <Button variant="outline" onClick={() => setSearchQuery('')} className="rounded-xl">
                        Clear search
                      </Button>
                    </div>
                  </div>
                </Reveal>
              ) : (
                <Reveal delay={100}>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden">
                      <Accordion type="single" collapsible className="divide-y divide-border/30">
                        {activeItems.map((item, index) => (
                          <AccordionItem key={index} value={`item-${index}`} className="border-0">
                            <AccordionTrigger className="px-8 py-6 text-left hover:no-underline hover:bg-muted/30 transition-colors [&[data-state=open]]:bg-primary/5">
                              <span className="font-semibold text-foreground pr-4 text-lg">
                                {highlightText(item.question, searchQuery)}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-8 pb-8 pt-2">
                              <p className="text-muted-foreground leading-relaxed text-base">
                                {highlightText(item.answer, searchQuery)}
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section - Premium Design */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        {/* Section Divider */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Still need help?
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <p className="text-xl text-muted-foreground mb-12">
              Our team and community are here to support you
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="grid sm:grid-cols-2 gap-6 max-w-xl mx-auto">
              {/* Discord Card */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/20 to-[#5865F2]/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 hover:border-[#5865F2]/30 transition-all duration-500 group-hover:-translate-y-1">
                  <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-[#5865F2]/20 to-[#5865F2]/5 mb-4">
                    <MessageCircle className="h-8 w-8 text-[#5865F2]" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">Discord Community</h3>
                  <p className="text-muted-foreground mb-6">
                    Get help from our active community
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-xl border-[#5865F2]/30 hover:bg-[#5865F2]/10 hover:border-[#5865F2]/50"
                    asChild
                  >
                    <a href="https://discord.gg/xQAzE4bWgu" target="_blank" rel="noopener noreferrer">
                      Join Discord
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Email Card */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 hover:border-primary/30 transition-all duration-500 group-hover:-translate-y-1">
                  <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">Email Support</h3>
                  <p className="text-muted-foreground mb-6">
                    For account-specific issues
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-xl border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                    asChild
                  >
                    <a href="mailto:support@sellspay.com">
                      Send Email
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
