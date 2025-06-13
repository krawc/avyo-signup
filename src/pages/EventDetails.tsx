
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, MessageCircle, Heart } from 'lucide-react';
import Header from '@/components/Header';
import EventAttendees from '@/components/EventAttendees';
import EventConnections from '@/components/EventConnections';
import DirectMessages from '@/components/DirectMessages';
import EventMatches from '@/components/EventMatches';

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  created_by: string;
}

const EventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [isAttending, setIsAttending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!eventId) {
      navigate('/');
      return;  
    }

    fetchEvent();
    checkAttendanceStatus();
  }, [eventId, user, navigate]);

  const fetchEvent = async () => {
    if (!eventId) return;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      navigate('/');
    } else {
      setEvent(data);
    }
    setLoading(false);
  };

  const checkAttendanceStatus = async () => {
    if (!eventId || !user) return;

    const { data, error } = await supabase
      .from('event_attendees')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setIsAttending(true);
    }
  };

  const handleJoinEvent = async () => {
    if (!eventId || !user) return;

    const { error } = await supabase
      .from('event_attendees')
      .insert({
        event_id: eventId,
        user_id: user.id
      });

    if (error) {
      console.error('Error joining event:', error);
    } else {
      setIsAttending(true);
    }
  };

  const handleLeaveEvent = async () => {
    if (!eventId || !user) return;

    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error leaving event:', error);
    } else {
      setIsAttending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
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

  if (!event) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Event not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Event Header */}
          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-3xl font-serif">{event.title}</CardTitle>
                  {event.description && (
                    <CardDescription className="text-lg mt-2">
                      {event.description}
                    </CardDescription>
                  )}
                  <div className="flex items-center gap-6 mt-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {formatDate(event.start_date)}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAttending ? (
                    <>
                      <Badge variant="default" className="bg-green-500">
                        Attending
                      </Badge>
                      <Button variant="outline" onClick={handleLeaveEvent}>
                        Leave Event
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleJoinEvent}>
                      Join Event
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Event Matches - Only show if user is attending */}
          {isAttending && (
            <EventMatches eventId={event.id} />
          )}

          {/* Event Tabs - Only show if user is attending */}
          {isAttending && (
            <Card className="gradient-card border-0 shadow-lg">
              <CardContent className="p-6">
                <Tabs defaultValue="attendees" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="attendees" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Attendees
                    </TabsTrigger>
                    <TabsTrigger value="connections" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Connections
                    </TabsTrigger>
                    <TabsTrigger value="messages" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Messages
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="attendees" className="mt-6">
                    <EventAttendees eventId={event.id} />
                  </TabsContent>
                  <TabsContent value="connections" className="mt-6">
                    <EventConnections eventId={event.id} />
                  </TabsContent>
                  <TabsContent value="messages" className="mt-6">
                    <DirectMessages eventId={event.id} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
