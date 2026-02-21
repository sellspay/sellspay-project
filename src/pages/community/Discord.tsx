import { ExternalLink, Headphones, Zap, Users, Calendar, Gift, MessageSquare, Star, Globe, CheckCircle, ArrowRight, ChevronDown } from 'lucide-react';
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
  { label: 'Members', value: '10,000+' },
  { label: 'Weekly Messages', value: '50,000+' },
  { label: 'Countries', value: '120+' },
  { label: 'Creators', value: '500+' },
];

const testimonials = [
  {
    quote: "The Discord community helped me grow from 0 to 10k followers in just 3 months. The networking opportunities are incredible!",
    author: "Alex Chen",
    role: "Motion Designer",
  },
  {
    quote: "I've learned more in this Discord than any paid course. The community is so supportive and the feedback is always constructive.",
    author: "Sarah Williams",
    role: "Video Editor",
  },
  {
    quote: "Got my first freelance client through the Discord. The creator network here is genuinely amazing.",
    author: "Marcus Johnson",
    role: "SFX Designer",
  },
];

const channelPreviews = [
  { name: 'general', description: 'Main community chat' },
  { name: 'showcase', description: 'Share your work' },
  { name: 'collabs', description: 'Find collaborators' },
  { name: 'help', description: 'Get assistance' },
];

export default function Discord() {
  const [openBenefit, setOpenBenefit] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#5865F2]/[0.04] to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-3xl px-6 pt-20 sm:pt-28 pb-14 sm:pb-20 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl border border-border/40 mb-6">
            <svg width="24" height="18" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4804 44.2898 53.5475 44.3433C53.9029 44.6363 54.2751 44.9293 54.6501 45.2082C54.7788 45.304 54.7704 45.5041 54.6277 45.5858C52.859 46.6197 51.0203 47.4931 49.0893 48.2228C48.9634 48.2707 48.9074 48.4172 48.969 48.5383C50.0349 50.6034 51.2523 52.57 52.5929 54.435C52.6489 54.5139 52.7496 54.5477 52.842 54.5195C58.6426 52.7249 64.5253 50.0174 70.5982 45.5576C70.6513 45.5182 70.6849 45.459 70.6905 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1099 30.1693C30.1099 34.1136 27.2805 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.8999 23.0133 53.7545 26.2532 53.7018 30.1693C53.7018 34.1136 50.8999 37.3253 47.3178 37.3253Z" fill="#5865F2"/>
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold text-foreground tracking-tight leading-[1.1] mb-4">
            Join the Community
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed mb-8">
            Connect with 10,000+ video editors, motion designers, and content creators.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              className="rounded-full h-10 px-7 text-sm font-medium bg-[#5865F2] hover:bg-[#4752C4] text-white"
              asChild
            >
              <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
                Join Discord
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Free · Instant access
            </span>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </section>

      {/* Stats */}
      <section className="py-12 sm:py-16 px-6">
        <div className="mx-auto max-w-2xl">
          <div className="grid grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">{stat.value}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-[0.1em] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent mx-6" />

      {/* Benefits */}
      <section className="py-12 sm:py-16 px-6">
        <div className="mx-auto max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-8 text-center">
            Why Join
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="border border-border/40 rounded-xl p-5 hover:border-border/60 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg border border-border/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-1">{benefit.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent mx-6" />

      {/* Channel Preview */}
      <section className="py-12 sm:py-16 px-6">
        <div className="mx-auto max-w-lg">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-8 text-center">
            Channels
          </p>

          <div className="border border-border/40 rounded-xl overflow-hidden">
            {channelPreviews.map((channel, index) => (
              <div
                key={channel.name}
                className={`flex items-center justify-between px-5 py-3.5 hover:bg-muted/[0.04] transition-colors ${
                  index !== channelPreviews.length - 1 ? 'border-b border-border/30' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">#</span>
                  <span className="text-sm font-medium text-foreground">{channel.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{channel.description}</span>
              </div>
            ))}
            <div className="px-5 py-3 bg-muted/[0.03] text-center">
              <span className="text-xs text-muted-foreground">+ 50 more channels</span>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent mx-6" />

      {/* Testimonials */}
      <section className="py-12 sm:py-16 px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-8 text-center">
            What Members Say
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <div key={i} className="border border-border/40 rounded-xl p-6">
                <p className="text-sm text-foreground/90 leading-relaxed mb-5 italic">
                  "{t.quote}"
                </p>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-24 px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent mb-16 sm:mb-24" />
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-3">
            Ready to Join?
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Your next collaboration, client, or breakthrough idea is waiting.
          </p>
          <Button
            className="rounded-full h-10 px-7 text-sm font-medium bg-[#5865F2] hover:bg-[#4752C4] text-white"
            asChild
          >
            <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
              Join Discord
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
