 import { useAITheme } from './AIThemeProvider';
import { Sparkles, Zap, Shield, Star, Target, Rocket, Gift, Crown, type LucideProps } from 'lucide-react';
 
const ICON_MAP: Record<string, React.FC<LucideProps>> = {
   sparkles: Sparkles,
   zap: Zap,
   shield: Shield,
   star: Star,
   target: Target,
   rocket: Rocket,
   gift: Gift,
   crown: Crown,
 };
 
interface LegacyItem {
  id?: string;
  title?: string;
  text?: string;
  description?: string;
  icon?: string;
  span?: string;
  image?: string;
}

 interface Props {
   id: string;
  props: {
    title?: string;
    items?: LegacyItem[];
    style?: string;
    layout?: string;
  };
 }
 
 export function BentoGridBlock({ props }: Props) {
  useAITheme();
  const { title } = props;
  
  // Normalize items from legacy basic_list or new bento_grid format
  const rawItems = props.items || [];
  const items = rawItems.map((item: LegacyItem, i: number) => ({
    id: item.id || `item-${i}`,
    title: item.title || item.text || 'Feature',
    description: item.description || '',
    icon: item.icon,
    span: item.span as 'normal' | 'wide' | 'tall' | undefined,
  }));

  // If no items, show placeholder grid
  const displayItems = items.length > 0 ? items : [
    { id: '1', title: 'Premium Quality', description: 'High-quality assets for professionals', icon: 'star' },
    { id: '2', title: 'Fast Delivery', description: 'Instant download after purchase', icon: 'zap' },
    { id: '3', title: 'Secure Payment', description: 'Your transactions are protected', icon: 'shield' },
    { id: '4', title: 'Unique Content', description: 'Exclusive creator assets', icon: 'sparkles' },
  ];
 
   return (
     <section
       style={{
         backgroundColor: 'var(--ai-background)',
         padding: 'var(--ai-section-spacing) 2rem',
       }}
     >
       <div className="max-w-6xl mx-auto">
         {title && (
           <h2
             className="text-2xl md:text-3xl font-bold mb-8 text-center"
             style={{ color: 'var(--ai-foreground)' }}
           >
             {title}
           </h2>
         )}
 
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayItems.map((item, index) => {
             const IconComponent = item.icon ? ICON_MAP[item.icon.toLowerCase()] : null;
             const spanClass = {
               normal: '',
               wide: 'md:col-span-2',
               tall: 'md:row-span-2',
             }[item.span || 'normal'];
 
             return (
               <div
                key={item.id}
                 className={`group relative overflow-hidden transition-all hover:scale-[1.02] ${spanClass}`}
                 style={{
                   backgroundColor: 'var(--ai-muted)',
                   borderRadius: 'var(--ai-radius)',
                   padding: 'var(--ai-element-spacing)',
                   minHeight: item.span === 'tall' ? '280px' : '140px',
                 }}
               >
                 <div className="relative z-10 h-full flex flex-col justify-between">
                   {IconComponent && (
                     <div
                       className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                       style={{ backgroundColor: 'var(--ai-accent)', opacity: 0.9 }}
                     >
                      <IconComponent className="w-5 h-5 text-[var(--ai-accent-foreground)]" />
                     </div>
                   )}
 
                   <div>
                     <h3
                       className="font-semibold text-base mb-1"
                       style={{ color: 'var(--ai-foreground)' }}
                     >
                       {item.title}
                     </h3>
                     {item.description && (
                       <p
                         className="text-sm line-clamp-2"
                         style={{ color: 'var(--ai-muted-foreground)' }}
                       >
                         {item.description}
                       </p>
                     )}
                   </div>
                 </div>
               </div>
             );
           })}
         </div>
       </div>
     </section>
   );
 }