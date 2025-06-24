import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, Send, MessageCircle } from 'lucide-react';

interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  other_user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    profile_picture_urls: string[] | null;
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
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

  useEffect(() => {
    fetchConnections();

    // Subscribe to connection changes
    const connectionSubscription = supabase
      .channel('connections')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connections' },
        (payload) => {
          console.log('Connection change received!', payload);
          fetchConnections();
        }
      )
      .subscribe();

    // Subscribe to message changes
    if (selectedConnection) {
      const messageSubscription = supabase
        .channel(`messages-${selectedConnection.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          (payload) => {
            console.log('Message change received!', payload);
            fetchMessages(selectedConnection.id);
          }
        )
        .subscribe();

      return () => {
        connectionSubscription.unsubscribe();
        messageSubscription.unsubscribe();
      };
    } else {
      return () => {
        connectionSubscription.unsubscribe();
      };
    }
  }, [eventId, user, selectedConnection]);

  const fetchConnections = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('connections')
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        created_at,
        other_user: profiles (
          id,
          first_name,
          last_name,
          display_name,
          profile_picture_urls
        )
      `)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching connections:', error);
    } else {
      const formattedConnections = (data || []).map((conn: any) => {
        const other_user =
          conn.requester_id === user.id ? conn.other_user : conn.other_user;
        return {
          ...conn,
          other_user,
        };
      });
      setConnections(formattedConnections);
    }
    setLoading(false);
  };

  const fetchMessages = async (connectionId: string) => {
    const { data, error } = await supabase
      .from('messages')
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
    if (!user || !selectedConnection) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        connection_id: selectedConnection.id,
        sender_id: user.id,
        content: newMessage,
      });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
      fetchMessages(selectedConnection.id);
    }
  };

  const handleConnectionSelect = (connection: Connection) => {
    if (onInteractionAttempt) {
      onInteractionAttempt();
      return;
    }
    setSelectedConnection(connection);
    fetchMessages(connection.id);
  };

  const handleSendMessage = async () => {
    if (onInteractionAttempt) {
      onInteractionAttempt();
      return;
    }
    await sendMessage();
  };

  const getDisplayName = (profile: any) => {
    if (!profile) return 'Anonymous User';

    if (profile.display_name) return profile.display_name;
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.first_name || 'Anonymous User';
  };

  if (loading) {
    return <div className="text-center py-4">Loading messages...</div>;
  }

  if (connections.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
        <p className="text-muted-foreground">
          Start making connections by matching with other attendees!
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[600px]">
      {/* Connections List */}
      <div className="md:col-span-1">
        <h3 className="text-lg font-semibold mb-4">Your Connections ({connections.length})</h3>
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {connections.map((connection) => (
              <Card
                key={connection.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedConnection?.id === connection.id ? 'bg-muted' : ''
                }`}
                onClick={() => handleConnectionSelect(connection)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={connection.other_user.profile_picture_urls?.[0] || ''}
                        alt={getDisplayName(connection.other_user)}
                      />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {getDisplayName(connection.other_user)}
                      </h4>
                      <Badge variant="default" className="bg-green-500 text-xs">
                        Connected
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Messages */}
      <div className="md:col-span-2">
        {selectedConnection ? (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={selectedConnection.other_user.profile_picture_urls?.[0] || ''}
                    alt={getDisplayName(selectedConnection.other_user)}
                  />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                {getDisplayName(selectedConnection.other_user)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[500px]">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
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
                    placeholder="Type your message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Select a connection to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessages;
