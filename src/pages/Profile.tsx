import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, checkUserRole } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { 
  Settings, 
  Plus,
  Link as LinkIcon, 
  Heart,
  MessageCircle,
  Play,
  UserPlus,
  UserMinus,
  Download,
  Bookmark,
  Pencil,
  User,
  Sparkles,
  Store
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import CollectionRow from '@/components/profile/CollectionRow';
import CreateCollectionDialog from '@/components/profile/CreateCollectionDialog';
import SubscribeDialog from '@/components/profile/SubscribeDialog';
import { ProfileEditorDialog } from '@/components/profile-editor';
import { PublicProfileSections } from '@/components/profile/PublicProfileSections';
import CreatorApplicationDialog from '@/components/creator-application/CreatorApplicationDialog';
import { SellerConfirmDialog } from '@/components/profile/SellerConfirmDialog';
import { UnfollowConfirmDialog } from '@/components/profile/UnfollowConfirmDialog';
import { createNotification, checkFollowCooldown, recordUnfollow } from '@/lib/notifications';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  background_url: string | null;
  bio: string | null;
  website: string | null;
  social_links: unknown;
  is_creator: boolean | null;
  is_seller: boolean | null;
  verified: boolean | null;
  show_recent_uploads?: boolean | null;
  global_font?: string | null;
  global_custom_font?: { name: string; url: string } | null;
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
  likeCount?: number;
  commentCount?: number;
}
interface Purchase {
  id: string;
  product_id: string;
  created_at: string;
  product: {
    id: string;
    name: string;
    cover_image_url: string | null;
    youtube_url: string | null;
    preview_video_url: string | null;
    pricing_type: string | null;
    status?: string | null;
  } | null;
}

interface SavedProduct {
  id: string;
  product_id: string;
  created_at: string;
  product: {
    id: string;
    name: string;
    cover_image_url: string | null;
    youtube_url: string | null;
    preview_video_url: string | null;
    pricing_type: string | null;
    price_cents: number | null;
    currency: string | null;
    status?: string | null;
  } | null;
}

interface Collection {
  id: string;
  name: string;
  cover_image_url: string | null;
  is_visible?: boolean;
  products: {
    id: string;
    name: string;
    cover_image_url: string | null;
    youtube_url: string | null;
    preview_video_url: string | null;
    price_cents: number | null;
    currency: string | null;
    pricing_type?: string | null;
    created_at?: string | null;
    likeCount?: number;
    commentCount?: number;
  }[];
  totalCount: number;
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
// Helper to format price
function formatPrice(cents: number | null, currency: string | null): string {
  if (!cents || cents === 0) return 'Free';
  const amount = cents / 100;
  const cur = currency?.toUpperCase() || 'USD';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(amount);
}

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
      videoRef.current.loop = true;
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

        {/* Price Badge */}
        <div className="absolute top-2 left-2 rounded bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
          {formatPrice(product.price_cents, product.currency)}
        </div>

        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <h3 className="text-sm font-medium text-white line-clamp-1">
            {product.name}
          </h3>
        </div>

        {/* Play indicator on hover */}
        {!isHovering && previewVideoUrl && !videoError && (
          <div className="absolute top-2 right-2 bg-background/80 rounded-full p-1.5">
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
          <Heart className="w-3 h-3" /> {product.likeCount ?? 0}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="w-3 h-3" /> {product.commentCount ?? 0}
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
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'collections' | 'downloads' | 'saved'>('collections');
  const [isAdmin, setIsAdmin] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showRecentUploads, setShowRecentUploads] = useState(true);
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [creatorHasPlans, setCreatorHasPlans] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [layoutRefreshKey, setLayoutRefreshKey] = useState(0);
  const [showCreatorApplication, setShowCreatorApplication] = useState(false);
  const [showSellerConfirm, setShowSellerConfirm] = useState(false);
  const [becomingSellerLoading, setBecomingSellerLoading] = useState(false);
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);
  const [unfollowLoading, setUnfollowLoading] = useState(false);

  const handleBecomeSeller = async () => {
    if (!user || !profile) return;
    setBecomingSellerLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_seller: true })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      setProfile({ ...profile, is_seller: true });
      setShowSellerConfirm(false);
      toast.success('Your account is now a seller account! You can create products.');
    } catch (error) {
      console.error('Error becoming seller:', error);
      toast.error('Failed to switch account. Please try again.');
    } finally {
      setBecomingSellerLoading(false);
    }
  };
  const fetchCollections = async (profileId: string, isOwn: boolean) => {
    try {
      // Fetch collections for this profile
      let query = supabase
        .from('collections')
        .select('id, name, cover_image_url, is_visible')
        .eq('creator_id', profileId)
        .order('display_order', { ascending: true });

      // If not own profile, only show visible collections
      if (!isOwn) {
        query = query.eq('is_visible', true);
      }

      const { data: collectionsData, error: collectionsError } = await query;

      if (collectionsError) throw collectionsError;

      if (collectionsData && collectionsData.length > 0) {
        // For each collection, fetch its products
        const collectionsWithProducts = await Promise.all(
          collectionsData.map(async (collection) => {
            // Get collection items
            const { data: items, count } = await supabase
              .from('collection_items')
              .select('product_id', { count: 'exact' })
              .eq('collection_id', collection.id)
              .order('display_order', { ascending: true });

            if (!items || items.length === 0) {
              return { ...collection, products: [], totalCount: 0 };
            }

            // Fetch product details
            const productIds = items.map((item) => item.product_id);
            const { data: productsData } = await supabase
              .from('products')
              .select('id, name, cover_image_url, youtube_url, preview_video_url, price_cents, currency, pricing_type, created_at')
              .in('id', productIds)
              .eq('status', 'published');

            // Get like and comment counts for products
            let likeMap = new Map<string, number>();
            let commentMap = new Map<string, number>();

            if (productsData && productsData.length > 0) {
              const pIds = productsData.map(p => p.id);
              
              const { data: likeCounts } = await supabase
                .from('product_likes')
                .select('product_id')
                .in('product_id', pIds);
              
              const { data: commentCounts } = await supabase
                .from('comments')
                .select('product_id')
                .in('product_id', pIds);

              likeCounts?.forEach(like => {
                likeMap.set(like.product_id, (likeMap.get(like.product_id) || 0) + 1);
              });
              
              commentCounts?.forEach(comment => {
                commentMap.set(comment.product_id, (commentMap.get(comment.product_id) || 0) + 1);
              });
            }

            return {
              ...collection,
              products: (productsData || []).map(p => ({
                ...p,
                likeCount: likeMap.get(p.id) || 0,
                commentCount: commentMap.get(p.id) || 0,
              })),
              totalCount: count || 0,
            };
          })
        );

        setCollections(collectionsWithProducts);
      } else {
        setCollections([]);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const bumpLayoutRefresh = () => setLayoutRefreshKey((k) => k + 1);

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
        // Set initial recent uploads visibility from profile data
        setShowRecentUploads(data.show_recent_uploads !== false);
        const ownProfile = user?.id === data.user_id;
        setIsOwnProfile(ownProfile);
        
        // Set default tab: for non-sellers viewing their own profile, default to downloads
        if (ownProfile && !data.is_seller) {
          setActiveTab('downloads');
        }

        // Check if the PROFILE BEING VIEWED is an admin (for special verified badge)
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user_id)
          .eq('role', 'admin')
          .maybeSingle();
        const profileIsAdmin = !!roleData;
        setIsAdmin(profileIsAdmin);

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
        
        // Fetch like counts for each product
        if (productsData && productsData.length > 0) {
          const productIds = productsData.map(p => p.id);
          
          // Get like counts
          const { data: likeCounts } = await supabase
            .from('product_likes')
            .select('product_id')
            .in('product_id', productIds);
          
          // Get comment counts
          const { data: commentCounts } = await supabase
            .from('comments')
            .select('product_id')
            .in('product_id', productIds);
          
          // Map counts to products
          const likeMap = new Map<string, number>();
          const commentMap = new Map<string, number>();
          
          likeCounts?.forEach(like => {
            likeMap.set(like.product_id, (likeMap.get(like.product_id) || 0) + 1);
          });
          
          commentCounts?.forEach(comment => {
            commentMap.set(comment.product_id, (commentMap.get(comment.product_id) || 0) + 1);
          });
          
          const productsWithCounts = productsData.map(p => ({
            ...p,
            likeCount: likeMap.get(p.id) || 0,
            commentCount: commentMap.get(p.id) || 0,
          }));
          
          setProducts(productsWithCounts);
        } else {
          setProducts([]);
        }

        // Fetch purchases for own profile (both creators and non-creators)
        if (ownProfile) {
          const { data: purchasesData, error: purchasesError } = await supabase
            .from('purchases')
            .select(`
              id,
              product_id,
              created_at,
              product:products!inner (
                id,
                name,
                cover_image_url,
                youtube_url,
                preview_video_url,
                pricing_type,
                status
              )
            `)
            .eq('buyer_id', data.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false });
          
          if (purchasesError) {
            console.error('Error fetching purchases:', purchasesError);
          }

          // Filter to only show published products and format the data
          // Also deduplicate by product_id (keep the first occurrence which is most recent)
          const seenProductIds = new Set<string>();
          const typedPurchases = (purchasesData || [])
            .filter(p => {
              if (!p.product) return false;
              const productId = p.product_id;
              if (seenProductIds.has(productId)) return false;
              seenProductIds.add(productId);
              return true;
            })
            .map(p => ({
              id: p.id,
              product_id: p.product_id,
              created_at: p.created_at,
              product: Array.isArray(p.product) ? p.product[0] : p.product
            })) as Purchase[];
          
          setPurchases(typedPurchases);

          // Fetch saved products (two-step fetch because saved_products has no FK relationship,
          // so PostgREST joins like products!inner won't work reliably).
          const { data: savedRows, error: savedError } = await supabase
            .from('saved_products')
            .select('id, product_id, created_at')
            .eq('user_id', data.id)
            .order('created_at', { ascending: false });

          if (savedError) {
            console.error('Error fetching saved products:', savedError);
            setSavedProducts([]);
          } else if (!savedRows || savedRows.length === 0) {
            setSavedProducts([]);
          } else {
            const savedProductIds = savedRows.map((r) => r.product_id);
            const { data: savedProductsData, error: productsError } = await supabase
              .from('products')
              .select('id, name, cover_image_url, youtube_url, preview_video_url, pricing_type, price_cents, currency, status')
              .in('id', savedProductIds)
              .eq('status', 'published');

            if (productsError) {
              console.error('Error fetching saved product details:', productsError);
              setSavedProducts([]);
            } else {
              const productMap = new Map((savedProductsData || []).map((p) => [p.id, p]));
              const typedSaved = savedRows
                .map((r) => ({
                  id: r.id,
                  product_id: r.product_id,
                  created_at: r.created_at,
                  product: productMap.get(r.product_id) ?? null,
                }))
                .filter((r) => r.product) as SavedProduct[];
              setSavedProducts(typedSaved);
            }
          }
        }

        // Fetch collections for the profile
        fetchCollections(data.id, ownProfile);

        // Check if creator/owner has subscription plans (for non-own profiles)
        if (!ownProfile && (data.is_creator || profileIsAdmin)) {
          const { count } = await supabase
            .from('creator_subscription_plans')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', data.id)
            .eq('is_active', true);
          setCreatorHasPlans((count || 0) > 0);
        }
      }

      setLoading(false);
    }

    fetchProfile();
  }, [username, atUsername, user]);

  const handleFollow = async () => {
    if (!user) {
      // Redirect to login for unauthenticated users
      navigate('/login');
      return;
    }
    
    if (!profile) return;
    
    // If user doesn't have a profile ID yet, they need to complete profile setup
    if (!currentUserProfileId) {
      toast.error('Please complete your profile setup first');
      navigate('/settings');
      return;
    }

    if (isFollowing) {
      // Show unfollow confirmation dialog
      setShowUnfollowConfirm(true);
    } else {
      // Check for cooldown before following
      const cooldownCheck = await checkFollowCooldown(currentUserProfileId, profile.id);
      if (cooldownCheck.blocked) {
        toast.error(`You can't follow this user for ${cooldownCheck.daysLeft} more day(s) due to a previous unfollow.`);
        return;
      }

      // Follow
      const { error } = await supabase
        .from('followers')
        .insert({ follower_id: currentUserProfileId, following_id: profile.id });
      
      if (!error) {
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success(`Now following @${profile.username}`);

        // Create notification for the followed user
        await createNotification({
          userId: profile.id,
          type: 'follow',
          actorId: currentUserProfileId,
          message: 'started following you',
          redirectUrl: `/@${(await supabase.from('profiles').select('username').eq('id', currentUserProfileId).maybeSingle()).data?.username || 'user'}`,
        });
      } else {
        toast.error('Failed to follow');
      }
    }
  };

  const handleConfirmUnfollow = async () => {
    if (!currentUserProfileId || !profile) return;

    setUnfollowLoading(true);
    try {
      // Delete from followers
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', currentUserProfileId)
        .eq('following_id', profile.id);

      if (error) throw error;

      // Record unfollow for cooldown
      await recordUnfollow(currentUserProfileId, profile.id);

      setIsFollowing(false);
      setFollowersCount(prev => prev - 1);
      setShowUnfollowConfirm(false);
      toast.success(`Unfollowed @${profile.username}. You won't be able to follow back for 7 days.`);
    } catch (error) {
      console.error('Error unfollowing:', error);
      toast.error('Failed to unfollow');
    } finally {
      setUnfollowLoading(false);
    }
  };

  const copyProfileLink = () => {
    const url = `${window.location.origin}/@${profile?.username}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied!');
  };

  const filteredProducts = products.filter(p => p.status === 'published');

  const publishedCount = filteredProducts.length;

  // Toggle and persist recent uploads visibility
  const toggleRecentUploadsVisibility = async (visible: boolean) => {
    if (!profile) return;
    
    setShowRecentUploads(visible);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ show_recent_uploads: visible })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success(visible ? 'Recent Uploads is now visible' : 'Recent Uploads hidden');
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
      // Revert on error
      setShowRecentUploads(!visible);
    }
  };

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
    <TooltipProvider>
      <div className="bg-background relative">
        {/* Steam-style full-page background - using img for better quality */}
        {profile.background_url && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <img 
              src={profile.background_url}
              alt=""
              className="w-full h-full object-cover"
              style={{ 
                imageRendering: 'auto',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden'
              }}
              loading="eager"
              decoding="sync"
            />
          </div>
        )}
        
        {/* Content wrapper - solid card when background is present */}
        <div className={`relative z-10 ${profile.background_url ? 'py-6' : ''}`}>
          <div className={`max-w-4xl mx-auto ${profile.background_url ? 'bg-background/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-border/50 mx-4 md:mx-auto pb-6' : ''}`}>
            {/* Banner - contained width like Twitter/X */}
            <div className={`px-4 ${profile.background_url ? 'pt-4' : 'pt-4'}`}>
              <div className="h-32 md:h-40 rounded-xl overflow-hidden">
                {profile.banner_url ? (
                  <img
                    src={profile.banner_url}
                    alt="Profile banner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/40 to-accent/30" />
                )}
              </div>
            </div>

            {/* Profile Header - Avatar and info below banner */}
            <div className="px-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end -mt-16">
            {/* Avatar */}
            <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-3xl">
                {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Action buttons on desktop - positioned to the right */}
            <div className="hidden md:flex flex-1 justify-end gap-2 pb-2">
              {/* Follow button for other profiles - show for sellers, creators, or admins/owners */}
              {!isOwnProfile && (profile.is_seller || profile.is_creator || isAdmin) && (
                <Button 
                  onClick={handleFollow}
                  variant={isFollowing ? "outline" : "default"}
                  className={isFollowing ? "" : "bg-primary hover:bg-primary/90"}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
              
              {/* Subscribe button for sellers/admins with plans */}
              {!isOwnProfile && (profile.is_seller || isAdmin) && creatorHasPlans && (
                <Button 
                  onClick={() => setShowSubscribeDialog(true)}
                  variant="outline"
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Subscribe
                </Button>
              )}
              
              {/* Own profile buttons */}
              {isOwnProfile && (
                <>
                  <Button 
                    variant="outline"
                    onClick={copyProfileLink}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Copy link
                  </Button>
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  {!profile.is_seller && (
                    <Button 
                      variant="default"
                      onClick={() => setShowSellerConfirm(true)}
                      className="gap-2"
                    >
                      <Store className="w-4 h-4" />
                      Seller?
                    </Button>
                  )}
                  {!profile.verified && profile.is_seller && (
                    <Button 
                      variant="outline"
                      onClick={() => setShowCreatorApplication(true)}
                      className="gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Get Verified
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Info Section - below avatar */}
          <div className="mt-4">
            {/* Username row with badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-foreground">
                @{profile.username || 'user'}
              </h1>
              {profile.verified && (
                <VerifiedBadge isOwner={isAdmin} size="md" />
              )}
              {profile.is_seller && !isAdmin && (
                <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                  Seller
                </Badge>
              )}
              {isAdmin && (
                <Badge className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient text-primary-foreground border-0">
                  Owner
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

            {/* Social Links */}
            {profile.social_links && typeof profile.social_links === 'object' && (
              <div className="flex items-center gap-3 mb-3">
                {(profile.social_links as Record<string, string>).instagram && (
                  <a
                    href={(profile.social_links as Record<string, string>).instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Instagram"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {(profile.social_links as Record<string, string>).youtube && (
                  <a
                    href={(profile.social_links as Record<string, string>).youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="YouTube"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
                {(profile.social_links as Record<string, string>).twitter && (
                  <a
                    href={(profile.social_links as Record<string, string>).twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="X (Twitter)"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                {(profile.social_links as Record<string, string>).tiktok && (
                  <a
                    href={(profile.social_links as Record<string, string>).tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="TikTok"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>
                )}
              </div>
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

            {/* Mobile action buttons */}
            <div className="flex md:hidden flex-wrap gap-2 mb-4">
              {/* Follow button for other profiles - show for sellers, creators, or admins/owners */}
              {!isOwnProfile && (profile.is_seller || profile.is_creator || isAdmin) && (
                <Button 
                  onClick={handleFollow}
                  variant={isFollowing ? "outline" : "default"}
                  className={isFollowing ? "" : "bg-primary hover:bg-primary/90"}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}

              {/* Subscribe button for sellers/admins with plans (mobile) */}
              {!isOwnProfile && (profile.is_seller || isAdmin) && creatorHasPlans && (
                <Button 
                  onClick={() => setShowSubscribeDialog(true)}
                  variant="outline"
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Subscribe
                </Button>
              )}
              
              {/* Own profile buttons */}
              {isOwnProfile && (
                <>
                  <Button 
                    variant="outline"
                    onClick={copyProfileLink}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Copy link
                  </Button>
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Instagram-style Icon Tabs */}
        <div className="mt-8 max-w-4xl mx-auto px-4">
          <div className="flex justify-center border-t border-border">
            {/* Store/Collections Tab - for sellers, creators, admins, or public view */}
            {(profile.is_seller || profile.is_creator || isAdmin || !isOwnProfile) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab('collections')}
                    className={`flex items-center gap-2 px-8 py-3 border-t-2 transition-colors ${
                      activeTab === 'collections'
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{profile.is_seller ? 'Store' : 'Products'}</TooltipContent>
              </Tooltip>
            )}

            {/* Downloads Tab - only for own profile */}
            {isOwnProfile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab('downloads')}
                    className={`flex items-center gap-2 px-8 py-3 border-t-2 transition-colors ${
                      activeTab === 'downloads'
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Purchases</TooltipContent>
              </Tooltip>
            )}

            {/* Saved Products Tab - only for own profile */}
            {isOwnProfile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab('saved')}
                    className={`flex items-center gap-2 px-8 py-3 border-t-2 transition-colors ${
                      activeTab === 'saved'
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Saved</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-6 max-w-5xl mx-auto px-4 pb-12">
          
          {/* Collections Tab - public view */}
          {activeTab === 'collections' && (
            <>
              {/* Edit Controls for own profile */}
              {isOwnProfile && profile.is_seller && (
                <div className="flex justify-end items-center mb-6 gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowProfileEditor(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Launch Editor
                  </Button>
                </div>
              )}

              {/* Unified layout: Recent Uploads + Collections + Sections interleaved */}
              {profile?.id && (
                <PublicProfileSections
                  profileId={profile.id}
                  isOwnProfile={isOwnProfile}
                  refreshKey={layoutRefreshKey}
                  recentUploadsVisible={showRecentUploads && filteredProducts.length > 0}
                  recentProducts={filteredProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    cover_image_url: p.cover_image_url,
                    youtube_url: p.youtube_url,
                    preview_video_url: p.preview_video_url,
                    price_cents: p.price_cents,
                    currency: p.currency,
                    pricing_type: p.pricing_type,
                    created_at: p.created_at,
                    likeCount: p.likeCount,
                    commentCount: p.commentCount,
                  }))}
                  globalFont={profile.global_font}
                  globalCustomFont={profile.global_custom_font}
                />
              )}

              {/* Empty state */}
              {filteredProducts.length === 0 && collections.length === 0 && (
                <div className="text-center py-16 bg-muted/20 rounded-xl border border-border/50">
                  {isOwnProfile ? (
                    <>
                      <p className="text-muted-foreground mb-4">
                        You haven't published any products yet.
                      </p>
                      <Button onClick={() => navigate('/create-product')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Product
                      </Button>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No products yet.</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Downloads/Purchases Tab */}
          {activeTab === 'downloads' && isOwnProfile && (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Products you've purchased
              </p>
              {purchases.length > 0 ? (
                <div className="mb-10">
                  <CollectionRow
                    id="downloads"
                    name="My Purchases"
                    coverImage={null}
                    products={purchases.filter(p => p.product).slice(0, 9).map(p => ({
                      id: p.product!.id,
                      name: p.product!.name,
                      cover_image_url: p.product!.cover_image_url,
                      youtube_url: p.product!.youtube_url,
                      preview_video_url: p.product!.preview_video_url,
                      price_cents: null,
                      currency: null,
                      pricing_type: p.product!.pricing_type,
                      created_at: p.created_at,
                    }))}
                    totalCount={purchases.length}
                  />
                </div>
              ) : (
                <div className="text-center py-16 bg-muted/20 rounded-xl border border-border/50">
                  <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No purchases yet.</p>
                  <Button onClick={() => navigate('/products')}>
                    Browse Products
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Saved Products Tab */}
          {activeTab === 'saved' && isOwnProfile && (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Products you've saved for later
              </p>
              {savedProducts.length > 0 ? (
                <div className="mb-10">
                  <CollectionRow
                    id="saved"
                    name="Saved Products"
                    coverImage={null}
                    products={savedProducts.filter(s => s.product).slice(0, 9).map(s => ({
                      id: s.product!.id,
                      name: s.product!.name,
                      cover_image_url: s.product!.cover_image_url,
                      youtube_url: s.product!.youtube_url,
                      preview_video_url: s.product!.preview_video_url,
                      price_cents: s.product!.price_cents,
                      currency: s.product!.currency,
                      pricing_type: s.product!.pricing_type,
                      created_at: s.created_at,
                    }))}
                    totalCount={savedProducts.length}
                  />
                </div>
              ) : (
                <div className="text-center py-16 bg-muted/20 rounded-xl border border-border/50">
                  <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No saved products yet.</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Save products to purchase later by clicking the bookmark icon.
                  </p>
                  <Button onClick={() => navigate('/products')}>
                    Browse Products
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
          </div>
        </div>
        {/* End content wrapper */}
      </div>

      {/* Create Collection Dialog */}
      {profile && (
        <CreateCollectionDialog
          open={showCreateCollection}
          onOpenChange={setShowCreateCollection}
          creatorId={profile.id}
          products={products.filter(p => p.status === 'published').map(p => ({
            id: p.id,
            name: p.name,
            cover_image_url: p.cover_image_url,
          }))}
          onCreated={() => fetchCollections(profile.id, isOwnProfile)}
        />
      )}


      {/* Subscribe Dialog */}
      {profile && (
        <SubscribeDialog
          open={showSubscribeDialog}
          onOpenChange={setShowSubscribeDialog}
          creatorId={profile.id}
          creatorName={profile.full_name || profile.username || 'Creator'}
        />
      )}

      {/* Profile Editor Dialog */}
      {profile && (
        <ProfileEditorDialog
          open={showProfileEditor}
          onOpenChange={setShowProfileEditor}
          profileId={profile.id}
          profile={{
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            banner_url: profile.banner_url,
            background_url: profile.background_url,
            bio: profile.bio,
            verified: profile.verified,
          }}
          collections={collections.map(c => ({ id: c.id, name: c.name }))}
          onCollectionsChange={async () => {
            fetchCollections(profile.id, isOwnProfile);
            bumpLayoutRefresh();
            // Re-fetch recent uploads visibility after editor save
            const { data } = await supabase
              .from('profiles')
              .select('show_recent_uploads')
              .eq('id', profile.id)
              .single();
            if (data) setShowRecentUploads(data.show_recent_uploads !== false);
          }}
        />
      )}

      {/* Creator Verification Application */}
      <CreatorApplicationDialog
        open={showCreatorApplication}
        onOpenChange={setShowCreatorApplication}
        onApplicationSubmitted={() => {
          // No-op for now; dialog itself handles its own pending/rejected views.
          // We keep this callback so the caller can optionally refresh profile state later.
        }}
      />

      {/* Seller Confirmation Dialog */}
      <SellerConfirmDialog
        open={showSellerConfirm}
        onOpenChange={setShowSellerConfirm}
        onConfirm={handleBecomeSeller}
        loading={becomingSellerLoading}
      />

      {/* Unfollow Confirmation Dialog */}
      <UnfollowConfirmDialog
        open={showUnfollowConfirm}
        onOpenChange={setShowUnfollowConfirm}
        username={profile?.username || 'user'}
        onConfirm={handleConfirmUnfollow}
        loading={unfollowLoading}
      />
    </TooltipProvider>
  );
};

export default ProfilePage;
