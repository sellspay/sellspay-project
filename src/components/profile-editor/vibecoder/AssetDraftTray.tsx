 import { Button } from '@/components/ui/button';
 import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
 import { X, Check, RefreshCw, ImagePlus, Loader2 } from 'lucide-react';
 import { useGeneratedAssets } from './hooks/useGeneratedAssets';
 import { cn } from '@/lib/utils';
 
 interface AssetDraftTrayProps {
   profileId: string;
   onApplyAsset: (assetId: string, assetUrl: string, type: string) => void;
   onClose: () => void;
 }
 
 export function AssetDraftTray({ profileId, onApplyAsset, onClose }: AssetDraftTrayProps) {
   const { assets, loading, generating, discardAsset, applyAsset } = useGeneratedAssets(profileId);
 
   if (assets.length === 0 && !loading && !generating) {
     return null;
   }
 
   const handleApply = async (assetId: string, assetUrl: string, type: string) => {
     await applyAsset(assetId);
     onApplyAsset(assetId, assetUrl, type);
   };
 
   return (
     <div className="border-t border-border bg-card/50 backdrop-blur-sm">
       <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
         <div>
           <h3 className="text-sm font-medium text-foreground">Generated Assets (Drafts)</h3>
           <p className="text-xs text-muted-foreground">Select an asset to apply. Nothing changes until you apply.</p>
         </div>
         <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
           <X className="w-4 h-4" />
         </Button>
       </div>
 
       <ScrollArea className="w-full">
         <div className="flex gap-4 p-4">
           {loading ? (
             <div className="flex items-center justify-center w-full py-4">
               <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
             </div>
           ) : (
             <>
               {assets.map((asset) => (
                 <div
                   key={asset.id}
                   className="relative group flex-shrink-0"
                 >
                   <div
                     className={cn(
                       'w-40 rounded-lg overflow-hidden border border-border',
                       asset.type === 'banner' ? 'aspect-[21/9]' : 'aspect-square'
                     )}
                   >
                     <img
                       src={asset.url}
                       alt={asset.prompt}
                       className="w-full h-full object-cover"
                     />
                   </div>
 
                   {/* Hover actions */}
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-lg">
                     <Button
                       size="sm"
                       onClick={() => handleApply(asset.id, asset.url, asset.type)}
                       className="h-7 text-xs"
                     >
                       <Check className="w-3 h-3 mr-1" />
                       Use as {asset.type}
                     </Button>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => discardAsset(asset.id)}
                       className="h-7 text-xs text-white hover:text-white hover:bg-white/20"
                     >
                       <X className="w-3 h-3 mr-1" />
                       Discard
                     </Button>
                   </div>
 
                   {/* Type badge */}
                   <div className="absolute top-1 left-1">
                     <span className="text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                       {asset.type}
                     </span>
                   </div>
                 </div>
               ))}
 
               {generating && (
                 <div className="w-40 aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center flex-shrink-0">
                   <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                 </div>
               )}
 
               {/* Generate more button */}
               <div className="w-40 aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center flex-shrink-0 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                 <ImagePlus className="w-6 h-6 text-muted-foreground mb-2" />
                 <span className="text-xs text-muted-foreground">Generate</span>
               </div>
             </>
           )}
         </div>
         <ScrollBar orientation="horizontal" />
       </ScrollArea>
     </div>
   );
 }