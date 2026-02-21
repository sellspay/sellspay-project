import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ApplicationFormData } from './EditorApplicationDialog';
import { cn } from '@/lib/utils';

interface Step3Props {
  formData: ApplicationFormData;
  updateFormData: (updates: Partial<ApplicationFormData>) => void;
}

const SERVICES = [
  { id: 'video-editing', label: 'Video Editing', category: 'Core' },
  { id: 'color-grading', label: 'Color Grading', category: 'Core' },
  { id: 'motion-graphics', label: 'Motion Graphics', category: 'Core' },
  { id: 'vfx-compositing', label: 'VFX & Compositing', category: 'Core' },
  { id: 'sound-design', label: 'Sound Design', category: 'Audio' },
  { id: 'audio-mixing', label: 'Audio Mixing', category: 'Audio' },
  { id: 'thumbnail-design', label: 'Thumbnail Design', category: 'Design' },
  { id: 'youtube-editing', label: 'YouTube Editing', category: 'Platforms' },
  { id: 'short-form', label: 'Short Form Content', category: 'Platforms' },
  { id: 'tiktok-reels', label: 'TikTok / Reels', category: 'Platforms' },
  { id: 'documentary', label: 'Documentary', category: 'Genres' },
  { id: 'music-videos', label: 'Music Videos', category: 'Genres' },
  { id: 'commercials', label: 'Commercial / Ads', category: 'Genres' },
  { id: 'podcast-editing', label: 'Podcast Editing', category: 'Other' },
  { id: 'livestream', label: 'Livestream Editing', category: 'Other' },
  { id: 'gaming-content', label: 'Gaming Content', category: 'Other' },
  { id: 'wedding-videos', label: 'Wedding Videos', category: 'Genres' },
  { id: 'corporate', label: 'Corporate Videos', category: 'Genres' },
  { id: 'tutorials', label: 'Tutorials / Courses', category: 'Other' },
  { id: 'animation', label: 'Animation', category: 'Core' },
];

const CATEGORIES = ['Core', 'Audio', 'Design', 'Platforms', 'Genres', 'Other'];

export default function Step3Services({ formData, updateFormData }: Step3Props) {
  const toggleService = (serviceId: string) => {
    const current = formData.services;
    if (current.includes(serviceId)) {
      updateFormData({ services: current.filter(s => s !== serviceId) });
    } else {
      updateFormData({ services: [...current, serviceId] });
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        <Label>Services You Offer *</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Select all the services you can provide to clients. These will appear on your professional profile and help clients find you.
        </p>
      </div>

      {/* Services by Category */}
      <div className="space-y-6">
        {CATEGORIES.map((category) => {
          const categoryServices = SERVICES.filter(s => s.category === category);
          return (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {categoryServices.map((service) => {
                  const isSelected = formData.services.includes(service.id);
                  return (
                    <Badge
                      key={service.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-all px-3 py-1.5 text-sm',
                        isSelected
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'hover:bg-secondary'
                      )}
                      onClick={() => toggleService(service.id)}
                    >
                      {service.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Summary */}
      <div className="p-4 rounded-lg bg-secondary/50 border">
        <p className="text-sm font-medium mb-2">
          Selected Services ({formData.services.length})
        </p>
        {formData.services.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {formData.services.map((serviceId) => {
              const service = SERVICES.find(s => s.id === serviceId);
              return (
                <Badge key={serviceId} variant="secondary" className="text-xs">
                  {service?.label || serviceId}
                </Badge>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select at least one service to continue
          </p>
        )}
      </div>
    </div>
  );
}