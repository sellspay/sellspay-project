import React from "react";

interface CreditSegmentBarProps {
  rollover: number;
  monthly: number;
  bonus: number;
  total: number;
  maxCredits: number;
  showLegend?: boolean;
  planLabel?: string;
}

export function CreditSegmentBar({
  rollover,
  monthly,
  bonus,
  total,
  maxCredits,
  showLegend = true,
  planLabel,
}: CreditSegmentBarProps) {
  const safeMax = Math.max(maxCredits, total, 1);
  
  // Each segment as % of bar
  const rolloverPct = (rollover / safeMax) * 100;
  const monthlyPct = (monthly / safeMax) * 100;
  const bonusPct = (bonus / safeMax) * 100;

  return (
    <div className="space-y-1.5">
      {/* Bar */}
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden flex">
        {rolloverPct > 0 && (
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${rolloverPct}%`,
              background: 'linear-gradient(90deg, hsl(217 91% 60%), hsl(217 91% 53%))',
              borderRadius: monthlyPct === 0 && bonusPct === 0 ? '9999px' : '9999px 0 0 9999px',
            }}
          />
        )}
        {monthlyPct > 0 && (
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${monthlyPct}%`,
              background: 'linear-gradient(90deg, hsl(217 91% 45%), hsl(217 91% 38%))',
              borderRadius: rolloverPct === 0 && bonusPct === 0 ? '9999px' : rolloverPct === 0 ? '9999px 0 0 9999px' : bonusPct === 0 ? '0 9999px 9999px 0' : '0',
            }}
          />
        )}
        {bonusPct > 0 && (
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${bonusPct}%`,
              background: 'linear-gradient(90deg, hsl(263 70% 50%), hsl(263 67% 42%))',
              borderRadius: rolloverPct === 0 && monthlyPct === 0 ? '9999px' : '0 9999px 9999px 0',
            }}
          />
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {rollover > 0 && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'hsl(217 91% 60%)' }} />
              Rollover ({rollover})
            </p>
          )}
          {monthly > 0 && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'hsl(217 91% 42%)' }} />
              Monthly ({monthly})
            </p>
          )}
          {bonus > 0 && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'hsl(263 70% 50%)' }} />
              Bonus ({bonus})
            </p>
          )}
          {total === 0 && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              No credits remaining
            </p>
          )}
        </div>
      )}
    </div>
  );
}
