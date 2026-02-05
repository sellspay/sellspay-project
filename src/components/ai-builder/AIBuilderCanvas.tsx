 import { useState, useEffect, useCallback } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { ArrowLeft, Eye, Undo2, Loader2 } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { AIBuilderChat } from './AIBuilderChat';
 import { AIBuilderPreview } from './AIBuilderPreview';
 import { toast } from 'sonner';
 import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
 
 interface AIBuilderCanvasProps {
   profileId: string;
 }
 
 interface AILayout {
   sections: any[];
   theme: Record<string, any>;
   header: Record<string, any>;
 }
 
 export function AIBuilderCanvas({ profileId }: AIBuilderCanvasProps) {
   const navigate = useNavigate();
   const [layout, setLayout] = useState<AILayout>({ sections: [], theme: {}, header: {} });
   const [isPublished, setIsPublished] = useState(false);
   const [loading, setLoading] = useState(true);
   const [publishing, setPublishing] = useState(false);
   const [history, setHistory] = useState<AILayout[]>([]);
 
   // Load existing AI layout
   useEffect(() => {
     const loadLayout = async () => {
       const { data } = await supabase
         .from('ai_storefront_layouts')
         .select('*')
         .eq('profile_id', profileId)
         .maybeSingle();
 
       if (data) {
         const parsed = data.layout_json as unknown as AILayout;
         setLayout(parsed);
         setIsPublished(data.is_published);
       }
       setLoading(false);
     };
 
     loadLayout();
   }, [profileId]);
 
   // Save layout changes
   const saveLayout = useCallback(async (newLayout: AILayout) => {
     setLayout(newLayout);
     
     await supabase
       .from('ai_storefront_layouts')
       .upsert({
         profile_id: profileId,
         layout_json: newLayout as any,
         updated_at: new Date().toISOString(),
       }, { onConflict: 'profile_id' });
   }, [profileId]);
 
   // Push to history for undo
   const pushHistory = useCallback((state: AILayout) => {
     setHistory(prev => [...prev.slice(-19), state]);
   }, []);
 
   // Undo last change
   const handleUndo = useCallback(() => {
     if (history.length === 0) return;
     const previous = history[history.length - 1];
     setHistory(prev => prev.slice(0, -1));
     saveLayout(previous);
     toast.success('Reverted changes');
   }, [history, saveLayout]);
 
   // Publish the AI layout
   const handlePublish = async () => {
     setPublishing(true);
     try {
       // Update layout to published
       await supabase
         .from('ai_storefront_layouts')
         .update({ is_published: true })
         .eq('profile_id', profileId);
 
       // Set profile to use AI mode
       await supabase
         .from('profiles')
         .update({ active_storefront_mode: 'ai' })
         .eq('id', profileId);
 
       setIsPublished(true);
       toast.success('Store published! Your AI layout is now live.');
     } catch (error) {
       toast.error('Failed to publish');
     } finally {
       setPublishing(false);
     }
   };
 
   if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   const isEmpty = layout.sections.length === 0;
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <header className="flex items-center justify-between px-6 py-3 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
         <div className="flex items-center gap-4">
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={() => navigate('/profile')}
             className="gap-2 text-muted-foreground hover:text-foreground"
           >
             <ArrowLeft className="w-4 h-4" />
             Exit
           </Button>
           <div className="flex items-center gap-2">
             <img src={sellspayLogo} alt="SellsPay" className="w-6 h-6 object-contain" />
             <span className="font-semibold">AI Builder</span>
             {isPublished && (
             <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full border border-primary/30">
                 Live
               </span>
             )}
           </div>
         </div>
 
         <div className="flex items-center gap-2">
           {history.length > 0 && (
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={handleUndo}
               className="gap-1.5 text-muted-foreground"
             >
               <Undo2 className="w-4 h-4" />
               Undo
             </Button>
           )}
           <Button
             size="sm"
             onClick={handlePublish}
             disabled={isEmpty || publishing}
             className="gap-2"
           >
             {publishing ? (
               <Loader2 className="w-4 h-4 animate-spin" />
             ) : (
               <Eye className="w-4 h-4" />
             )}
             {isPublished ? 'Update' : 'Publish'}
           </Button>
         </div>
       </header>
 
       {/* Main content - split view */}
       <div className="flex-1 flex min-h-0">
         {/* Preview panel */}
         <div className="flex-1 border-r border-border/30 bg-muted/20 overflow-hidden">
           <AIBuilderPreview layout={layout} isEmpty={isEmpty} />
         </div>
 
         {/* Chat panel */}
         <div className="w-[480px] shrink-0 flex flex-col bg-background">
           <AIBuilderChat
             profileId={profileId}
             layout={layout}
             onLayoutChange={(newLayout) => {
               pushHistory(layout);
               saveLayout(newLayout);
             }}
             onUndo={handleUndo}
             canUndo={history.length > 0}
           />
         </div>
       </div>
     </div>
   );
 }