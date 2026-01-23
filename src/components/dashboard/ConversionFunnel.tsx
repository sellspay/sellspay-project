import { ArrowRight } from 'lucide-react';

interface ConversionFunnelProps {
  views: number;
  startedCheckout: number;
  completedCheckout: number;
}

export function ConversionFunnel({ views, startedCheckout, completedCheckout }: ConversionFunnelProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Conversion Rate</h3>
      
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <span className="font-medium">{views} views</span>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{startedCheckout} started checkout</span>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{completedCheckout} completed checkout</span>
      </div>
    </div>
  );
}
