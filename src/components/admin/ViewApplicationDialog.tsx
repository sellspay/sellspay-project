import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, Globe, Clock, DollarSign, CheckCircle, XCircle, ExternalLink, Mail } from 'lucide-react';

const SERVICE_LABELS: Record<string, string> = {
  'video-editing': 'Video Editing',
  'color-grading': 'Color Grading',
  'motion-graphics': 'Motion Graphics',
  'vfx-compositing': 'VFX & Compositing',
  'sound-design': 'Sound Design',
  'audio-mixing': 'Audio Mixing',
  'thumbnail-design': 'Thumbnail Design',
  'youtube-editing': 'YouTube Editing',
  'short-form': 'Short Form Content',
  'tiktok-reels': 'TikTok / Reels',
  'documentary': 'Documentary',
  'music-videos': 'Music Videos',
  'commercials': 'Commercial / Ads',
  'podcast-editing': 'Podcast Editing',
  'livestream': 'Livestream Editing',
  'gaming-content': 'Gaming Content',
  'wedding-videos': 'Wedding Videos',
  'corporate': 'Corporate Videos',
  'tutorials': 'Tutorials / Courses',
  'animation': 'Animation',
};

interface EditorApplication {
  id: string;
  user_id: string;
  display_name: string;
  about_me: string;
  country: string;
  city: string;
  hourly_rate_cents: number;
  starting_budget_cents?: number | null;
  services: string[];
  languages: string[];
  social_links?: unknown;
  status: string | null;
  created_at: string | null;
  profile?: {
    avatar_url: string | null;
    username: string | null;
    email: string | null;
  };
}

interface ViewApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: EditorApplication | null;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function ViewApplicationDialog({
  open,
  onOpenChange,
  application,
  onApprove,
  onReject,
}: ViewApplicationDialogProps) {
  if (!application) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const socialLinks = (typeof application.social_links === 'object' && application.social_links !== null) 
    ? application.social_links as Record<string, string> 
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editor Application</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with avatar and basic info */}
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 ring-2 ring-border">
              <AvatarImage src={application.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {application.display_name?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-semibold">{application.display_name}</h3>
                {application.status === 'pending' && (
                  <Badge className="bg-yellow-500/20 text-yellow-600">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                )}
                {application.status === 'approved' && (
                  <Badge className="bg-green-500/20 text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approved
                  </Badge>
                )}
                {application.status === 'rejected' && (
                  <Badge className="bg-red-500/20 text-red-600">
                    <XCircle className="w-3 h-3 mr-1" />
                    Rejected
                  </Badge>
                )}
              </div>
              {application.profile?.username && (
                <p className="text-muted-foreground">@{application.profile.username}</p>
              )}
              {application.profile?.email && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Mail className="w-3 h-3" />
                  {application.profile.email}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Applied: {formatDate(application.created_at)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Location</h4>
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {application.city}, {application.country}
            </p>
          </div>

          {/* Rates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Hourly Rate</h4>
              <p className="flex items-center gap-2 text-lg font-semibold">
                <DollarSign className="w-4 h-4 text-primary" />
                ${(application.hourly_rate_cents / 100).toFixed(0)}/hr
              </p>
            </div>
            {application.starting_budget_cents && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Starting Budget</h4>
                <p className="flex items-center gap-2 text-lg font-semibold">
                  <DollarSign className="w-4 h-4 text-primary" />
                  ${(application.starting_budget_cents / 100).toFixed(0)}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* About */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">About</h4>
            <p className="text-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
              {application.about_me}
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Services Offered</h4>
            <div className="flex flex-wrap gap-2">
              {application.services.map((service) => (
                <Badge key={service} variant="secondary">
                  {SERVICE_LABELS[service] || service}
                </Badge>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Languages</h4>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <p>{application.languages.join(', ')}</p>
            </div>
          </div>

          {/* Social Links */}
          {socialLinks && Object.keys(socialLinks).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Social Links</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(socialLinks).map(([platform, url]) => (
                  url && (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-md text-sm transition-colors"
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Actions for pending applications */}
          {application.status === 'pending' && (onApprove || onReject) && (
            <>
              <Separator />
              <div className="flex gap-3 justify-end">
                {onReject && (
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => onReject(application.id)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Application
                  </Button>
                )}
                {onApprove && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => onApprove(application.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Application
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
