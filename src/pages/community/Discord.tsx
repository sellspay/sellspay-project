import { ExternalLink, Headphones, Zap, Users, Calendar, Gift, MessageSquare, Star, Globe, CheckCircle, ArrowRight, ChevronDown, Heart } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const DISCORD_LINK = 'https://discord.gg/JSDMksAsHx';

const benefits = [
  { icon: Headphones, title: 'Priority Support', description: 'Get help directly from the team and community moderators with faster response times.' },
  { icon: Zap, title: 'Early Access', description: 'Be the first to know about new features, tools, and platform updates before anyone else.' },
  { icon: Users, title: 'Creator Network', description: 'Connect with fellow creators, collaborate on projects, and grow your audience together.' },
  { icon: Calendar, title: 'Weekly Events', description: 'Join exclusive challenges, AMAs with top creators, and interactive workshops.' },
  { icon: Gift, title: 'Exclusive Content', description: 'Access members-only tutorials, tips, and resources to level up your skills.' },
  { icon: MessageSquare, title: 'Feedback Channel', description: 'Shape the future of the platform by sharing your ideas and voting on features.' },
];

const stats = [
  { label: 'Active Members', value: '10,000+', icon: Users },
  { label: 'Messages Weekly', value: '50,000+', icon: MessageSquare },
  { label: 'Countries', value: '120+', icon: Globe },
  { label: 'Verified Creators', value: '500+', icon: CheckCircle },
];

const testimonials = [
  {
    quote: "The Discord community helped me grow from 0 to 10k followers in just 3 months. The networking opportunities are incredible!",
    author: "Alex Chen",
    role: "Motion Designer",
    avatar: "AC",
  },
  {
    quote: "I've learned more in this Discord than any paid course. The community is so supportive and the feedback is always constructive.",
    author: "Sarah Williams",
    role: "Video Editor",
    avatar: "SW",
  },
  {
    quote: "Got my first freelance client through the Discord. The creator network here is genuinely amazing.",
    author: "Marcus Johnson",
    role: "SFX Designer",
    avatar: "MJ",
  },
];

const channelPreviews = [
  { name: '# general', members: '8.2k', description: 'Main community chat' },
  { name: '# showcase', members: '5.1k', description: 'Share your work' },
  { name: '# collabs', members: '3.4k', description: 'Find collaborators' },
  { name: '# help', members: '6.8k', description: 'Get assistance' },
];

export default function Discord() {
  const [openBenefit, setOpenBenefit] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <section className="border-b border-border/40 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-12 sm:pt-16 pb-8 sm:pb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-[#5865F2]/10">
              <svg width="20" height="15" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4804 44.2898 53.5475 44.3433C53.9029 44.6363 54.2751 44.9293 54.6501 45.2082C54.7788 45.304 54.7704 45.5041 54.6277 45.5858C52.859 46.6197 51.0203 47.4931 49.0893 48.2228C48.9634 48.2707 48.9074 48.4172 48.969 48.5383C50.0349 50.6034 51.2523 52.57 52.5929 54.435C52.6489 54.5139 52.7496 54.5477 52.842 54.5195C58.6426 52.7249 64.5253 50.0174 70.5982 45.5576C70.6513 45.5182 70.6849 45.459 70.6905 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1099 30.1693C30.1099 34.1136 27.2805 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.8999 23.0133 53.7545 26.2532 53.7018 30.1693C53.7018 34.1136 50.8999 37.3253 47.3178 37.3253Z" fill="#5865F2"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-[#5865F2] tracking-wide uppercase">Discord</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
            Join 10,000+ Creators
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mb-6">
            Connect with the most active community of video editors, motion designers, and content creators.
          </p>
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              className="rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white"
              asChild
            >
              <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Join Discord
              </a>
            </Button>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              Free • Instant access
            </span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 border-b border-border/40">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl border border-border/30 bg-card/30">
                <stat.icon className="h-5 w-5 text-[#5865F2] mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Accordion */}
      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xl font-semibold text-foreground mb-6">Why Join?</h2>
          
          <div className="space-y-2">
            {benefits.map((benefit, index) => {
              const isOpen = openBenefit === index;
              const Icon = benefit.icon;
              
              return (
                <div key={benefit.title} className="border border-border/40 rounded-xl overflow-hidden bg-card/30">
                  <button
                    onClick={() => setOpenBenefit(isOpen ? null : index)}
                    className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-muted/20 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-[#5865F2]/10 shrink-0">
                      <Icon className="h-4 w-4 text-[#5865F2]" />
                    </div>
                    <span className="flex-1 font-medium text-foreground text-sm">{benefit.title}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <div className="px-5 pb-4 pl-14">
                        <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Channel Preview */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 border-t border-border/40">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xl font-semibold text-foreground mb-6">Active Channels</h2>
          
          <div className="bg-[#2f3136] rounded-xl overflow-hidden border border-[#202225]">
            <div className="bg-[#202225] px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ed6a5e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#f4bf4f]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#61c554]" />
              </div>
              <span className="ml-3 text-xs text-[#b9bbbe]">SellsPay</span>
            </div>
            
            <div className="p-3 space-y-0.5">
              {channelPreviews.map((channel) => (
                <div key={channel.name} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-[#393c43] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#8e9297] font-medium">{channel.name}</span>
                    <span className="text-xs text-[#72767d] hidden sm:inline">{channel.description}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#72767d]">
                    <Users className="h-3 w-3" />
                    {channel.members}
                  </div>
                </div>
              ))}
              <div className="pt-2 text-center">
                <span className="text-xs text-[#5865F2] font-medium">+ 50 more channels</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 border-t border-border/40">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-foreground mb-6">What Members Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="border border-border/40 rounded-xl p-5 bg-card/30">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-[#5865F2] text-[#5865F2]" />
                  ))}
                </div>
                <p className="text-sm text-foreground mb-4 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 flex items-center justify-center text-xs font-semibold text-[#5865F2]">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-border/40">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Join?</h2>
          <p className="text-muted-foreground mb-6">
            Your next collaboration, client, or breakthrough idea is waiting.
          </p>
          <Button
            className="rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white"
            asChild
          >
            <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Join Discord Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              100% Free
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              Instant Access
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
