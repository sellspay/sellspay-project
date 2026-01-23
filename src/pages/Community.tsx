import { Users, MessageSquare, Calendar, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const communityFeatures = [
  {
    icon: MessageSquare,
    title: 'Discord Community',
    description: 'Join thousands of creators sharing tips, feedback, and collaborating on projects.',
    action: 'Join Discord',
    link: 'https://discord.gg/editorsparadise',
  },
  {
    icon: Calendar,
    title: 'Weekly Challenges',
    description: 'Participate in weekly editing challenges and showcase your skills.',
    action: 'View Challenges',
    link: '/challenges',
  },
  {
    icon: Trophy,
    title: 'Creator Spotlight',
    description: 'Get featured and recognized for your outstanding work and contributions.',
    action: 'Learn More',
    link: '/spotlight',
  },
  {
    icon: Users,
    title: 'Mentorship Program',
    description: 'Connect with experienced editors for guidance and career growth.',
    action: 'Apply Now',
    link: '/mentorship',
  },
];

export default function Community() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Join the Community
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with thousands of editors and creators. Share your work, get feedback, 
            and grow together in the largest editing community.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {communityFeatures.map((feature) => (
              <Card key={feature.title} className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    {feature.description}
                  </CardDescription>
                  <Button variant="outline" asChild>
                    <a href={feature.link}>{feature.action}</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground mt-1">Active Members</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground mt-1">Verified Creators</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary">1K+</div>
              <div className="text-sm text-muted-foreground mt-1">Products Sold</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground mt-1">Weekly Challenges</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
