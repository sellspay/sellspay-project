import { Briefcase, DollarSign, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const benefits = [
  {
    icon: Briefcase,
    title: 'Post Your Project',
    description: 'Describe your project requirements and budget. Get proposals from qualified editors within hours.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Pay securely through our platform. Funds are released only when you approve the work.',
  },
  {
    icon: Zap,
    title: 'Fast Turnaround',
    description: 'Our editors are committed to delivering quality work on time, every time.',
  },
  {
    icon: DollarSign,
    title: 'Fair Pricing',
    description: 'Get competitive rates from skilled editors. No hidden fees or surprises.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Create Your Brief',
    description: 'Tell us about your project, timeline, and budget.',
  },
  {
    step: '02',
    title: 'Receive Proposals',
    description: 'Qualified editors will submit their proposals and portfolios.',
  },
  {
    step: '03',
    title: 'Choose Your Editor',
    description: 'Review proposals, chat with editors, and select the best fit.',
  },
  {
    step: '04',
    title: 'Get Your Project Done',
    description: 'Collaborate, review drafts, and approve the final delivery.',
  },
];

export default function WorkWithEditors() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Work with Professional Editors
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Connect with talented video editors for your projects. From YouTube videos 
            to commercial productions, find the perfect editor for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8">
              Post a Project
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Browse Editors
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-5xl font-bold text-primary/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Why Choose EditorsParadise?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="bg-card/50 border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Start Your Project?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of creators who trust EditorsParadise for their editing needs.
          </p>
          <Button size="lg" className="text-lg px-8">
            Get Started for Free
          </Button>
        </div>
      </section>
    </div>
  );
}
