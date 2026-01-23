import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Globe, Clock, Sparkles, Users, ChevronDown, X, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import EditorApplicationDialog from '@/components/editor-application/EditorApplicationDialog';
import HireEditorModal from '@/components/hire/HireEditorModal';
import EditorDetailDialog from '@/components/hire/EditorDetailDialog';
import { VerifiedBadge } from '@/components/ui/verified-badge';

interface EditorSocialLinks {
  instagram?: string;
  youtube?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
}

interface EditorProfile {
  id: string;
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
}

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

const CATEGORIES = [
  { id: 'all', label: 'All Editors' },
  { id: 'video-editing', label: 'Video Editing' },
  { id: 'motion-graphics', label: 'Motion Graphics' },
  { id: 'color-grading', label: 'Color Grading' },
  { id: 'vfx-compositing', label: 'VFX' },
  { id: 'sound-design', label: 'Sound Design' },
  { id: 'thumbnail-design', label: 'Thumbnail Design' },
  { id: 'youtube-editing', label: 'YouTube' },
  { id: 'short-form', label: 'Short Form' },
  { id: 'tiktok-reels', label: 'TikTok / Reels' },
  { id: 'podcast-editing', label: 'Podcast' },
  { id: 'gaming-content', label: 'Gaming' },
];

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

export default function HireEditors() {
  const { user } = useAuth();
  const [editors, setEditors] = useState<EditorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [selectedEditor, setSelectedEditor] = useState<EditorProfile | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailEditor, setDetailEditor] = useState<EditorProfile | null>(null);

  useEffect(() => {
    fetchEditors();
  }, []);

  const fetchEditors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, verified, editor_hourly_rate_cents, editor_services, editor_languages, editor_country, editor_city, editor_about, editor_social_links')
        .eq('is_editor', true)
        .not('editor_hourly_rate_cents', 'is', null);

      if (error) throw error;
      
      // Cast social links to proper type
      const typedData = (data || []).map(editor => ({
        ...editor,
        editor_social_links: editor.editor_social_links as EditorSocialLinks | null
      }));
      
      setEditors(typedData);
    } catch (error) {
      console.error('Error fetching editors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEditors = editors.filter(editor => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (editor.full_name?.toLowerCase().includes(searchLower)) ||
      (editor.username?.toLowerCase().includes(searchLower)) ||
      (editor.editor_services?.some(s => SERVICE_LABELS[s]?.toLowerCase().includes(searchLower)));

    const matchesCategory = selectedCategory === 'all' || 
      (editor.editor_services?.includes(selectedCategory));

    return matchesSearch && matchesCategory;
  });

  const handleHireClick = (editor: EditorProfile) => {
    setSelectedEditor(editor);
    setHireModalOpen(true);
  };

  const handleCardClick = (editor: EditorProfile) => {
    setDetailEditor(editor);
    setDetailDialogOpen(true);
  };

  const clearFilter = () => {
    setSelectedCategory('all');
  };

  const hasSocialLinks = (editor: EditorProfile) => {
    const links = editor.editor_social_links;
    return links && Object.values(links).some(Boolean);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Connect with Creative Professionals
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Hire Top{' '}
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Video Editors
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Find skilled editors, motion designers, and creative professionals 
            ready to bring your vision to life.
          </p>
          
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search by skill, name, or specialty..." 
                className="pl-12 h-14 bg-card/80 backdrop-blur-sm border-border/50 text-base rounded-xl shadow-lg shadow-black/5"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filter Popover */}
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={`h-14 px-6 gap-2 rounded-xl border-border/50 bg-card/80 backdrop-blur-sm shadow-lg shadow-black/5 ${
                    selectedCategory !== 'all' ? 'border-primary text-primary' : ''
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filter</span>
                  {selectedCategory !== 'all' && (
                    <Badge variant="secondary" className="ml-1 bg-primary/20 text-primary text-xs">
                      1
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Filter by Specialty</h4>
                    {selectedCategory !== 'all' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearFilter}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'outline'}
                        size="sm"
                        className={`justify-start h-9 text-xs ${
                          selectedCategory === category.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setFilterOpen(false);
                        }}
                      >
                        {category.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Active Filter Tag */}
          {selectedCategory !== 'all' && (
            <div className="flex justify-center mb-6">
              <Badge 
                variant="secondary" 
                className="px-3 py-1.5 gap-2 bg-primary/10 text-primary border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={clearFilter}
              >
                {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                <X className="w-3 h-3" />
              </Badge>
            </div>
          )}

          {/* Apply Button */}
          {user && (
            <Button 
              size="lg" 
              onClick={() => setApplicationOpen(true)}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground shadow-lg shadow-primary/25 h-12 px-8 rounded-xl"
            >
              <Users className="w-4 h-4 mr-2" />
              Apply to be an Editor
            </Button>
          )}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border/40 bg-card/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">
                <span className="font-semibold text-foreground">{filteredEditors.length}</span>
                {' '}editors available
              </span>
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                Showing results for "<span className="text-foreground">{searchQuery}</span>"
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Editors Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="bg-card/50 border-border/30 animate-pulse overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEditors.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <Users className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No editors found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'all' 
                  ? "Try adjusting your search or filters to find more editors."
                  : "Be the first to join our community of creative professionals."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEditors.map((editor) => (
                <Card 
                  key={editor.id} 
                  className="group bg-card/60 backdrop-blur-sm border-border/40 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden cursor-pointer"
                  onClick={() => handleCardClick(editor)}
                >
                  {/* Card header gradient */}
                  <div className="h-2 bg-gradient-to-r from-primary/60 via-purple-500/60 to-primary/60" />
                  
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="w-14 h-14 ring-2 ring-background shadow-lg">
                        <AvatarImage src={editor.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-purple-500/30 text-foreground text-lg font-semibold">
                          {(editor.full_name || editor.username)?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            @{editor.username || 'editor'}
                          </h3>
                          {editor.verified && <VerifiedBadge size="sm" />}
                        </div>
                        {editor.full_name && (
                          <p className="text-sm text-muted-foreground">{editor.full_name}</p>
                        )}
                        {(editor.editor_city || editor.editor_country) && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {[editor.editor_city, editor.editor_country].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* About */}
                    {editor.editor_about && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {editor.editor_about}
                      </p>
                    )}

                    {/* Services */}
                    {editor.editor_services && editor.editor_services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {editor.editor_services.slice(0, 3).map((service) => (
                          <Badge 
                            key={service} 
                            variant="secondary" 
                            className="text-xs bg-muted/50 hover:bg-muted transition-colors"
                          >
                            {SERVICE_LABELS[service] || service}
                          </Badge>
                        ))}
                        {editor.editor_services.length > 3 && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            +{editor.editor_services.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Languages */}
                    {editor.editor_languages && editor.editor_languages.length > 0 && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-4">
                        <Globe className="w-3.5 h-3.5" />
                        {editor.editor_languages.slice(0, 3).join(', ')}
                        {editor.editor_languages.length > 3 && ` +${editor.editor_languages.length - 3}`}
                      </p>
                    )}

                    {/* Social Media Icons */}
                    {hasSocialLinks(editor) && (
                      <div className="flex items-center gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
                        {editor.editor_social_links?.instagram && (
                          <a 
                            href={editor.editor_social_links.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <InstagramIcon className="w-4 h-4" />
                          </a>
                        )}
                        {editor.editor_social_links?.youtube && (
                          <a 
                            href={editor.editor_social_links.youtube} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Youtube className="w-4 h-4" />
                          </a>
                        )}
                        {editor.editor_social_links?.twitter && (
                          <a 
                            href={editor.editor_social_links.twitter} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <XIcon className="w-4 h-4" />
                          </a>
                        )}
                        {editor.editor_social_links?.tiktok && (
                          <a 
                            href={editor.editor_social_links.tiktok} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <TikTokIcon className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Rate & Hire */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground">
                            ${((editor.editor_hourly_rate_cents || 0) / 100).toFixed(0)}
                          </span>
                          <span className="text-muted-foreground text-sm">/hr</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHireClick(editor);
                        }}
                        className="bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
                      >
                        Hire Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Application Dialog */}
      <EditorApplicationDialog 
        open={applicationOpen} 
        onOpenChange={setApplicationOpen} 
      />

      {/* Hire Modal */}
      <HireEditorModal
        open={hireModalOpen}
        onOpenChange={setHireModalOpen}
        editor={selectedEditor}
      />

      {/* Editor Detail Dialog */}
      <EditorDetailDialog
        editor={detailEditor}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onHireClick={handleHireClick}
        serviceLabels={SERVICE_LABELS}
      />
    </div>
  );
}
