 import type { StatsProps } from './types';
 import { TrendingUp, Users, Package, DollarSign, type LucideProps } from 'lucide-react';
 
 const ICON_MAP: Record<string, React.FC<LucideProps>> = {
   trending: TrendingUp,
   users: Users,
   package: Package,
   dollar: DollarSign,
 };
 
 interface Props {
   id: string;
   props: StatsProps;
 }
 
 export function StatsBlock({ props }: Props) {
   const { items = [], layout = 'row' } = props;
 
   return (
     <section
       style={{
         backgroundColor: 'var(--ai-background)',
         padding: 'var(--ai-section-spacing) 2rem',
       }}
     >
       <div
         className={`max-w-5xl mx-auto ${
           layout === 'grid'
             ? 'grid grid-cols-2 md:grid-cols-4 gap-6'
             : 'flex flex-wrap justify-center gap-8 md:gap-16'
         }`}
       >
         {items.map((item, index) => {
           const IconComponent = item.icon ? ICON_MAP[item.icon.toLowerCase()] : null;
 
           return (
             <div
               key={item.id || index}
               className={`text-center ${layout === 'grid' ? 'p-4' : ''}`}
               style={
                 layout === 'grid'
                   ? {
                       backgroundColor: 'var(--ai-muted)',
                       borderRadius: 'var(--ai-radius)',
                     }
                   : undefined
               }
             >
               {IconComponent && (
                 <div
                   className="w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center"
                   style={{ backgroundColor: 'var(--ai-accent)' }}
                 >
                   <IconComponent
                     className="w-5 h-5 text-[var(--ai-accent-foreground)]"
                   />
                 </div>
               )}
 
               <div
                 className="text-3xl md:text-4xl font-bold"
                 style={{ color: 'var(--ai-foreground)' }}
               >
                 {item.value}
               </div>
 
               <div
                 className="text-sm mt-1"
                 style={{ color: 'var(--ai-muted-foreground)' }}
               >
                 {item.label}
               </div>
             </div>
           );
         })}
       </div>
     </section>
   );
 }