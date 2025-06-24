
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users } from 'lucide-react';
import MatchesTable from './MatchesTable';
import MatchOverlay from './MatchOverlay';

interface Match {
  user_id: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    profile_picture_urls: string[] | null;
  };
  compatibility_score: number;
}

interface EventMatchesProps {
  eventId: string;
  onInteractionAttempt?: () => void;
}

const EventMatches = ({ eventId, onInteractionAttempt }: EventMatchesProps) => {
  const { user } = useAuth();
  const [topMatches, setTopMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchOverlay, setMatchOverlay] = useState<{
    show: boolean;
    match: Match | null;
  }>({ show: false, match: null });

  useEffect(() => {
    if (user) {
      generateAndLoadMatches();
    }
  }, [eventId, user]);

  const generateAndLoadMatches = async () => {
    if (!user) return;

    try {
      console.log('Generating matches for user:', user.id, 'in event:', eventId);
      
      // First generate matches for this user
      const { error: generateError } = await supabase.functions.invoke('generate-matches', {
        body: { eventId, userId: user.id }
      });

      if (generateError) {
        console.error('Error generating matches:', generateError);
      }

      // Then load the top matches
      const { data, error } = await supabase.functions.invoke('get-filtered-matches', {
        body: { eventId, limit: 5 }
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

      console.log('Loaded matches:', matchesWithSignedUrls.length);
      setTopMatches(matchesWithSignedUrls);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchResponse = async (targetUserId: string, response: 'yes' | 'no') => {
    if (onInteractionAttempt) {
      onInteractionAttempt();
      return;
    }

    if (!user) return;

    try {
      console.log('Handling match response:', response, 'for user:', targetUserId);
      
      const { data, error } = await supabase.functions.invoke('handle-match-response', {
        body: { eventId, targetUserId, response }
      });

      if (error) throw error;

      // Check if it's a mutual match
      if (data.isMutualMatch && response === 'yes') {
        const match = topMatches.find(m => m.user_id === targetUserId);
        if (match) {
          console.log('Mutual match found! Showing overlay');
          setMatchOverlay({ show: true, match });
        }
      }

      // Remove the match from top matches (it will be handled by MatchesTable)
      setTopMatches(prev => prev.filter(match => match.user_id !== targetUserId));
    } catch (error) {
      console.error('Error handling match response:', error);
    }
  };

  const closeMatchOverlay = () => {
    setMatchOverlay({ show: false, match: null });
  };

  const handleGoToDM = () => {
    closeMatchOverlay();
    // The DirectMessages component will automatically update via real-time subscription
    // when the new connection is created
  };

  if (loading) {
    return (
      <Card className="gradient-card border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Loading matches...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Top 5 Matches */}
        <Card className="gradient-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Your Top Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topMatches.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
                <p className="text-muted-foreground">Check back soon for potential connections!</p>
              </div>
            ) : (
              <MatchesTable 
                eventId={eventId}
                excludeUserIds={[]}
                onMatchResponse={handleMatchResponse}
              />
            )}
          </CardContent>
        </Card>

        {/* All Other Matches */}
        <Card className="gradient-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              More Potential Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MatchesTable 
              eventId={eventId}
              excludeUserIds={topMatches.map(match => match.user_id)}
              onMatchResponse={handleMatchResponse}
            />
          </CardContent>
        </Card>
      </div>

      {/* Match Overlay */}
      {matchOverlay.show && matchOverlay.match && (
        <MatchOverlay
          match={matchOverlay.match}
          onClose={closeMatchOverlay}
          onGoToDM={handleGoToDM}
        />
      )}
    </>
  );
};

// Helper function to get signed URLs - keeping it here since it's used in this component
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

export default EventMatches;
