
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, User } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileView {
  id: string;
  viewer_id: string;
  viewed_at: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    profile_picture_urls: string[] | null;
  };
}

interface ProfileViewsListProps {
  eventId: string;
}

const ProfileViewsList = ({ eventId }: ProfileViewsListProps) => {
  const { user } = useAuth();
  const [profileViews, setProfileViews] = useState<ProfileView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfileViews();
    }
  }, [user, eventId]);

  const loadProfileViews = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profile_views')
        .select(`
          *,
          viewer:profiles!profile_views_viewer_id_fkey(first_name, last_name, display_name, profile_picture_urls)
        `)
        .eq('viewed_user_id', user.id)
        .eq('event_id', eventId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      const viewsWithProfiles = data.map(view => ({
        ...view,
        profile: view.viewer
      }));

      setProfileViews(viewsWithProfiles);
    } catch (error) {
      console.error('Error loading profile views:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (profile: ProfileView['profile']) => {
    if (!profile) return 'Anonymous User';
    if (profile.display_name) return profile.display_name;
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.first_name || 'Anonymous User';
  };

  if (loading) {
    return (
      <Card className="gradient-card border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Loading profile views...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-500" />
          Who Viewed My Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        {profileViews.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No profile views yet</h3>
            <p className="text-muted-foreground">When someone views your profile, they'll appear here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {profileViews.map((view) => (
              <div key={view.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={view.profile?.profile_picture_urls?.[0] || ''} 
                    alt={getDisplayName(view.profile)} 
                  />
                  <AvatarFallback>
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">
                    {getDisplayName(view.profile)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Viewed {format(new Date(view.viewed_at), 'MMM d, yyyy \'at\' h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileViewsList;
