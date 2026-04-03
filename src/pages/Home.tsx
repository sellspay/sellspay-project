import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import HeroSection from '@/components/home/HeroSection';
import SlidingBanner from '@/components/home/SlidingBanner';
import { LandingSmartTools } from '@/components/home/LandingSmartTools';
import { LandingEditingTools } from '@/components/home/LandingEditingTools';
import { LandingTestimonials } from '@/components/home/LandingTestimonials';
import { LandingFooterCta } from '@/components/home/LandingFooterCta';
import HomeFeed from './HomeFeed';

export default function Home() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'SellsPay';
  }, []);

  // Signed-in users see the feed
  if (user) {
    return <HomeFeed />;
  }

  // Guests see the landing page
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <SlidingBanner />
      <LandingSmartTools />
      <LandingEditingTools />
      <LandingTestimonials />
      <LandingFooterCta />
    </div>
  );
}
