import { Sparkles, LayoutTemplate, ShoppingCart, Globe, Palette, FileText, ArrowRight } from "lucide-react";

/**
 * Empty Canvas State - Premium "Fresh Boot" experience
 * 
 * This is the zero-state UI when no project is active.
 * It shows a beautiful aspirational canvas that directs
 * users to the chat input — NO buttons to click here.
 */
export function EmptyCanvasState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center bg-gradient-to-br from-background via-background to-muted/30">
      {/* Glowing Icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150" />
        <div className="relative p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-xl">
          <Sparkles className="w-12 h-12 text-primary" strokeWidth={1.5} />
        </div>
      </div>

      {/* Headline */}
      <h2 className="text-3xl font-bold tracking-tight text-foreground">
        What do you want to build today?
      </h2>

      {/* Subtext */}
      <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
        I'm your AI engineering team. Describe your vision in the chat, 
        and I'll handle the code, design, and deployment.
      </p>

      {/* Inspiration Cards - Non-interactive visual cues */}
      <div className="flex flex-wrap justify-center gap-3 mt-10">
        <InspirationCard icon={LayoutTemplate} label="Portfolio" />
        <InspirationCard icon={ShoppingCart} label="Store" />
        <InspirationCard icon={Globe} label="SaaS Landing" />
        <InspirationCard icon={Palette} label="Dashboard" />
        <InspirationCard icon={FileText} label="Blog" />
      </div>

      {/* CTA directing to chat */}
      <div className="mt-12 flex items-center gap-2 text-sm text-muted-foreground">
        <span>Just type your idea in the chat to begin</span>
        <ArrowRight className="w-4 h-4 animate-pulse" />
      </div>
    </div>
  );
}

function InspirationCard({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-sm text-muted-foreground cursor-default select-none">
      <Icon className="w-4 h-4" />
      {label}
    </div>
  );
}
