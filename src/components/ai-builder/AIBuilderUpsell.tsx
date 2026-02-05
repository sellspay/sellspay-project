 import { useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { Crown, Wand2, Lock } from 'lucide-react';
 import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
 
 /**
  * Locked AI Builder button shown to non-premium users on their profile.
  */
 export function AIBuilderLockedButton() {
   const navigate = useNavigate();
 
   return (
     <Button
       variant="outline"
       onClick={() => navigate('/ai-builder')}
       className="gap-2 border-primary/30 text-primary hover:bg-primary/10 relative overflow-hidden group"
     >
       <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
       <Wand2 className="w-4 h-4" />
       <span>Create with AI</span>
       <Lock className="w-3 h-3 text-muted-foreground" />
     </Button>
   );
 }
 
 /**
  * Inline upsell prompt shown in empty sections or profile editor.
  */
 export function AIBuilderInlineUpsell({ onDismiss }: { onDismiss?: () => void }) {
   const navigate = useNavigate();
 
   return (
     <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20 rounded-xl p-6 text-center space-y-4">
       <div className="flex justify-center">
         <div className="relative">
           <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full scale-150" />
           <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-background to-muted border border-border/40 flex items-center justify-center">
             <img src={sellspayLogo} alt="" className="w-7 h-7 object-contain" />
           </div>
         </div>
       </div>
 
       <div className="space-y-2">
         <h4 className="font-semibold text-foreground">Design your entire storefront with AI</h4>
         <p className="text-sm text-muted-foreground">
           Start from a blank canvas. No limits. No templates.
         </p>
       </div>
 
       <Button onClick={() => navigate('/ai-builder')} className="gap-2">
         <Crown className="w-4 h-4" />
         Start AI Builder
       </Button>
     </div>
   );
 }
 
 /**
  * Small banner upsell for the profile page.
  */
 export function AIBuilderBannerUpsell() {
   const navigate = useNavigate();
 
   return (
     <div className="bg-gradient-to-r from-primary/5 to-accent/5 border-y border-primary/10 py-3 px-4">
       <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
         <div className="flex items-center gap-3 text-sm">
           <Wand2 className="w-4 h-4 text-primary" />
           <span className="text-muted-foreground">
             Want to design this with AI instead?
           </span>
         </div>
         <Button 
           variant="ghost" 
           size="sm" 
           onClick={() => navigate('/ai-builder')}
           className="text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
         >
           Try AI Builder
           <Crown className="w-3 h-3" />
         </Button>
       </div>
     </div>
   );
 }