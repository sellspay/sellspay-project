import { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface AvatarCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
}

// Helper function to create cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas size to desired crop size
  const size = Math.max(pixelCrop.width, pixelCrop.height);
  canvas.width = size;
  canvas.height = size;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  );

  // Return as blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      },
      'image/jpeg',
      0.95
    );
  });
}

export function AvatarCropper({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
}: AvatarCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const resetZoom = () => {
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Adjust Profile Picture</DialogTitle>
        </DialogHeader>

        {/* Cropper Area */}
        <div className="relative w-full aspect-square bg-black/90">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            classes={{
              containerClassName: 'rounded-none',
              cropAreaClassName: 'border-2 border-primary shadow-lg',
            }}
          />
        </div>

        {/* Zoom Controls */}
        <div className="p-4 space-y-4 bg-background">
          <div className="flex items-center gap-4">
            <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={([value]) => setZoom(value)}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
            <Button
              variant="ghost"
              size="icon"
              onClick={resetZoom}
              className="shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Drag to reposition • Pinch or use slider to zoom
          </p>
        </div>

        <DialogFooter className="p-4 pt-0 gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
