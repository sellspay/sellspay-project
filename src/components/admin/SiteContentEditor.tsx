import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Image, Video, Type, Sparkles, X, Plus } from 'lucide-react';

interface SiteContent {
  id: string;
  hero_media_type: 'image' | 'video';
  hero_image_url: string | null;
  hero_video_url: string | null;
  hero_headline: string;
  hero_subheadline: string;
  hero_rotating_words: string[];
  hero_subtitle: string;
  hero_stats: { assets: string; creators: string; downloads: string };
  tools_title: string;
  tools_subtitle: string;
}

export function SiteContentEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [newWord, setNewWord] = useState('');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('id', 'main')
        .single();

      if (error) throw error;
      
      setContent({
        ...data,
        hero_media_type: (data.hero_media_type as 'image' | 'video') || 'image',
        hero_stats: data.hero_stats as SiteContent['hero_stats'] || { assets: '5,000+', creators: '500+', downloads: '50k+' }
      });
    } catch (error) {
      console.error('Failed to fetch site content:', error);
      toast.error('Failed to load site content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_content')
        .update({
          hero_media_type: content.hero_media_type,
          hero_image_url: content.hero_image_url,
          hero_video_url: content.hero_video_url,
          hero_headline: content.hero_headline,
          hero_subheadline: content.hero_subheadline,
          hero_rotating_words: content.hero_rotating_words,
          hero_subtitle: content.hero_subtitle,
          hero_stats: content.hero_stats,
          tools_title: content.tools_title,
          tools_subtitle: content.tools_subtitle,
        })
        .eq('id', 'main');

      if (error) throw error;
      toast.success('Site content saved successfully');
    } catch (error) {
      console.error('Failed to save site content:', error);
      toast.error('Failed to save site content');
    } finally {
      setSaving(false);
    }
  };

  const addRotatingWord = () => {
    if (!newWord.trim() || !content) return;
    setContent({
      ...content,
      hero_rotating_words: [...content.hero_rotating_words, newWord.trim()]
    });
    setNewWord('');
  };

  const removeRotatingWord = (index: number) => {
    if (!content) return;
    setContent({
      ...content,
      hero_rotating_words: content.hero_rotating_words.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Failed to load site content
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Site Content Editor</h2>
          <p className="text-muted-foreground">Customize hero section and AI tools showcase</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="tools">AI Tools Section</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-6 mt-6">
          {/* Hero Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Hero Media
              </CardTitle>
              <CardDescription>Choose between image or video background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Media Type</Label>
                <Select
                  value={content.hero_media_type}
                  onValueChange={(value: 'image' | 'video') => setContent({ ...content, hero_media_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">
                      <span className="flex items-center gap-2">
                        <Image className="h-4 w-4" /> Image
                      </span>
                    </SelectItem>
                    <SelectItem value="video">
                      <span className="flex items-center gap-2">
                        <Video className="h-4 w-4" /> Video
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {content.hero_media_type === 'image' ? (
                <div className="space-y-2">
                  <Label htmlFor="hero_image_url">Hero Image URL</Label>
                  <Input
                    id="hero_image_url"
                    placeholder="https://example.com/hero.jpg"
                    value={content.hero_image_url || ''}
                    onChange={(e) => setContent({ ...content, hero_image_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to use default image</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="hero_video_url">Hero Video URL</Label>
                  <Input
                    id="hero_video_url"
                    placeholder="https://example.com/hero.mp4"
                    value={content.hero_video_url || ''}
                    onChange={(e) => setContent({ ...content, hero_video_url: e.target.value })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hero Text */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Hero Headlines
              </CardTitle>
              <CardDescription>Customize the main headlines and subtitle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hero_headline">Headline (Line 1)</Label>
                  <Input
                    id="hero_headline"
                    placeholder="Create with"
                    value={content.hero_headline}
                    onChange={(e) => setContent({ ...content, hero_headline: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_subheadline">Subheadline (Line 2 prefix)</Label>
                  <Input
                    id="hero_subheadline"
                    placeholder="Premium"
                    value={content.hero_subheadline}
                    onChange={(e) => setContent({ ...content, hero_subheadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rotating Words</Label>
                <div className="flex flex-wrap gap-2">
                  {content.hero_rotating_words.map((word, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 text-sm"
                    >
                      {word}
                      <button
                        onClick={() => removeRotatingWord(index)}
                        className="hover:bg-primary/20 p-0.5 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new word..."
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRotatingWord()}
                  />
                  <Button variant="outline" size="icon" onClick={addRotatingWord}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_subtitle">Subtitle Description</Label>
                <Textarea
                  id="hero_subtitle"
                  placeholder="Discover thousands of high-quality digital assets..."
                  value={content.hero_subtitle}
                  onChange={(e) => setContent({ ...content, hero_subtitle: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Hero Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Hero Stats
              </CardTitle>
              <CardDescription>Statistics shown at the bottom of the hero</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stat_assets">Digital Assets</Label>
                  <Input
                    id="stat_assets"
                    placeholder="5,000+"
                    value={content.hero_stats.assets}
                    onChange={(e) => setContent({
                      ...content,
                      hero_stats: { ...content.hero_stats, assets: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stat_creators">Pro Creators</Label>
                  <Input
                    id="stat_creators"
                    placeholder="500+"
                    value={content.hero_stats.creators}
                    onChange={(e) => setContent({
                      ...content,
                      hero_stats: { ...content.hero_stats, creators: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stat_downloads">Downloads</Label>
                  <Input
                    id="stat_downloads"
                    placeholder="50k+"
                    value={content.hero_stats.downloads}
                    onChange={(e) => setContent({
                      ...content,
                      hero_stats: { ...content.hero_stats, downloads: e.target.value }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Tools Section
              </CardTitle>
              <CardDescription>Customize the AI Studio showcase section</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tools_title">Section Title</Label>
                <Input
                  id="tools_title"
                  placeholder="AI Studio"
                  value={content.tools_title}
                  onChange={(e) => setContent({ ...content, tools_title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tools_subtitle">Section Subtitle</Label>
                <Input
                  id="tools_subtitle"
                  placeholder="Professional AI tools for modern creators"
                  value={content.tools_subtitle}
                  onChange={(e) => setContent({ ...content, tools_subtitle: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
