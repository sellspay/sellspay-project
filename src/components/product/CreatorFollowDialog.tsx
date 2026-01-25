import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Loader2, UserPlus, Package, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CreatorInfo {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  verified: boolean | null;
  user_id?: string | null;
}

interface CreatorFollowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creator: CreatorInfo | null;
  onFollow: () => Promise<void>;
  isFollowing: boolean;
}

export function CreatorFollowDialog({
  open,
  onOpenChange,
  creator,
  onFollow,
  isFollowing,
}: CreatorFollowDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [stats, setStats] = useState({
    productCount: 0,
    followerCount: 0,
    followingCount: 0,
  });

  useEffect(() => {
    if (open && creator?.id) {
      fetchCreatorStats();
      checkOwnerStatus();
    }
  }, [open, creator?.id]);

  const checkOwnerStatus = async () => {
    if (!creator?.user_id) {
      // Try to get user_id from public_profiles view (public access)
      const { data: profile } = await supabase
        .from("public_profiles")
        .select("user_id")
        .eq("id", creator?.id || "")
        .maybeSingle();
      
      if (profile?.user_id) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.user_id)
          .eq("role", "owner")
          .maybeSingle();
        setIsOwner(!!roleData);
      }
    } else {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", creator.user_id)
        .eq("role", "owner")
        .maybeSingle();
      setIsOwner(!!roleData);
    }
  };

  const fetchCreatorStats = async () => {
    if (!creator?.id) return;

    try {
      // Fetch product count
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", creator.id)
        .eq("status", "published");

      // Fetch followers count
      const { count: followerCount } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", creator.id);

      // Fetch following count
      const { count: followingCount } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", creator.id);

      setStats({
        productCount: productCount || 0,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
      });
    } catch (error) {
      console.error("Error fetching creator stats:", error);
    }
  };

  const handleFollow = async () => {
    setLoading(true);
    try {
      await onFollow();
    } finally {
      setLoading(false);
    }
  };

  if (!creator) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Follow to Get Access</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          {/* Avatar */}
          <Avatar className="w-24 h-24 border-4 border-primary/20">
            <AvatarImage src={creator.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl">
              {(creator.username || creator.full_name || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Username & Verified Badge */}
          <div className="flex items-center gap-2 mt-4">
            <h3 className="text-lg font-semibold">@{creator.username || "user"}</h3>
            {creator.verified && <VerifiedBadge size="md" isOwner={isOwner} />}
          </div>

          {/* Full Name */}
          {creator.full_name && (
            <p className="text-muted-foreground text-sm">{creator.full_name}</p>
          )}

          {/* Bio */}
          {creator.bio && (
            <p className="text-center text-sm text-muted-foreground mt-3 max-w-xs line-clamp-3">
              {creator.bio}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Package className="w-4 h-4" />
              <span className="font-medium text-foreground">{stats.productCount}</span>
              <span>Products</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="font-medium text-foreground">{stats.followerCount}</span>
              <span>Followers</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="font-medium text-foreground">{stats.followingCount}</span>
              <span>Following</span>
            </div>
          </div>

          {/* Follow Button */}
          <Button
            onClick={handleFollow}
            disabled={loading || isFollowing}
            className="mt-6 w-full max-w-xs"
            size="lg"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            {isFollowing ? "Following" : "Follow to Unlock"}
          </Button>

          <p className="text-xs text-muted-foreground mt-3 text-center max-w-xs">
            Follow this creator to access their free downloads
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
