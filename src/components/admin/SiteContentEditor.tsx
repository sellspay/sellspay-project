import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Image, Video, Type, Sparkles, X, Plus, Upload, Trash2, Music, Mic, Palette, Film } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

interface ThumbnailItem {
  url: string;
  label?: string;
}

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
  sfx_thumbnails: ThumbnailItem[];
  vocal_thumbnails: ThumbnailItem[];
  manga_thumbnails: ThumbnailItem[];
  video_thumbnails: ThumbnailItem[];
}

const BUCKET = 'site-assets';

export function SiteContentEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [newWord, setNewWord] = useState('');
  
  const heroFileRef = useRef<HTMLInputElement>(null);

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
        hero_stats: data.hero_stats as SiteContent['hero_stats'] || { assets: '5,000+', creators: '500+', downloads: '50k+' },
        sfx_thumbnails: (data.sfx_thumbnails as unknown as ThumbnailItem[]) || [],
        vocal_thumbnails: (data.vocal_thumbnails as unknown as ThumbnailItem[]) || [],
        manga_thumbnails: (data.manga_thumbnails as unknown as ThumbnailItem[]) || [],
        video_thumbnails: (data.video_thumbnails as unknown as ThumbnailItem[]) || [],
      });
    } catch (error) {
      console.error('Failed to fetch site content:', error);
      toast.error('Failed to load site content');
    } finally {
      setLoading(false);
    }
  };

  const MAX_FILE_SIZE_MB = 50; // 50MB limit for site assets
  const UPLOAD_TIMEOUT_MS = 60000; // 60 second timeout
  const VERIFY_TIMEOUT_MS = 15000; // 15s - verify asset is reachable after upload

  const verifyPublicUrlReachable = async (url: string): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const t = window.setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
      const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
      window.clearTimeout(t);
      return res.ok;
    } catch {
      return false;
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    // File size validation
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      toast.error(`File too large (${fileSizeMB.toFixed(1)}MB). Max size is ${MAX_FILE_SIZE_MB}MB.`);
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Create upload promise with timeout
    const uploadPromise = supabase.storage.from(BUCKET).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

    const timeoutPromise = new Promise<{ error: Error }>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Upload timed out after ${UPLOAD_TIMEOUT_MS / 1000} seconds. Try a smaller file or check your connection.`));
      }, UPLOAD_TIMEOUT_MS);
    });

    try {
      const result = await Promise.race([uploadPromise, timeoutPromise]);
      
      if ('error' in result && result.error) {
        console.error('Upload error:', result.error);
        toast.error(result.error.message || 'Failed to upload file');
        return null;
      }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

      // Verify the file is actually reachable (prevents “looks uploaded” but can’t load elsewhere)
      const reachable = await verifyPublicUrlReachable(publicUrl);
      if (!reachable) {
        toast.error('Upload finished, but the file is not reachable yet. Please try again in a moment.');
        return null;
      }

      return publicUrl;
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Upload failed. Please try again.');
      return null;
    }
  };

  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !content) return;

    const isVideo = file.type.startsWith('video/');
    const folder = isVideo ? 'hero-videos' : 'hero-images';
    
    // Show file info in loading state
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    toast.info(`Uploading ${file.name} (${fileSizeMB}MB)...`);
    
    setUploading('hero');
    
    try {
      const url = await uploadFile(file, folder);
      
      if (url) {
        if (isVideo) {
          setContent({ ...content, hero_media_type: 'video', hero_video_url: url });
        } else {
          setContent({ ...content, hero_media_type: 'image', hero_image_url: url });
        }
        toast.success('Hero media uploaded successfully! (Don\'t forget to Save Changes)');
      }
    } catch (error: any) {
      console.error('Hero upload error:', error);
      toast.error('Failed to upload hero media');
    } finally {
      setUploading(null);
      if (heroFileRef.current) heroFileRef.current.value = '';
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>, toolType: 'sfx' | 'vocal' | 'manga' | 'video') => {
    const files = e.target.files;
    if (!files?.length || !content) return;

    setUploading(toolType);
    const newThumbnails: ThumbnailItem[] = [];

    for (const file of Array.from(files)) {
      const url = await uploadFile(file, `${toolType}-thumbnails`);
      if (url) {
        newThumbnails.push({ url, label: '' });
      }
    }

    const key = `${toolType}_thumbnails` as keyof SiteContent;
    setContent({
      ...content,
      [key]: [...(content[key] as ThumbnailItem[]), ...newThumbnails]
    });
    
    setUploading(null);
    toast.success(`${newThumbnails.length} thumbnail(s) added`);
  };

  const removeThumbnail = (toolType: 'sfx' | 'vocal' | 'manga' | 'video', index: number) => {
    if (!content) return;
    const key = `${toolType}_thumbnails` as keyof SiteContent;
    const current = content[key] as ThumbnailItem[];
    setContent({
      ...content,
      [key]: current.filter((_, i) => i !== index)
    });
  };

  const updateThumbnailLabel = (toolType: 'sfx' | 'vocal' | 'manga' | 'video', index: number, label: string) => {
    if (!content) return;
    const key = `${toolType}_thumbnails` as keyof SiteContent;
    const current = [...(content[key] as ThumbnailItem[])];
    current[index] = { ...current[index], label };
    setContent({ ...content, [key]: current });
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
          sfx_thumbnails: JSON.parse(JSON.stringify(content.sfx_thumbnails)),
          vocal_thumbnails: JSON.parse(JSON.stringify(content.vocal_thumbnails)),
          manga_thumbnails: JSON.parse(JSON.stringify(content.manga_thumbnails)),
          video_thumbnails: JSON.parse(JSON.stringify(content.video_thumbnails)),
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

  const heroMediaUrl = content.hero_media_type === 'video' ? content.hero_video_url : content.hero_image_url;

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hero Media Upload & Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Hero Media
                </CardTitle>
                <CardDescription>Upload image or video for the hero background</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview */}
                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative border">
                  {heroMediaUrl ? (
                    content.hero_media_type === 'video' ? (
                      <video 
                        src={heroMediaUrl} 
                        className="w-full h-full object-cover"
                        muted 
                        loop 
                        autoPlay
                        playsInline
                      />
                    ) : (
                      <img 
                        src={heroMediaUrl} 
                        alt="Hero preview" 
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      No media selected
                    </div>
                  )}
                  
                  {/* Media type badge */}
                  {heroMediaUrl && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs flex items-center gap-1">
                      {content.hero_media_type === 'video' ? <Video className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                      {content.hero_media_type}
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex gap-2">
                  <input
                    ref={heroFileRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleHeroFileUpload}
                  />
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => heroFileRef.current?.click()}
                    disabled={uploading === 'hero'}
                  >
                    {uploading === 'hero' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload Image or Video
                  </Button>
                </div>

                {/* Or use URL */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or use URL</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select
                      value={content.hero_media_type}
                      onValueChange={(value: 'image' | 'video') => setContent({ ...content, hero_media_type: value })}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      placeholder={`Enter ${content.hero_media_type} URL...`}
                      value={heroMediaUrl || ''}
                      onChange={(e) => {
                        if (content.hero_media_type === 'video') {
                          setContent({ ...content, hero_video_url: e.target.value });
                        } else {
                          setContent({ ...content, hero_image_url: e.target.value });
                        }
                      }}
                    />
                  </div>
                </div>
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
                        className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 text-sm rounded"
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
          </div>

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

          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>How the hero section will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-[21/9] bg-gradient-to-br from-background to-muted rounded-lg overflow-hidden relative border">
                {/* Background */}
                {heroMediaUrl && (
                  content.hero_media_type === 'video' ? (
                    <video 
                      src={heroMediaUrl} 
                      className="absolute inset-0 w-full h-full object-cover opacity-40"
                      muted 
                      loop 
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img 
                      src={heroMediaUrl} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                  )
                )}
                
                {/* Content overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <p className="text-lg text-muted-foreground">{content.hero_headline}</p>
                  <h1 className="text-3xl md:text-4xl font-bold mt-2">
                    {content.hero_subheadline}{' '}
                    <span className="text-primary">{content.hero_rotating_words[0] || 'Assets'}</span>
                  </h1>
                  <p className="text-sm text-muted-foreground mt-4 max-w-md">{content.hero_subtitle}</p>
                  
                  <div className="flex gap-8 mt-6 text-sm">
                    <div><span className="font-bold">{content.hero_stats.assets}</span> Assets</div>
                    <div><span className="font-bold">{content.hero_stats.creators}</span> Creators</div>
                    <div><span className="font-bold">{content.hero_stats.downloads}</span> Downloads</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6 mt-6">
          {/* Section Title */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Section Branding
              </CardTitle>
              <CardDescription>Customize the AI Studio section title</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
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

          {/* Thumbnail Grids for each tool */}
          <ThumbnailGridEditor
            title="SFX Generator Thumbnails"
            description="Carousel images for the SFX tool showcase"
            icon={<Music className="h-5 w-5" />}
            thumbnails={content.sfx_thumbnails}
            toolType="sfx"
            uploading={uploading}
            onUpload={handleThumbnailUpload}
            onRemove={removeThumbnail}
            onLabelChange={updateThumbnailLabel}
          />

          <ThumbnailGridEditor
            title="Vocal Isolator Thumbnails"
            description="Carousel images for the vocal separation tool"
            icon={<Mic className="h-5 w-5" />}
            thumbnails={content.vocal_thumbnails}
            toolType="vocal"
            uploading={uploading}
            onUpload={handleThumbnailUpload}
            onRemove={removeThumbnail}
            onLabelChange={updateThumbnailLabel}
          />

          <ThumbnailGridEditor
            title="Manga Generator Thumbnails"
            description="Grid images for the manga style converter"
            icon={<Palette className="h-5 w-5" />}
            thumbnails={content.manga_thumbnails}
            toolType="manga"
            uploading={uploading}
            onUpload={handleThumbnailUpload}
            onRemove={removeThumbnail}
            onLabelChange={updateThumbnailLabel}
          />

          <ThumbnailGridEditor
            title="Video Generator Thumbnails"
            description="Carousel images for the video generation tool"
            icon={<Film className="h-5 w-5" />}
            thumbnails={content.video_thumbnails}
            toolType="video"
            uploading={uploading}
            onUpload={handleThumbnailUpload}
            onRemove={removeThumbnail}
            onLabelChange={updateThumbnailLabel}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ThumbnailGridEditorProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  thumbnails: ThumbnailItem[];
  toolType: 'sfx' | 'vocal' | 'manga' | 'video';
  uploading: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, toolType: 'sfx' | 'vocal' | 'manga' | 'video') => void;
  onRemove: (toolType: 'sfx' | 'vocal' | 'manga' | 'video', index: number) => void;
  onLabelChange: (toolType: 'sfx' | 'vocal' | 'manga' | 'video', index: number, label: string) => void;
}

function ThumbnailGridEditor({ 
  title, 
  description, 
  icon, 
  thumbnails, 
  toolType, 
  uploading,
  onUpload, 
  onRemove,
  onLabelChange 
}: ThumbnailGridEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Thumbnail Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {thumbnails.map((thumb, index) => (
            <div key={index} className="relative group aspect-[4/3]">
              <img 
                src={thumb.url} 
                alt={thumb.label || `Thumbnail ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
              <button
                onClick={() => onRemove(toolType, index)}
                className="absolute top-1 right-1 p-1 bg-destructive/90 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3 text-destructive-foreground" />
              </button>
              <Input
                value={thumb.label || ''}
                onChange={(e) => onLabelChange(toolType, index, e.target.value)}
                placeholder="Label"
                className="absolute bottom-1 left-1 right-1 h-6 text-xs bg-background/90"
              />
            </div>
          ))}
          
          {/* Add Button */}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading === toolType}
            className="aspect-[4/3] border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            {uploading === toolType ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Plus className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add</span>
              </>
            )}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onUpload(e, toolType)}
        />

        <p className="text-xs text-muted-foreground">
          {thumbnails.length} thumbnail{thumbnails.length !== 1 ? 's' : ''} • Click + to add more
        </p>
      </CardContent>
    </Card>
  );
}
