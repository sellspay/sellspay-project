import { Link } from 'react-router-dom';

export function FloatingCtaBar() {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <Link
        to="/login"
        className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 border border-border/30 backdrop-blur-md shadow-lg hover:border-primary/40 transition-all"
      >
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          Create smarter, build faster
        </span>
        <span className="inline-flex h-8 px-5 items-center justify-center rounded-full bg-foreground text-background text-sm font-semibold whitespace-nowrap">
          Try online for free
        </span>
      </Link>
    </div>
  );
}
