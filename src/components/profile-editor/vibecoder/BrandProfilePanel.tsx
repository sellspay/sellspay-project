 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Palette, Plus, X, Loader2 } from 'lucide-react';
 import { useBrandProfile } from './hooks/useBrandProfile';
 import { cn } from '@/lib/utils';
 
 interface BrandProfilePanelProps {
   profileId: string;
 }
 
 const PRESET_COLORS = [
   '#000000', '#FFFFFF', '#1a1a2e', '#16213e', '#0f3460',
   '#e94560', '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1',
   '#5f27cd', '#341f97', '#ee5a24', '#009432', '#0652DD',
 ];
 
 const PRESET_VIBES = [
   'minimal', 'premium', 'dark', 'light', 'neon', 'retro',
   'anime', 'cinematic', 'editorial', 'playful', 'brutalist',
   'organic', 'futuristic', 'vintage', 'clean', 'bold',
 ];
 
 export function BrandProfilePanel({ profileId }: BrandProfilePanelProps) {
   const {
     brandProfile,
     loading,
     addColor,
     removeColor,
     addVibeTag,
     removeVibeTag,
   } = useBrandProfile(profileId);
 
   const [newColor, setNewColor] = useState('#000000');
   const [customVibe, setCustomVibe] = useState('');
 
   if (loading) {
     return (
       <div className="flex items-center justify-center h-full">
         <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
       </div>
     );
   }
 
   const handleAddColor = () => {
     if (newColor && !brandProfile?.colorPalette.includes(newColor)) {
       addColor(newColor);
     }
   };
 
   const handleAddCustomVibe = () => {
     if (customVibe.trim()) {
       addVibeTag(customVibe.trim().toLowerCase());
       setCustomVibe('');
     }
   };
 
   return (
     <ScrollArea className="h-full">
       <div className="p-4 space-y-6">
         {/* Header */}
         <div className="flex items-center gap-2">
           <Palette className="w-5 h-5 text-primary" />
           <h2 className="font-semibold text-foreground">Brand Profile</h2>
         </div>
 
         <p className="text-sm text-muted-foreground">
           Configure your brand identity to help the AI generate consistent designs.
         </p>
 
         {/* Color Palette */}
         <div className="space-y-3">
           <Label className="text-sm font-medium">Color Palette</Label>
           
           {/* Current colors */}
           <div className="flex flex-wrap gap-2">
             {brandProfile?.colorPalette.map((color, index) => (
               <div
                 key={index}
                 className="relative group"
               >
                 <div
                   className="w-8 h-8 rounded-lg border border-border cursor-pointer"
                   style={{ backgroundColor: color }}
                   title={color}
                 />
                 <button
                   onClick={() => removeColor(index)}
                   className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                 >
                   <X className="w-3 h-3" />
                 </button>
               </div>
             ))}
             
             {/* Add color */}
             <div className="flex items-center gap-1">
               <input
                 type="color"
                 value={newColor}
                 onChange={(e) => setNewColor(e.target.value)}
                 className="w-8 h-8 rounded-lg cursor-pointer border border-border"
               />
               <Button
                 variant="outline"
                 size="icon"
                 onClick={handleAddColor}
                 className="w-8 h-8"
               >
                 <Plus className="w-4 h-4" />
               </Button>
             </div>
           </div>
 
           {/* Preset colors */}
           <div className="flex flex-wrap gap-1">
             {PRESET_COLORS.map((color) => (
               <button
                 key={color}
                 onClick={() => addColor(color)}
                 className={cn(
                   'w-6 h-6 rounded border border-border hover:scale-110 transition-transform',
                   brandProfile?.colorPalette.includes(color) && 'ring-2 ring-primary'
                 )}
                 style={{ backgroundColor: color }}
                 title={color}
               />
             ))}
           </div>
         </div>
 
         {/* Vibe Tags */}
         <div className="space-y-3">
           <Label className="text-sm font-medium">Vibe Tags</Label>
           
           {/* Current tags */}
           <div className="flex flex-wrap gap-2">
             {brandProfile?.vibeTags.map((tag) => (
               <Badge
                 key={tag}
                 variant="secondary"
                 className="flex items-center gap-1 pr-1"
               >
                 {tag}
                 <button
                   onClick={() => removeVibeTag(tag)}
                   className="ml-1 hover:text-destructive"
                 >
                   <X className="w-3 h-3" />
                 </button>
               </Badge>
             ))}
           </div>
 
           {/* Preset vibes */}
           <div className="flex flex-wrap gap-1">
             {PRESET_VIBES.filter(v => !brandProfile?.vibeTags.includes(v)).map((vibe) => (
               <Badge
                 key={vibe}
                 variant="outline"
                 className="cursor-pointer hover:bg-muted transition-colors"
                 onClick={() => addVibeTag(vibe)}
               >
                 + {vibe}
               </Badge>
             ))}
           </div>
 
           {/* Custom vibe input */}
           <div className="flex gap-2">
             <Input
               value={customVibe}
               onChange={(e) => setCustomVibe(e.target.value)}
               placeholder="Add custom vibe..."
               className="flex-1"
               onKeyDown={(e) => e.key === 'Enter' && handleAddCustomVibe()}
             />
             <Button
               variant="outline"
               size="icon"
               onClick={handleAddCustomVibe}
               disabled={!customVibe.trim()}
             >
               <Plus className="w-4 h-4" />
             </Button>
           </div>
         </div>
 
         {/* Info */}
         <div className="p-3 bg-muted/50 rounded-lg">
           <p className="text-xs text-muted-foreground">
             The AI will use your brand profile to generate consistent colors, styles, and messaging across all suggestions.
           </p>
         </div>
       </div>
     </ScrollArea>
   );
 }