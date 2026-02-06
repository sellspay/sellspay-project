import { Link } from 'react-router-dom';
import { Store, Package, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { CREATOR_CATEGORIES } from './creatorCategories';

export interface Creator {
  id: string;
  user_id: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  verified: boolean | null;
  isOwner: boolean;
  creator_tags: string[];
  niche: string;
  stats: {
    productCount: number;
    salesCount: string;
  };
}

interface CreatorCardProps {
  creator: Creator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <Link
      to={`/@${creator.username || creator.id}`}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5"
    >
      {/* BRAND BANNER */}
      <div className="relative h-28 overflow-hidden">
        <ImageWithFallback
          src={creator.banner_url}
          alt={`${creator.full_name || creator.username} banner`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
      </div>

      {/* CARD CONTENT */}
      <div className="relative px-5 pb-5 -mt-10">
        {/* Avatar & CTA Row */}
        <div className="flex items-end justify-between mb-3">
          <div className="relative">
            <Avatar className="w-16 h-16 ring-4 ring-card shadow-lg">
              <AvatarImage src={creator.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-violet-500/20 text-primary text-xl font-medium">
                {(creator.username || 'C').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {creator.verified && (
              <div className="absolute -bottom-1 -right-1">
                <VerifiedBadge isOwner={creator.isOwner} size="sm" />
              </div>
            )}
          </div>
          
          {/* CTA BUTTON */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-lg">
            Visit Store
            <Store size={12} />
          </button>
        </div>
        
        {/* Brand Name & Niche */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-foreground truncate">
              {creator.full_name || creator.username || 'Creator'}
            </h3>
            {creator.isOwner && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-primary to-violet-500 text-primary-foreground rounded-full">
                Admin
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-0.5">{creator.niche}</p>
          <p className="text-xs bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent font-medium">
            @{creator.username || 'creator'}
          </p>
        </div>
        
        {/* Description */}
        {creator.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">
            {creator.bio}
          </p>
        )}
        {!creator.bio && <div className="mb-3 min-h-[2rem]" />}

        {/* TAGS (Categories) */}
        {creator.creator_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {creator.creator_tags.slice(0, 3).map(tag => {
              const cat = CREATOR_CATEGORIES.find(c => c.id === tag);
              const Icon = cat?.icon;
              return (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-muted/50 text-muted-foreground rounded-full capitalize"
                >
                  {Icon && <Icon size={10} />}
                  {cat?.label || tag}
                </span>
              );
            })}
          </div>
        )}

        {/* STORE STATS */}
        <div className="flex items-center gap-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package size={12} />
            <span className="font-medium">{creator.stats.productCount}</span>
            <span className="hidden sm:inline">Products</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star size={12} className="text-amber-400" />
            <span className="font-medium">{creator.stats.salesCount}</span>
            <span className="hidden sm:inline">Sold</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
