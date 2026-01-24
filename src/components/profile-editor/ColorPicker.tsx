import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

// HSV to RGB conversion (more intuitive for color pickers)
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h = h / 360;
  s = s / 100;
  v = v / 100;
  
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// RGB to HSV conversion
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  
  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

// Hex to RGB conversion
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

// RGB to Hex conversion
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Hex to HSV
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 0, s: 100, v: 100 };
  return rgbToHsv(rgb.r, rgb.g, rgb.b);
}

// HSV to Hex
function hsvToHex(h: number, s: number, v: number): string {
  const rgb = hsvToRgb(h, s, v);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

// Validate hex color
function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value || '#000000');
  const [hsv, setHsv] = useState(() => hexToHsv(value || '#FF0000'));
  const svPickerRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);
  const [isDraggingSV, setIsDraggingSV] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  // Sync internal state when external value changes
  useEffect(() => {
    if (value && isValidHex(value)) {
      setHexInput(value);
      setHsv(hexToHsv(value));
    }
  }, [value]);

  const updateColor = useCallback((newHsv: { h: number; s: number; v: number }) => {
    setHsv(newHsv);
    const hex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setHexInput(hex);
    onChange(hex);
  }, [onChange]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let hex = e.target.value;
    setHexInput(hex);
    
    // Add # if missing
    if (hex && !hex.startsWith('#')) {
      hex = '#' + hex;
    }
    
    if (isValidHex(hex)) {
      setHsv(hexToHsv(hex));
      onChange(hex);
    }
  };

  // Handle saturation/value picker interaction
  const handleSVInteraction = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!svPickerRef.current) return;
    
    const rect = svPickerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const s = Math.round((x / rect.width) * 100);
    const v = Math.round(100 - (y / rect.height) * 100);
    
    updateColor({ ...hsv, s, v });
  }, [hsv, updateColor]);

  // Handle hue slider interaction
  const handleHueInteraction = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!hueSliderRef.current) return;
    
    const rect = hueSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const h = Math.round((x / rect.width) * 360);
    
    updateColor({ ...hsv, h });
  }, [hsv, updateColor]);

  // Mouse event handlers for SV picker
  useEffect(() => {
    if (!isDraggingSV) return;
    
    const handleMouseMove = (e: MouseEvent) => handleSVInteraction(e);
    const handleMouseUp = () => setIsDraggingSV(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSV, handleSVInteraction]);

  // Mouse event handlers for Hue slider
  useEffect(() => {
    if (!isDraggingHue) return;
    
    const handleMouseMove = (e: MouseEvent) => handleHueInteraction(e);
    const handleMouseUp = () => setIsDraggingHue(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHue, handleHueInteraction]);

  // Preset colors for quick selection
  const presetColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FF6B6B', '#4ECDC4',
    '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
  ];

  // Get the pure hue color for the SV picker background
  const pureHueColor = hsvToHex(hsv.h, 100, 100);

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-3 w-full p-2 border rounded-md hover:bg-muted/50 transition-colors"
            type="button"
          >
            <div
              className="w-8 h-8 rounded-md border shadow-sm"
              style={{ backgroundColor: value || '#000000' }}
            />
            <span className="text-sm font-mono uppercase">{value || '#000000'}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="start">
          <div className="space-y-4">
            {/* Saturation/Value Picker */}
            <div
              ref={svPickerRef}
              className="relative w-full h-40 rounded-lg cursor-crosshair"
              style={{
                backgroundColor: pureHueColor,
              }}
              onMouseDown={(e) => {
                setIsDraggingSV(true);
                handleSVInteraction(e);
              }}
            >
              {/* White gradient (left to right) */}
              <div 
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(to right, white, transparent)',
                }}
              />
              {/* Black gradient (top to bottom) */}
              <div 
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(to bottom, transparent, black)',
                }}
              />
              {/* Picker indicator */}
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
                style={{
                  backgroundColor: value || '#000000',
                  left: `${hsv.s}%`,
                  top: `${100 - hsv.v}%`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            </div>

            {/* Hue Slider */}
            <div
              ref={hueSliderRef}
              className="relative w-full h-4 rounded-full cursor-pointer"
              style={{
                background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
              }}
              onMouseDown={(e) => {
                setIsDraggingHue(true);
                handleHueInteraction(e);
              }}
            >
              {/* Hue indicator */}
              <div
                className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
                style={{
                  backgroundColor: hsvToHex(hsv.h, 100, 100),
                  left: `${(hsv.h / 360) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            </div>

            {/* Hex Input */}
            <div>
              <Label className="text-xs text-muted-foreground">Hex Code</Label>
              <Input
                value={hexInput}
                onChange={handleHexChange}
                placeholder="#000000"
                className="font-mono uppercase"
              />
            </div>

            {/* Preset Colors */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Presets</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-md border shadow-sm hover:scale-110 transition-transform",
                      value?.toUpperCase() === color && "ring-2 ring-primary ring-offset-1"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setHexInput(color);
                      setHsv(hexToHsv(color));
                      onChange(color);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
