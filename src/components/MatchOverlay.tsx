
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, User, MessageCircle } from 'lucide-react';
import { getSignedUrls } from '@/lib/utils';

interface Match {
  user_id: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    profile_picture_urls: string[] | null;
  };
}

interface MatchOverlayProps {
  match: Match;
  onClose: () => void;
  onGoToDM: () => void;
}

const MatchOverlay = ({ match, onClose, onGoToDM }: MatchOverlayProps) => {
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');

  useEffect(() => {
    const loadProfileImage = async () => {
      if (match.profile?.profile_picture_urls?.[0]) {
        const signedUrls = await getSignedUrls([match.profile.profile_picture_urls[0]]);
        setProfileImageUrl(signedUrls[0] || '');
      }
    };
    loadProfileImage();
  }, [match]);

  const getDisplayName = () => {
    if (match.profile?.display_name) return match.profile.display_name;
    if (match.profile?.first_name && match.profile?.last_name) {
      return `${match.profile.first_name} ${match.profile.last_name}`;
    }
    return match.profile?.first_name || 'Anonymous User';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-300">
      <Card className="max-w-sm mx-4 bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200 shadow-2xl">
        <CardContent className="p-6 text-center space-y-4">
          <div className="flex justify-center">
            <Heart className="h-12 w-12 text-pink-500 animate-bounce" />
          </div>
          
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            It's a Match!
          </h2>
          
          <div className="flex justify-center">
            <Avatar className="h-20 w-20 ring-4 ring-pink-200">
              <AvatarImage 
                src={profileImageUrl} 
                alt={getDisplayName()} 
              />
              <AvatarFallback className="bg-gradient-to-br from-pink-100 to-purple-100">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
          </div>
          
          <p className="text-lg font-semibold text-gray-800">
            You and {getDisplayName()} liked each other! Send them a message.
          </p>
          
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchOverlay;
