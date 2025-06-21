
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, MessageCircle, Heart, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import EventAttendees from '@/components/EventAttendees';
import EventConnections from '@/components/EventConnections';
import DirectMessages from '@/components/DirectMessages';
import EventMatches from '@/components/EventMatches';
import PaymentOverlay from '@/components/PaymentOverlay';

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  created_by: string;
}

interface PaymentAccess {
  hasAccess: boolean;
  isPostEvent: boolean;
}

interface EventPayment {
  id: string;
  user_id: string;
  event_id: string;
  stripe_session_id: string;
  amount: number;
  currency: string;
  status: string;
  is_post_event: boolean;
  access_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const EventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [isAttending, setIsAttending] = useState(false);
  const [paymentAccess, setPaymentAccess] = useState<PaymentAccess>({ hasAccess: false, isPostEvent: false });
  const [loading, setLoading] = useState(true);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      //navigate('/auth');
      return;
    }

    if (!eventId) {
      navigate('/');
      return;  
    }

    fetchEvent();
    checkPaymentAccess();

    // Check for payment success
    if (searchParams.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      verifyPayment();
    }
  }, [eventId, user, navigate, searchParams]);

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

  const checkPaymentAccess = async () => {
    if (!eventId || !user) return;

    // Check if user has paid for this event
    const { data: payment, error } = await supabase
      .from('event_payments')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .maybeSingle();

    if (error) {
      console.error('Error checking payment:', error);
    }

    console.log('payment checked')

    console.log(payment)

    if (payment) {
      console.log(payment)

      const now = new Date();
      const eventDate = event ? new Date(event.end_date) : new Date();
      const isEventEnded = now > eventDate;
      
      // Check if access has expired (for post-event payments)
      if (payment.is_post_event && payment.access_expires_at) {
        const expiresAt = new Date(payment.access_expires_at);
        const hasValidAccess = now < expiresAt;
        setPaymentAccess({ 
          hasAccess: hasValidAccess, 
          isPostEvent: isEventEnded && !hasValidAccess 
        });
      } else {
        setPaymentAccess({ 
          hasAccess: !isEventEnded || payment.is_post_event, 
          isPostEvent: isEventEnded 
        });
      }
    } else {
      // No payment found
      const now = new Date();
      const eventDate = event ? new Date(event.end_date) : new Date();
      const isEventEnded = now > eventDate;
      console.log(event, isEventEnded)
      
      setPaymentAccess({ 
        hasAccess: false, 
        isPostEvent: isEventEnded 
      });
    }

    // Check attendance status
    checkAttendanceStatus();
  };

  const checkAttendanceStatus = async () => {
    if (!eventId || !user) return;

    const { data, error } = await supabase
      .from('event_attendees')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setIsAttending(true);
    }
  };

  const verifyPayment = async () => {
    const sessionId = searchParams.get('session_id') || new URLSearchParams(window.location.search).get('session_id');
    if (!sessionId) return;

    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId }
      });

      if (error) throw error;

      if (data.success) {
        setPaymentAccess({ hasAccess: true, isPostEvent: data.isPostEvent });
        setIsAttending(true);
        // Remove payment params from URL
        navigate(`/events/${eventId}`, { replace: true });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
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

  const needsPayment = !paymentAccess.hasAccess;

  console.log(paymentAccess)
  //const needsPayment = false;

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Payment Success Message */}
          {showPaymentSuccess && (
            <Card className="gradient-card border-0 shadow-lg border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle className="h-6 w-6" />
                  <div>
                    <h3 className="font-semibold">Payment Successful!</h3>
                    <p className="text-sm">You now have access to all event features.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Event Header */}
          <Card className="gradient-card border-0 shadow-lg relative z-10">
            <CardHeader>
              <div className="flex justify-between items-start flex-col sm:flex-row">
                <div className="flex-1">
                  <CardTitle className="text-3xl">{event.title}</CardTitle>
                  {event.description && (
                    <CardDescription className="text-lg mt-2">
                      {event.description}
                    </CardDescription>
                  )}
                  <div className="flex sm:items-center gap-4 my-4 text-muted-foreground flex-col sm:flex-row">
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
                  {paymentAccess.hasAccess && (
                    <Badge variant="default" className="bg-green-500">
                      {paymentAccess.isPostEvent ? 'Post-Event Access' : 'Event Access'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            {/* Payment Overlay */}
            {needsPayment && !loading && (
              <PaymentOverlay 
                eventId={event.id}
                eventTitle={event.title}
                isPostEvent={paymentAccess.isPostEvent}
                onPaymentSuccess={() => {
                  setPaymentAccess({ hasAccess: true, isPostEvent: paymentAccess.isPostEvent });
                  setIsAttending(true);
                }}
              />
            )}
          </Card>

          {/* Event Content - Only show if user has paid */}
          <div className={needsPayment ? 'blur-md pointer-events-none overflow-hidden' : ''}>
            
            {/* Event Matches */}
            <EventMatches eventId={event.id} />

            {/* Event Tabs */}
            <Card className="gradient-card border-0 shadow-lg relative">
              <CardContent className="p-6">
                <Tabs defaultValue="messages" className="w-full">

                  {/* <TabsContent value="attendees" className="mt-6">
                    <EventAttendees eventId={event.id} />
                  </TabsContent> */}
                  {/* <TabsContent value="connections" className="mt-6">
                    <EventConnections eventId={event.id} />
                  </TabsContent> */}
                  <TabsContent value="messages" className="mt-6">
                    <DirectMessages eventId={event.id} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
