import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Check, X, Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface BannerPositionEditorProps {
  imageUrl: string;
  onConfirm: (positionY: number, scale?: number) => void;
  onCancel: () => void;
  initialPositionY?: number;
}

export default function BannerPositionEditor({
  imageUrl,
  onConfirm,
  onCancel,
  initialPositionY = 50,
}: BannerPositionEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  // Initialize position from initialPositionY
  useEffect(() => {
    if (imageLoaded && containerRef.current && imageRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const imgHeight = imageRef.current.naturalHeight;
      const scaledHeight = (container.width / imageRef.current.naturalWidth) * imgHeight;
      
      // Convert percentage to pixel offset
      const maxOffset = Math.max(0, scaledHeight - container.height);
      const initialY = -((initialPositionY / 100) * maxOffset - maxOffset / 2);
      
      positionRef.current = { x: 0, y: initialY };
      setPosition({ x: 0, y: initialY });
    }
  }, [imageLoaded, initialPositionY]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
  };

  // Use refs for smooth dragging without re-renders
  const updateImagePosition = useCallback(() => {
    if (imageRef.current) {
      imageRef.current.style.transform = `translate(${positionRef.current.x}px, ${positionRef.current.y}px) scale(${scale})`;
    }
  }, [scale]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    isDraggingRef.current = true;
    setIsDragging(true);
    
    startPosRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    const newX = e.clientX - startPosRef.current.x;
    const newY = e.clientY - startPosRef.current.y;
    
    positionRef.current = { x: newX, y: newY };
    
    // Direct DOM manipulation for smooth performance
    if (imageRef.current) {
      imageRef.current.style.transform = `translate(${newX}px, ${newY}px) scale(${scale})`;
    }
  }, [scale]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    isDraggingRef.current = false;
    setIsDragging(false);
    setPosition({ ...positionRef.current });
  }, []);

  // Update transform when scale changes
  useEffect(() => {
    updateImagePosition();
  }, [scale, updateImagePosition]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  }, []);

  const handleZoomIn = () => setScale(prev => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setScale(prev => Math.max(0.5, prev - 0.25));
  const handleReset = () => {
    setScale(1);
    positionRef.current = { x: 0, y: 0 };
    setPosition({ x: 0, y: 0 });
    updateImagePosition();
  };

  const handleConfirm = () => {
    // Convert pixel position back to percentage for storage
    if (containerRef.current && imageRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const scaledHeight = (container.width / imageDimensions.width) * imageDimensions.height * scale;
      const maxOffset = Math.max(0, scaledHeight - container.height);
      
      // Calculate percentage from current Y position
      const percentage = maxOffset > 0 
        ? ((maxOffset / 2 - positionRef.current.y) / maxOffset) * 100
        : 50;
      
      onConfirm(Math.max(0, Math.min(100, percentage)), scale);
    } else {
      onConfirm(50, scale);
    }
  };

  return (
    <div className="space-y-4">
      {/* Editor container */}
      <div 
        ref={containerRef}
        className={`relative overflow-hidden rounded-lg border-2 bg-muted/50 select-none touch-none ${
          isDragging ? 'border-primary cursor-grabbing' : 'border-border cursor-grab'
        }`}
        style={{ aspectRatio: '16 / 5' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* Full banner image */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Banner preview"
          className="absolute w-full will-change-transform"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            left: 0,
            top: 0,
          }}
          onLoad={handleImageLoad}
          draggable={false}
        />
        
        {/* Safe zone overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Border frame to show the visible area */}
          <div className="absolute inset-4 border-2 border-dashed border-primary/60 rounded-lg">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium shadow-lg whitespace-nowrap">
              Visible on Profile
            </div>
          </div>
        </div>
        
        {/* Loading state */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        
        {/* Drag hint */}
        {imageLoaded && !isDragging && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs">
            Drag to move • Scroll to zoom
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="w-32">
            <Slider
              value={[scale]}
              onValueChange={([val]) => setScale(val)}
              min={0.5}
              max={3}
              step={0.1}
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={scale >= 3}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12">{Math.round(scale * 100)}%</span>
        </div>
        
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>
        
        <div className="flex-1" />
        
        {/* Action buttons */}
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
        <Button size="sm" onClick={handleConfirm}>
          <Check className="w-4 h-4 mr-1" />
          Apply
        </Button>
      </div>
    </div>
  );
}
