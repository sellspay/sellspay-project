import { Sparkles, LayoutTemplate, ShoppingCart, Globe } from "lucide-react";

interface EmptyCanvasStateProps {
  onCreateProject: () => void;
}

/**
 * Empty Canvas State - shows when NO project is active
 * 
 * This is the "Fresh Boot" experience: no Sandpack, no code preview,
 * just a clean starting point inviting users to describe their vision.
 */
export function EmptyCanvasState({ onCreateProject }: EmptyCanvasStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">
      {/* Glowing Icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150" />
        <div className="relative p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
          <Sparkles className="w-12 h-12 text-primary" strokeWidth={1.5} />
        </div>
      </div>

      {/* Headline */}
      <h2 className="text-3xl font-bold tracking-tight text-foreground">
        What are we building today?
      </h2>

      {/* Subtext */}
      <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
        I'm ready to act as your engineering team. Describe your vision, 
        and I'll handle the code, design, and deployment.
      </p>

      {/* Quick Starters */}
      <div className="flex flex-wrap justify-center gap-3 mt-10">
        <StarterCard icon={LayoutTemplate} label="Portfolio" />
        <StarterCard icon={ShoppingCart} label="Store" />
        <StarterCard icon={Globe} label="Landing Page" />
      </div>

      {/* Create Project Button */}
      <button
        type="button"
        onClick={onCreateProject}
        className="mt-10 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
      >
        <Sparkles className="w-4 h-4" />
        Start a new project
      </button>
    </div>
  );
}

function StarterCard({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-default">
      <Icon className="w-4 h-4" />
      {label}
    </div>
  );
}
