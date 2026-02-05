 import { useAITheme } from './AIThemeProvider';
 import type { BentoGridProps } from './types';
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
 
 interface Props {
   id: string;
   props: BentoGridProps;
 }
 
 export function BentoGridBlock({ props }: Props) {
   const theme = useAITheme();
   const { title, items = [] } = props;
 
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
           {items.map((item, index) => {
             const IconComponent = item.icon ? ICON_MAP[item.icon.toLowerCase()] : null;
             const spanClass = {
               normal: '',
               wide: 'md:col-span-2',
               tall: 'md:row-span-2',
             }[item.span || 'normal'];
 
             return (
               <div
                 key={item.id || index}
                 className={`group relative overflow-hidden transition-all hover:scale-[1.02] ${spanClass}`}
                 style={{
                   backgroundColor: 'var(--ai-muted)',
                   borderRadius: 'var(--ai-radius)',
                   padding: 'var(--ai-element-spacing)',
                   minHeight: item.span === 'tall' ? '280px' : '140px',
                 }}
               >
                 {item.image && (
                   <img
                     src={item.image}
                     alt=""
                     className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
                   />
                 )}
 
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