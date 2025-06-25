
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Heart, X, MapPin, Eye } from 'lucide-react';
import { getSignedUrls } from '@/lib/utils';
import ProfileViewPopup from './ProfileViewPopup';

interface Match {
  user_id: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    city: string | null;
    state: string | null;
    date_of_birth: string | null;
    profile_picture_urls: string[] | null;
  };
  compatibility_score: number;
}

interface MatchesTableProps {
  eventId: string;
  excludeUserIds?: string[];
  onMatchResponse: (targetUserId: string, response: 'yes' | 'no') => void;
}

const MatchesTable = ({ eventId, excludeUserIds = [], onMatchResponse }: MatchesTableProps) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  useEffect(() => {
    if (user) {
      loadMatches();
    }
  }, [eventId, user, excludeUserIds]);

  const loadMatches = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-filtered-matches', {
        body: { eventId, limit: 50 }
      });

      if (error) throw error;

      // Filter out excluded users (top 5 matches)
      const filteredData = data.filter((match: Match) => 
        !excludeUserIds.includes(match.user_id)
      );

      // Sign profile picture URLs
      const matchesWithSignedUrls = await Promise.all(
        filteredData.map(async (match: Match) => {
          const rawUrls: string[] = match.profile?.profile_picture_urls || [];
          const signedUrls = await getSignedUrls(rawUrls);
          
          return {
            ...match,
            profile: {
              ...match.profile,
              profile_picture_urls: signedUrls,
            }
          };
        })
      );

      setMatches(matchesWithSignedUrls);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = (targetUserId: string, response: 'yes' | 'no') => {
    // Remove the match from the current list
    setMatches(prev => prev.filter(match => match.user_id !== targetUserId));
    // Call the parent handler
    onMatchResponse(targetUserId, response);
  };

  const handleViewProfile = (userId: string) => {
    setSelectedProfileId(userId);
    setShowProfilePopup(true);
  };

  const getDisplayName = (profile: Match['profile']) => {
    if (!profile) return 'Anonymous User';
    
    if (profile.display_name) return profile.display_name;
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.first_name || 'Anonymous User';
  };

  const getLocation = (profile: Match['profile']) => {
    if (!profile || !profile.city || !profile.state) return null;
    return `${profile.city}, ${profile.state}`;
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-pulse">Loading matches...</div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No more matches</h3>
        <p className="text-muted-foreground">You've seen all available matches for this event!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {matches.map((match) => (
          <div 
            key={match.user_id} 
            className="flex items-center justify-between p-4 border rounded-lg bg-white/50"
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 ring-2 ring-white/50">
                <AvatarImage 
                  src={match.profile?.profile_picture_urls?.[0] || ''} 
                  alt={getDisplayName(match.profile)} 
                />
                <AvatarFallback className="bg-gradient-to-br from-pink-100 to-purple-100">
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-1">
                <h4 className="font-semibold text-lg">
                  {getDisplayName(match.profile)}
                </h4>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {getLocation(match.profile) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {getLocation(match.profile)}
                    </div>
                  )}
                </div>

                <Badge variant="secondary" className="bg-gradient-to-r from-pink-100 to-purple-100">
                  {match.compatibility_score}% match
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-blue-200 hover:bg-blue-50"
                onClick={() => handleViewProfile(match.user_id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-red-200 hover:bg-red-50"
                onClick={() => handleResponse(match.user_id, 'no')}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
                onClick={() => handleResponse(match.user_id, 'yes')}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ProfileViewPopup
        userId={selectedProfileId}
        eventId={eventId}
        isOpen={showProfilePopup}
        onClose={() => {
          setShowProfilePopup(false);
          setSelectedProfileId(null);
        }}
        onMatchResponse={handleResponse}
      />
    </>
  );
};

export default MatchesTable;
