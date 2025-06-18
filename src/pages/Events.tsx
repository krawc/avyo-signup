
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  created_by: string;
  attendee_count?: number;
  is_attending?: boolean;
}

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      //navigate('/auth');
      return;
    }
    fetchEvents();
  }, [user, navigate]);

  const fetchEvents = async () => {
    const { data: eventsData, error } = await supabase
      .from('events')
      .select(`
        *,
        event_attendees!left(count)
      `)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
    } else if (eventsData) {
      // Check which events the user is attending
      const { data: userAttendances } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', user?.id);

      const attendingEventIds = new Set(userAttendances?.map(a => a.event_id) || []);

      const eventsWithAttendance = eventsData.map(event => ({
        ...event,
        attendee_count: Array.isArray(event.event_attendees) ? event.event_attendees.length : 0,
        is_attending: attendingEventIds.has(event.id)
      }));

      setEvents(eventsWithAttendance);
    }
    setLoading(false);
  };

  const joinEvent = async (eventId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('event_attendees')
      .insert({ event_id: eventId, user_id: user.id });

    if (error) {
      console.error('Error joining event:', error);
    } else {
      fetchEvents(); // Refresh the events list
    }
  };

  const leaveEvent = async (eventId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .match({ event_id: eventId, user_id: user.id });

    if (error) {
      console.error('Error leaving event:', error);
    } else {
      fetchEvents(); // Refresh the events list
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">AVYO In-Gathering Events</h1>
            <p className="text-muted-foreground">Discover and join upcoming Christian community events</p>
          </div>

          {events.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
                <p className="text-muted-foreground">Check back soon for upcoming events!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {events.map((event) => (
                <Card key={event.id} className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                        <CardDescription className="text-base">
                          {event.description}
                        </CardDescription>
                      </div>
                      {event.is_attending && (
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          Attending
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(event.start_date)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{event.attendee_count || 0} attending</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => navigate(`/events/${event.id}`)}
                        variant="outline"
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      {event.is_attending ? (
                        <Button
                          onClick={() => leaveEvent(event.id)}
                          variant="destructive"
                          className="flex-1"
                        >
                          Leave Event
                        </Button>
                      ) : (
                        <Button
                          onClick={() => joinEvent(event.id)}
                          className="flex-1"
                        >
                          Join Event
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;
