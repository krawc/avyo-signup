
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';
import { User, Heart, X, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { getSignedUrls } from '@/lib/utils';
import MatchOverlay from './MatchOverlay';
import MatchesTable from './MatchesTable';

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

interface EventMatchesProps {
  eventId: string;
}

const EventMatches = ({ eventId }: EventMatchesProps) => {
  const { user } = useAuth();
  const [topMatches, setTopMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [matchOverlay, setMatchOverlay] = useState<Match | null>(null);

  useEffect(() => {
    if (user) {
      loadTopMatches();
    }
  }, [eventId, user]);

  const loadTopMatches = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-filtered-matches', {
        body: { eventId, limit: 5 }
      });

      if (error) throw error;

      // Sign profile picture URLs
      const matchesWithSignedUrls = await Promise.all(
        data.map(async (match: Match) => {
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

      setTopMatches(matchesWithSignedUrls);
    } catch (error) {
      console.error('Error loading top matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchResponse = async (targetUserId: string, response: 'yes' | 'no') => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('handle-match-response', {
        body: { eventId, targetUserId, response }
      });

      if (error) throw error;

      // Remove the match from the current list
      setTopMatches(prev => prev.filter(match => match.user_id !== targetUserId));

      // Show match overlay if it's a mutual match
      if (data.isMutualMatch && response === 'yes') {
        const matchedUser = topMatches.find(match => match.user_id === targetUserId);
        if (matchedUser) {
          setMatchOverlay(matchedUser);
        }
      }

    } catch (error) {
      console.error('Error handling match response:', error);
    }
  };

  const handleGoToDM = () => {
    setMatchOverlay(null);
    // Navigate to messages tab - this could be enhanced to navigate directly to the specific conversation
    const messagesTab = document.querySelector('[data-tab="messages"]') as HTMLElement;
    if (messagesTab) {
      messagesTab.click();
    }
  };

  const getDisplayName = (profile: Match['profile']) => {
    if (!profile) return 'Anonymous User';
    
    if (profile.display_name) return profile.display_name;
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.first_name || 'Anonymous User';
  };

  const getAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getLocation = (profile: Match['profile']) => {
    if (!profile || !profile.city || !profile.state) return null;
    return `${profile.city}, ${profile.state}`;
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-pulse">Loading your matches...</div>
      </div>
    );
  }

  return (
    <>
      <Card className="gradient-card border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Top 5 Matches
          </h3>
          
          {topMatches.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
              <p className="text-muted-foreground">Check back later as more people join the event!</p>
            </div>
          ) : (
            <Carousel 
              className="w-full" 
              opts={{
                align: "start",
                loop: true,
              }}
            >
              <CarouselContent>
                {topMatches.map((match) => (
                  <CarouselItem key={match.user_id} className="basis-full">
                    <Card className="border">
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <Avatar className="h-24 w-24 mx-auto ring-2 ring-white/50">
                            <AvatarImage 
                              src={match.profile?.profile_picture_urls?.[0] || ''} 
                              alt={getDisplayName(match.profile)} 
                            />
                            <AvatarFallback className="bg-gradient-to-br from-pink-100 to-purple-100">
                              <User className="h-10 w-10" />
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <h4 className="font-semibold text-xl">
                              {getDisplayName(match.profile)}
                            </h4>
                            
                            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground mt-2">
                              {getAge(match.profile?.date_of_birth) && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {getAge(match.profile?.date_of_birth)}
                                </div>
                              )}
                              {getLocation(match.profile) && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {getLocation(match.profile)}
                                </div>
                              )}
                            </div>
                          </div>

                          <Badge variant="secondary" className="bg-gradient-to-r from-pink-100 to-purple-100">
                            {match.compatibility_score}% match
                          </Badge>

                          <div className="flex gap-3 pt-2">
                            <Button 
                              variant="outline" 
                              size="default" 
                              className="flex-1 border-red-200 hover:bg-red-50"
                              onClick={() => handleMatchResponse(match.user_id, 'no')}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Pass
                            </Button>
                            <Button 
                              size="default" 
                              className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
                              onClick={() => handleMatchResponse(match.user_id, 'yes')}
                            >
                              <Heart className="h-4 w-4 mr-2" />
                              Like
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}

          <div className="mt-6">
            <Button 
              variant="ghost" 
              onClick={() => setShowAllMatches(!showAllMatches)}
              className="w-full flex items-center gap-2"
            >
              {showAllMatches ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide All Matches
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  View All Matches
                </>
              )}
            </Button>

            {showAllMatches && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-lg font-semibold mb-4">All Matches</h4>
                <MatchesTable 
                  eventId={eventId} 
                  excludeUserIds={topMatches.map(match => match.user_id)}
                  onMatchResponse={handleMatchResponse}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {matchOverlay && (
        <MatchOverlay
          match={matchOverlay}
          onClose={() => setMatchOverlay(null)}
          onGoToDM={handleGoToDM}
        />
      )}
    </>
  );
};

export default EventMatches;
