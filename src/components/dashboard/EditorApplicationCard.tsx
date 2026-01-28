import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Pencil, Trash2, UserCog, MapPin, DollarSign, Languages, Briefcase, Globe, Linkedin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CountryCitySelect from '@/components/editor-application/CountryCitySelect';

interface EditorApplication {
  id: string;
  display_name: string;
  about_me: string;
  country: string;
  city: string;
  hourly_rate_cents: number;
  starting_budget_cents: number | null;
  social_links: { website?: string; linkedin?: string } | null;
  languages: string[];
  services: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

interface EditorApplicationCardProps {
  profileId: string;
}

const AVAILABLE_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian',
  'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi',
  'Dutch', 'Polish', 'Swedish', 'Turkish', 'Vietnamese', 'Thai'
];

const AVAILABLE_SERVICES = [
  'Video Editing', 'Color Grading', 'Motion Graphics', 'Sound Design',
  'VFX', 'Thumbnail Design', 'Short-form Content', 'Long-form Content',
  'Music Videos', 'Commercials', 'Documentary', 'Wedding Videos',
  'Corporate Videos', 'YouTube Content', 'TikTok/Reels', 'Podcast Editing'
];

export function EditorApplicationCard({ profileId }: EditorApplicationCardProps) {
  const [application, setApplication] = useState<EditorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    displayName: '',
    aboutMe: '',
    country: '',
    city: '',
    hourlyRate: 0,
    startingBudget: null as number | null,
    websiteLink: '',
    linkedinLink: '',
    languages: [] as string[],
    services: [] as string[],
  });

  const fetchApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('editor_applications')
        .select('*')
        .eq('user_id', profileId)
        .eq('status', 'approved')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const typedData = {
          ...data,
          social_links: data.social_links as { website?: string; linkedin?: string } | null
        };
        setApplication(typedData);
        
        const socialLinks = typedData.social_links;
        setEditForm({
          displayName: typedData.display_name,
          aboutMe: typedData.about_me,
          country: typedData.country,
          city: typedData.city,
          hourlyRate: typedData.hourly_rate_cents / 100,
          startingBudget: typedData.starting_budget_cents ? typedData.starting_budget_cents / 100 : null,
          websiteLink: socialLinks?.website || '',
          linkedinLink: socialLinks?.linkedin || '',
          languages: typedData.languages || [],
          services: typedData.services || [],
        });
      }
    } catch (error) {
      console.error('Error fetching editor application:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileId) {
      fetchApplication();
    }
  }, [profileId]);

  const handleSaveEdit = async () => {
    if (!application) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('editor_applications')
        .update({
          display_name: editForm.displayName,
          about_me: editForm.aboutMe,
          country: editForm.country,
          city: editForm.city,
          hourly_rate_cents: Math.round(editForm.hourlyRate * 100),
          starting_budget_cents: editForm.startingBudget ? Math.round(editForm.startingBudget * 100) : null,
          social_links: {
            website: editForm.websiteLink || null,
            linkedin: editForm.linkedinLink || null,
          },
          languages: editForm.languages,
          services: editForm.services,
          status: 'pending', // Send back for review
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id);

      if (error) throw error;

      // Also update the profile to remove is_editor temporarily until re-approved
      await supabase
        .from('profiles')
        .update({ is_editor: false })
        .eq('id', profileId);

      // Send admin notification
      const { createAdminNotification } = await import('@/lib/notifications');
      await createAdminNotification({
        type: 'editor_application',
        message: `Editor application updated and needs re-review`,
        applicantId: profileId,
        applicationType: 'editor',
        redirectUrl: '/admin',
      });

      toast.success('Application updated and sent for review');
      setEditDialogOpen(false);
      fetchApplication();
    } catch (error: any) {
      console.error('Error updating application:', error);
      toast.error(error.message || 'Failed to update application');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!application) return;
    
    setDeleting(true);
    try {
      // Delete the application
      const { error: appError } = await supabase
        .from('editor_applications')
        .delete()
        .eq('id', application.id);

      if (appError) throw appError;

      // Update profile to remove editor status and clear editor fields
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_editor: false,
          editor_about: null,
          editor_city: null,
          editor_country: null,
          editor_hourly_rate_cents: null,
          editor_languages: null,
          editor_services: null,
          editor_social_links: null,
        })
        .eq('id', profileId);

      if (profileError) throw profileError;

      toast.success('Editor application deleted');
      setApplication(null);
    } catch (error: any) {
      console.error('Error deleting application:', error);
      toast.error(error.message || 'Failed to delete application');
    } finally {
      setDeleting(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    setEditForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const toggleService = (service: string) => {
    setEditForm(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  if (loading) {
    return (
      <Card className="bg-card">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!application) {
    return null;
  }

  const socialLinks = application.social_links as { website?: string; linkedin?: string } | null;

  return (
    <>
      <Card className="bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCog className="w-5 h-5 text-primary" />
              Editor Application
            </CardTitle>
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-0">
              Approved
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display Name */}
          <div>
            <p className="text-sm text-muted-foreground">Display Name</p>
            <p className="font-medium">{application.display_name}</p>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{application.city}, {application.country}</span>
          </div>

          {/* Rates */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span>${application.hourly_rate_cents / 100}/hr</span>
            </div>
            {application.starting_budget_cents && (
              <span className="text-muted-foreground">
                Starting: ${application.starting_budget_cents / 100}
              </span>
            )}
          </div>

          {/* Languages */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Languages className="w-4 h-4" />
              <span>Languages</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {application.languages.map((lang) => (
                <Badge key={lang} variant="outline" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Briefcase className="w-4 h-4" />
              <span>Services</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {application.services.slice(0, 4).map((service) => (
                <Badge key={service} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
              {application.services.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{application.services.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          {/* Social Links */}
          {(socialLinks?.website || socialLinks?.linkedin) && (
            <div className="flex items-center gap-3 text-sm">
              {socialLinks?.website && (
                <a 
                  href={socialLinks.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Website
                </a>
              )}
              {socialLinks?.linkedin && (
                <a 
                  href={socialLinks.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="flex-1"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Editor Application</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your editor application and remove you from the Hire Editors page. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Application'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Editing will send your application for re-review
          </p>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Editor Application</DialogTitle>
            <DialogDescription>
              Update your editor profile. Changes will be sent for review before going live.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="font-medium">Personal Info</h3>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Your display name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aboutMe">About Me</Label>
                <Textarea
                  id="aboutMe"
                  value={editForm.aboutMe}
                  onChange={(e) => setEditForm(prev => ({ ...prev, aboutMe: e.target.value }))}
                  placeholder="Tell clients about yourself..."
                  rows={4}
                />
              </div>

              <CountryCitySelect
                country={editForm.country}
                city={editForm.city}
                onCountryChange={(country) => setEditForm(prev => ({ ...prev, country, city: '' }))}
                onCityChange={(city) => setEditForm(prev => ({ ...prev, city }))}
              />
            </div>

            {/* Rates */}
            <div className="space-y-4">
              <h3 className="font-medium">Rates</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="1"
                    value={editForm.hourlyRate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startingBudget">Starting Budget ($) - Optional</Label>
                  <Input
                    id="startingBudget"
                    type="number"
                    min="0"
                    value={editForm.startingBudget || ''}
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      startingBudget: e.target.value ? parseFloat(e.target.value) : null 
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="font-medium">Social Links</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={editForm.websiteLink}
                    onChange={(e) => setEditForm(prev => ({ ...prev, websiteLink: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    value={editForm.linkedinLink}
                    onChange={(e) => setEditForm(prev => ({ ...prev, linkedinLink: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-4">
              <h3 className="font-medium">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_LANGUAGES.map((lang) => (
                  <Badge
                    key={lang}
                    variant={editForm.languages.includes(lang) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleLanguage(lang)}
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="font-medium">Services</h3>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SERVICES.map((service) => (
                  <Badge
                    key={service}
                    variant={editForm.services.includes(service) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleService(service)}
                  >
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={saving || !editForm.displayName || !editForm.aboutMe || !editForm.country || !editForm.city || editForm.hourlyRate <= 0 || editForm.languages.length === 0 || editForm.services.length === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Submit for Review'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
