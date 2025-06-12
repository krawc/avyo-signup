
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, UserPlus } from 'lucide-react';

interface Attendee {
  user_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    city: string | null;
    state: string | null;
    profile_picture_urls: string[] | null;
  } | null;
}

interface EventAttendeesProps {
  eventId: string;
}

const EventAttendees = ({ eventId }: EventAttendeesProps) => {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendees();
  }, [eventId]);

  const fetchAttendees = async () => {
    const { data, error } = await supabase
      .from('event_attendees')
      .select(`
        user_id,
        profiles (
          first_name,
          last_name,
          display_name,
          city,
          state,
          profile_picture_urls
        )
      `)
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching attendees:', error);
    } else {
      setAttendees(data || []);
    }
    setLoading(false);
  };

  const sendConnectionRequest = async (addresseeId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('connections')
      .insert({
        requester_id: user.id,
        addressee_id: addresseeId,
        status: 'pending'
      });

    if (error) {
      console.error('Error sending connection request:', error);
    } else {
      console.log('Connection request sent successfully');
    }
  };

  const getDisplayName = (attendee: Attendee) => {
    const profile = attendee.profiles;
    if (!profile) return 'Anonymous User';
    
    if (profile.display_name) return profile.display_name;
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.first_name || 'Anonymous User';
  };

  const getLocation = (attendee: Attendee) => {
    const profile = attendee.profiles;
    if (!profile || !profile.city || !profile.state) return null;
    return `${profile.city}, ${profile.state}`;
  };

  if (loading) {
    return <div className="text-center py-4">Loading attendees...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Event Attendees ({attendees.length})</h3>
      <div className="grid gap-4">
        {attendees.map((attendee) => (
          <Card key={attendee.user_id} className="border">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={attendee.profiles?.profile_picture_urls?.[0] || ''} 
                      alt={getDisplayName(attendee)} 
                    />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{getDisplayName(attendee)}</h4>
                    {getLocation(attendee) && (
                      <p className="text-sm text-muted-foreground">{getLocation(attendee)}</p>
                    )}
                  </div>
                </div>
                {user?.id !== attendee.user_id && (
                  <Button 
                    size="sm" 
                    onClick={() => sendConnectionRequest(attendee.user_id)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Connect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EventAttendees;
