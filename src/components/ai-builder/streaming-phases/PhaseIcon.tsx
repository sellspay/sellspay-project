import { cn } from '@/lib/utils';

interface PhaseIconProps {
  active: boolean;
  activeClass: string;
  inactiveClass?: string;
  activeIcon: React.ReactNode;
  doneIcon: React.ReactNode;
}

export function PhaseIcon({ active, activeClass, inactiveClass = "bg-muted/50 border-border/50", activeIcon, doneIcon }: PhaseIconProps) {
  return (
    <div className={cn(
      "w-7 h-7 rounded-full flex items-center justify-center border",
      active ? activeClass : inactiveClass
    )}>
      {active ? activeIcon : doneIcon}
    </div>
  );
}
