 import { useState } from 'react';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
   DialogFooter,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Check, X, Plus, Minus, ArrowRight, Edit2 } from 'lucide-react';
 import { VibecoderOp } from './types';
 
 interface OperationPreviewProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   operations: VibecoderOp[];
   onApply: () => void;
   onCancel: () => void;
 }
 
 const OP_ICONS: Record<string, React.ReactNode> = {
   addSection: <Plus className="w-3 h-3 text-primary" />,
   removeSection: <Minus className="w-3 h-3 text-destructive" />,
   moveSection: <ArrowRight className="w-3 h-3 text-primary" />,
   updateSection: <Edit2 className="w-3 h-3 text-accent-foreground" />,
   updateTheme: <Edit2 className="w-3 h-3 text-muted-foreground" />,
   updateHeaderContent: <Edit2 className="w-3 h-3 text-primary" />,
   assignAssetToSlot: <Plus className="w-3 h-3 text-primary" />,
 };
 
 const OP_LABELS: Record<string, string> = {
   addSection: 'Add Section',
   removeSection: 'Remove Section',
   moveSection: 'Move Section',
   updateSection: 'Update Section',
   updateTheme: 'Update Theme',
   updateHeaderContent: 'Update Header',
   assignAssetToSlot: 'Assign Asset',
 };
 
 function getOperationDetails(op: VibecoderOp): string {
   switch (op.op) {
     case 'addSection':
       return `Add "${op.section?.section_type}" section`;
     case 'removeSection':
       return `Remove section ${op.sectionId}`;
     case 'moveSection':
       return `Move section ${op.sectionId} ${op.after ? `after ${op.after}` : 'to top'}`;
     case 'updateSection':
       const fields = Object.keys(op.patch || {}).join(', ');
       return `Update ${op.sectionId}: ${fields}`;
     case 'updateTheme':
       return `Set ${op.path} to ${JSON.stringify(op.value)}`;
     case 'updateHeaderContent':
       const headerFields = Object.keys(op.patch || {}).join(', ');
       return `Update header: ${headerFields}`;
     case 'assignAssetToSlot':
       return `Assign asset to ${op.slot}`;
     default:
       return 'Unknown operation';
   }
 }
 
 export function OperationPreview({
   open,
   onOpenChange,
   operations,
   onApply,
   onCancel,
 }: OperationPreviewProps) {
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-md">
         <DialogHeader>
           <DialogTitle>Preview Changes</DialogTitle>
           <DialogDescription>
             The AI has proposed {operations.length} change{operations.length !== 1 ? 's' : ''} to your storefront.
           </DialogDescription>
         </DialogHeader>
 
         <ScrollArea className="max-h-[300px]">
           <div className="space-y-2">
             {operations.map((op, index) => (
               <div
                 key={index}
                 className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
               >
                 <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border">
                   {OP_ICONS[op.op]}
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2">
                     <Badge variant="secondary" className="text-[10px]">
                       {OP_LABELS[op.op]}
                     </Badge>
                   </div>
                   <p className="text-sm text-muted-foreground mt-1 break-words">
                     {getOperationDetails(op)}
                   </p>
                 </div>
               </div>
             ))}
           </div>
         </ScrollArea>
 
         <DialogFooter>
           <Button variant="outline" onClick={onCancel}>
             <X className="w-4 h-4 mr-2" />
             Cancel
           </Button>
           <Button onClick={onApply}>
             <Check className="w-4 h-4 mr-2" />
             Apply All Changes
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }