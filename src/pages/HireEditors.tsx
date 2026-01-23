import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Globe, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import EditorApplicationDialog from '@/components/editor-application/EditorApplicationDialog';
import HireEditorModal from '@/components/hire/HireEditorModal';
import { VerifiedBadge } from '@/components/ui/verified-badge';

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
];

export default function HireEditors() {
  const { user } = useAuth();
  const [editors, setEditors] = useState<EditorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [selectedEditor, setSelectedEditor] = useState<EditorProfile | null>(null);

  useEffect(() => {
    fetchEditors();
  }, []);

  const fetchEditors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, verified, editor_hourly_rate_cents, editor_services, editor_languages, editor_country, editor_city, editor_about')
        .eq('is_editor', true)
        .not('editor_hourly_rate_cents', 'is', null);

      if (error) throw error;
      setEditors(data || []);
    } catch (error) {
      console.error('Error fetching editors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEditors = editors.filter(editor => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (editor.full_name?.toLowerCase().includes(searchLower)) ||
      (editor.username?.toLowerCase().includes(searchLower)) ||
      (editor.editor_services?.some(s => SERVICE_LABELS[s]?.toLowerCase().includes(searchLower)));

    // Category filter
    const matchesCategory = selectedCategory === 'all' || 
      (editor.editor_services?.includes(selectedCategory));

    return matchesSearch && matchesCategory;
  });

  const handleHireClick = (editor: EditorProfile) => {
    setSelectedEditor(editor);
    setHireModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 border-b border-border/40">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Hire Top Editors
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Find skilled video editors, motion designers, and creative professionals 
            for your next project.
          </p>
          
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search editors by skill or name..." 
                className="pl-10 h-12 bg-card"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-12 gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Apply Button */}
          {user && (
            <Button 
              size="lg" 
              onClick={() => setApplicationOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Apply to be an Editor
            </Button>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 border-b border-border/40">
        <div className="mx-auto max-w-6xl">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Editors Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {selectedCategory === 'all' ? 'All Editors' : CATEGORIES.find(c => c.id === selectedCategory)?.label} 
            {' '}({filteredEditors.length})
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="bg-card/50 animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEditors.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">No editors found matching your criteria.</p>
              {user && (
                <Button onClick={() => setApplicationOpen(true)}>
                  Be the first to apply!
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEditors.map((editor) => (
                <Card key={editor.id} className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={editor.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xl">
                          {(editor.full_name || editor.username)?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">
                            {editor.full_name || editor.username || 'Editor'}
                          </h3>
                          {editor.verified && <VerifiedBadge size="sm" />}
                        </div>
                        {editor.username && (
                          <p className="text-sm text-muted-foreground">@{editor.username}</p>
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
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {editor.editor_about}
                      </p>
                    )}

                    {/* Services */}
                    {editor.editor_services && editor.editor_services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {editor.editor_services.slice(0, 3).map((service) => (
                          <Badge key={service} variant="secondary" className="text-xs">
                            {SERVICE_LABELS[service] || service}
                          </Badge>
                        ))}
                        {editor.editor_services.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{editor.editor_services.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Languages */}
                    {editor.editor_languages && editor.editor_languages.length > 0 && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-4">
                        <Globe className="w-3 h-3" />
                        {editor.editor_languages.slice(0, 3).join(', ')}
                        {editor.editor_languages.length > 3 && ` +${editor.editor_languages.length - 3}`}
                      </p>
                    )}

                    {/* Rate & Hire */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">
                          ${((editor.editor_hourly_rate_cents || 0) / 100).toFixed(0)}
                        </span>
                        <span className="text-muted-foreground">/hr</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleHireClick(editor)}
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
    </div>
  );
}