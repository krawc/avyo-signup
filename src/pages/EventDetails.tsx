
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

const EventDetails = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('matches');
  
  const { hasAccepted: hasAcceptedMessaging, loading: loadingMessagingTerms, markAsAccepted: markMessagingAccepted } = useTermsAcceptance('messaging');

  useEffect(() => {
    if (eventId && user) {
      loadEvent();
      checkAccess();
    }
  }, [eventId, user]);

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

  const handleInteractionAttempt = () => {
    setShowPaymentOverlay(true);
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
                onInteractionAttempt={hasAccess ? undefined : handleInteractionAttempt}
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
                  onInteractionAttempt={hasAccess ? undefined : handleInteractionAttempt}
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
