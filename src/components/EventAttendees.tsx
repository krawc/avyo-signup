import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayName } from '@/lib/utils';
import UserActionsDropdown from './UserActionsDropdown';

interface EventAttendeesProps {
  eventId: string;
}

interface Attendee {
  user_id: string;
  joined_at: string;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    profile_picture_urls: string[] | null;
    city: string | null;
    state: string | null;
  };
}

const EventAttendees = ({ eventId }: EventAttendeesProps) => {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendees();
  }, [eventId]);

  const loadAttendees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          user_id,
          joined_at,
          profiles (
            id,
            first_name,
            last_name,
            display_name,
            profile_picture_urls,
            city,
            state
          )
        `)
        .eq('event_id', eventId);

      if (error) throw error;
      setAttendees(data || []);
    } catch (error) {
      console.error('Error loading attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Event Attendees ({attendees.length})</h3>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-pulse">Loading attendees...</div>
        </div>
      ) : attendees.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No attendees yet
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {attendees.map((attendee) => (
            <Card key={attendee.user_id} className="gradient-card border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={attendee.profiles?.profile_picture_urls?.[0] || ''} 
                        alt={getDisplayName(attendee.profiles)} 
                      />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {getDisplayName(attendee.profiles)}
                      </h4>
                      {attendee.profiles?.city && attendee.profiles?.state && (
                        <p className="text-sm text-muted-foreground truncate">
                          {attendee.profiles.city}, {attendee.profiles.state}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Joined {format(new Date(attendee.joined_at), 'MMM d')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Only show dropdown for other users, not current user */}
                  {user?.id !== attendee.user_id && (
                    <UserActionsDropdown 
                      userId={attendee.user_id} 
                      userName={getDisplayName(attendee.profiles)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventAttendees;
