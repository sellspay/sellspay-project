import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { MapPin, Globe, Clock, ExternalLink, Youtube } from 'lucide-react';

interface EditorSocialLinks {
  instagram?: string;
  youtube?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
}

interface EditorProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  verified: boolean | null;
  editor_hourly_rate_cents: number | null;
  editor_services: string[] | null;
  editor_languages: string[] | null;
  editor_country: string | null;
  editor_city: string | null;
  editor_about: string | null;
  editor_social_links: EditorSocialLinks | null;
  isAdmin?: boolean;
}

interface EditorDetailDialogProps {
  editor: EditorProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHireClick: (editor: EditorProfile) => void;
  serviceLabels: Record<string, string>;
}

// Social Media Icons
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export default function EditorDetailDialog({
  editor,
  open,
  onOpenChange,
  onHireClick,
  serviceLabels
}: EditorDetailDialogProps) {
  if (!editor) return null;

  const socialLinks = editor.editor_social_links || {};
  const hasSocialLinks = Object.values(socialLinks).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Professional Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 ring-2 ring-background shadow-lg">
              <AvatarImage src={editor.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-purple-500/30 text-foreground text-2xl font-semibold">
                {(editor.full_name || editor.username)?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-foreground">
                  @{editor.username || 'professional'}
                </h2>
                {editor.verified && <VerifiedBadge size="md" isOwner={editor.isAdmin} />}
              </div>
              {editor.full_name && (
                <p className="text-muted-foreground">{editor.full_name}</p>
              )}
              {(editor.editor_city || editor.editor_country) && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {[editor.editor_city, editor.editor_country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* About Me */}
          {editor.editor_about && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {editor.editor_about}
              </p>
            </div>
          )}

          {/* Services */}
          {editor.editor_services && editor.editor_services.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Services</h3>
              <div className="flex flex-wrap gap-2">
                {editor.editor_services.map((service) => (
                  <Badge 
                    key={service} 
                    variant="secondary" 
                    className="text-xs bg-muted/50"
                  >
                    {serviceLabels[service] || service}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {editor.editor_languages && editor.editor_languages.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Languages</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                {editor.editor_languages.join(', ')}
              </p>
            </div>
          )}

          {/* Social Links */}
          {hasSocialLinks && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Social Links</h3>
              <div className="flex items-center gap-3">
                {socialLinks.instagram && (
                  <a 
                    href={socialLinks.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <InstagramIcon className="w-5 h-5" />
                  </a>
                )}
                {socialLinks.youtube && (
                  <a 
                    href={socialLinks.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
                {socialLinks.twitter && (
                  <a 
                    href={socialLinks.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="w-5 h-5" />
                  </a>
                )}
                {socialLinks.tiktok && (
                  <a 
                    href={socialLinks.tiktok} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <TikTokIcon className="w-5 h-5" />
                  </a>
                )}
                {socialLinks.website && (
                  <a 
                    href={socialLinks.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Rate & Hire Button */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-2xl font-bold text-foreground">
                  ${((editor.editor_hourly_rate_cents || 0) / 100).toFixed(0)}
                </span>
                <span className="text-muted-foreground">/hour</span>
              </div>
            </div>
            <Button 
              size="lg"
              onClick={() => {
                onOpenChange(false);
                onHireClick(editor);
              }}
              className="bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
            >
              Hire Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
