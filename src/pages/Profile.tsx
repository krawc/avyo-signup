
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Church, Heart, Users, User, ScanQrCode, Edit, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import ProfileEditor from '@/components/ProfileEditor';
import { getSignedUrls } from '@/lib/utils';

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

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  attendee_count?: number;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchProfile();
    fetchMyEvents();
    handlePendingEvent();
  }, [user, navigate]);

  const handlePendingEvent = async () => {
    const pendingEventId = localStorage.getItem('pendingEventId');
    if (pendingEventId && user) {
      try {
        // Join the event
        const { error } = await supabase
          .from('event_attendees')
          .insert({ event_id: pendingEventId, user_id: user.id });

        if (!error) {
          // Clear the pending event
          localStorage.removeItem('pendingEventId');
          // Refresh events list
          fetchMyEvents();
        }
      } catch (error) {
        console.error('Error joining pending event:', error);
      }
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
  
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
  
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
  
    // If there are image URLs, generate signed versions
    if (data.profile_picture_urls && data.profile_picture_urls.length > 0) {
      const signedUrls = await getSignedUrls(data.profile_picture_urls);
      setProfile({
        ...data,
        profile_picture_urls: signedUrls,
      });
    } else {
      setProfile(data);
    }
  };

  const fetchMyEvents = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('event_attendees')
      .select(`
        event_id,
        events (
          id,
          title,
          description,
          location,
          start_date,
          end_date
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      const eventsWithCounts = await Promise.all(
        (data?.map(item => item.events).filter(Boolean) || []).map(async (event: any) => {
          // Fetch attendee count for each event
          const { count } = await supabase
            .from('event_attendees')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);
          
          return {
            ...event,
            attendee_count: count || 0
          };
        })
      );
      setMyEvents(eventsWithCounts);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile?.first_name || 'Anonymous User';
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    setIsEditing(false);
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

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          {isEditing && profile ? (
            <ProfileEditor
              profile={profile}
              onUpdate={handleProfileUpdate}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <Card className="gradient-card border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-start gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage 
                      src={profile?.profile_picture_urls?.[0] || ''} 
                      alt={getDisplayName()} 
                    />
                    <AvatarFallback className="text-2xl">
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <CardTitle className="text-3xl">{getDisplayName()}</CardTitle>
                      <div className="flex gap-2 sm:ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex justify-center"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline-block">Edit Profile</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex justify-center"
                          onClick={() => navigate('/account-settings')}
                        >
                          <Settings className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline-block">Settings</span>
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="text-lg mt-2">
                      {profile?.city && profile?.state && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {profile.city}, {profile.state}
                        </div>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {profile?.marital_status && (
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-primary" />
                      <span>Status: {profile.marital_status}</span>
                    </div>
                  )}
                  {profile?.has_kids && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Children: {profile.has_kids}</span>
                    </div>
                  )}
                  {profile?.church_name && (
                    <div className="flex items-center gap-2">
                      <Church className="h-4 w-4 text-primary" />
                      <span>{profile.church_name}</span>
                    </div>
                  )}
                  {profile?.age_range && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Age: {profile.age_range}</span>
                    </div>
                  )}
                </div>
                {profile?.life_verse && (
                  <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-primary font-medium italic">
                      "{profile.life_verse}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* My Events Section */}
          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary" />
                    My Events
                  </CardTitle>
                  <CardDescription>
                    Events you're attending or have attended
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {myEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You haven't joined any events yet. Scan a QR code or visit an event link to join your event.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          {event.description && (
                            <p className="text-muted-foreground mt-1">{event.description}</p>
                          )}
                          <div className="flex items-start sm:items-center gap-4 mt-4 text-sm text-muted-foreground flex-col sm:flex-row">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(event.start_date)}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.location}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {event.attendee_count} attendees
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary">Attending</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
