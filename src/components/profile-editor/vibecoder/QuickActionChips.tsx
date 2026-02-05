 import { forwardRef } from 'react';
 import { Button } from '@/components/ui/button';
 import { QUICK_ACTIONS } from './types';
 
 interface QuickActionChipsProps {
   onAction: (prompt: string) => void;
   disabled?: boolean;
 }
 
export const QuickActionChips = forwardRef<HTMLDivElement, QuickActionChipsProps>(
  function QuickActionChips({ onAction, disabled }, ref) {
   return (
    <div ref={ref} className="flex flex-wrap gap-2">
       {QUICK_ACTIONS.map((action) => (
         <Button
           key={action.id}
           variant="outline"
           size="sm"
           onClick={() => onAction(action.prompt)}
           disabled={disabled}
           className="text-xs h-7 px-3 bg-muted/50 hover:bg-muted border-border/50"
         >
           {action.label}
         </Button>
       ))}
     </div>
   );
  }
);