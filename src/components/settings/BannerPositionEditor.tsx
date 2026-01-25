import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Move, X, Upload, Loader2 } from 'lucide-react';

interface BannerPositionEditorProps {
  imageUrl: string;
  onConfirm: (positionY: number) => void;
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
  const [positionY, setPositionY] = useState(initialPositionY);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageAspect, setImageAspect] = useState<number>(1);
  
  // Handle image load to get aspect ratio
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageAspect(img.naturalWidth / img.naturalHeight);
    setImageLoaded(true);
  };

  // Mouse/touch handlers for dragging
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const percentage = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));
    setPositionY(percentage);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleDragMove(e.clientY);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Add/remove global event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Move className="w-4 h-4 text-primary" />
          <span>Position Your Banner</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={() => onConfirm(positionY)}>
            <Check className="w-4 h-4 mr-1" />
            Apply
          </Button>
        </div>
      </div>
      
      {/* Editor container */}
      <div 
        ref={containerRef}
        className={`relative overflow-hidden rounded-lg border-2 transition-colors select-none ${
          isDragging ? 'border-primary cursor-grabbing' : 'border-border cursor-grab'
        }`}
        style={{ aspectRatio: '2560 / 1440' }} // TV aspect from reference
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Full banner image - positioned based on positionY */}
        <img
          src={imageUrl}
          alt="Banner preview"
          className="absolute w-full transition-transform"
          style={{
            transform: `translateY(${positionY - 50}%)`,
            top: '50%',
            left: 0,
          }}
          onLoad={handleImageLoad}
          draggable={false}
        />
        
        {/* Dimmed overlay for areas outside safe zone */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top dim area */}
          <div 
            className="absolute top-0 left-0 right-0 bg-black/60"
            style={{ height: '15%' }}
          />
          {/* Bottom dim area */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-black/60"
            style={{ height: '55%' }}
          />
          {/* Left dim area (in the visible band) */}
          <div 
            className="absolute bg-black/40"
            style={{ 
              top: '15%', 
              bottom: '55%', 
              left: 0, 
              width: '11%' 
            }}
          />
          {/* Right dim area (in the visible band) */}
          <div 
            className="absolute bg-black/40"
            style={{ 
              top: '15%', 
              bottom: '55%', 
              right: 0, 
              width: '11%' 
            }}
          />
        </div>
        
        {/* Safe area indicator (the visible banner region) */}
        <div 
          className="absolute pointer-events-none border-2 border-primary/80 border-dashed rounded"
          style={{
            top: '15%',
            left: '11%',
            right: '11%',
            height: '30%',
          }}
        >
          {/* Label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium shadow-lg">
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
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-2 animate-pulse">
            <Move className="w-3 h-3" />
            Drag to reposition
          </div>
        )}
      </div>
      
      {/* Position indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Vertical position: {Math.round(positionY)}%</span>
        <span>The highlighted area shows what will appear on your profile</span>
      </div>
    </div>
  );
}
