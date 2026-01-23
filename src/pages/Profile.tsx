import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, ExternalLink, Play, Plus, CheckCircle, ShieldCheck } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  social_links: unknown;
  is_creator: boolean | null;
  verified: boolean | null;
}

interface Product {
  id: string;
  name: string;
  cover_image_url: string | null;
  youtube_url: string | null;
  pricing_type: string | null;
  price_cents: number | null;
  currency: string | null;
}

// Helper to generate YouTube thumbnail URL
const getYouTubeThumbnail = (youtubeUrl: string | null): string | null => {
  if (!youtubeUrl) return null;
  // Handle various YouTube URL formats
  let videoId = youtubeUrl;
  if (youtubeUrl.includes('youtube.com/watch')) {
    const url = new URL(youtubeUrl);
    videoId = url.searchParams.get('v') || youtubeUrl;
  } else if (youtubeUrl.includes('youtu.be/')) {
    videoId = youtubeUrl.split('youtu.be/')[1]?.split('?')[0] || youtubeUrl;
  } else if (youtubeUrl.includes('youtube.com/embed/')) {
    videoId = youtubeUrl.split('embed/')[1]?.split('?')[0] || youtubeUrl;
  }
  // Clean video ID (remove any query params)
  videoId = videoId.split('?')[0].split('&')[0];
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      let query = supabase.from('profiles').select('*');

      // Handle /@username route
      const cleanUsername = username?.replace('@', '');
      
      if (cleanUsername) {
        query = query.eq('username', cleanUsername);
      } else if (user) {
        query = query.eq('user_id', user.id);
      } else {
        setLoading(false);
        return;
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Failed to load profile:', error);
      } else if (data) {
        setProfile(data);
        setIsOwnProfile(user?.id === data.user_id);

        // Fetch user's products
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name, cover_image_url, youtube_url, pricing_type, price_cents, currency')
          .eq('creator_id', data.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        setProducts(productsData || []);
      }

      setLoading(false);
    }

    fetchProfile();
  }, [username, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Profile not found</h1>
          <p className="text-muted-foreground mb-4">This user doesn't exist or hasn't set up their profile.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="relative mb-8">
          {/* Cover gradient */}
          <div className="h-32 rounded-xl bg-gradient-to-br from-primary/40 to-accent/30" />
          
          {/* Avatar and info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 px-6">
            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl font-bold text-foreground">
                  {profile.full_name || profile.username || 'User'}
                </h1>
                {profile.verified && (
                  <CheckCircle className="w-5 h-5 text-primary fill-primary/20" />
                )}
              </div>
              {profile.username && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isOwnProfile && (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  {profile.is_creator && (
                    <Button size="sm" onClick={() => navigate('/create-product')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Product
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bio & Details */}
        <div className="mb-8 space-y-4 px-6">
          {profile.bio && (
            <p className="text-muted-foreground whitespace-pre-line">{profile.bio}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {profile.is_creator && (
              <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30">
                Creator
              </Badge>
            )}
            {profile.verified && (
              <Badge variant="outline" className="border-primary/50 text-primary">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Website
              </a>
            )}
          </div>
        </div>

        {/* Products */}
        {products.length > 0 && (
          <div className="px-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const thumbnailUrl = product.cover_image_url || getYouTubeThumbnail(product.youtube_url);
                return (
                  <button
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="group text-left"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.includes('maxresdefault')) {
                              target.src = target.src.replace('maxresdefault', 'hqdefault');
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/30">
                        <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
                          <Play className="w-5 h-5 text-foreground ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <h3 className="mt-2 font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {products.length === 0 && isOwnProfile && (
          <div className="text-center py-12 bg-muted/30 rounded-xl mx-6">
            <p className="text-muted-foreground mb-4">You haven't created any products yet.</p>
            <Button onClick={() => navigate('/create-product')}>Create Your First Product</Button>
          </div>
        )}
      </div>
    </div>
  );
}
