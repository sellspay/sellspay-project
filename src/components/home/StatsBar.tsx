import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Users, Package, UserCheck, Download, Store } from 'lucide-react';
import { Reveal } from './Reveal';

interface StatItem {
  label: string;
  value: number;
  suffix: string;
  icon: React.ReactNode;
}

function AnimatedCounter({ target, suffix, isVisible }: { target: number; suffix: string; isVisible: boolean }) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);
  const targetRef = useRef(target);
  
  // Keep track of current target for animation
  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    // Wait for both visibility AND valid target data
    if (!isVisible || target === 0) return;
    
    // If already animated, just update to new target
    if (hasAnimated.current) {
      setCount(target);
      return;
    }
    
    hasAnimated.current = true;

    const duration = 2000;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * targetRef.current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isVisible, target]);

  return (
    <span className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function StatsBar() {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.3,
    triggerOnce: true,
  });

  const [stats, setStats] = useState<StatItem[]>([
    { label: 'Verified Creators', value: 0, suffix: '+', icon: <UserCheck className="h-5 w-5" /> },
    { label: 'Verified Sellers', value: 0, suffix: '+', icon: <Store className="h-5 w-5" /> },
    { label: 'Premium Products', value: 0, suffix: '+', icon: <Package className="h-5 w-5" /> },
    { label: 'Community Members', value: 0, suffix: '+', icon: <Users className="h-5 w-5" /> },
    { label: 'Total Downloads', value: 0, suffix: '+', icon: <Download className="h-5 w-5" /> },
  ]);

  useEffect(() => {
    async function fetchStats() {
      // Use security definer RPC to get accurate counts (bypasses RLS)
      const { data, error } = await supabase.rpc('get_home_stats');
      
      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      const statsData = data?.[0] || { verified_creators: 0, verified_sellers: 0, premium_products: 0, community_members: 0, total_downloads: 0 };

      setStats([
        { label: 'Verified Creators', value: Number(statsData.verified_creators) || 0, suffix: '+', icon: <UserCheck className="h-5 w-5" /> },
        { label: 'Verified Sellers', value: Number(statsData.verified_sellers) || 0, suffix: '+', icon: <Store className="h-5 w-5" /> },
        { label: 'Premium Products', value: Number(statsData.premium_products) || 0, suffix: '+', icon: <Package className="h-5 w-5" /> },
        { label: 'Community Members', value: Number(statsData.community_members) || 0, suffix: '+', icon: <Users className="h-5 w-5" /> },
        { label: 'Total Downloads', value: Number(statsData.total_downloads) || 0, suffix: '+', icon: <Download className="h-5 w-5" /> },
      ]);
    }

    fetchStats();
  }, []);

  return (
    <Reveal>
      <section ref={ref} className="py-12 sm:py-16 border-y border-border/50 bg-gradient-to-b from-background via-card/20 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Mobile: First row of 3, then row of 2 centered */}
          <div className="md:hidden flex flex-col gap-4">
            {/* First row - 3 items */}
            <div className="grid grid-cols-3 gap-3">
              {stats.slice(0, 3).map((stat, index) => (
                <StatCard key={stat.label} stat={stat} index={index} isVisible={isVisible} compact />
              ))}
            </div>
            {/* Second row - 2 items centered */}
            <div className="flex justify-center gap-3">
              {stats.slice(3, 5).map((stat, index) => (
                <div key={stat.label} className="w-[calc(33.333%-4px)]">
                  <StatCard stat={stat} index={index + 3} isVisible={isVisible} compact />
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop: 5 columns */}
          <div className="hidden md:grid md:grid-cols-5 gap-6 lg:gap-10">
            {stats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} isVisible={isVisible} />
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

// Extracted stat card component
function StatCard({ stat, index, isVisible, compact = false }: { stat: StatItem; index: number; isVisible: boolean; compact?: boolean }) {
  return (
    <div
      className={`group relative flex flex-col items-center text-center gap-2 sm:gap-4 ${compact ? 'p-3' : 'p-6'} rounded-2xl transition-all duration-500 hover:bg-card/40 hover:shadow-xl hover:shadow-primary/5 cursor-default`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Icon container with premium styling */}
      <div className={`relative ${compact ? 'p-2.5' : 'p-4'} rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 group-hover:border-primary/40 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-500`}>
        <div className={`text-primary group-hover:text-primary group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)] transition-all duration-300 ${compact ? '[&>svg]:h-4 [&>svg]:w-4' : ''}`}>
          {stat.icon}
        </div>
      </div>
      
      <div className="relative">
        <div className={`${compact ? 'text-xl' : 'text-4xl lg:text-5xl'} font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent transition-all duration-500`}>
          <AnimatedCounter target={stat.value} suffix={stat.suffix} isVisible={isVisible} />
        </div>
        <div className={`${compact ? 'text-[10px]' : 'text-sm'} text-muted-foreground mt-1 sm:mt-2 group-hover:text-foreground/80 transition-colors duration-300 font-medium tracking-wide uppercase`}>
          {stat.label}
        </div>
      </div>
    </div>
  );
}
