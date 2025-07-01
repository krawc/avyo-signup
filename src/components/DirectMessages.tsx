import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, MessageCircle, Eye, User } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { getDisplayName } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import UserActionsDropdown from './UserActionsDropdown';

interface DirectMessagesProps {
  eventId: string;
  onInteractionAttempt?: () => void;
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  date_of_birth: string | null;
  age_range: string | null;
  gender: string | null;
  phone_number: string | null;
  city: string | null;
  state: string | null;
  church_name: string | null;
  marital_status: string | null;
  has_kids: string | null;
  life_verse: string | null;
  profile_picture_urls: string[] | null;
}

interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ConnectionWithProfile extends Connection {
  requester?: Profile;
  addressee?: Profile;
}

interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

const DirectMessages = ({ eventId, onInteractionAttempt }: DirectMessagesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionWithProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConnections();
      subscribeToPresence();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConnection) {
      fetchMessages(selectedConnection.id);
    }
  }, [selectedConnection]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchConnections = async () => {
    if (!user) return;

    try {
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at,
          updated_at,
          requester:profiles!connections_requester_id_fkey(
            id,
            first_name,
            last_name,
            display_name,
            date_of_birth,
            age_range,
            gender,
            phone_number,
            city,
            state,
            church_name,
            marital_status,
            has_kids,
            life_verse,
            profile_picture_urls
          ),
          addressee:profiles!connections_addressee_id_fkey(
            id,
            first_name,
            last_name,
            display_name,
            date_of_birth,
            age_range,
            gender,
            phone_number,
            city,
            state,
            church_name,
            marital_status,
            has_kids,
            life_verse,
            profile_picture_urls
          )
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (connectionsError) throw connectionsError;

      const connectionsWithProfiles = connectionsData.map((connection) => ({
        ...connection,
        requester: connection.requester,
        addressee: connection.addressee,
      }));

      setConnections(connectionsWithProfiles);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load connections. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const fetchMessages = async (connectionId: string) => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedConnection || !newMessage.trim()) {
      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please sign in to send messages.',
          variant: 'destructive',
        });
      } else if (!selectedConnection) {
        toast({
          title: 'No connection selected',
          description: 'Please select a connection to send a message.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Empty message',
          description: 'Please enter a message to send.',
          variant: 'destructive',
        });
      }
      return;
    }

    try {
      const { data: messageData, error: messageError } = await supabase
        .from('direct_messages')
        .insert({
          connection_id: selectedConnection.id,
          sender_id: user.id,
          message: newMessage.trim(),
        })
        .select('*')
        .single();

      if (messageError) throw messageError;

      setMessages([...messages, messageData]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const subscribeToPresence = async () => {
    if (!user) return;

    await supabase.from(`presence:event-${eventId}`).subscribe(async (msg) => {
      if (msg.payload && msg.payload.online_users) {
        setOnlineUsers(msg.payload.online_users);
      }
    })
  }

  const isUserOnline = (userId: string) => {
    return onlineUsers.includes(userId);
  };

  const renderConnectionCard = (connection: ConnectionWithProfile, isOnline: boolean) => {
    const otherUser = connection.requester_id === user?.id ? connection.addressee : connection.requester;
    
    return (
      <div
        key={connection.id}
        onClick={() => setSelectedConnection(connection)}
        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
          selectedConnection?.id === connection.id 
            ? 'bg-primary/10 border-primary' 
            : 'hover:bg-accent/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar>
                <AvatarImage 
                  src={otherUser?.profile_picture_urls?.[0] || ''} 
                  alt={getDisplayName(otherUser)} 
                />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <p className="font-medium">{getDisplayName(otherUser)}</p>
              <p className="text-sm text-muted-foreground">
                {otherUser?.city && otherUser?.state && `${otherUser.city}, ${otherUser.state}`}
              </p>
            </div>
          </div>
          
          {/* Add report dropdown */}
          <div onClick={(e) => e.stopPropagation()}>
            <UserActionsDropdown 
              userId={otherUser?.id || ''} 
              userName={getDisplayName(otherUser)}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderMessage = (message: Message) => {
    const isCurrentUser = message.sender_id === user?.id;
    return (
      <div
        key={message.id}
        className={`mb-2 flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
      >
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          {message.message}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
        </div>
      </div>
    );
  };

  const renderMessageHeader = () => {
    if (!selectedConnection) return null;
    
    const otherUser = selectedConnection.requester_id === user?.id 
      ? selectedConnection.addressee 
      : selectedConnection.requester;
    
    return (
      <div className="p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage 
                src={otherUser?.profile_picture_urls?.[0] || ''} 
                alt={getDisplayName(otherUser)} 
              />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{getDisplayName(otherUser)}</h3>
              <p className="text-sm text-muted-foreground">
                {otherUser?.city && otherUser?.state && `${otherUser.city}, ${otherUser.state}`}
              </p>
            </div>
          </div>
          
          {/* Add report dropdown in message header */}
          <UserActionsDropdown 
            userId={otherUser?.id || ''} 
            userName={getDisplayName(otherUser)}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-4">Loading connections...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      {/* Connections List */}
      <div className="md:col-span-1 h-full overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">Connections</h2>
        {connections.length === 0 ? (
          <div className="text-muted-foreground">No connections yet.</div>
        ) : (
          connections.map((connection) => (
            renderConnectionCard(
              connection,
              isUserOnline(
                connection.requester_id === user?.id
                  ? connection.addressee_id
                  : connection.requester_id
              )
            )
          ))
        )}
      </div>

      {/* Messages Area */}
      <div className="md:col-span-2 flex flex-col h-full">
        {renderMessageHeader()}

        {selectedConnection ? (
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((message) => renderMessage(message))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a connection to view messages.
          </div>
        )}

        {/* Message Input */}
        {selectedConnection && (
          <div className="p-4 border-t bg-background/95 backdrop-blur">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendMessage();
                  }
                }}
              />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessages;
