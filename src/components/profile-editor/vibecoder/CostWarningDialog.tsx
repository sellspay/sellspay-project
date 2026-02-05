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
 import { Coins } from 'lucide-react';
 
 interface CostWarningDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   cost: number;
   balance: number;
   actionDescription: string;
   onConfirm: () => void;
 }
 
 export function CostWarningDialog({
   open,
   onOpenChange,
   cost,
   balance,
   actionDescription,
   onConfirm,
 }: CostWarningDialogProps) {
   const canAfford = balance >= cost;
 
   return (
     <AlertDialog open={open} onOpenChange={onOpenChange}>
       <AlertDialogContent>
         <AlertDialogHeader>
           <AlertDialogTitle className="flex items-center gap-2">
             <Coins className="w-5 h-5 text-primary" />
             Credit Cost
           </AlertDialogTitle>
           <AlertDialogDescription asChild>
             <div className="space-y-3">
               <p>{actionDescription}</p>
               
               <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                 <span className="text-sm text-foreground">Cost</span>
                 <span className="font-semibold text-foreground">{cost} credits</span>
               </div>
               
               <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                 <span className="text-sm text-foreground">Your balance</span>
                 <span className={`font-semibold ${canAfford ? 'text-foreground' : 'text-destructive'}`}>
                   {balance} credits
                 </span>
               </div>
 
               {!canAfford && (
                 <p className="text-sm text-destructive">
                   You don't have enough credits. Please top up to continue.
                 </p>
               )}
             </div>
           </AlertDialogDescription>
         </AlertDialogHeader>
         <AlertDialogFooter>
           <AlertDialogCancel>Cancel</AlertDialogCancel>
           {canAfford ? (
             <AlertDialogAction onClick={onConfirm}>
               Generate ({cost} credits)
             </AlertDialogAction>
           ) : (
             <AlertDialogAction asChild>
               <a href="/settings?tab=credits">Top Up Credits</a>
             </AlertDialogAction>
           )}
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
   );
 }