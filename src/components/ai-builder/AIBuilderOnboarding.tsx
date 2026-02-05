 import { useState, useEffect } from 'react';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 import { Wand2 } from 'lucide-react';
 import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
 
 interface AIBuilderOnboardingProps {
   profileId: string;
   onConfirm: () => void;
   onCancel: () => void;
 }
 
 const STORAGE_KEY = 'ai-builder-onboarded';
 
 export function useAIBuilderOnboarding(profileId: string) {
   const [needsOnboarding, setNeedsOnboarding] = useState(false);
 
   useEffect(() => {
     const key = `${STORAGE_KEY}:${profileId}`;
     const hasOnboarded = localStorage.getItem(key) === 'true';
     setNeedsOnboarding(!hasOnboarded);
   }, [profileId]);
 
   const completeOnboarding = () => {
     const key = `${STORAGE_KEY}:${profileId}`;
     localStorage.setItem(key, 'true');
     setNeedsOnboarding(false);
   };
 
   return { needsOnboarding, completeOnboarding };
 }
 
 export function AIBuilderOnboarding({ profileId, onConfirm, onCancel }: AIBuilderOnboardingProps) {
   return (
     <AlertDialog open={true}>
       <AlertDialogContent className="max-w-md">
         <AlertDialogHeader className="text-center space-y-4">
           <div className="mx-auto relative">
             <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full scale-150" />
             <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-background via-muted/50 to-background border border-border/40 flex items-center justify-center shadow-xl mx-auto">
               <img src={sellspayLogo} alt="" className="w-10 h-10 object-contain" />
             </div>
           </div>
           <AlertDialogTitle className="text-xl">
             Create a brand-new storefront with AI
           </AlertDialogTitle>
           <AlertDialogDescription className="text-muted-foreground leading-relaxed">
             The AI Builder starts from a <strong className="text-foreground">blank canvas</strong> so it can design freely.
             <br />
             <br />
             Your existing profile layout will stay untouched.
           </AlertDialogDescription>
         </AlertDialogHeader>
         <AlertDialogFooter className="sm:justify-center pt-4">
           <AlertDialogCancel onClick={onCancel} className="sm:w-32">
             Cancel
           </AlertDialogCancel>
           <AlertDialogAction onClick={onConfirm} className="gap-2 sm:w-44">
             <Wand2 className="w-4 h-4" />
             Start with AI
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
   );
 }