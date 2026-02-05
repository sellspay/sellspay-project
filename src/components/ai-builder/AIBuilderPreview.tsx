import { useMemo } from 'react';
 import { Wand2 } from 'lucide-react';
import { AiRenderer, convertLegacySectionsToBlocks, type AILayout, type AITheme } from './blocks';
 
 interface AIBuilderPreviewProps {
   layout: {
     sections: any[];
     theme: Record<string, any>;
     header: Record<string, any>;
   };
   isEmpty: boolean;
 }
 
 export function AIBuilderPreview({ layout, isEmpty }: AIBuilderPreviewProps) {
  // Convert legacy format to new AILayout format
  const aiLayout: AILayout = useMemo(() => {
    // If theme already has proper structure, use it; otherwise default
    const theme: AITheme = {
      mode: layout.theme?.mode || 'dark',
      accent: layout.theme?.accent || '262 83% 58%',
      radius: layout.theme?.radius ?? 16,
      spacing: layout.theme?.spacing || 'balanced',
      font: layout.theme?.font || 'inter',
    };

    // Convert sections to blocks
    const blocks = convertLegacySectionsToBlocks(layout.sections);

    return { theme, blocks };
  }, [layout]);
 
   if (isEmpty) {
     return (
       <div className="h-full flex items-center justify-center">
         <div className="text-center space-y-6 max-w-md px-8">
           {/* Decorative canvas */}
           <div className="relative mx-auto w-32 h-32">
             <div className="absolute inset-0 border-2 border-dashed border-border/50 rounded-3xl" />
             <div className="absolute inset-4 border border-dashed border-border/30 rounded-2xl" />
             <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                 <Wand2 className="w-6 h-6 text-muted-foreground/50" />
               </div>
             </div>
           </div>
           
           <div className="space-y-2">
             <h3 className="text-lg font-medium text-muted-foreground">Your Canvas Awaits</h3>
             <p className="text-sm text-muted-foreground/60">
               Start with "Build My Store" or describe your vision in the chat.
             </p>
           </div>
         </div>
       </div>
     );
   }
 
   return (
    <div className="h-full overflow-y-auto">
      <AiRenderer layout={aiLayout} />
     </div>
   );
 }