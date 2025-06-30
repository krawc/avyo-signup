
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Users, Eye, Clock, CheckCircle } from 'lucide-react';
import MatchesTable from './MatchesTable';
import MatchOverlay from './MatchOverlay';
import AllMatchesPopup from './AllMatchesPopup';
import PreviousMatches from './PreviousMatches';

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
  const [showAllMatches, setShowAllMatches] = useState(false);
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
      
      const { error: generateError } = await supabase.functions.invoke('generate-matches', {
        body: { eventId, userId: user.id }
      });

      if (generateError) {
        console.error('Error generating matches:', generateError);
      }

      const { data, error } = await supabase.functions.invoke('get-filtered-matches', {
        body: { eventId, limit: 5 }
      });

      if (error) throw error;

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

      if (data.isMutualMatch && response === 'yes') {
        const match = topMatches.find(m => m.user_id === targetUserId);
        if (match) {
          console.log('Mutual match found! Showing overlay');
          setMatchOverlay({ show: true, match });
        }
      }

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
        {/* Your Potential Matches */}
        <Card className="gradient-card border-0 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Heart className="h-4 w-4 md:h-5 md:w-5 text-pink-500" />
                Your Potential Matches
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAllMatches(true)}
                className="text-xs md:text-sm"
              >
                <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                View All Matches
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {topMatches.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-base md:text-lg font-semibold mb-2">No matches yet</h3>
                <p className="text-muted-foreground text-sm">Check back soon for potential connections!</p>
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

        {/* Previous Matches */}
        <Card className="gradient-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              Previous Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PreviousMatches 
              eventId={eventId}
              onInteractionAttempt={onInteractionAttempt}
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

      {/* All Matches Popup */}
      <AllMatchesPopup
        isOpen={showAllMatches}
        onClose={() => setShowAllMatches(false)}
        eventId={eventId}
        onMatchResponse={handleMatchResponse}
        onInteractionAttempt={onInteractionAttempt}
      />
    </>
  );
};

const getSignedUrls = async (urls: string[]): Promise<string[]> => {
  if (!urls || urls.length === 0) return [];
  
  try {
    const signedUrls = await Promise.all(
      urls.map(async (url) => {
        if (!url) return '';
        
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const bucketPath = `profile-pictures/${fileName}`;
        
        const { data } = await supabase.storage
          .from('profile-pictures')
          .createSignedUrl(bucketPath, 3600);
        
        return data?.signedUrl || '';
      })
    );
    
    return signedUrls;
  } catch (error) {
    console.error('Error creating signed URLs:', error);
    return urls;
  }
};

export default EventMatches;
