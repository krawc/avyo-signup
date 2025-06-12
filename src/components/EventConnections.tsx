
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Check, X } from 'lucide-react';

interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
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

interface EventConnectionsProps {
  eventId: string;
}

const EventConnections = ({ eventId }: EventConnectionsProps) => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('connections-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'connections' },
        () => fetchConnections()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId, user]);

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
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching connections:', error);
    } else {
      setConnections(data || []);
    }
    setLoading(false);
  };

  const updateConnectionStatus = async (connectionId: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('connections')
      .update({ status })
      .eq('id', connectionId);

    if (error) {
      console.error('Error updating connection:', error);
    } else {
      fetchConnections();
    }
  };

  const getDisplayName = (profile: any) => {
    if (!profile) return 'Anonymous User';
    
    if (profile.display_name) return profile.display_name;
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.first_name || 'Anonymous User';
  };

  const getConnectionInfo = (connection: Connection) => {
    const isRequester = connection.requester_id === user?.id;
    const otherProfile = isRequester ? connection.addressee_profile : connection.requester_profile;
    const otherUserId = isRequester ? connection.addressee_id : connection.requester_id;
    
    return {
      profile: otherProfile,
      userId: otherUserId,
      isRequester,
      canRespond: !isRequester && connection.status === 'pending'
    };
  };

  if (loading) {
    return <div className="text-center py-4">Loading connections...</div>;
  }

  const pendingRequests = connections.filter(c => c.status === 'pending');
  const acceptedConnections = connections.filter(c => c.status === 'accepted');

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Connection Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map((connection) => {
              const { profile, isRequester, canRespond } = getConnectionInfo(connection);
              
              return (
                <div key={connection.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={profile?.profile_picture_urls?.[0] || ''} 
                        alt={getDisplayName(profile)} 
                      />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{getDisplayName(profile)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {isRequester ? 'Request sent' : 'Wants to connect'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canRespond ? (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => updateConnectionStatus(connection.id, 'accepted')}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateConnectionStatus(connection.id, 'rejected')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Accepted Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Connections ({acceptedConnections.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {acceptedConnections.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No connections yet.</p>
          ) : (
            <div className="space-y-4">
              {acceptedConnections.map((connection) => {
                const { profile } = getConnectionInfo(connection);
                
                return (
                  <div key={connection.id} className="flex items-center gap-3 p-4 border rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={profile?.profile_picture_urls?.[0] || ''} 
                        alt={getDisplayName(profile)} 
                      />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{getDisplayName(profile)}</h4>
                      <p className="text-sm text-muted-foreground">Connected</p>
                    </div>
                    <Badge variant="default" className="ml-auto bg-green-500">
                      Connected
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EventConnections;
