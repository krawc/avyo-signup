
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
import { getSignedUrls } from '@/lib/utils';

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

// Placeholder matches for events with no participants
const createPlaceholderMatches = (): Match[] => [
  {
    user_id: 'placeholder-1',
    profile: {
      first_name: 'Sarah',
      last_name: 'M.',
      display_name: 'Sarah M.',
      profile_picture_urls: ['https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face']
    },
    compatibility_score: 92
  },
  {
    user_id: 'placeholder-2',
    profile: {
      first_name: 'Michael',
      last_name: 'K.',
      display_name: 'Michael K.',
      profile_picture_urls: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face']
    },
    compatibility_score: 88
  },
  {
    user_id: 'placeholder-3',
    profile: {
      first_name: 'Jessica',
      last_name: 'L.',
      display_name: 'Jessica L.',
      profile_picture_urls: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face']
    },
    compatibility_score: 85
  }
];

const EventMatches = ({ eventId, onInteractionAttempt }: EventMatchesProps) => {
  const { user } = useAuth();
  const [topMatches, setTopMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [matchOverlay, setMatchOverlay] = useState<{
    show: boolean;
    match: Match | null;
  }>({ show: false, match: null });
  const [showPlaceholders, setShowPlaceholders] = useState(false);

  useEffect(() => {
    console.log(eventId, user)
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
      
      // If no real matches, check if event has very few participants and show placeholders
      if (matchesWithSignedUrls.length === 0) {
        const { data: attendeeCount } = await supabase
          .from('event_attendees')
          .select('id', { count: 'exact' })
          .eq('event_id', eventId);
        
        // Show placeholders if event has 3 or fewer attendees (including current user)
        if (!attendeeCount || attendeeCount.length <= 3) {
          setShowPlaceholders(true);
          setTopMatches(createPlaceholderMatches());
        } else {
          setTopMatches([]);
        }
      } else {
        setTopMatches(matchesWithSignedUrls);
        setShowPlaceholders(false);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchResponse = async (targetUserId: string, response: 'yes' | 'no') => {
    // For placeholder matches, always trigger payment
    if (targetUserId.startsWith('placeholder-') || onInteractionAttempt) {
      if (onInteractionAttempt) {
        onInteractionAttempt();
      }
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
                {showPlaceholders && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                    Preview
                  </span>
                )}
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
            {topMatches.length === 0 && !showPlaceholders ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-base md:text-lg font-semibold mb-2">No matches yet</h3>
                <p className="text-muted-foreground text-sm">Check back soon for potential connections!</p>
              </div>
            ) : (
              <>
                {showPlaceholders && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Preview:</strong> These are example profiles to show you what matches will look like. 
                      Real matches will appear as more people join this event!
                    </p>
                  </div>
                )}
                <MatchesTable 
                  eventId={eventId}
                  excludeUserIds={[]}
                  onMatchResponse={handleMatchResponse}
                  matches={topMatches}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Previous Matches - only show if not using placeholders */}
        {!showPlaceholders && (
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
        )}
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

export default EventMatches;
