import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

function AnimatedCounter({ target, suffix, isVisible }: { target: number; suffix: string; isVisible: boolean }) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);
  const targetRef = useRef(target);
  
  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    if (!isVisible || target === 0) return;
    
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

  const [stats, setStats] = useState([
    { label: 'Verified Creators', value: 0, suffix: '+' },
    { label: 'Premium Assets', value: 0, suffix: '+' },
    { label: 'Total Downloads', value: 0, suffix: '+' },
    { label: 'Happy Customers', value: 0, suffix: '+' },
  ]);

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase.rpc('get_home_stats');
      
      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      const statsData = data?.[0] || { verified_creators: 0, premium_products: 0, total_downloads: 0 };

      setStats([
        { label: 'Verified Creators', value: Number(statsData.verified_creators) || 0, suffix: '+' },
        { label: 'Premium Assets', value: Number(statsData.premium_products) || 0, suffix: '+' },
        { label: 'Total Downloads', value: Number(statsData.total_downloads) || 0, suffix: '+' },
        { label: 'Happy Customers', value: Math.floor(Number(statsData.total_downloads) * 0.7) || 0, suffix: '+' },
      ]);
    }

    fetchStats();
  }, []);

  return (
    <section ref={ref} className="py-16 sm:py-20 border-y border-border/50 bg-card/30">
      <div className="px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary mb-3">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} isVisible={isVisible} />
              </div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
