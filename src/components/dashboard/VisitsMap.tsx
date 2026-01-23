interface CountryVisit {
  country: string;
  visits: number;
}

interface VisitsMapProps {
  countries: CountryVisit[];
  maxVisits: number;
}

export function VisitsMap({ countries, maxVisits }: VisitsMapProps) {
  // Simple world map SVG with highlighted countries based on visits
  // This is a simplified placeholder - for a real implementation, you'd use a library like react-simple-maps
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Visits Map</h3>
        <p className="text-sm text-muted-foreground">The countries your visitors are based in</p>
      </div>
      
      {/* Simplified world map representation */}
      <div className="relative bg-card rounded-lg border border-border p-4">
        <svg viewBox="0 0 1000 500" className="w-full h-auto opacity-60">
          {/* Simplified continent shapes */}
          {/* North America */}
          <path 
            d="M150,80 L280,80 L300,150 L280,200 L200,250 L150,200 L120,150 Z" 
            fill={countries.some(c => ['US', 'CA', 'MX'].includes(c.country)) ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
            opacity={0.7}
          />
          {/* South America */}
          <path 
            d="M220,260 L280,260 L300,350 L280,450 L240,450 L200,380 Z" 
            fill={countries.some(c => ['BR', 'AR', 'CO'].includes(c.country)) ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
            opacity={0.5}
          />
          {/* Europe */}
          <path 
            d="M450,80 L550,70 L580,120 L550,160 L480,170 L450,130 Z" 
            fill={countries.some(c => ['GB', 'DE', 'FR', 'IT', 'ES'].includes(c.country)) ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
            opacity={0.5}
          />
          {/* Africa */}
          <path 
            d="M480,180 L560,180 L580,280 L540,380 L480,380 L460,280 Z" 
            fill={countries.some(c => ['ZA', 'NG', 'EG'].includes(c.country)) ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
            opacity={0.4}
          />
          {/* Asia */}
          <path 
            d="M600,60 L850,80 L880,200 L800,280 L650,250 L580,180 L600,100 Z" 
            fill={countries.some(c => ['CN', 'JP', 'IN', 'KR'].includes(c.country)) ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
            opacity={0.4}
          />
          {/* Australia */}
          <path 
            d="M780,320 L880,320 L900,400 L840,430 L780,400 Z" 
            fill={countries.some(c => ['AU', 'NZ'].includes(c.country)) ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
            opacity={0.4}
          />
        </svg>
        
        {/* Legend */}
        <div className="flex items-center gap-2 mt-4">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">1</span>
            <div className="w-20 h-2 bg-gradient-to-r from-primary/20 to-primary rounded" />
            <span className="text-xs text-muted-foreground">{maxVisits || 1}</span>
          </div>
        </div>
      </div>
      
      {/* Country list */}
      {countries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {countries.slice(0, 8).map((c) => (
            <div key={c.country} className="flex justify-between">
              <span className="text-muted-foreground">{c.country}</span>
              <span className="font-medium">{c.visits}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
