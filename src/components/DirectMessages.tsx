import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, User, MapPin } from 'lucide-react';
import TermsAndConditions from './TermsAndConditions';
import LocationMap from './LocationMap';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';
import UserActionsDropdown from './UserActionsDropdown'

interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    profile_picture_urls: string[] | null;
  };
}

interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

interface LocationShare {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  expires_at: string;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    profile_picture_urls: string[] | null;
  } | null;
}

interface DirectMessagesProps {
  eventId: string;
  onInteractionAttempt?: () => void;
}

const DirectMessages = ({ eventId, onInteractionAttempt }: DirectMessagesProps) => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [showLocationTerms, setShowLocationTerms] = useState(false);
  const [activeLocations, setActiveLocations] = useState<LocationShare[]>([]);
  const [showLocationMap, setShowLocationMap] = useState(false);
  
  const { hasAccepted: hasAcceptedMessaging, loading: messagingTermsLoading, markAsAccepted: markMessagingAccepted } = useTermsAcceptance('messaging');
  const { hasAccepted: hasAcceptedLocation, loading: locationTermsLoading, markAsAccepted: markLocationAccepted } = useTermsAcceptance('location_sharing');

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user, eventId]);

  useEffect(() => {
    if (selectedConnection) {
      loadMessages(selectedConnection.id);
      loadActiveLocations();
      
      // Set up real-time subscription for messages
      const channel = supabase
        .channel('direct-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `connection_id=eq.${selectedConnection.id}`
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConnection]);

  useEffect(() => {
    // Set up real-time subscription for new connections
    if (user) {
      const channel = supabase
        .channel('new-connections')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'connections'
          },
          (payload) => {
            const newConnection = payload.new;
            if (newConnection.requester_id === user.id || newConnection.addressee_id === user.id) {
              loadConnections();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'connections'
          },
          (payload) => {
            const updatedConnection = payload.new;
            if (updatedConnection.requester_id === user.id || updatedConnection.addressee_id === user.id) {
              loadConnections();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          requester:profiles!connections_requester_id_fkey(id, first_name, last_name, display_name, profile_picture_urls),
          addressee:profiles!connections_addressee_id_fkey(id, first_name, last_name, display_name, profile_picture_urls)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      const connectionsWithProfiles = data.map(conn => ({
        ...conn,
        profile: conn.requester_id === user.id ? conn.addressee : conn.requester
      }));

      setConnections(connectionsWithProfiles);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (connectionId: string) => {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadActiveLocations = async () => {
    if (!selectedConnection) return;

    try {
      const { data, error } = await supabase
        .from('location_shares')
        .select(`
          *,
          profiles(first_name, last_name, display_name, profile_picture_urls)
        `)
        .eq('connection_id', selectedConnection.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveLocations(data || []);
    } catch (error) {
      console.error('Error loading active locations:', error);
    }
  };

  const handleMessagingAccess = () => {
    if (hasAcceptedMessaging === false) {
      setShowTerms(true);
    }
  };

  const handleLocationShare = () => {
    if (hasAcceptedLocation === false) {
      setShowLocationTerms(true);
    } else {
      shareLocation();
    }
  };

  const shareLocation = async () => {
    console.log('clicked shareLoc')
    if (!selectedConnection || !user) return;
    console.log('worked')

    try {
      if (navigator.geolocation) {

        console.log('nav geo present')

        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          console.log(latitude, longitude)

          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 1);

          const { error } = await supabase
          .from('location_shares')
          .upsert({
            connection_id: selectedConnection.id,
            user_id: user.id,
            latitude,
            longitude,
            expires_at: expiresAt.toISOString()
          }, {
            onConflict: ['user_id', 'connection_id'] // 🔑 specify the conflict key
          });
        
          if (error) throw error;
          
          await supabase
            .from('direct_messages')
            .upsert({
              connection_id: selectedConnection.id,
              sender_id: user.id,
              message: '📍 I shared my location with you for the next hour.'
            });

          loadActiveLocations();
        }, (error) => {
          console.error('Error getting location:', error);
        });
      }
    } catch (error) {
      console.error('Error sharing location:', error);
    }
  };

  const sendMessage = async () => {
    if (onInteractionAttempt) {
      onInteractionAttempt();
      return;
    }

    if (hasAcceptedMessaging === false) {
      setShowTerms(true);
      return;
    }

    if (!newMessage.trim() || !selectedConnection || !user) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          connection_id: selectedConnection.id,
          sender_id: user.id,
          message: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getDisplayName = (profile: Connection['profile']) => {
    if (!profile) return 'Anonymous User';
    if (profile.display_name) return profile.display_name;
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.first_name || 'Anonymous User';
  };

  const handleLocationClick = () => {
    //console.log(showLocationMap)
    
    setShowLocationMap(true);
  };

  const renderMessage = (message: Message) => {
    const isLocationMessage = message.message.includes('📍');
    
    if (isLocationMessage) {
      return (
        <div
          className={`flex ${
            message.sender_id === user?.id ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-xs rounded-lg cursor-pointer hover:opacity-80 ${
              message.sender_id === user?.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-900'
            }`}
            onClick={handleLocationClick}
          >
            <div className="p-2">
              <div className="w-full h-20 bg-green-200 rounded mb-2 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-xs">{message.message}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex ${
          message.sender_id === user?.id ? 'justify-end' : 'justify-start'
        }`}
      >
        <div
          className={`max-w-xs px-4 py-2 rounded-lg ${
            message.sender_id === user?.id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          {message.message}
        </div>
      </div>
    );
  };

  if (loading || messagingTermsLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-pulse">Loading messages...</div>
      </div>
    );
  }

  const showBlur = hasAcceptedMessaging === false;

  return (
    <>
      <div className={`relative ${showBlur ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-96">
          {/* Connections List */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-64">
                {connections.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No connections yet
                  </div>
                ) : (
                  connections.map((connection) => (
                    <div
                      key={connection.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedConnection?.id === connection.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedConnection(connection)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 md:h-10 md:w-10">
                          <AvatarImage 
                            src={connection.profile?.profile_picture_urls?.[0] || ''} 
                            alt={getDisplayName(connection.profile)} 
                          />
                          <AvatarFallback>
                            <User className="h-4 w-4 md:h-5 md:w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-sm">
                            {getDisplayName(connection.profile)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="md:col-span-2">
            <CardContent className="p-0 h-full flex flex-col">
              {selectedConnection ? (
                <>
                  {/* Messages Header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-6 w-6 md:h-8 md:w-8">
                        <AvatarImage 
                          src={selectedConnection.profile?.profile_picture_urls?.[0] || ''} 
                          alt={getDisplayName(selectedConnection.profile)} 
                        />
                        <AvatarFallback>
                          <User className="h-3 w-3 md:h-4 md:w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-sm md:text-base">
                        {getDisplayName(selectedConnection.profile)}
                      </h3>
                    </div>
                    {/* Add report dropdown in message header */}
                      <UserActionsDropdown 
                        userId={selectedConnection.profile?.id || ''} 
                        userName={getDisplayName(selectedConnection.profile)}
                      />
                  </div>

                  {/* Messages List */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id}>
                          {renderMessage(message)}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="text-sm"
                      />
                      <Button onClick={handleLocationShare} size="sm" variant="outline">
                        <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <Button onClick={sendMessage} size="sm">
                        <Send className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  Select a conversation to start messaging
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Terms and Conditions Overlays
      {showBlur && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
          <Button onClick={handleMessagingAccess} className="bg-primary hover:bg-primary/90">
            Read Terms and Conditions
          </Button>
        </div>
      )} */}

      <TermsAndConditions
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => {
          markMessagingAccepted();
          setShowTerms(false);
        }}
        termsType="messaging"
      />

      <TermsAndConditions
        isOpen={showLocationTerms}
        onClose={() => setShowLocationTerms(false)}
        onAccept={() => {
          markLocationAccepted();
          setShowLocationTerms(false);
          shareLocation();
        }}
        termsType="location_sharing"
      />

        <LocationMap
         isOpen={showLocationMap}
         onClose={() => setShowLocationMap(false)}
         locations={activeLocations}>
          <div />
        </LocationMap>
    </>
  );
};

export default DirectMessages;