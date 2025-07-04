
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, MapPin, Clock, Map } from 'lucide-react';
import { getSignedUrls } from '@/lib/utils';
import LocationMap from './LocationMap';

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

interface LocationShareProps {
  connectionId: string;
}

const LocationShare = ({ connectionId }: LocationShareProps) => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<LocationShare[]>([]);
  const [sharing, setSharing] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationShare | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const locationUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const watchId = useRef<number | null>(null);

  console.log(locations)

  useEffect(() => {
    fetchLocations();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('location-shares')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'location_shares' },
        () => fetchLocations()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [connectionId]);

  // Auto-update location every 5 seconds when sharing
  useEffect(() => {
    if (userLocation && !sharing) {
      console.log('start loca updates')
      startLocationUpdates();
    } else {
      stopLocationUpdates();
    }

    return () => {
      stopLocationUpdates();
    };
  }, [userLocation, sharing]);

  const startLocationUpdates = () => {

    console.log('geo pre interval')
    if (locationUpdateInterval.current) return;

    console.log('geo post interval')

    // Update location every 5 seconds
    locationUpdateInterval.current = setInterval(() => {
      updateCurrentLocation();
    }, 5000);

    // Also start continuous watching for more frequent updates
    if ('geolocation' in navigator) {
      console.log('geo present')
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          updateLocationInDatabase(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error watching location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    } else {
      console.log('geo not present')

    }
  };

  const stopLocationUpdates = () => {
    if (locationUpdateInterval.current) {
      clearInterval(locationUpdateInterval.current);
      locationUpdateInterval.current = null;
    }

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  const updateCurrentLocation = () => {
    if (!user || !userLocation) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateLocationInDatabase(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting current location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    }
  };

  const updateLocationInDatabase = async (latitude: number, longitude: number) => {
    if (!user || !userLocation) return;

    try {
      // Set expiration to 24 hours from now

      console.log(latitude,longitude)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error } = await supabase
        .from('location_shares')
        .upsert({
          user_id: user.id,
          connection_id: connectionId,
          latitude,
          longitude,
          expires_at: expiresAt.toISOString()
        }, {
          onConflict: 'user_id,connection_id'
        });

      if (error) {
        console.error('Error updating location:', error);
      } else {
        console.log('Location updated successfully');
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('location_shares')
      .select(`
        *,
        profiles (
          first_name,
          last_name,
          display_name,
          profile_picture_urls
        )
      `)
      .eq('connection_id', connectionId)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching locations:', error);
    } else {
      // Sign profile picture URLs
      const locationsWithSignedUrls = await Promise.all(
        (data || []).map(async (location) => {
          const rawUrls: string[] = location.profiles?.profile_picture_urls || [];
          const signedUrls = await getSignedUrls(rawUrls);
          
          return {
            ...location,
            profiles: {
              ...location.profiles,
              profile_picture_urls: signedUrls,
            }
          };
        })
      );

      setLocations(locationsWithSignedUrls);
      
      // Find user's own location
      const myLocation = locationsWithSignedUrls.find(loc => loc.user_id === user?.id);
      setUserLocation(myLocation || null);
    }
  };

  const shareLocation = async () => {
    if (!user) return;

    setSharing(true);
    
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Set expiration to 24 hours from now
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          const { error } = await supabase
            .from('location_shares')
            .upsert({
              user_id: user.id,
              connection_id: connectionId,
              latitude,
              longitude,
              expires_at: expiresAt.toISOString()
            }, {
              onConflict: 'user_id,connection_id'
            });

          if (error) {
            console.error('Error sharing location:', error);
          } else {
            console.log('Location shared successfully');
          }
          setSharing(false);
        }, (error) => {
          console.error('Error getting location:', error);
          setSharing(false);
        }, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        });
      } else {
        console.error('Geolocation not supported');
        setSharing(false);
      }
    } catch (error) {
      console.error('Error sharing location:', error);
      setSharing(false);
    }
  };

  const stopSharing = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('location_shares')
      .delete()
      .eq('user_id', user.id)
      .eq('connection_id', connectionId);

    if (error) {
      console.error('Error stopping location share:', error);
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

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card className="border-white/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Live Locations
            {userLocation && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                Auto-updating
              </div>
            )}
          </div>
          {locations.length > 0 && (
            <LocationMap 
              locations={locations}
              isOpen={isMapOpen}
              onClose={() => setIsMapOpen(false)}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => setIsMapOpen(true)}
              >
                <Map className="h-3 w-3 mr-1" />
                View Map
              </Button>
            </LocationMap>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {userLocation ? (
            <Button
              onClick={stopSharing}
              variant="outline"
              size="sm"
              className="flex-1 border-red-200 hover:bg-red-50 text-xs"
            >
              Stop Sharing
            </Button>
          ) : (
            <Button
              onClick={shareLocation}
              disabled={sharing}
              size="sm"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-xs"
            >
              {sharing ? 'Getting Location...' : 'Share Location'}
            </Button>
          )}
        </div>

        <div className="space-y-3 max-h-48 overflow-y-auto">
          {locations.length === 0 ? (
            <div className="text-center text-muted-foreground py-4 text-xs">
              No active location shares
            </div>
          ) : (
            locations.map((location) => (
              <div 
                key={location.id} 
                className="flex items-center gap-3 p-3 rounded-lg glassmorphic border-white/20"
              >
                <div className="relative">
                  <Avatar className="h-10 w-10 ring-2 ring-blue-200">
                    <AvatarImage 
                      src={location.profiles?.profile_picture_urls?.[0] || ''} 
                      alt={getDisplayName(location.profiles)} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-xs">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {getDisplayName(location.profiles)}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{getTimeRemaining(location.expires_at)} left</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => {
                    // Open in maps app
                    const url = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
                    window.open(url, '_blank');
                  }}
                >
                  <MapPin className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationShare;
