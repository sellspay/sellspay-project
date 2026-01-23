import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Creator {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_creator: boolean | null;
}

export default function Creators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchCreators() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, is_creator')
        .eq('is_creator', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load creators:', error);
        setCreators([]);
      } else {
        setCreators(data || []);
      }
      setLoading(false);
    }

    fetchCreators();
  }, []);

  const filteredCreators = creators.filter((creator) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      creator.username?.toLowerCase().includes(searchLower) ||
      creator.full_name?.toLowerCase().includes(searchLower) ||
      creator.bio?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Creators</h1>
          </div>
          <p className="text-muted-foreground">Discover and follow talented creators in our community</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Creators Grid */}
        {loading ? (
          <div className="text-center text-muted-foreground py-16">Loading creators...</div>
        ) : filteredCreators.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No creators found matching your search' : 'No creators yet. Be the first to become one!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCreators.map((creator) => (
              <Link
                key={creator.id}
                to={`/@${creator.username || creator.id}`}
                className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
              >
                <div className="flex flex-col items-center text-center">
                  <Avatar className="w-20 h-20 mb-4">
                    <AvatarImage src={creator.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xl">
                      {(creator.full_name || creator.username || 'C').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {creator.full_name || creator.username || 'Creator'}
                  </h3>
                  
                  {creator.username && (
                    <p className="text-sm text-muted-foreground">@{creator.username}</p>
                  )}
                  
                  {creator.bio && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {creator.bio}
                    </p>
                  )}
                  
                  <Badge variant="secondary" className="mt-3">
                    Creator
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
