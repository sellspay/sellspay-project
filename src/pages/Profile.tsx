import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Settings, 
  BadgeCheck,
  Plus,
  Link as LinkIcon, 
  Heart,
  MessageCircle,
  Play,
  UserPlus,
  UserMinus,
  Layers,
  Download,
  Bookmark,
  Pencil,
  Check,
  User,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import CollectionRow from '@/components/profile/CollectionRow';
import SortableCollectionItem from '@/components/profile/SortableCollectionItem';
import CreateCollectionDialog from '@/components/profile/CreateCollectionDialog';
import EditCollectionDialog from '@/components/profile/EditCollectionDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  verified: boolean | null;
  show_recent_uploads?: boolean | null;
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
  const [isEditingCollections, setIsEditingCollections] = useState(false);
  const [showRecentUploads, setShowRecentUploads] = useState(true);
  const [showEditCollection, setShowEditCollection] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deleteCollectionId, setDeleteCollectionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
          const { data: purchasesData } = await supabase
            .from('purchases')
            .select(`
              id,
              product_id,
              created_at,
              product:products (
                id,
                name,
                cover_image_url,
                youtube_url,
                preview_video_url,
                pricing_type
              )
            `)
            .eq('buyer_id', data.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false });
          
          // Type assertion for the joined data
          const typedPurchases = (purchasesData || []).map(p => ({
            id: p.id,
            product_id: p.product_id,
            created_at: p.created_at,
            product: Array.isArray(p.product) ? p.product[0] : p.product
          })) as Purchase[];
          
          setPurchases(typedPurchases);

          // Fetch saved products
          const { data: savedData } = await supabase
            .from('saved_products')
            .select(`
              id,
              product_id,
              created_at,
              product:products (
                id,
                name,
                cover_image_url,
                youtube_url,
                preview_video_url,
                pricing_type,
                price_cents,
                currency
              )
            `)
            .eq('user_id', data.id)
            .order('created_at', { ascending: false });

          const typedSaved = (savedData || []).map(s => ({
            id: s.id,
            product_id: s.product_id,
            created_at: s.created_at,
            product: Array.isArray(s.product) ? s.product[0] : s.product
          })) as SavedProduct[];

          setSavedProducts(typedSaved);
        }

        // Fetch collections for the profile
        fetchCollections(data.id, ownProfile);
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

  const filteredProducts = products.filter(p => p.status === 'published');

  const publishedCount = filteredProducts.length;

  // Handle drag end for collection reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = collections.findIndex(c => c.id === active.id);
      const newIndex = collections.findIndex(c => c.id === over.id);

      const newCollections = arrayMove(collections, oldIndex, newIndex);
      setCollections(newCollections);

      // Update display_order in database
      try {
        await Promise.all(
          newCollections.map((col, idx) =>
            supabase
              .from('collections')
              .update({ display_order: idx })
              .eq('id', col.id)
          )
        );
      } catch (error) {
        console.error('Error updating collection order:', error);
        toast.error('Failed to update order');
      }
    }
  };

  // Toggle collection visibility
  const toggleCollectionVisibility = async (collectionId: string, isVisible: boolean) => {
    try {
      const { error } = await supabase
        .from('collections')
        .update({ is_visible: isVisible })
        .eq('id', collectionId);

      if (error) throw error;

      setCollections(prev => 
        prev.map(c => c.id === collectionId ? { ...c, is_visible: isVisible } : c)
      );

      toast.success(isVisible ? 'Collection is now visible' : 'Collection hidden');
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  // Delete collection
  const handleDeleteCollection = async (collectionId: string) => {
    try {
      // First delete collection items
      const { error: itemsError } = await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId);

      if (itemsError) throw itemsError;

      // Then delete the collection itself
      const { error: collectionError } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (collectionError) throw collectionError;

      setCollections(prev => prev.filter(c => c.id !== collectionId));
      setDeleteCollectionId(null);
      toast.success('Collection deleted');
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    }
  };

  // Open edit dialog for a collection
  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setShowEditCollection(true);
  };

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

          {/* Info Section - below avatar */}
          <div className="mt-4">
            {/* Username row with badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-foreground">
                @{profile.username || 'user'}
              </h1>
              {profile.verified && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isAdmin 
                          ? 'border-current animate-hue-rotate' 
                          : 'border-blue-500'
                      }`}
                      style={isAdmin ? { animation: 'hue-rotate 3s linear infinite' } : undefined}
                    >
                      <Check 
                        className={`w-3 h-3 ${isAdmin ? 'animate-hue-rotate' : 'text-blue-500'}`}
                        style={isAdmin ? { animation: 'hue-rotate 3s linear infinite' } : undefined}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isAdmin ? 'Verified Creator / Owner' : 'Verified Creator'}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {isAdmin && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
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

            {/* Mobile action buttons */}
            <div className="flex md:hidden flex-wrap gap-2 mb-4">
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
            {/* Collections Tab (Person icon - public) */}
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
              <TooltipContent>Collections</TooltipContent>
            </Tooltip>

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
              {isOwnProfile && profile.is_creator && (
                <div className="flex justify-end items-center mb-6 gap-2">
                  {isEditingCollections ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingCollections(false)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Done
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCreateCollection(true)}
                        className="text-primary"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        New Collection
                      </Button>
                      {collections.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingCollections(true)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Automatic "Recent Uploads" Collection - toggleable */}
              {filteredProducts.length > 0 && showRecentUploads && (
                <div className="mb-10">
                  {isEditingCollections && isOwnProfile && (
                    <div className="flex items-center gap-2 mb-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleRecentUploadsVisibility(false)}
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <span className="text-sm text-muted-foreground">Recent Uploads</span>
                    </div>
                  )}
                  <CollectionRow
                    id="recent-uploads"
                    name="Recent Uploads"
                    coverImage={null}
                    products={filteredProducts.slice(0, 9).map(p => ({
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
                    totalCount={filteredProducts.length}
                  />
                </div>
              )}

              {/* Hidden Recent Uploads toggle when editing */}
              {filteredProducts.length > 0 && !showRecentUploads && isEditingCollections && isOwnProfile && (
                <div className="mb-10 p-4 border border-dashed border-border rounded-lg opacity-50">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleRecentUploadsVisibility(true)}
                    >
                      <EyeOff className="w-4 h-4 text-destructive" />
                    </Button>
                    <span className="text-sm text-muted-foreground">Recent Uploads (Hidden)</span>
                  </div>
                </div>
              )}

              {/* User Created Collections with Drag & Drop */}
              {collections.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={collections.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                    disabled={!isEditingCollections}
                  >
                    <div className="space-y-10">
                      {collections.map((collection) => (
                        <SortableCollectionItem
                          key={collection.id}
                          collection={collection}
                          isEditing={isEditingCollections && isOwnProfile}
                          onToggleVisibility={toggleCollectionVisibility}
                          onDelete={(id) => setDeleteCollectionId(id)}
                          onEdit={handleEditCollection}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
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

      {/* Edit Collection Dialog */}
      <EditCollectionDialog
        open={showEditCollection}
        onOpenChange={setShowEditCollection}
        collection={editingCollection}
        onUpdated={() => {
          if (profile) {
            fetchCollections(profile.id, isOwnProfile);
          }
        }}
      />

      {/* Delete Collection Confirmation */}
      <AlertDialog open={!!deleteCollectionId} onOpenChange={(open) => !open && setDeleteCollectionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this collection. The products inside will not be deleted, 
              only the collection grouping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCollectionId && handleDeleteCollection(deleteCollectionId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};

export default ProfilePage;
