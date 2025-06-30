import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, MapPin, Users, MessageCircle, Heart, Eye } from 'lucide-react';
import { format } from 'date-fns';
import EventMatches from '@/components/EventMatches';
import DirectMessages from '@/components/DirectMessages';
import EventAttendees from '@/components/EventAttendees';
import EventChat from '@/components/EventChat';
import ProfileViewsList from '@/components/ProfileViewsList';
import PaymentOverlay from '@/components/PaymentOverlay';

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (eventId && user) {
      loadEvent();
      checkAccess();
    }
  }, [eventId, user]);

  const loadEvent = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAccess = async () => {
    if (!eventId || !user) return;

    try {
      // Check if user has paid for this event
      const { data: payment, error } = await supabase
        .from('event_payments')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setHasAccess(!!payment);
    } catch (error) {
      console.error('Error checking access:', error);
    }
  };

  const handleInteractionAttempt = () => {
    setShowPaymentOverlay(true);
  };

  const handlePaymentSuccess = () => {
    setHasAccess(true);
    setShowPaymentOverlay(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Event not found</h2>
          <Button onClick={() => navigate('/events')}>
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/events')}
            className="mb-4 hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
          
          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">{event.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">
                      {format(new Date(event.start_date), 'MMM d, yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(event.start_date), 'h:mm a')}
                      {event.end_date && ` - ${format(new Date(event.end_date), 'h:mm a')}`}
                    </div>
                  </div>
                </div>
                
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-sm text-muted-foreground">{event.location}</div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="font-medium">Event</div>
                    <div className="text-sm text-muted-foreground">Christian Singles</div>
                  </div>
                </div>
              </div>
              
              {event.description && (
                <div className="mt-4 p-4 bg-white/10 rounded-lg">
                  <p className="text-sm">{event.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="matches" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="matches">Matches</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="attendees">Attendees</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="profile-views">Profile Views</TabsTrigger>
            </TabsList>

            <TabsContent value="matches">
              <EventMatches 
                eventId={eventId!} 
                onInteractionAttempt={hasAccess ? undefined : handleInteractionAttempt}
              />
            </TabsContent>

            <TabsContent value="messages">
              <DirectMessages 
                eventId={eventId!}
                onInteractionAttempt={hasAccess ? undefined : handleInteractionAttempt}
              />
            </TabsContent>

            <TabsContent value="attendees">
              <EventAttendees 
                eventId={eventId!}
                onInteractionAttempt={hasAccess ? undefined : handleInteractionAttempt}
              />
            </TabsContent>

            <TabsContent value="chat">
              <EventChat 
                eventId={eventId!}
                onInteractionAttempt={hasAccess ? undefined : handleInteractionAttempt}
              />
            </TabsContent>

            <TabsContent value="profile-views">
              <ProfileViewsList eventId={eventId!} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Payment Overlay */}
        {showPaymentOverlay && (
          <PaymentOverlay
            eventId={eventId!}
            onClose={() => setShowPaymentOverlay(false)}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default EventDetails;
