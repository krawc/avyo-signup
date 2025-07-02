
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Clock, CheckCircle, Eye } from 'lucide-react';
import ProfileViewPopup from './ProfileViewPopup';
import { getSignedUrls } from '@/lib/utils';

interface MatchResponse {
  target_user_id: string;
  response: string;
  created_at: string;
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
  mutual_match: boolean;
}

interface PreviousMatchesProps {
  eventId: string;
  onInteractionAttempt?: () => void;
}

const PreviousMatches = ({ eventId, onInteractionAttempt }: PreviousMatchesProps) => {
  const { user } = useAuth();
  const [previousMatches, setPreviousMatches] = useState<MatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreviousMatches();
    }
  }, [eventId, user]);

  const loadPreviousMatches = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('match_responses')
        .select(`
          target_user_id,
          response,
          created_at,
          profiles!match_responses_target_user_id_fkey(
            first_name,
            last_name,
            display_name,
            profile_picture_urls,
            age_range,
            city,
            state,
            gender,
            church_name,
            marital_status,
            has_kids,
            pastor_name,
            life_verse
          )
        `)
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .eq('response', 'yes')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check for mutual matches
      const matchesWithMutualStatus = await Promise.all(
        (data || []).map(async (match) => {
          const { data: mutualData, error: mutualError } = await supabase
            .from('match_responses')
            .select('response')
            .eq('user_id', match.target_user_id)
            .eq('target_user_id', user.id)
            .eq('event_id', eventId)
            .single();

          const isMutual = !mutualError && mutualData?.response === 'yes';

          // Only show matches that haven't been rejected
          if (!mutualError || mutualError.code === 'PGRST116') {
            return {
              ...match,
              mutual_match: isMutual,
              profile: match.profiles
            };
          }
          return null;
        })
      );

      const filteredMatches = matchesWithMutualStatus.filter(match => match !== null);
      
      // Sign URLs for profile pictures
      const matchesWithSignedUrls = await Promise.all(
        filteredMatches.map(async (match) => {
          if (!match) return match;
          
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

      setPreviousMatches(matchesWithSignedUrls.filter(Boolean));
    } catch (error) {
      console.error('Error loading previous matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (match: MatchResponse) => {
    const formattedMatch = {
      user_id: match.target_user_id,
      profile: match.profile,
      compatibility_score: 0 // Not needed for view-only
    };
    setSelectedMatch(formattedMatch);
    setShowProfilePopup(true);
  };

  const handleProfilePopupClose = () => {
    setShowProfilePopup(false);
    setSelectedMatch(null);
  };

  const getDisplayName = (profile: MatchResponse['profile']) => {
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
        <div className="animate-pulse">Loading previous matches...</div>
      </div>
    );
  }

  if (previousMatches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-4" />
        <p className="text-sm">No previous matches yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {previousMatches.map((match) => (
          <div key={match.target_user_id} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
            <Avatar className="h-12 w-12 md:h-16 md:w-16">
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
                {match.mutual_match ? (
                  <Badge variant="default" className="text-xs flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Matched
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                )}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                {match.profile?.city && match.profile?.state 
                  ? `${match.profile.city}, ${match.profile.state}` 
                  : 'Location not specified'}
              </p>
            </div>
            
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewProfile(match)}
                className="text-xs md:text-sm"
              >
                <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                View
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ProfileViewPopup
        match={selectedMatch}
        isOpen={showProfilePopup}
        onClose={handleProfilePopupClose}
        onMatchResponse={() => {}} // Read-only mode
        eventId={eventId}
        readOnly={true}
      />
    </>
  );
};

export default PreviousMatches;
