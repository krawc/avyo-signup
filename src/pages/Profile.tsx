import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Edit, Calendar, MapPin, Church, Heart, Users, Baby } from 'lucide-react';
import Header from '@/components/Header';
import ProfileEditor from '@/components/ProfileEditor';

interface Profile {
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
  profile_picture_urls: string[];
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      // Ensure all required fields are present, including age_range
      const profileWithDefaults = {
        ...data,
        profile_picture_urls: data.profile_picture_urls || [],
        age_range: data.age_range || null
      };
      setProfile(profileWithDefaults);
    }
    setLoading(false);
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    setIsEditing(false);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getDisplayName = () => {
    if (!profile) return 'Anonymous User';
    if (profile.display_name) return profile.display_name;
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.first_name || 'Anonymous User';
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Profile not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {isEditing ? (
            <ProfileEditor
              profile={profile}
              onSave={handleProfileUpdate}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <Card className="gradient-card border-0 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-semibold">{getDisplayName()}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.profile_picture_urls?.[0] || ''} alt={getDisplayName()} />
                    <AvatarFallback>
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="text-lg font-medium">{getDisplayName()}</div>
                    <div className="text-sm text-muted-foreground">
                      Member since {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-bold mb-1">Personal Information</div>
                    <div className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Date of Birth: {formatDate(profile.date_of_birth)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Baby className="h-4 w-4" />
                        <span>Age Range: {profile.age_range || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Gender: {profile.gender || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-bold mb-1">Location</div>
                    <div className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {profile.city ? `${profile.city}, ${profile.state}` : 'Location not specified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-bold mb-1">Faith Details</div>
                    <div className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Church className="h-4 w-4" />
                        <span>Church: {profile.church_name || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        <span>Denomination: {profile.denomination || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-bold mb-1">Life Verse</div>
                    <div className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Quote className="h-4 w-4" />
                        <span>{profile.life_verse || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-bold mb-1">Has Kids</div>
                    <div className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{profile.has_kids || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
