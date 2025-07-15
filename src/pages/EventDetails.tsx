
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, MessageCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import EventMatches from '@/components/EventMatches';
import DirectMessages from '@/components/DirectMessages';
import EventAttendees from '@/components/EventAttendees';
import ProfileViewsList from '@/components/ProfileViewsList';
import PaymentOverlay from '@/components/PaymentOverlay';
import TermsAndConditions from '@/components/TermsAndConditions';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';
import Header from '@/components/Header';

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

interface PaymentAccess {
  hasAccess: boolean;
}

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentAccess, setPaymentAccess] = useState<PaymentAccess>({ hasAccess: false });
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('matches');
  const [isAttending, setIsAttending] = useState(false);

  const { hasAccepted: hasAcceptedMessaging, loading: loadingMessagingTerms, markAsAccepted: markMessagingAccepted } = useTermsAcceptance('messaging');

  useEffect(() => {

    if (!user) {
      return;
    }

    if (!eventId) {
      navigate('/');
      return;
    }
    // if (eventId && user) {
      loadEvent();
      checkPaymentAccess();
    //}
    // Check for payment success
    if (searchParams.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      verifyPayment();
    }
  }, [eventId, user, navigate, searchParams]);

  useEffect(() => {
    // Show terms modal when user tries to access messages tab without accepting terms
    if (activeTab === 'messages' && !loadingMessagingTerms && !hasAcceptedMessaging) {
      setShowTermsModal(true);
    }
  }, [activeTab, hasAcceptedMessaging, loadingMessagingTerms]);

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

    console.log('payment checked', payment);

    if (payment) {
      setPaymentAccess({ hasAccess: true });
    } else {
      setPaymentAccess({ hasAccess: false });
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
        setPaymentAccess({ hasAccess: true });
        setIsAttending(true);
        // Remove payment params from URL
        navigate(`/events/${eventId}`, { replace: true });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
    }
  };

  const checkAccess = async () => {
    if (!eventId || !user) return;

    try {
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

  console.log(paymentAccess)
  const needsPayment = !paymentAccess.hasAccess;


  const handleInteractionAttempt = () => {
    if (needsPayment) {
       setShowPaymentOverlay(true);
    }
  };

  const handlePaymentSuccess = () => {
    setHasAccess(true);
    setShowPaymentOverlay(false);
  };

  const handleTermsAccept = () => {
    markMessagingAccepted();
    setShowTermsModal(false);
  };

  const handleTermsDecline = () => {
    setShowTermsModal(false);
    setActiveTab('matches'); // Switch back to matches tab
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Event Info Card */}
        <div className="mb-8">
          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">{event.title}</CardTitle>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 overflow-x-auto">
              <TabsTrigger value="matches" className="text-xs md:text-sm">Matches</TabsTrigger>
              <TabsTrigger value="messages" className="text-xs md:text-sm">Messages</TabsTrigger>
              <TabsTrigger value="profile-views" className="text-xs md:text-sm">Profile Views</TabsTrigger>
            </TabsList>

            <TabsContent value="matches">
              <EventMatches 
                eventId={eventId!} 
                onInteractionAttempt={needsPayment ? handleInteractionAttempt : null}
              />
            </TabsContent>

            <TabsContent value="messages" className="relative">
              {!hasAcceptedMessaging && !loadingMessagingTerms && (
                <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Button 
                    onClick={() => setShowTermsModal(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Read Terms and Conditions to Access Messages
                  </Button>
                </div>
              )}
              <div className={!hasAcceptedMessaging && !loadingMessagingTerms ? 'blur-sm pointer-events-none' : ''}>
                <DirectMessages 
                  eventId={eventId!}
                  onInteractionAttempt={needsPayment ? handleInteractionAttempt : null}
                />
              </div>
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
            eventTitle={event?.title || 'Event'}
            onClose={() => setShowPaymentOverlay(false)}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}

        {/* Terms and Conditions Modal */}
        {showTermsModal && (
          <TermsAndConditions
            isOpen={showTermsModal}
            onClose={handleTermsDecline}
            onAccept={handleTermsAccept}
            termsType="messaging"
          />
        )}
      </div>
    </div>
  );
};

export default EventDetails;
