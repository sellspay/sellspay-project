import { useState } from "react";
import { cn } from "@/lib/utils";

interface CountryVisit {
  country: string;
  visits: number;
}

interface VisitsMapProps {
  countries: CountryVisit[];
  maxVisits: number;
}

// Country name mapping for display
const countryNames: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  BR: "Brazil",
  IN: "India",
  JP: "Japan",
  CN: "China",
  KR: "South Korea",
  MX: "Mexico",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  RU: "Russia",
  ZA: "South Africa",
  NG: "Nigeria",
  EG: "Egypt",
  NZ: "New Zealand",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  PH: "Philippines",
  ID: "Indonesia",
  MY: "Malaysia",
  SG: "Singapore",
  TH: "Thailand",
  VN: "Vietnam",
  PK: "Pakistan",
  BD: "Bangladesh",
  TR: "Turkey",
  UA: "Ukraine",
  PT: "Portugal",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  IE: "Ireland",
};

// Simplified world map paths - major countries with clean boundaries
const worldMapPaths: Record<string, string> = {
  US: "M45,115 L55,100 L95,100 L115,110 L115,130 L100,145 L60,145 L45,130 Z",
  CA: "M50,50 L150,50 L155,95 L50,95 Z",
  MX: "M55,145 L95,145 L95,175 L65,175 Z",
  BR: "M175,190 L220,175 L235,210 L220,255 L180,255 L165,220 Z",
  AR: "M180,255 L200,255 L195,310 L175,310 Z",
  CO: "M150,180 L175,175 L175,200 L155,205 Z",
  GB: "M365,85 L375,80 L378,95 L368,100 Z",
  FR: "M365,100 L385,98 L390,120 L370,125 Z",
  DE: "M385,85 L405,85 L408,110 L385,110 Z",
  ES: "M350,115 L375,115 L375,135 L350,135 Z",
  PT: "M345,115 L352,115 L352,135 L345,135 Z",
  IT: "M395,110 L410,105 L415,135 L400,145 L395,125 Z",
  PL: "M410,85 L435,85 L435,100 L410,100 Z",
  SE: "M395,45 L410,45 L412,80 L395,80 Z",
  NO: "M380,35 L395,35 L400,75 L385,75 Z",
  FI: "M420,35 L435,35 L438,65 L420,65 Z",
  RU: "M450,35 L650,35 L650,100 L500,110 L450,90 Z",
  UA: "M430,90 L470,85 L475,105 L435,110 Z",
  TR: "M450,110 L495,105 L500,125 L455,128 Z",
  EG: "M430,145 L455,140 L460,175 L435,175 Z",
  NG: "M390,190 L415,185 L420,210 L395,215 Z",
  ZA: "M420,265 L455,260 L460,300 L425,305 Z",
  IN: "M545,140 L590,130 L600,190 L560,210 L535,185 Z",
  PK: "M530,125 L555,115 L560,145 L540,155 Z",
  BD: "M580,155 L595,150 L598,170 L582,172 Z",
  CN: "M580,85 L680,75 L690,155 L620,165 L575,130 Z",
  JP: "M700,105 L720,95 L725,135 L708,140 Z",
  KR: "M685,110 L698,105 L700,130 L687,132 Z",
  TH: "M600,175 L620,170 L625,205 L605,210 Z",
  VN: "M620,165 L635,158 L640,200 L625,205 Z",
  MY: "M605,215 L640,210 L645,228 L610,230 Z",
  SG: "M615,230 L625,228 L626,235 L616,236 Z",
  ID: "M610,235 L700,225 L705,260 L615,265 Z",
  PH: "M660,175 L680,168 L685,210 L665,215 Z",
  AU: "M640,275 L720,265 L735,330 L660,340 Z",
  NZ: "M745,320 L760,315 L765,345 L750,348 Z",
};

export function VisitsMap({ countries, maxVisits }: VisitsMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  
  // Create a map of country code to visits for quick lookup
  const visitsMap = new Map(countries.map(c => [c.country, c.visits]));
  
  // Calculate color intensity based on visits
  const getCountryColor = (countryCode: string): string => {
    const visits = visitsMap.get(countryCode);
    if (!visits || maxVisits === 0) return "hsl(var(--muted) / 0.3)";
    
    const intensity = Math.min(visits / maxVisits, 1);
    // Use primary color with varying opacity
    return `hsl(var(--primary) / ${0.2 + intensity * 0.7})`;
  };

  const hoveredVisits = hoveredCountry ? visitsMap.get(hoveredCountry) : null;
  const hoveredName = hoveredCountry ? countryNames[hoveredCountry] || hoveredCountry : null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Visitor Map</h3>
        <p className="text-sm text-muted-foreground">See where your audience is from around the world</p>
      </div>
      
      {/* Map Container */}
      <div className="relative bg-card rounded-xl border border-border p-4 overflow-hidden">
        {/* Tooltip */}
        {hoveredCountry && hoveredVisits && (
          <div className="absolute top-4 right-4 bg-popover border border-border rounded-lg px-3 py-2 shadow-lg z-10">
            <p className="font-medium text-sm">{hoveredName}</p>
            <p className="text-xs text-muted-foreground">{hoveredVisits.toLocaleString()} visits</p>
          </div>
        )}
        
        {/* SVG World Map */}
        <svg 
          viewBox="0 0 800 400" 
          className="w-full h-auto"
          style={{ minHeight: "200px" }}
        >
          {/* Background ocean */}
          <rect width="800" height="400" fill="hsl(var(--muted) / 0.1)" rx="8" />
          
          {/* Grid lines for reference */}
          <g stroke="hsl(var(--border) / 0.3)" strokeWidth="0.5" fill="none">
            <line x1="0" y1="200" x2="800" y2="200" strokeDasharray="4,4" />
            <line x1="400" y1="0" x2="400" y2="400" strokeDasharray="4,4" />
          </g>
          
          {/* Country shapes */}
          <g>
            {Object.entries(worldMapPaths).map(([code, path]) => {
              const hasVisits = visitsMap.has(code);
              return (
                <path
                  key={code}
                  d={path}
                  fill={getCountryColor(code)}
                  stroke={hoveredCountry === code ? "hsl(var(--primary))" : "hsl(var(--border) / 0.5)"}
                  strokeWidth={hoveredCountry === code ? 2 : 0.5}
                  className={cn(
                    "transition-all duration-200",
                    hasVisits && "cursor-pointer hover:brightness-110"
                  )}
                  onMouseEnter={() => hasVisits && setHoveredCountry(code)}
                  onMouseLeave={() => setHoveredCountry(null)}
                />
              );
            })}
          </g>
          
          {/* Visitor dots for countries with visits */}
          <g>
            {countries.slice(0, 10).map((c) => {
              const path = worldMapPaths[c.country];
              if (!path) return null;
              
              // Extract center from path (rough approximation)
              const coords = path.match(/[ML]\s*(\d+),(\d+)/g);
              if (!coords || coords.length < 2) return null;
              
              let sumX = 0, sumY = 0;
              coords.forEach(coord => {
                const [, x, y] = coord.match(/(\d+),(\d+)/) || [];
                sumX += parseInt(x);
                sumY += parseInt(y);
              });
              const centerX = sumX / coords.length;
              const centerY = sumY / coords.length;
              
              const size = Math.max(4, Math.min(12, (c.visits / maxVisits) * 12 + 4));
              
              return (
                <circle
                  key={c.country}
                  cx={centerX}
                  cy={centerY}
                  r={size}
                  fill="hsl(var(--primary))"
                  stroke="hsl(var(--background))"
                  strokeWidth="2"
                  className="animate-pulse"
                  style={{ animationDuration: `${2 + Math.random()}s` }}
                />
              );
            })}
          </g>
        </svg>
        
        {/* Legend */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted/30" />
              <span className="text-xs text-muted-foreground">No data</span>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <div className="w-12 h-3 rounded bg-gradient-to-r from-primary/20 to-primary" />
              <span className="text-xs text-muted-foreground">1 — {maxVisits || 1} visits</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {countries.length} countries
          </span>
        </div>
      </div>
      
      {/* Country list */}
      {countries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {countries.slice(0, 8).map((c) => (
            <div 
              key={c.country} 
              className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getCountryColor(c.country) }}
                />
                <span className="text-sm font-medium">
                  {countryNames[c.country] || c.country}
                </span>
              </div>
              <span className="text-sm text-muted-foreground font-mono">
                {c.visits.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {countries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No visitor data yet</p>
        </div>
      )}
    </div>
  );
}
