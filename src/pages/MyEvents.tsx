import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  attendee_count: number;
}

const MyEvents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyEvents();
    }
  }, [user]);

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
      setEvents(eventsWithCounts);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your events...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Events</h1>
          <p className="text-muted-foreground">Events you're attending</p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't joined any events yet. Browse available events to get started!
            </p>
            <button 
              onClick={() => navigate('/events')}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card 
                key={event.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <Badge variant="secondary" className="w-fit">
                    <Users className="h-3 w-3 mr-1" />
                    {event.attendee_count} attending
                  </Badge>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{formatDate(event.start_date)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;