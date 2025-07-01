import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn, getDisplayName } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import UserActionsDropdown from './UserActionsDropdown';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  date_of_birth: string | null;
  age_range: string | null;
  gender: string | null;
  phone_number: string | null;
  city: string | null;
  state: string | null;
  church_name: string | null;
  marital_status: string | null;
  has_kids: string | null;
  life_verse: string | null;
  profile_picture_urls: string[] | null;
}

interface EventMatchesProps {
  eventId: string;
  onInteractionAttempt?: () => void;
}

const EventMatches = ({ eventId, onInteractionAttempt }: EventMatchesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [likedProfiles, setLikedProfiles] = useState<string[]>([]);
  const [matchedProfiles, setMatchedProfiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId && user) {
      fetchEventProfiles();
      fetchLikedProfiles();
      fetchMatchedProfiles();
    }
  }, [eventId, user]);

  const fetchEventProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select('user_id, profiles(*)')
        .eq('event_id', eventId)
        .neq('user_id', user!.id) // Exclude current user
        .returns<{ user_id: string; profiles: Profile }[]>();

      if (error) throw error;

      const profilesData = data.map(item => item.profiles).filter(Boolean) as Profile[];
      setProfiles(profilesData);
    } catch (error) {
      console.error('Error fetching event profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profiles. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('match_responses')
        .select('target_user_id')
        .eq('event_id', eventId)
        .eq('user_id', user!.id)
        .eq('response', 'like')
        .returns<{ target_user_id: string }[]>();

      if (error) throw error;
      setLikedProfiles(data.map(item => item.target_user_id));
    } catch (error) {
      console.error('Error fetching liked profiles:', error);
    }
  };

  const fetchMatchedProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('event_id', eventId)
        .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
        .returns<{ user1_id: string; user2_id: string }[]>();

      if (error) throw error;

      const matchedUserIds = data.map(match =>
        match.user1_id === user!.id ? match.user2_id : match.user1_id
      );
      setMatchedProfiles(matchedUserIds);
    } catch (error) {
      console.error('Error fetching matched profiles:', error);
    }
  };

  const handleLike = async (targetUserId: string) => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'You must be logged in to like a profile.',
      });
      return;
    }

    if (onInteractionAttempt) {
      onInteractionAttempt();
      return;
    }

    try {
      const { error } = await supabase
        .from('match_responses')
        .insert({
          event_id: eventId,
          user_id: user.id,
          target_user_id: targetUserId,
          response: 'like',
        });

      if (error) throw error;

      setLikedProfiles(prev => [...prev, targetUserId]);
      toast({
        title: 'Profile Liked',
        description: 'You have liked this profile.',
      });
    } catch (error) {
      console.error('Error liking profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to like profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleMessage = (targetUserId: string) => {
    if (onInteractionAttempt) {
      onInteractionAttempt();
    } else {
      // Implement direct navigation to messages or trigger a chat modal
      toast({
        title: 'Message Feature',
        description: 'This feature is under development.',
      });
    }
  };

  const isLiked = (profileId: string) => likedProfiles.includes(profileId);
  const isMatched = (profileId: string) => matchedProfiles.includes(profileId);

  const renderProfileCard = (profile: Profile, isLiked: boolean, isMatched: boolean) => (
    <Card key={profile.id} className="gradient-card border-0 shadow-lg overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {/* Profile Image */}
          <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center relative">
            {profile.profile_picture_urls && profile.profile_picture_urls.length > 0 ? (
              <img
                src={profile.profile_picture_urls[0]}
                alt={getDisplayName(profile)}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <User className="h-20 w-20 text-gray-400" />
            )}
            
            {/* User Actions Dropdown */}
            <div className="absolute top-2 right-2">
              <UserActionsDropdown 
                userId={profile.id} 
                userName={getDisplayName(profile)}
                className="bg-white/80 hover:bg-white/90"
              />
            </div>
          </div>

          {/* Profile Info */}
          <div className="p-4">
            <h3 className="font-semibold text-lg">{getDisplayName(profile)}</h3>
            <p className="text-sm text-muted-foreground">
              {profile.city}, {profile.state}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {profile.age_range && (
                <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full">
                  {profile.age_range}
                </span>
              )}
              {profile.marital_status && (
                <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full">
                  {profile.marital_status}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-around border-t p-4">
            <Button
              variant="outline"
              className={cn({ 'opacity-50 cursor-not-allowed': isLiked(profile.id) })}
              onClick={() => handleLike(profile.id)}
              disabled={isLiked(profile.id)}
            >
              <Heart className="h-5 w-5 mr-2" />
              {isLiked(profile.id) ? 'Liked' : 'Like'}
            </Button>
            <Button variant="outline" onClick={() => handleMessage(profile.id)}>
              <MessageCircle className="h-5 w-5 mr-2" />
              Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {loading ? (
        <div className="text-center py-8 col-span-full">
          <div className="animate-pulse">Loading profiles...</div>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-8 col-span-full text-muted-foreground">
          No profiles found for this event.
        </div>
      ) : (
        profiles.map(profile => renderProfileCard(profile, isLiked(profile.id), isMatched(profile.id)))
      )}
    </div>
  );
};

export default EventMatches;
