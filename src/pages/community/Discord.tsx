import { ExternalLink, Headphones, Zap, Users, Calendar, Gift, MessageSquare, Star, Globe, CheckCircle, Sparkles, ArrowRight, Crown, Trophy, Heart, ChevronDown, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/home/Reveal';

const DISCORD_LINK = 'https://discord.gg/xQAzE4bWgu';

const benefits = [
  {
    icon: Headphones,
    title: 'Priority Support',
    description: 'Get help directly from the team and community moderators with faster response times.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: Zap,
    title: 'Early Access',
    description: 'Be the first to know about new features, tools, and platform updates before anyone else.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    icon: Users,
    title: 'Creator Network',
    description: 'Connect with fellow creators, collaborate on projects, and grow your audience together.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Calendar,
    title: 'Weekly Events',
    description: 'Join exclusive challenges, AMAs with top creators, and interactive workshops.',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    icon: Gift,
    title: 'Exclusive Content',
    description: 'Access members-only tutorials, tips, and resources to level up your skills.',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    icon: MessageSquare,
    title: 'Feedback Channel',
    description: 'Shape the future of the platform by sharing your ideas and voting on features.',
    gradient: 'from-indigo-500 to-violet-600',
  },
];

const stats = [
  { label: 'Active Members', value: '10,000+', icon: Users, suffix: '' },
  { label: 'Messages Weekly', value: '50,000+', icon: MessageSquare, suffix: '' },
  { label: 'Countries', value: '120+', icon: Globe, suffix: '' },
  { label: 'Verified Creators', value: '500+', icon: CheckCircle, suffix: '' },
];

const testimonials = [
  {
    quote: "The Discord community helped me grow from 0 to 10k followers in just 3 months. The networking opportunities are incredible!",
    author: "Alex Chen",
    role: "Motion Designer",
    avatar: "AC",
    rating: 5,
  },
  {
    quote: "I've learned more in this Discord than any paid course. The community is so supportive and the feedback is always constructive.",
    author: "Sarah Williams",
    role: "Video Editor",
    avatar: "SW",
    rating: 5,
  },
  {
    quote: "Got my first freelance client through the Discord. The creator network here is genuinely amazing.",
    author: "Marcus Johnson",
    role: "SFX Designer",
    avatar: "MJ",
    rating: 5,
  },
];

const channelPreviews = [
  { name: '# general', members: '8.2k', description: 'Main community chat' },
  { name: '# showcase', members: '5.1k', description: 'Share your work' },
  { name: '# collabs', members: '3.4k', description: 'Find collaborators' },
  { name: '# help', members: '6.8k', description: 'Get assistance' },
];

// Premium FAQ Accordion Section Component
function BenefitsFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative py-32 lg:py-40 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Premium Background System */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_50%,rgba(88,101,242,0.12),transparent_70%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      
      {/* Floating Orbs */}
      <div className="absolute left-0 top-1/3 w-[500px] h-[500px] bg-[#5865F2]/15 rounded-full blur-[180px] animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute right-0 bottom-1/3 w-[400px] h-[400px] bg-violet-600/12 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      
      {/* Glowing Top Border */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#5865F2]/40 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-[#5865F2] to-transparent blur-sm" />

      <div className="relative mx-auto max-w-4xl">
        {/* Header */}
        <Reveal>
          <div className="text-center mb-16 lg:mb-20">
            {/* Animated Badge */}
            <div className="relative inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-[#5865F2]/20 via-violet-500/20 to-[#5865F2]/20 border border-[#5865F2]/30 backdrop-blur-xl mb-8 group hover:border-[#5865F2]/50 transition-all duration-500 cursor-default overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#5865F2] to-violet-600 shadow-lg shadow-[#5865F2]/30">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-[#5865F2] via-violet-400 to-[#5865F2] bg-clip-text text-transparent tracking-wide uppercase">
                Exclusive Benefits
              </span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
            </div>

            {/* Main Headline */}
            <h2 className="relative text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              <span className="text-foreground">Why Join </span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#5865F2] via-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Our Community
                </span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#5865F2] to-transparent rounded-full" />
                <div className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-[#5865F2] blur-md rounded-full" />
              </span>
              <span className="text-foreground">?</span>
            </h2>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              More than just a chat server — 
              <span className="text-foreground font-medium"> it's your creative home base.</span>
            </p>
          </div>
        </Reveal>

        {/* FAQ Accordion Items */}
        <div className="space-y-4">
          {benefits.map((benefit, index) => {
            const isOpen = openIndex === index;
            const Icon = benefit.icon;
            
            return (
              <Reveal key={benefit.title} delay={index * 80}>
                <div className="group relative">
                  {/* Glow Effect when open */}
                  <div 
                    className={`absolute -inset-0.5 bg-gradient-to-r ${benefit.gradient} rounded-2xl blur-lg transition-opacity duration-500 ${isOpen ? 'opacity-20' : 'opacity-0 group-hover:opacity-10'}`} 
                  />
                  
                  {/* Main Container */}
                  <div 
                    className={`relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border rounded-2xl transition-all duration-500 overflow-hidden ${
                      isOpen 
                        ? 'border-[#5865F2]/40 shadow-xl shadow-[#5865F2]/10' 
                        : 'border-border/50 hover:border-[#5865F2]/30'
                    }`}
                  >
                    {/* Accent line on top when open */}
                    <div 
                      className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${benefit.gradient} transition-opacity duration-300 ${isOpen ? 'opacity-60' : 'opacity-0'}`} 
                    />
                    
                    {/* Question Header */}
                    <button
                      onClick={() => toggleItem(index)}
                      className="w-full px-6 py-5 lg:px-8 lg:py-6 flex items-center gap-4 lg:gap-6 text-left transition-colors"
                    >
                      {/* Icon */}
                      <div className={`relative flex-shrink-0 transition-all duration-500 ${isOpen ? 'scale-110' : 'group-hover:scale-105'}`}>
                        <div className={`absolute -inset-1 bg-gradient-to-br ${benefit.gradient} rounded-xl blur-md opacity-40 ${isOpen ? 'opacity-60' : ''} transition-opacity`} />
                        <div className={`relative p-3 lg:p-4 rounded-xl bg-gradient-to-br ${benefit.gradient} shadow-lg`}>
                          <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                        </div>
                      </div>
                      
                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg lg:text-xl font-semibold text-foreground">
                          {benefit.title}
                        </h3>
                      </div>
                      
                      {/* Toggle Icon */}
                      <div className={`relative flex-shrink-0 p-2 rounded-full bg-muted/50 transition-all duration-300 ${isOpen ? 'bg-[#5865F2]/20 rotate-180' : 'group-hover:bg-muted'}`}>
                        <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'text-[#5865F2]' : 'text-muted-foreground'}`} />
                      </div>
                    </button>
                    
                    {/* Answer Content - Animated */}
                    <div 
                      className={`grid transition-all duration-500 ease-out ${
                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-6 pb-6 lg:px-8 lg:pb-8 pl-[4.5rem] lg:pl-[6.5rem]">
                          {/* Subtle divider */}
                          <div className="h-px w-full bg-gradient-to-r from-border/50 via-border to-transparent mb-4" />
                          
                          <p className="text-muted-foreground leading-relaxed text-base lg:text-lg">
                            {benefit.description}
                          </p>
                          
                          {/* Optional: Additional benefits list for this item */}
                          <div className="flex flex-wrap gap-3 mt-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/70 bg-muted/50 px-3 py-1.5 rounded-full">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                              Available 24/7
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/70 bg-muted/50 px-3 py-1.5 rounded-full">
                              <Sparkles className="h-3.5 w-3.5 text-[#5865F2]" />
                              Exclusive Access
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <Reveal delay={600}>
          <div className="mt-16 text-center">
            <Button 
              size="lg" 
              className="group relative bg-gradient-to-r from-[#5865F2] to-violet-600 hover:from-[#4752C4] hover:to-violet-700 text-white px-10 py-7 text-lg font-semibold rounded-2xl shadow-2xl shadow-[#5865F2]/30 hover:shadow-[#5865F2]/50 transition-all duration-500 hover:scale-105 overflow-hidden"
              asChild
            >
              <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Sparkles className="mr-3 h-5 w-5" />
                Unlock All Benefits
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <p className="mt-5 text-sm text-muted-foreground flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              Join 10,000+ creators • 100% free • No spam
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Discord() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section - Immersive */}
      <section className="relative min-h-[70vh] sm:min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Layered Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#5865F2]/5 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(88,101,242,0.3),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(88,101,242,0.1),transparent_50%)]" />
        
        {/* Floating Orbs - Hidden on mobile */}
        <div className="hidden sm:block absolute top-1/4 left-1/4 w-96 h-96 bg-[#5865F2]/20 rounded-full blur-[128px] animate-pulse" />
        <div className="hidden sm:block absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="hidden sm:block absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(88,101,242,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(88,101,242,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10 mx-auto max-w-5xl text-center px-2">
          <Reveal>
            {/* Floating Badge */}
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/20 backdrop-blur-sm mb-6 sm:mb-8 hover:bg-[#5865F2]/15 hover:border-[#5865F2]/30 transition-all duration-300 cursor-default">
              <div className="relative">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#5865F2]" />
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#5865F2] opacity-50" />
                </div>
              </div>
              <span className="text-xs sm:text-sm font-medium bg-gradient-to-r from-[#5865F2] to-violet-400 bg-clip-text text-transparent">
                The #1 Community for Creators
              </span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            {/* Discord Logo - Floating */}
            <div className="mb-6 sm:mb-10 flex justify-center">
              <div className="relative group">
                {/* Glow layers */}
                <div className="absolute inset-0 blur-[40px] sm:blur-[60px] bg-[#5865F2]/50 rounded-full scale-125 sm:scale-150 group-hover:scale-175 transition-transform duration-700" />
                <div className="absolute inset-0 blur-2xl sm:blur-3xl bg-gradient-to-br from-[#5865F2] to-violet-600 opacity-40 rounded-full scale-110 sm:scale-125 group-hover:opacity-60 transition-all duration-500" />
                
                {/* Main Logo Container */}
                <div className="relative bg-gradient-to-br from-[#5865F2] to-[#4752C4] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl shadow-[#5865F2]/30 group-hover:shadow-[#5865F2]/50 transition-all duration-500 group-hover:scale-105">
                  <svg width="48" height="37" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg sm:w-[72px] sm:h-[55px]">
                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4804 44.2898 53.5475 44.3433C53.9029 44.6363 54.2751 44.9293 54.6501 45.2082C54.7788 45.304 54.7704 45.5041 54.6277 45.5858C52.859 46.6197 51.0203 47.4931 49.0893 48.2228C48.9634 48.2707 48.9074 48.4172 48.969 48.5383C50.0349 50.6034 51.2523 52.57 52.5929 54.435C52.6489 54.5139 52.7496 54.5477 52.842 54.5195C58.6426 52.7249 64.5253 50.0174 70.5982 45.5576C70.6513 45.5182 70.6849 45.459 70.6905 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1099 30.1693C30.1099 34.1136 27.2805 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.8999 23.0133 53.7545 26.2532 53.7018 30.1693C53.7018 34.1136 50.8999 37.3253 47.3178 37.3253Z" fill="white"/>
                  </svg>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight">
              Join{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#5865F2] via-violet-400 to-[#5865F2] bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
                  10,000+
                </span>
                <div className="absolute -inset-1 bg-gradient-to-r from-[#5865F2]/20 to-violet-500/20 blur-lg opacity-50" />
              </span>
              {' '}Creators
            </h1>
          </Reveal>

          <Reveal delay={300}>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Connect with the most active community of video editors, motion designers, and content creators. 
              <span className="text-foreground font-medium"> Get help, share your work, and grow together.</span>
            </p>
          </Reveal>

          <Reveal delay={400}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="group relative bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#3d44a8] text-white px-10 py-7 text-lg font-semibold rounded-2xl shadow-2xl shadow-[#5865F2]/30 hover:shadow-[#5865F2]/50 transition-all duration-500 hover:scale-105 overflow-hidden"
                asChild
              >
                <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <ExternalLink className="mr-3 h-5 w-5" />
                  Join Our Discord
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Free to join • Instant access
              </p>
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

      {/* Stats Section - Floating Cards */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        {/* Section Divider Gradient */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5865F2]/30 to-transparent" />
        
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {stats.map((stat, index) => (
                <Reveal key={stat.label} delay={index * 100}>
                  <div className="group relative">
                    {/* Glow on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/20 to-violet-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 lg:p-8 text-center hover:border-[#5865F2]/30 transition-all duration-500 group-hover:-translate-y-1">
                      <div className="flex justify-center mb-4">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#5865F2]/20 to-[#5865F2]/5 group-hover:from-[#5865F2]/30 group-hover:to-[#5865F2]/10 transition-all duration-500">
                          <stat.icon className="h-7 w-7 text-[#5865F2]" />
                        </div>
                      </div>
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium tracking-wide uppercase">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Benefits FAQ Section - Premium Accordion Design */}
      <BenefitsFAQSection />

      {/* Channel Preview Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Active Channels
              </h2>
              <p className="text-muted-foreground text-lg">
                Find your community within the community
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="relative">
              {/* Discord Window Mock */}
              <div className="bg-[#2f3136] rounded-2xl overflow-hidden border border-[#202225] shadow-2xl">
                {/* Window Header */}
                <div className="bg-[#202225] px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ed6a5e]" />
                    <div className="w-3 h-3 rounded-full bg-[#f4bf4f]" />
                    <div className="w-3 h-3 rounded-full bg-[#61c554]" />
                  </div>
                  <span className="ml-4 text-sm text-[#b9bbbe]">EditorsParadise</span>
                </div>
                
                {/* Channels */}
                <div className="p-4 space-y-1">
                  {channelPreviews.map((channel, index) => (
                    <div 
                      key={channel.name}
                      className="group flex items-center justify-between p-3 rounded-lg hover:bg-[#393c43] transition-colors cursor-pointer"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#8e9297] group-hover:text-[#dcddde] transition-colors font-medium">
                          {channel.name}
                        </span>
                        <span className="text-xs text-[#72767d] hidden sm:inline">
                          {channel.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-[#72767d]" />
                        <span className="text-xs text-[#72767d]">{channel.members}</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* More channels indicator */}
                  <div className="pt-2 text-center">
                    <span className="text-xs text-[#5865F2] font-medium">+ 50 more channels</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Testimonials - Elegant */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-[#5865F2]/5 via-background to-background" />
        <div className="absolute left-1/4 top-1/2 w-96 h-96 bg-[#5865F2]/10 rounded-full blur-[128px]" />

        <div className="relative mx-auto max-w-6xl">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/20 mb-6">
                <Heart className="h-4 w-4 text-[#5865F2]" />
                <span className="text-sm font-medium text-[#5865F2]">Community Love</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-5">
                What Members Say
              </h2>
              <p className="text-xl text-muted-foreground">
                Real stories from our community
              </p>
            </div>
          </Reveal>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Reveal key={index} delay={index * 100}>
                <div className="group relative h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/20 to-violet-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative h-full bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 hover:border-[#5865F2]/30 transition-all duration-500 group-hover:-translate-y-2">
                    {/* Rating Stars */}
                    <div className="flex gap-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-[#5865F2] text-[#5865F2]" />
                      ))}
                    </div>
                    
                    {/* Quote */}
                    <p className="text-foreground mb-8 leading-relaxed text-lg">
                      "{testimonial.quote}"
                    </p>
                    
                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5865F2] to-violet-600 flex items-center justify-center text-white font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.author}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA - Immersive */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Rich Background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#5865F2]/20 via-[#5865F2]/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(88,101,242,0.3),transparent_70%)]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#5865F2]/20 rounded-full blur-[128px]" />
        
        {/* Decorative Elements */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 opacity-20">
          <Trophy className="h-24 w-24 text-[#5865F2]" />
        </div>
        <div className="absolute right-10 top-1/3 opacity-20">
          <Sparkles className="h-20 w-20 text-violet-500" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/20 backdrop-blur-sm mb-8">
              <Zap className="h-4 w-4 text-[#5865F2]" />
              <span className="text-sm font-medium text-[#5865F2]">Join in seconds</span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Ready to{' '}
              <span className="bg-gradient-to-r from-[#5865F2] to-violet-400 bg-clip-text text-transparent">
                Level Up?
              </span>
            </h2>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Your next collaboration, client, or breakthrough idea is waiting. 
              Join the fastest-growing community of creative professionals.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <Button 
              size="lg" 
              className="group relative bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#3d44a8] text-white px-12 py-8 text-xl font-semibold rounded-2xl shadow-2xl shadow-[#5865F2]/40 hover:shadow-[#5865F2]/60 transition-all duration-500 hover:scale-105 overflow-hidden"
              asChild
            >
              <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <ExternalLink className="mr-3 h-6 w-6" />
                Join Discord Now
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </a>
            </Button>
          </Reveal>

          <Reveal delay={400}>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                100% Free
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                No Credit Card
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Instant Access
              </span>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
