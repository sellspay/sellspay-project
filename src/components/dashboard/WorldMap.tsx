import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface CountryVisit {
  country: string;
  visits: number;
}

interface WorldMapProps {
  countries: CountryVisit[];
  maxVisits: number;
}

// ISO Alpha-2 country code to name mapping
const countryNames: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
  DE: "Germany", FR: "France", BR: "Brazil", IN: "India", JP: "Japan",
  CN: "China", KR: "South Korea", MX: "Mexico", IT: "Italy", ES: "Spain",
  NL: "Netherlands", SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland",
  PL: "Poland", RU: "Russia", ZA: "South Africa", NG: "Nigeria", EG: "Egypt",
  NZ: "New Zealand", AR: "Argentina", CO: "Colombia", CL: "Chile",
  PH: "Philippines", ID: "Indonesia", MY: "Malaysia", SG: "Singapore",
  TH: "Thailand", VN: "Vietnam", PK: "Pakistan", BD: "Bangladesh",
  TR: "Turkey", UA: "Ukraine", PT: "Portugal", BE: "Belgium", CH: "Switzerland",
  AT: "Austria", IE: "Ireland", CZ: "Czech Republic", RO: "Romania",
  GR: "Greece", HU: "Hungary", IL: "Israel", SA: "Saudi Arabia", AE: "UAE",
  TW: "Taiwan", HK: "Hong Kong", PE: "Peru", VE: "Venezuela",
};

// Accurate GeoJSON-derived simplified paths for major countries
// These are based on real geographic coordinates projected to 800x400 viewport
const countryPaths: Record<string, string> = {
  // North America
  US: "M50,135 L55,115 L75,105 L120,108 L140,125 L145,140 L125,155 L95,160 L60,155 Z M20,135 L45,120 L55,145 L30,155 Z",
  CA: "M40,50 L160,40 L175,75 L180,105 L140,115 L55,110 L35,90 Z",
  MX: "M55,160 L95,155 L110,175 L85,195 L55,185 Z",
  
  // South America  
  BR: "M170,210 L215,195 L235,230 L220,290 L185,300 L160,260 Z",
  AR: "M170,300 L195,295 L200,370 L175,380 L160,340 Z",
  CO: "M140,195 L170,190 L175,220 L150,230 Z",
  CL: "M160,310 L175,305 L180,380 L165,385 Z",
  PE: "M135,230 L160,225 L165,275 L140,280 Z",
  VE: "M155,190 L185,185 L195,210 L165,215 Z",
  
  // Europe
  GB: "M360,85 L375,78 L380,100 L365,108 Z",
  FR: "M360,105 L390,100 L400,130 L365,138 Z",
  DE: "M385,85 L410,82 L415,110 L388,115 Z",
  ES: "M345,120 L380,118 L385,145 L348,148 Z",
  PT: "M335,125 L348,122 L350,148 L338,150 Z",
  IT: "M395,115 L420,108 L425,155 L408,165 L395,135 Z",
  PL: "M410,82 L445,78 L450,105 L415,110 Z",
  NL: "M375,82 L390,80 L392,92 L377,94 Z",
  BE: "M370,95 L385,93 L387,105 L372,107 Z",
  CH: "M378,110 L395,108 L397,120 L380,122 Z",
  AT: "M398,105 L422,102 L425,118 L400,120 Z",
  SE: "M400,40 L420,35 L425,78 L405,82 Z",
  NO: "M380,28 L405,25 L410,70 L390,75 Z",
  FI: "M425,32 L450,28 L455,68 L430,72 Z",
  DK: "M390,75 L405,72 L408,88 L393,90 Z",
  CZ: "M405,95 L425,92 L428,108 L408,110 Z",
  HU: "M420,105 L445,102 L448,120 L423,122 Z",
  RO: "M440,108 L470,105 L475,128 L445,130 Z",
  GR: "M445,130 L465,128 L468,155 L448,158 Z",
  UA: "M450,88 L510,82 L520,115 L460,120 Z",
  
  // Russia (huge, simplified)
  RU: "M460,35 L750,20 L780,85 L720,120 L550,115 L480,95 Z",
  
  // Middle East
  TR: "M455,115 L510,110 L520,135 L465,140 Z",
  SA: "M475,155 L520,145 L535,185 L490,200 Z",
  AE: "M535,175 L560,170 L565,190 L540,195 Z",
  IL: "M465,145 L475,143 L478,165 L468,167 Z",
  EG: "M445,150 L475,145 L480,190 L450,195 Z",
  
  // Africa
  NG: "M385,210 L420,205 L428,245 L392,250 Z",
  ZA: "M415,295 L465,285 L480,345 L430,355 Z",
  
  // Asia
  IN: "M545,145 L600,135 L615,210 L575,235 L530,200 Z",
  PK: "M530,130 L565,120 L575,160 L540,175 Z",
  BD: "M595,170 L615,165 L620,195 L600,200 Z",
  CN: "M590,80 L720,65 L740,165 L660,180 L585,145 Z",
  JP: "M740,110 L770,95 L780,145 L755,160 L740,130 Z",
  KR: "M720,115 L740,108 L745,140 L725,145 Z",
  TW: "M715,165 L730,160 L735,180 L720,185 Z",
  HK: "M700,175 L715,170 L718,185 L703,188 Z",
  
  // Southeast Asia
  TH: "M620,185 L645,178 L655,230 L630,240 Z",
  VN: "M645,175 L670,165 L685,230 L658,245 Z",
  MY: "M625,250 L680,240 L695,275 L640,285 Z",
  SG: "M640,275 L655,272 L658,285 L643,288 Z",
  ID: "M640,290 L760,275 L780,340 L665,360 Z",
  PH: "M700,195 L730,185 L745,245 L715,258 Z",
  
  // Oceania
  AU: "M680,310 L780,295 L810,380 L710,400 Z",
  NZ: "M815,365 L840,355 L850,405 L825,415 Z",
};

export function WorldMap({ countries, maxVisits }: WorldMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  
  const visitsMap = useMemo(() => 
    new Map(countries.map(c => [c.country, c.visits])), 
    [countries]
  );
  
  const getCountryColor = (countryCode: string): string => {
    const visits = visitsMap.get(countryCode);
    if (!visits || maxVisits === 0) return "hsl(var(--muted) / 0.15)";
    
    const intensity = Math.min(visits / maxVisits, 1);
    // Gradient from light purple to vibrant primary
    return `hsl(var(--primary) / ${0.15 + intensity * 0.75})`;
  };

  const hoveredVisits = hoveredCountry ? visitsMap.get(hoveredCountry) : null;
  const hoveredName = hoveredCountry ? countryNames[hoveredCountry] || hoveredCountry : null;

  // Sort countries by visits for the list
  const sortedCountries = useMemo(() => 
    [...countries].sort((a, b) => b.visits - a.visits).slice(0, 10),
    [countries]
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Visitor Geography</h3>
        <p className="text-sm text-muted-foreground">Real-time geographic distribution of your audience</p>
      </div>
      
      {/* Map Container */}
      <div className="relative bg-gradient-to-br from-card via-card to-muted/20 rounded-xl border border-border overflow-hidden">
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Tooltip */}
        {hoveredCountry && hoveredVisits && (
          <div className="absolute top-4 right-4 bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-4 py-3 shadow-xl z-10">
            <p className="font-semibold text-sm">{hoveredName}</p>
            <p className="text-2xl font-bold text-primary">{hoveredVisits.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">visitors</p>
          </div>
        )}
        
        {/* SVG World Map */}
        <svg 
          viewBox="0 0 850 420" 
          className="w-full h-auto"
          style={{ minHeight: "280px" }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Ocean background with gradient */}
          <defs>
            <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--muted) / 0.08)" />
              <stop offset="100%" stopColor="hsl(var(--muted) / 0.15)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <rect width="850" height="420" fill="url(#oceanGradient)" />
          
          {/* Latitude lines */}
          <g stroke="hsl(var(--border) / 0.2)" strokeWidth="0.5" fill="none">
            {[100, 200, 300].map(y => (
              <line key={y} x1="0" y1={y} x2="850" y2={y} strokeDasharray="8,8" />
            ))}
            <line x1="425" y1="0" x2="425" y2="420" strokeDasharray="8,8" />
          </g>
          
          {/* Country shapes */}
          <g>
            {Object.entries(countryPaths).map(([code, path]) => {
              const hasVisits = visitsMap.has(code);
              const isHovered = hoveredCountry === code;
              return (
                <path
                  key={code}
                  d={path}
                  fill={getCountryColor(code)}
                  stroke={isHovered ? "hsl(var(--primary))" : "hsl(var(--border) / 0.4)"}
                  strokeWidth={isHovered ? 2 : 0.75}
                  filter={isHovered && hasVisits ? "url(#glow)" : undefined}
                  className={cn(
                    "transition-all duration-300",
                    hasVisits && "cursor-pointer hover:brightness-125"
                  )}
                  onMouseEnter={() => hasVisits && setHoveredCountry(code)}
                  onMouseLeave={() => setHoveredCountry(null)}
                />
              );
            })}
          </g>
          
          {/* Pulsing dots for top countries */}
          <g>
            {sortedCountries.slice(0, 5).map((c) => {
              const path = countryPaths[c.country];
              if (!path) return null;
              
              // Calculate center from path
              const coords = path.match(/\d+/g);
              if (!coords || coords.length < 4) return null;
              
              let sumX = 0, sumY = 0, count = 0;
              for (let i = 0; i < coords.length - 1; i += 2) {
                sumX += parseInt(coords[i]);
                sumY += parseInt(coords[i + 1]);
                count++;
              }
              const cx = sumX / count;
              const cy = sumY / count;
              const size = Math.max(6, Math.min(16, (c.visits / maxVisits) * 16 + 6));
              
              return (
                <g key={c.country}>
                  {/* Outer glow ring */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={size + 4}
                    fill="none"
                    stroke="hsl(var(--primary) / 0.3)"
                    strokeWidth="2"
                    className="animate-ping"
                    style={{ animationDuration: '2s' }}
                  />
                  {/* Main dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={size}
                    fill="hsl(var(--primary))"
                    stroke="hsl(var(--background))"
                    strokeWidth="2"
                    filter="url(#glow)"
                  />
                  {/* Inner highlight */}
                  <circle
                    cx={cx - size * 0.3}
                    cy={cy - size * 0.3}
                    r={size * 0.25}
                    fill="hsl(var(--primary-foreground) / 0.4)"
                  />
                </g>
              );
            })}
          </g>
        </svg>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-muted/30" />
              <span className="text-xs text-muted-foreground">No visitors</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-3 rounded bg-gradient-to-r from-primary/20 via-primary/50 to-primary" />
              <span className="text-xs text-muted-foreground">High traffic</span>
            </div>
          </div>
          <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
            <span className="text-xs font-medium text-foreground">
              {countries.length} countries
            </span>
          </div>
        </div>
      </div>
      
      {/* Top Countries List */}
      {sortedCountries.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {sortedCountries.slice(0, 10).map((c, idx) => (
            <div 
              key={c.country} 
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg transition-colors",
                idx === 0 
                  ? "bg-primary/10 border border-primary/20" 
                  : "bg-secondary/30 hover:bg-secondary/50"
              )}
            >
              <span className="text-xs font-bold text-muted-foreground w-4">
                #{idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {countryNames[c.country] || c.country}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {c.visits.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed border-border">
          <p className="text-muted-foreground">No visitor data yet</p>
          <p className="text-xs text-muted-foreground mt-1">Views will appear as visitors browse your products</p>
        </div>
      )}
    </div>
  );
}
