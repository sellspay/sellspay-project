import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Languages, 
  Package, 
  CheckCircle, 
  XCircle,
  ExternalLink 
} from 'lucide-react';
import { CreatorApplication, PRODUCT_TYPE_OPTIONS } from '@/components/creator-application/types';

interface ViewCreatorApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: CreatorApplication | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function ViewCreatorApplicationDialog({
  open,
  onOpenChange,
  application,
  onApprove,
  onReject,
}: ViewCreatorApplicationDialogProps) {
  if (!application) return null;

  const getProductTypeLabel = (value: string) => {
    return PRODUCT_TYPE_OPTIONS.find(opt => opt.value === value)?.label || value;
  };

  const socialLinks = application.social_links 
    ? Object.entries(application.social_links).filter(([_, value]) => value)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Creator Application</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Applicant Info */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
            <Avatar className="w-16 h-16">
              <AvatarImage src={application.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xl">
                {application.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{application.full_name}</h3>
              {application.profile?.username && (
                <p className="text-sm text-muted-foreground">@{application.profile.username}</p>
              )}
            </div>
            <div className="ml-auto">
              <Badge
                className={
                  application.status === 'approved'
                    ? 'bg-green-500/20 text-green-500'
                    : application.status === 'rejected'
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-yellow-500/20 text-yellow-500'
                }
              >
                {application.status}
              </Badge>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Location
            </h4>
            <p className="text-sm text-muted-foreground pl-6">
              {application.state}, {application.country}
            </p>
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Languages className="w-4 h-4 text-muted-foreground" />
              Languages
            </h4>
            <div className="flex flex-wrap gap-1 pl-6">
              {application.languages.map((lang) => (
                <Badge key={lang} variant="secondary">{lang}</Badge>
              ))}
            </div>
          </div>

          {/* Product Types */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              Products to Sell
            </h4>
            <div className="flex flex-wrap gap-1 pl-6">
              {application.product_types.map((type) => (
                <Badge key={type} variant="outline">{getProductTypeLabel(type)}</Badge>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              Social Links
            </h4>
            <div className="space-y-2 pl-6">
              {socialLinks.map(([platform, url]) => (
                <div key={platform} className="flex items-center gap-2 text-sm">
                  <span className="capitalize text-muted-foreground w-20">{platform}:</span>
                  <a
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate max-w-[250px]"
                  >
                    {url as string}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Applied Date */}
          <div className="text-sm text-muted-foreground">
            Applied on: {application.created_at ? new Date(application.created_at).toLocaleDateString() : 'Unknown'}
          </div>

          {/* Action Buttons */}
          {application.status === 'pending' && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1 text-destructive hover:bg-destructive/10"
                onClick={() => onReject(application.id)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                className="flex-1"
                onClick={() => onApprove(application.id)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
