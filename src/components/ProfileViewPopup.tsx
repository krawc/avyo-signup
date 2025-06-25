
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, X, MapPin, Church, Quote, Users, User, Calendar, Baby } from 'lucide-react';
import { getSignedUrls } from '@/lib/utils';

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  date_of_birth: string | null;
  age_range: string | null;
  gender: string | null;
  city: string | null;
  state: string | null;
  church_name: string | null;
  denomination: string | null;
  life_verse: string | null;
  has_kids: string | null;
  marital_status: string | null;
  profile_picture_urls: string[] | null;
}

interface ProfileViewPopupProps {
  userId: string | null;
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onMatchResponse?: (targetUserId: string, response: 'yes' | 'no') => void;
}

const ProfileViewPopup = ({ userId, eventId, isOpen, onClose, onMatchResponse }: ProfileViewPopupProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && isOpen) {
      fetchProfile();
    }
  }, [userId, isOpen]);

  const fetchProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Sign profile picture URLs
      const rawUrls: string[] = data.profile_picture_urls || [];
      const signedUrls = await getSignedUrls(rawUrls);
      
      setProfile({
        ...data,
        profile_picture_urls: signedUrls,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchResponse = (response: 'yes' | 'no') => {
    if (userId && onMatchResponse) {
      onMatchResponse(userId, response);
    }
    onClose();
  };

  const getDisplayName = () => {
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

  const getLocation = () => {
    if (!profile || !profile.city || !profile.state) return null;
    return `${profile.city}, ${profile.state}`;
  };

  if (!isOpen || !profile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            {getDisplayName()}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse">Loading profile...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Pictures Grid */}
            {profile.profile_picture_urls && profile.profile_picture_urls.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {profile.profile_picture_urls.slice(0, 4).map((url, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden">
                    <img 
                      src={url} 
                      alt={`${getDisplayName()} photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center">
                <Avatar className="h-32 w-32">
                  <AvatarFallback className="bg-gradient-to-br from-pink-100 to-purple-100">
                    <User className="h-16 w-16" />
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* Profile Information */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{getDisplayName()}</h3>
                <div className="flex justify-center gap-2 mt-2">
                  {getAge(profile.date_of_birth) && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {getAge(profile.date_of_birth)} years old
                    </Badge>
                  )}
                  {profile.age_range && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Baby className="h-3 w-3" />
                      {profile.age_range}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {getLocation() && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{getLocation()}</span>
                  </div>
                )}

                {profile.church_name && (
                  <div className="flex items-center gap-2">
                    <Church className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.church_name}</span>
                  </div>
                )}

                {profile.denomination && (
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.denomination}</span>
                  </div>
                )}

                {profile.life_verse && (
                  <div className="flex items-start gap-2">
                    <Quote className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="italic">"{profile.life_verse}"</span>
                  </div>
                )}

                {profile.has_kids && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Has kids: {profile.has_kids}</span>
                  </div>
                )}

                {profile.marital_status && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Status: {profile.marital_status}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Match/Pass Buttons */}
            {onMatchResponse && userId !== user?.id && (
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 border-red-200 hover:bg-red-50"
                  onClick={() => handleMatchResponse('no')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Pass
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
                  onClick={() => handleMatchResponse('yes')}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Like
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileViewPopup;
