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

// HSL to Hex conversion
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Hex to HSL conversion
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 100, l: 50 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Validate hex color
function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value || '#000000');
  const [hsl, setHsl] = useState(() => hexToHsl(value || '#000000'));
  const wheelRef = useRef<HTMLDivElement>(null);
  const slRef = useRef<HTMLDivElement>(null);
  const [isDraggingWheel, setIsDraggingWheel] = useState(false);
  const [isDraggingSL, setIsDraggingSL] = useState(false);

  // Sync internal state when external value changes
  useEffect(() => {
    if (value && isValidHex(value)) {
      setHexInput(value);
      setHsl(hexToHsl(value));
    }
  }, [value]);

  const updateColor = useCallback((newHsl: { h: number; s: number; l: number }) => {
    setHsl(newHsl);
    const hex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
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
      setHsl(hexToHsl(hex));
      onChange(hex);
    }
  };

  // Handle hue wheel interaction
  const handleWheelInteraction = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!wheelRef.current) return;
    
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    
    updateColor({ ...hsl, h: Math.round(angle) });
  }, [hsl, updateColor]);

  // Handle saturation/lightness interaction
  const handleSLInteraction = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!slRef.current) return;
    
    const rect = slRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const s = Math.round((x / rect.width) * 100);
    const l = Math.round(100 - (y / rect.height) * 100);
    
    updateColor({ ...hsl, s, l });
  }, [hsl, updateColor]);

  // Mouse event handlers for wheel
  useEffect(() => {
    if (!isDraggingWheel) return;
    
    const handleMouseMove = (e: MouseEvent) => handleWheelInteraction(e);
    const handleMouseUp = () => setIsDraggingWheel(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingWheel, handleWheelInteraction]);

  // Mouse event handlers for SL picker
  useEffect(() => {
    if (!isDraggingSL) return;
    
    const handleMouseMove = (e: MouseEvent) => handleSLInteraction(e);
    const handleMouseUp = () => setIsDraggingSL(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSL, handleSLInteraction]);

  // Preset colors for quick selection
  const presetColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FF6B6B', '#4ECDC4',
    '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
  ];

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
        <PopoverContent className="w-64 p-4" align="start">
          <div className="space-y-4">
            {/* Hue Wheel */}
            <div 
              ref={wheelRef}
              className="relative w-full aspect-square cursor-crosshair"
              onMouseDown={(e) => {
                setIsDraggingWheel(true);
                handleWheelInteraction(e);
              }}
              style={{
                background: `conic-gradient(
                  hsl(0, 100%, 50%),
                  hsl(60, 100%, 50%),
                  hsl(120, 100%, 50%),
                  hsl(180, 100%, 50%),
                  hsl(240, 100%, 50%),
                  hsl(300, 100%, 50%),
                  hsl(360, 100%, 50%)
                )`,
                borderRadius: '50%',
              }}
            >
              {/* Hue indicator */}
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
                style={{
                  backgroundColor: hslToHex(hsl.h, 100, 50),
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${hsl.h - 90}deg) translateX(70px) translate(-50%, -50%)`,
                  transformOrigin: '0 0',
                }}
              />
              {/* Inner white circle for SL picker */}
              <div 
                ref={slRef}
                className="absolute inset-[25%] rounded-lg cursor-crosshair overflow-hidden"
                style={{
                  background: `linear-gradient(to bottom, white, transparent, black), linear-gradient(to right, gray, hsl(${hsl.h}, 100%, 50%))`,
                  backgroundBlendMode: 'multiply',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingSL(true);
                  handleSLInteraction(e);
                }}
              >
                {/* SL indicator */}
                <div
                  className="absolute w-3 h-3 rounded-full border-2 border-white shadow-lg pointer-events-none"
                  style={{
                    backgroundColor: value || '#000000',
                    left: `${hsl.s}%`,
                    top: `${100 - hsl.l}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </div>
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
                      setHsl(hexToHsl(color));
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
