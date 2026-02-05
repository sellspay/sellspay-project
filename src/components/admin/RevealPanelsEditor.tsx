 import { useState, useEffect, useRef } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Loader2, Upload, Trash2, Image, Video, Layers } from 'lucide-react';
 
 interface PanelMedia {
   url: string | null;
   type: 'image' | 'video';
 }
 
 interface PanelConfig {
   label: string;
   media: PanelMedia;
 }
 
 const PANEL_LABELS = [
   'Building Made Simple',
   'Sell Products',
   'Audio Made Simple',
   'Generate Videos',
   'Generate Images',
   'All in One'
 ];
 
 const BUCKET = 'site-assets';
 const MAX_FILE_SIZE_MB = 100; // 100MB per card
 const UPLOAD_TIMEOUT_MS = 120000; // 2 minutes timeout for large files
 
 export function RevealPanelsEditor() {
   const [loading, setLoading] = useState(true);
   const [uploading, setUploading] = useState<number | null>(null);
   const [panels, setPanels] = useState<PanelConfig[]>([]);
   const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
 
   useEffect(() => {
     fetchPanels();
   }, []);
 
   const fetchPanels = async () => {
     try {
       const { data, error } = await supabase
         .from('site_content')
         .select(`
           reveal_panel_1_media_url,
           reveal_panel_1_media_type,
           reveal_panel_2_media_url,
           reveal_panel_2_media_type,
           reveal_panel_3_media_url,
           reveal_panel_3_media_type,
           reveal_panel_4_media_url,
           reveal_panel_4_media_type,
           reveal_panel_5_media_url,
           reveal_panel_5_media_type,
           reveal_panel_6_media_url,
           reveal_panel_6_media_type
         `)
         .eq('id', 'main')
         .single();
 
       if (error) throw error;
 
       const panelData: PanelConfig[] = [];
       for (let i = 1; i <= 6; i++) {
         const urlKey = `reveal_panel_${i}_media_url` as keyof typeof data;
         const typeKey = `reveal_panel_${i}_media_type` as keyof typeof data;
         panelData.push({
           label: PANEL_LABELS[i - 1],
           media: {
             url: data[urlKey] as string | null,
             type: (data[typeKey] as 'image' | 'video') || 'image'
           }
         });
       }
 
       setPanels(panelData);
     } catch (error) {
       console.error('Failed to fetch panel data:', error);
       toast.error('Failed to load panel data');
     } finally {
       setLoading(false);
     }
   };
 
   const uploadFile = async (file: File, folder: string): Promise<string | null> => {
     const fileSizeMB = file.size / (1024 * 1024);
     if (fileSizeMB > MAX_FILE_SIZE_MB) {
       toast.error(`File too large (${fileSizeMB.toFixed(1)}MB). Max size is ${MAX_FILE_SIZE_MB}MB.`);
       return null;
     }
 
     const fileExt = file.name.split('.').pop();
     const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
 
     toast.info(`Uploading ${file.name} (${fileSizeMB.toFixed(1)}MB)...`);
 
     const uploadPromise = supabase.storage.from(BUCKET).upload(fileName, file, {
       cacheControl: '3600',
       upsert: false
     });
 
     const timeoutPromise = new Promise<{ error: Error }>((_, reject) => {
       setTimeout(() => {
         reject(new Error(`Upload timed out after ${UPLOAD_TIMEOUT_MS / 1000} seconds.`));
       }, UPLOAD_TIMEOUT_MS);
     });
 
     try {
       const result = await Promise.race([uploadPromise, timeoutPromise]);
 
       if ('error' in result && result.error) {
         console.error('Upload error:', result.error);
         toast.error(result.error.message || 'Failed to upload file');
         return null;
       }
 
       const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
       return publicUrl;
     } catch (error: any) {
       console.error('Upload failed:', error);
       toast.error(error.message || 'Upload failed. Please try again.');
       return null;
     }
   };
 
   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, panelIndex: number) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     const isVideo = file.type.startsWith('video/');
     const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
     const folder = `reveal-panels/panel-${panelIndex + 1}`;
 
     setUploading(panelIndex);
 
     try {
       const url = await uploadFile(file, folder);
 
       if (url) {
         // Update local state
         const updatedPanels = [...panels];
         updatedPanels[panelIndex] = {
           ...updatedPanels[panelIndex],
           media: { url, type: mediaType }
         };
         setPanels(updatedPanels);
 
         // Persist to database immediately
         const panelNum = panelIndex + 1;
         const updateData: Record<string, string> = {
           [`reveal_panel_${panelNum}_media_url`]: url,
           [`reveal_panel_${panelNum}_media_type`]: mediaType
         };
 
         const { error } = await supabase
           .from('site_content')
           .update(updateData)
           .eq('id', 'main');
 
         if (error) throw error;
 
         toast.success(`Panel ${panelNum} media uploaded and saved!`);
       }
     } catch (error: any) {
       console.error('Upload error:', error);
       toast.error('Failed to save panel media');
     } finally {
       setUploading(null);
       if (fileInputRefs.current[panelIndex]) {
         fileInputRefs.current[panelIndex]!.value = '';
       }
     }
   };
 
   const handleRemoveMedia = async (panelIndex: number) => {
     try {
       const panelNum = panelIndex + 1;
       const updateData: Record<string, string | null> = {
         [`reveal_panel_${panelNum}_media_url`]: null,
         [`reveal_panel_${panelNum}_media_type`]: 'image'
       };
 
       const { error } = await supabase
         .from('site_content')
         .update(updateData)
         .eq('id', 'main');
 
       if (error) throw error;
 
       // Update local state
       const updatedPanels = [...panels];
       updatedPanels[panelIndex] = {
         ...updatedPanels[panelIndex],
         media: { url: null, type: 'image' }
       };
       setPanels(updatedPanels);
 
       toast.success(`Panel ${panelNum} media removed`);
     } catch (error) {
       console.error('Failed to remove media:', error);
       toast.error('Failed to remove media');
     }
   };
 
   if (loading) {
     return (
       <div className="flex items-center justify-center py-16">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       <div className="flex items-center gap-3">
         <Layers className="h-6 w-6 text-primary" />
         <div>
           <h3 className="text-xl font-bold">Reveal Panel Cards</h3>
           <p className="text-sm text-muted-foreground">
             Upload images or videos (max 100MB each) for the 6 scrolling deck cards
           </p>
         </div>
       </div>
 
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {panels.map((panel, idx) => (
           <Card key={idx} className="overflow-hidden">
             <CardHeader className="pb-3">
               <CardTitle className="text-base flex items-center gap-2">
                 <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                   {idx + 1}
                 </span>
                 {panel.label}
               </CardTitle>
               <CardDescription className="text-xs">
                 {panel.media.url ? (
                   <span className="flex items-center gap-1">
                     {panel.media.type === 'video' ? <Video className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                     {panel.media.type}
                   </span>
                 ) : (
                   'No media uploaded'
                 )}
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-3">
               {/* Preview */}
               <div className="aspect-video bg-muted rounded-lg overflow-hidden relative border">
                 {panel.media.url ? (
                   panel.media.type === 'video' ? (
                     <video
                       src={panel.media.url}
                       className="w-full h-full object-cover"
                       muted
                       loop
                       autoPlay
                       playsInline
                     />
                   ) : (
                     <img
                       src={panel.media.url}
                       alt={`Panel ${idx + 1}`}
                       className="w-full h-full object-cover"
                     />
                   )
                 ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                     <Image className="h-8 w-8 opacity-30" />
                     <span className="text-xs">No media</span>
                   </div>
                 )}
 
                 {uploading === idx && (
                   <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
                   </div>
                 )}
               </div>
 
               {/* Actions */}
               <div className="flex gap-2">
                 <input
                   ref={(el) => { fileInputRefs.current[idx] = el; }}
                   type="file"
                   accept="image/*,video/*"
                   className="hidden"
                   onChange={(e) => handleFileUpload(e, idx)}
                 />
                 <Button
                   variant="outline"
                   size="sm"
                   className="flex-1"
                   onClick={() => fileInputRefs.current[idx]?.click()}
                   disabled={uploading !== null}
                 >
                   <Upload className="h-3.5 w-3.5 mr-1.5" />
                   {panel.media.url ? 'Replace' : 'Upload'}
                 </Button>
                 {panel.media.url && (
                   <Button
                     variant="destructive"
                     size="sm"
                     onClick={() => handleRemoveMedia(idx)}
                     disabled={uploading !== null}
                   >
                     <Trash2 className="h-3.5 w-3.5" />
                   </Button>
                 )}
               </div>
             </CardContent>
           </Card>
         ))}
       </div>
 
       <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
         <strong>Tips:</strong>
         <ul className="list-disc list-inside mt-1 space-y-1">
           <li>Changes are saved automatically when you upload or remove media</li>
           <li>Recommended aspect ratio: 16:10 for best results</li>
           <li>Videos will autoplay muted and loop</li>
           <li>Max file size: 100MB per panel</li>
         </ul>
       </div>
     </div>
   );
 }