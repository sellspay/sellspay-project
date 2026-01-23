import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  CheckCircle, 
  ShieldCheck, 
  Plus, 
  Link as LinkIcon, 
  Grid3X3, 
  Heart,
  MessageCircle,
  Play,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  preview_video_url: string | null;
  pricing_type: string | null;
  price_cents: number | null;
  currency: string | null;
  status: string | null;
  created_at: string | null;
}

// Helper to generate YouTube thumbnail URL
const getYouTubeThumbnail = (youtubeUrl: string | null): string | null => {
  if (!youtubeUrl) return null;
  let videoId = youtubeUrl;
  if (youtubeUrl.includes('youtube.com/watch')) {
    const url = new URL(youtubeUrl);
    videoId = url.searchParams.get('v') || youtubeUrl;
  } else if (youtubeUrl.includes('youtu.be/')) {
    videoId = youtubeUrl.split('youtu.be/')[1]?.split('?')[0] || youtubeUrl;
  } else if (youtubeUrl.includes('youtube.com/embed/')) {
    videoId = youtubeUrl.split('embed/')[1]?.split('?')[0] || youtubeUrl;
  }
  videoId = videoId.split('?')[0].split('&')[0];
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

// Helper to get full preview video URL from Supabase storage
const getPreviewVideoUrl = (path: string | null): string | null => {
  if (!path) return null;
  // If already a full URL, return as-is
  if (path.startsWith('http')) return path;
  // Build Supabase storage URL
  const { data } = supabase.storage.from('product-media').getPublicUrl(path);
  return data?.publicUrl || null;
};

// Product Card with Video Preview
function ProductCard({ 
  product, 
  onClick 
}: { 
  product: Product; 
  onClick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [videoError, setVideoError] = useState(false);
  
  const thumbnailUrl = product.cover_image_url || getYouTubeThumbnail(product.youtube_url);
  const previewVideoUrl = getPreviewVideoUrl(product.preview_video_url);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current && previewVideoUrl && !videoError) {
      videoRef.current.play().catch(() => setVideoError(true));
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group text-left w-full"
    >
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border">
        {/* Video preview (hidden until hover) */}
        {previewVideoUrl && !videoError && (
          <video
            ref={videoRef}
            src={previewVideoUrl}
            muted
            loop
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            onError={() => setVideoError(true)}
          />
        )}
        
        {/* Thumbnail/fallback */}
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={product.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isHovering && previewVideoUrl && !videoError ? 'opacity-0' : 'opacity-100'
            }`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src.includes('maxresdefault')) {
                target.src = target.src.replace('maxresdefault', 'hqdefault');
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <h3 className="text-sm font-medium text-white line-clamp-1">
            {product.name}
          </h3>
        </div>

        {/* Play indicator on hover */}
        {!isHovering && previewVideoUrl && !videoError && (
          <div className="absolute top-2 left-2 bg-background/80 rounded-full p-1.5">
            <Play className="w-3 h-3 text-foreground" fill="currentColor" />
          </div>
        )}
      </div>

      {/* Meta info below card */}
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        {product.created_at && (
          <span>{format(new Date(product.created_at), 'MMM d, yyyy')}</span>
        )}
        <span className="flex items-center gap-1">
          <Heart className="w-3 h-3" /> 0
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="w-3 h-3" /> 0
        </span>
      </div>
    </button>
  );
}

const ProfilePage: React.FC = () => {
  const params = useParams();
  const username = (params as Record<string, string | undefined>).username;
  const atUsername = (params as Record<string, string | undefined>).atUsername;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'published' | 'drafts'>('published');
  const [isAdmin, setIsAdmin] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      // Supports:
      // - /profile (no username in URL)
      // - /@username via route param ":atUsername" where value starts with '@'
      const raw = atUsername ?? username;
      const cleanUsername = raw?.replace('@', '');
      
      let data = null;
      let error = null;
      
      if (cleanUsername) {
        // Use case-insensitive matching via ilike
        const result = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', cleanUsername)
          .maybeSingle();
        data = result.data;
        error = result.error;
      } else if (user) {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        data = result.data;
        error = result.error;
      } else {
        setLoading(false);
        return;
      }

      if (error) {
        console.error('Failed to load profile:', error);
      } else if (data) {
        setProfile(data);
        const ownProfile = user?.id === data.user_id;
        setIsOwnProfile(ownProfile);

        // TODO: Check admin status from user_roles table if needed
        // For now, assume admin if email matches
        setIsAdmin(user?.email === 'vizual90@gmail.com');

        // Fetch followers count
        const { count: followers } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', data.id);
        setFollowersCount(followers || 0);

        // Fetch following count
        const { count: following } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', data.id);
        setFollowingCount(following || 0);

        // Check if current user is following this profile
        if (user && !ownProfile) {
          const { data: currentUserProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (currentUserProfile) {
            setCurrentUserProfileId(currentUserProfile.id);
            const { data: followData } = await supabase
              .from('followers')
              .select('id')
              .eq('follower_id', currentUserProfile.id)
              .eq('following_id', data.id)
              .maybeSingle();
            setIsFollowing(!!followData);
          }
        }

        // Fetch all products if own profile, only published for others
        const productQuery = supabase
          .from('products')
          .select('id, name, cover_image_url, youtube_url, preview_video_url, pricing_type, price_cents, currency, status, created_at')
          .eq('creator_id', data.id)
          .order('created_at', { ascending: false });

        if (!ownProfile) {
          productQuery.eq('status', 'published');
        }

        const { data: productsData } = await productQuery;
        setProducts(productsData || []);
      }

      setLoading(false);
    }

    fetchProfile();
  }, [username, atUsername, user]);

  const handleFollow = async () => {
    if (!user || !profile || !currentUserProfileId) {
      toast.error('Please log in to follow creators');
      return;
    }

    if (isFollowing) {
      // Unfollow
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', currentUserProfileId)
        .eq('following_id', profile.id);
      
      if (!error) {
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
        toast.success(`Unfollowed @${profile.username}`);
      }
    } else {
      // Follow
      const { error } = await supabase
        .from('followers')
        .insert({ follower_id: currentUserProfileId, following_id: profile.id });
      
      if (!error) {
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success(`Now following @${profile.username}`);
      } else {
        toast.error('Failed to follow');
      }
    }
  };

  const copyProfileLink = () => {
    const url = `${window.location.origin}/@${profile?.username}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied!');
  };

  const filteredProducts = products.filter(p => 
    activeTab === 'published' ? p.status === 'published' : p.status === 'draft'
  );

  const publishedCount = products.filter(p => p.status === 'published').length;
  const draftsCount = products.filter(p => p.status === 'draft').length;

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
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-br from-primary/40 to-accent/30" />

      <div className="max-w-4xl mx-auto px-4 -mt-16">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-3xl">
              {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Info Section */}
          <div className="flex-1 pt-4 md:pt-8">
            {/* Username row with badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-foreground">
                @{profile.username || 'user'}
              </h1>
              {isOwnProfile && (
                <button 
                  onClick={() => navigate('/settings')}
                  className="p-1 rounded-full hover:bg-secondary transition-colors"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              {profile.verified && (
                <CheckCircle className="w-5 h-5 text-primary" fill="currentColor" />
              )}
              {isAdmin && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  Admin
                </Badge>
              )}
            </div>

            {/* Display name */}
            {profile.full_name && (
              <p className="text-muted-foreground mb-2">{profile.full_name}</p>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="text-foreground whitespace-pre-line mb-3 max-w-lg">
                {profile.bio}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-4 text-sm mb-4">
              <span>
                <strong className="text-foreground">{publishedCount}</strong>{' '}
                <span className="text-muted-foreground">products</span>
              </span>
              <span>
                <strong className="text-foreground">{followersCount}</strong>{' '}
                <span className="text-muted-foreground">followers</span>
              </span>
              <span>
                <strong className="text-foreground">{followingCount}</strong>{' '}
                <span className="text-muted-foreground">following</span>
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Follow button for other profiles */}
              {!isOwnProfile && profile.is_creator && (
                <Button 
                  onClick={handleFollow}
                  variant={isFollowing ? "outline" : "default"}
                  className={isFollowing ? "" : "bg-primary hover:bg-primary/90"}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
              
              {/* Own profile buttons */}
              {isOwnProfile && (
                <>
                  {profile.is_creator && (
                    <Button 
                      onClick={() => navigate('/create-product')}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create product
                    </Button>
                  )}
                  {isAdmin && (
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/admin')}
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={copyProfileLink}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Copy link
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Store Section */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Store</h2>
            {products.length > 0 && (
              <span className="text-sm text-muted-foreground">Showing newest</span>
            )}
          </div>

          {/* Tab buttons - Instagram style */}
          {isOwnProfile && profile.is_creator && (
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeTab === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('published')}
                className={activeTab === 'published' ? 'bg-foreground text-background hover:bg-foreground/90' : ''}
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Published ({publishedCount})
              </Button>
              <Button
                variant={activeTab === 'drafts' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('drafts')}
                className={activeTab === 'drafts' ? 'bg-foreground text-background hover:bg-foreground/90' : ''}
              >
                Drafts ({draftsCount})
              </Button>
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => navigate(`/product/${product.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/20 rounded-xl border border-border/50">
              {isOwnProfile ? (
                <>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'published' 
                      ? "You haven't published any products yet."
                      : "No drafts saved."}
                  </p>
                  {profile.is_creator && (
                    <Button onClick={() => navigate('/create-product')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Product
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No products yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
