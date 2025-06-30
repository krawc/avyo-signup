import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, X, User, Eye } from 'lucide-react';
import ProfileViewPopup from './ProfileViewPopup';

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
}

const MatchesTable = ({ eventId, excludeUserIds, onMatchResponse }: MatchesTableProps) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
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
        body: { 
          eventId, 
          excludeUserIds,
          limit: 20 
        }
      });

      if (error) throw error;

      // Sign profile picture URLs
      const matchesWithSignedUrls = await Promise.all(
        (data || []).map(async (match: Match) => {
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

  const getSignedUrls = async (urls: string[]): Promise<string[]> => {
    if (!urls || urls.length === 0) return [];
    
    try {
      const signedUrls = await Promise.all(
        urls.map(async (url) => {
          if (!url) return '';
          
          // Extract the file path from the full URL
          const urlParts = url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const bucketPath = `profile-pictures/${fileName}`;
          
          const { data } = await supabase.storage
            .from('profile-pictures')
            .createSignedUrl(bucketPath, 3600); // 1 hour expiry
          
          return data?.signedUrl || '';
        })
      );
      
      return signedUrls;
    } catch (error) {
      console.error('Error creating signed URLs:', error);
      return urls; // Return original URLs as fallback
    }
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
          <div key={match.user_id} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={match.profile?.profile_picture_urls?.[0] || ''} 
                alt={getDisplayName(match.profile)} 
              />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">
                  {getDisplayName(match.profile)}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {match.compatibility_score}% match
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {match.profile?.city && match.profile?.state 
                  ? `${match.profile.city}, ${match.profile.state}` 
                  : 'Location not specified'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewProfile(match)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMatchResponse(match.user_id, 'no')}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                onClick={() => onMatchResponse(match.user_id, 'yes')}
              >
                <Heart className="h-4 w-4" />
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
