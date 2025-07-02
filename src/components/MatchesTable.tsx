
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, X, User, Eye } from 'lucide-react';
import ProfileViewPopup from './ProfileViewPopup';
import { getSignedUrls } from '@/lib/utils';

interface Match {
  user_id: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    profile_picture_urls: string[] | null;
    age_range: string | null;
    city: string | null;
    state: string | null;
    gender: string | null;
    church_name: string | null;
    marital_status: string | null;
    has_kids: string | null;
    pastor_name: string | null;
    life_verse: string | null;
  };
  compatibility_score: number;
}

interface MatchesTableProps {
  eventId: string;
  excludeUserIds: string[];
  onMatchResponse: (targetUserId: string, response: 'yes' | 'no') => void;
  matches?: Match[]; // Optional prop to pass matches directly
}

const MatchesTable = ({ eventId, excludeUserIds, onMatchResponse, matches: propMatches }: MatchesTableProps) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  useEffect(() => {
    if (propMatches) {
      setMatches(propMatches);
      setLoading(false);
    } else if (user) {
      loadMatches();
    }
  }, [eventId, user, excludeUserIds, propMatches]);

  const loadMatches = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-filtered-matches', {
        body: { 
          eventId, 
          excludeUserIds,
          limit: 20 
        }
      });

      if (error) throw error;

      const matchesWithSignedUrls = await Promise.all(
        (data || []).map(async (match: Match) => {
          const rawUrls: string[] = match.profile?.profile_picture_urls || [];
          const signedUrls = await getSignedUrls(rawUrls);
          console.log(rawUrls)
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

  const handleViewProfile = (match: Match) => {
    setSelectedMatch(match);
    setShowProfilePopup(true);
  };

  const handleProfilePopupClose = () => {
    setShowProfilePopup(false);
    setSelectedMatch(null);
  };

  const handleMatchResponseFromPopup = (targetUserId: string, response: 'yes' | 'no') => {
    onMatchResponse(targetUserId, response);
    handleProfilePopupClose();
  };

  const getDisplayName = (profile: Match['profile']) => {
    if (!profile) return 'Anonymous User';
    if (profile.display_name) return profile.display_name;
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.first_name || 'Anonymous User';
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
      <div className="text-center py-8 text-muted-foreground">
        No matches found for this event.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {matches.map((match) => (
          <div key={match.user_id} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border bg-card">
            <Avatar className="h-12 w-12 md:h-16 md:w-16 flex-shrink-0">
              <AvatarImage 
                src={match.profile?.profile_picture_urls?.[0] || ''} 
                alt={getDisplayName(match.profile)} 
              />
              <AvatarFallback>
                <User className="h-6 w-6 md:h-8 md:w-8" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold truncate text-sm md:text-base">
                  {getDisplayName(match.profile)}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {match.compatibility_score}% match
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                {match.profile?.city && match.profile?.state 
                  ? `${match.profile.city}, ${match.profile.state}` 
                  : 'Location not specified'}
              </p>
            </div>
            
            <div className="flex gap-1 md:gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewProfile(match)}
                className="px-2 md:px-3"
              >
                <Eye className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                <span className="hidden md:inline">View</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMatchResponse(match.user_id, 'no')}
                className="px-2 md:px-3"
              >
                <X className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-2 md:px-3"
                onClick={() => onMatchResponse(match.user_id, 'yes')}
              >
                <Heart className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ProfileViewPopup
        match={selectedMatch}
        isOpen={showProfilePopup}
        onClose={handleProfilePopupClose}
        onMatchResponse={handleMatchResponseFromPopup}
        eventId={eventId}
      />
    </>
  );
};

export default MatchesTable;
