import { useState, useMemo } from 'react';
import { Search, ChevronDown, ExternalLink, MessageCircle, Mail, HelpCircle, Sparkles, CreditCard, Users, Store, Wrench, Shield, BookOpen, Headphones } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: typeof HelpCircle;
  description: string;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    description: 'Learn the basics of the platform',
    items: [
      {
        question: 'What is EditorsParadise?',
        answer: 'EditorsParadise is the ultimate marketplace for video editors, motion designers, and content creators. We connect creators who sell digital products (LUTs, presets, templates, sound effects) with buyers looking for high-quality assets to enhance their content.',
      },
      {
        question: 'How do I create an account?',
        answer: 'Click the "Sign Up" button in the top navigation bar. You can create an account using your email address. After signing up, you\'ll have immediate access to browse products, follow creators, and make purchases.',
      },
      {
        question: 'Is EditorsParadise free to use?',
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
        answer: 'EditorsParadise works on any device with a modern web browser – desktop, laptop, tablet, or mobile phone. The digital products you purchase can be downloaded and used on any compatible editing software.',
      },
    ],
  },
  {
    id: 'for-creators',
    title: 'For Creators',
    icon: Users,
    description: 'Start selling your digital products',
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
    items: [
      {
        question: 'How do I create and list products?',
        answer: 'Go to your Dashboard and click "Create Product". Add your product name, description, pricing, cover image, and upload your files. You can save as draft or publish immediately. Products go through a quick review before appearing in search.',
      },
      {
        question: 'What file types are supported?',
        answer: 'We support all common file types: ZIP, RAR, MP4, MOV, WAV, MP3, PNG, JPG, PSD, AI, and more. Maximum file size is 500MB per file. For larger products, use a ZIP file containing all assets.',
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Help Center</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            How can we help?
          </h1>
          <p className="text-xl text-muted-foreground mb-10">
            Find answers to common questions about our platform
          </p>
          
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for answers..."
              className="pl-12 pr-4 py-6 text-lg rounded-full border-border/50 bg-card/80 backdrop-blur-sm focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-border/40">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap justify-center gap-3">
            {faqCategories.slice(0, 5).map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id && !searchQuery ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery('');
                }}
              >
                <cat.icon className="h-4 w-4 mr-2" />
                {cat.title}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="sticky top-24 space-y-1">
                {faqCategories.map((category) => {
                  const isActive = activeCategory === category.id && !searchQuery;
                  const matchCount = searchQuery
                    ? filteredCategories.find((c) => c.id === category.id)?.items.length || 0
                    : 0;

                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setActiveCategory(category.id);
                        setSearchQuery('');
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <category.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium text-sm">{category.title}</span>
                      {searchQuery && matchCount > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {matchCount}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* FAQ Content */}
            <div className="lg:col-span-3">
              {searchQuery && (
                <div className="mb-6">
                  <p className="text-muted-foreground">
                    {activeItems.length} result{activeItems.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </p>
                </div>
              )}

              {activeItems.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try a different search term or browse categories
                    </p>
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      Clear search
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50 overflow-hidden">
                  <Accordion type="single" collapsible className="divide-y divide-border">
                    {activeItems.map((item, index) => (
                      <AccordionItem key={index} value={`item-${index}`} className="border-0">
                        <AccordionTrigger className="px-6 py-5 text-left hover:no-underline hover:bg-muted/50 transition-colors [&[data-state=open]]:bg-muted/30">
                          <span className="font-medium text-foreground pr-4">
                            {highlightText(item.question, searchQuery)}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 pt-2">
                          <p className="text-muted-foreground leading-relaxed">
                            {highlightText(item.answer, searchQuery)}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Still need help?
          </h2>
          <p className="text-muted-foreground mb-8">
            Our team and community are here to support you
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <Card className="p-6 hover:border-primary/50 transition-colors">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Discord Community</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get help from our active community
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://discord.gg/xQAzE4bWgu" target="_blank" rel="noopener noreferrer">
                  Join Discord
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </Card>
            
            <Card className="p-6 hover:border-primary/50 transition-colors">
              <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                For account-specific issues
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="mailto:support@editorsparadise.com">
                  Send Email
                </a>
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
