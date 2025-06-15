
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Send, MapPin, Users } from 'lucide-react';
import LocationShare from './LocationShare';
import { getSignedUrls } from '@/lib/utils';

interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  requester_profile?: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    profile_picture_urls: string[] | null;
  } | null;
  addressee_profile?: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    profile_picture_urls: string[] | null;
  } | null;
}

interface DirectMessage {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  connection_id: string;
}

interface DirectMessagesProps {
  eventId: string;
}

const DirectMessages = ({ eventId }: DirectMessagesProps) => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConnections();
    
    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('direct-messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'direct_messages'
        },
        () => {
          if (selectedConnection) {
            fetchMessages(selectedConnection);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId]);

  useEffect(() => {
    if (selectedConnection) {
      fetchMessages(selectedConnection);
    }
  }, [selectedConnection]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConnections = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('connections')
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        requester_profile:profiles!connections_requester_id_fkey (
          first_name,
          last_name,
          display_name,
          profile_picture_urls
        ),
        addressee_profile:profiles!connections_addressee_id_fkey (
          first_name,
          last_name,
          display_name,
          profile_picture_urls
        )
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching connections:', error);
    } else {
      // Sign profile picture URLs
      const connectionsWithSignedUrls = await Promise.all(
        (data || []).map(async (connection) => {
          const requesterUrls: string[] = connection.requester_profile?.profile_picture_urls || [];
          const addresseeUrls: string[] = connection.addressee_profile?.profile_picture_urls || [];
          
          const [signedRequesterUrls, signedAddresseeUrls] = await Promise.all([
            getSignedUrls(requesterUrls),
            getSignedUrls(addresseeUrls)
          ]);

          return {
            ...connection,
            requester_profile: {
              ...connection.requester_profile,
              profile_picture_urls: signedRequesterUrls,
            },
            addressee_profile: {
              ...connection.addressee_profile,
              profile_picture_urls: signedAddresseeUrls,
            }
          };
        })
      );

      setConnections(connectionsWithSignedUrls);
      if (connectionsWithSignedUrls.length > 0 && !selectedConnection) {
        setSelectedConnection(connectionsWithSignedUrls[0].id);
      }
    }
    setLoading(false);
  };

  const fetchMessages = async (connectionId: string) => {
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedConnection) return;

    const { error } = await supabase
      .from('direct_messages')
      .insert({
        connection_id: selectedConnection,
        sender_id: user.id,
        message: newMessage.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getConnectionInfo = (connection: Connection) => {
    const isRequester = connection.requester_id === user?.id;
    const otherProfile = isRequester ? connection.addressee_profile : connection.requester_profile;
    
    return { profile: otherProfile };
  };

  const getDisplayName = (profile: any) => {
    if (!profile) return 'Anonymous User';
    
    if (profile.display_name) return profile.display_name;
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.first_name || 'Anonymous User';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return <div className="text-center py-4">Loading messages...</div>;
  }

  if (connections.length === 0) {
    return (
      <Card className="gradient-card border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
          <p className="text-muted-foreground">Connect with other attendees to start messaging!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg  font-semibold">Messages & Location</h3>
      
      <Tabs value={selectedConnection || ''} onValueChange={setSelectedConnection} className="w-full">
        <TabsList className="grid w-full h-auto grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {connections.slice(0, 4).map((connection) => {
            const { profile } = getConnectionInfo(connection);
            return (
              <TabsTrigger 
                key={connection.id} 
                value={connection.id}
                className="flex items-center gap-2 text-xs"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage 
                    src={profile?.profile_picture_urls?.[0] || ''} 
                    alt={getDisplayName(profile)} 
                  />
                  <AvatarFallback className="text-xs">
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-16">{getDisplayName(profile)}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {connections.map((connection) => (
          <TabsContent key={connection.id} value={connection.id} className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Messages */}
              <Card className="border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm ">
                    Chat with {getDisplayName(getConnectionInfo(connection).profile)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-64 overflow-y-auto space-y-3 p-2">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8 text-sm">
                        Start a conversation!
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`flex gap-2 ${message.sender_id === user?.id ? 'flex-row-reverse' : ''}`}
                        >
                          <div className={`flex-1 max-w-xs ${message.sender_id === user?.id ? 'text-right' : ''}`}>
                            <div className={`inline-block p-2 rounded-lg text-sm ${
                              message.sender_id === user?.id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              <p>{message.message}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 text-sm"
                    />
                    <Button onClick={sendMessage} size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Location Sharing */}
              <LocationShare eventId={eventId} connectionId={connection.id} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default DirectMessages;
