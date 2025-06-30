import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, X, User, MapPin, Church, BookOpen, Users, Calendar } from 'lucide-react';

interface Match {
  user_id: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    profile_picture_urls: string[] | null;
    city: string | null;
    state: string | null;
    gender: string | null;
    church_name: string | null;
    marital_status: string | null;
    has_kids: string | null;
    pastor_name: string | null;
    life_verse: string | null;
    age_range: string | null;
  };
  compatibility_score: number;
}

interface ProfileViewPopupProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onMatchResponse: (targetUserId: string, response: 'yes' | 'no') => void;
  eventId: string;
}

const ProfileViewPopup = ({ match, isOpen, onClose, onMatchResponse, eventId }: ProfileViewPopupProps) => {
  const { user } = useAuth();

  useEffect(() => {
    // Track profile view when popup opens
    const trackProfileView = async () => {
      if (match && user && isOpen) {
        try {
          await supabase
            .from('profile_views')
            .upsert({
              viewer_id: user.id,
              viewed_user_id: match.user_id,
              event_id: eventId,
              viewed_at: new Date().toISOString()
            });
        } catch (error) {
          console.error('Error tracking profile view:', error);
        }
      }
    };

    trackProfileView();
  }, [match, user, isOpen, eventId]);

  if (!match) return null;

  const getDisplayName = () => {
    if (match.profile?.display_name) return match.profile.display_name;
    if (match.profile?.first_name && match.profile?.last_name) {
      return `${match.profile.first_name} ${match.profile.last_name}`;
    }
    return match.profile?.first_name || 'Anonymous User';
  };

  const profilePictures = match.profile?.profile_picture_urls || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Profile Pictures Grid */}
          <div className="grid grid-cols-2 gap-2">
            {profilePictures.length > 0 ? (
              profilePictures.slice(0, 4).map((url, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden">
                  <img 
                    src={url} 
                    alt={`${getDisplayName()} - Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-2 aspect-square rounded-lg bg-gray-200 flex items-center justify-center">
                <User className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold">{getDisplayName()}</h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {match.profile?.age_range || 'Age not specified'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {match.profile?.city && match.profile?.state && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{match.profile.city}, {match.profile.state}</span>
                </div>
              )}
              
              {match.profile?.gender && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{match.profile.gender}</span>
                </div>
              )}

              {match.profile?.church_name && (
                <div className="flex items-center gap-2">
                  <Church className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{match.profile.church_name}</span>
                </div>
              )}

              {match.profile?.marital_status && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{match.profile.marital_status}</span>
                </div>
              )}

              {match.profile?.has_kids && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Has kids: {match.profile.has_kids}</span>
                </div>
              )}

              {match.profile?.pastor_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Pastor: {match.profile.pastor_name}</span>
                </div>
              )}
            </div>

            {match.profile?.life_verse && (
              <div className="p-4 bg-accent/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Life Verse</span>
                </div>
                <p className="text-sm italic">{match.profile.life_verse}</p>
              </div>
            )}

            {/* Compatibility Score */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full">
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="text-sm font-medium">
                  {match.compatibility_score}% Compatibility
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onMatchResponse(match.user_id, 'no')}
            >
              <X className="h-4 w-4 mr-2" />
              Pass
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              onClick={() => onMatchResponse(match.user_id, 'yes')}
            >
              <Heart className="h-4 w-4 mr-2" />
              Like
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileViewPopup;
