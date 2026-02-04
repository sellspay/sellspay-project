import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Reveal } from './Reveal';

interface StatItem {
  label: string;
  value: number;
  suffix: string;
}

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

  const [stats, setStats] = useState<StatItem[]>([
    { label: 'Creators', value: 0, suffix: '+' },
    { label: 'Products', value: 0, suffix: '+' },
    { label: 'Downloads', value: 0, suffix: '+' },
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
        { label: 'Creators', value: Number(statsData.verified_creators) || 0, suffix: '+' },
        { label: 'Products', value: Number(statsData.premium_products) || 0, suffix: '+' },
        { label: 'Downloads', value: Number(statsData.total_downloads) || 0, suffix: '+' },
      ]);
    }

    fetchStats();
  }, []);

  return (
    <Reveal>
      <section ref={ref} className="py-16 sm:py-20 border-y border-border/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="grid grid-cols-3 gap-8 sm:gap-12">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-2">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} isVisible={isVisible} />
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
