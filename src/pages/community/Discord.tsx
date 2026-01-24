import { ExternalLink, Headphones, Zap, Users, Calendar, Gift, MessageSquare, Star, Globe, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const DISCORD_LINK = 'https://discord.gg/xQAzE4bWgu';

const benefits = [
  {
    icon: Headphones,
    title: 'Priority Support',
    description: 'Get help directly from the team and community moderators with faster response times.',
  },
  {
    icon: Zap,
    title: 'Early Access',
    description: 'Be the first to know about new features, tools, and platform updates before anyone else.',
  },
  {
    icon: Users,
    title: 'Creator Network',
    description: 'Connect with fellow creators, collaborate on projects, and grow your audience together.',
  },
  {
    icon: Calendar,
    title: 'Weekly Events',
    description: 'Join exclusive challenges, AMAs with top creators, and interactive workshops.',
  },
  {
    icon: Gift,
    title: 'Exclusive Content',
    description: 'Access members-only tutorials, tips, and resources to level up your skills.',
  },
  {
    icon: MessageSquare,
    title: 'Feedback Channel',
    description: 'Shape the future of the platform by sharing your ideas and voting on features.',
  },
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

export default function Discord() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/20 via-background to-[#5865F2]/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#5865F2]/30 via-transparent to-transparent" />
        
        <div className="relative mx-auto max-w-4xl text-center">
          {/* Discord Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-[#5865F2]/40 rounded-full scale-150" />
              <div className="relative bg-[#5865F2] rounded-2xl p-6">
                <svg width="80" height="80" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4804 44.2898 53.5475 44.3433C53.9029 44.6363 54.2751 44.9293 54.6501 45.2082C54.7788 45.304 54.7704 45.5041 54.6277 45.5858C52.859 46.6197 51.0203 47.4931 49.0893 48.2228C48.9634 48.2707 48.9074 48.4172 48.969 48.5383C50.0349 50.6034 51.2523 52.57 52.5929 54.435C52.6489 54.5139 52.7496 54.5477 52.842 54.5195C58.6426 52.7249 64.5253 50.0174 70.5982 45.5576C70.6513 45.5182 70.6849 45.459 70.6905 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1099 30.1693C30.1099 34.1136 27.2805 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.8999 23.0133 53.7545 26.2532 53.7018 30.1693C53.7018 34.1136 50.8999 37.3253 47.3178 37.3253Z" fill="white"/>
                </svg>
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Join <span className="text-[#5865F2]">10,000+</span> Creators
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Connect with the most active community of video editors, motion designers, and content creators. 
            Get help, share your work, and grow together.
          </p>
          
          <Button 
            size="lg" 
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-[#5865F2]/25 hover:shadow-[#5865F2]/40 transition-all"
            asChild
          >
            <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-5 w-5" />
              Join Our Discord
            </a>
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-border/40 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-xl bg-[#5865F2]/10">
                    <stat.icon className="h-6 w-6 text-[#5865F2]" />
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Join Our Community?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              More than just a chat server — it's your creative home base.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="bg-card/50 border-border/50 hover:border-[#5865F2]/50 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-[#5865F2]/10 group-hover:bg-[#5865F2]/20 transition-colors">
                      <benefit.icon className="h-6 w-6 text-[#5865F2]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What Members Say
            </h2>
            <p className="text-muted-foreground text-lg">
              Hear from creators who've transformed their journey with our community.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-card border-border/50 relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="absolute top-4 right-4 text-[#5865F2]/20">
                    <Star className="h-8 w-8 fill-current" />
                  </div>
                  <p className="text-foreground mb-6 leading-relaxed relative z-10">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#5865F2]/10 via-transparent to-transparent" />
        
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Ready to Join?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Become part of the fastest-growing community of creative professionals.
            Your next collaboration, client, or breakthrough idea is waiting.
          </p>
          
          <Button 
            size="lg" 
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-10 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-[#5865F2]/25 hover:shadow-[#5865F2]/40 transition-all"
            asChild
          >
            <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-5 w-5" />
              Join Discord Now
            </a>
          </Button>
          
          <p className="text-sm text-muted-foreground mt-6">
            Free to join • No credit card required • Instant access
          </p>
        </div>
      </section>
    </div>
  );
}
