import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

interface LocationMapProps {
  isOpen: boolean;
  onClose: () => void;
  locations: LocationShare[];
  connectionId: string;
  children: React.ReactNode;
}

const LocationMap = ({ isOpen, onClose, locations, connectionId, children }: LocationMapProps) => {
  const { user } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('pk.eyJ1Ijoia3Jhd2MiLCJhIjoiY2xtdWp3ZzViMGpjeTJrb2NtaHVuZWl1biJ9.xCUOYkJHjQ2oEWBzBqc66w');
  const [isMapReady, setIsMapReady] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [realTimeLocations, setRealTimeLocations] = useState<LocationShare[]>([]);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const locationUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const watchId = useRef<number | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [initialFitDone, setInitialFitDone] = useState(false);

  useEffect(() => {
    if (mapboxToken) {
      setIsMapReady(true);
    } else {
      setShowTokenInput(true);
    }
  }, []);

  // Start real-time location updates when map is open
  useEffect(() => {
    if (isOpen && connectionId && user) {
      console.log('Starting real-time location updates');
      startLocationUpdates();
      
      // Set up real-time subscription for location changes
      const channel = supabase
        .channel('location-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'location_shares',
            filter: `connection_id=eq.${connectionId}`
          },
          () => {
            console.log('Location change detected, reloading');
            loadLocations();
          }
        )
        .subscribe();

      return () => {
        console.log('Stopping location updates');
        stopLocationUpdates();
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, connectionId, user]);

  const startLocationUpdates = () => {
    console.log('Starting location updates');
    
    // Initial load
    loadLocations();
    
    // Update location every 5 seconds
    locationUpdateInterval.current = setInterval(() => {
      updateCurrentLocation();
      loadLocations();
    }, 5000);

    // Start continuous watching for more frequent updates
    if ('geolocation' in navigator) {
      console.log('Starting geolocation watch');
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          console.log('Position update:', position.coords.latitude, position.coords.longitude);
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
    if (!user || !connectionId) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Updating location:', position.coords.latitude, position.coords.longitude);
          updateLocationInDatabase(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting current location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        }
      );
    }
  };

  const updateLocationInDatabase = async (latitude: number, longitude: number) => {
    if (!user || !connectionId) return;

    try {
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

  const loadLocations = async () => {
    if (!connectionId) return;

    try {
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
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading locations:', error);
      } else {
        console.log('Loaded locations:', data?.length || 0);
        setRealTimeLocations(data || []);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    console.log('Initializing map');

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-74.5, 40],
        zoom: 9
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Track user interactions to prevent auto-zoom when user is actively using the map
      map.current.on('dragstart', () => setHasUserInteracted(true));
      map.current.on('zoomstart', () => setHasUserInteracted(true));
      map.current.on('pitchstart', () => setHasUserInteracted(true));
      map.current.on('rotatestart', () => setHasUserInteracted(true));
      
      map.current.on('load', () => {
        console.log('Map loaded');
        setIsMapReady(true);
        updateMarkers();
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const saveToken = () => {
    if (mapboxToken.trim()) {
      localStorage.setItem('mapbox_token', mapboxToken);
      setShowTokenInput(false);
      initializeMap();
    }
  };

  const updateMarkers = () => {
    if (!map.current || !isMapReady) return;

    console.log('Updating markers with', realTimeLocations.length, 'locations');

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    if (realTimeLocations.length === 0) return;

    realTimeLocations.forEach((location) => {
      const getDisplayName = (profile: any) => {
        if (!profile) return 'Anonymous User';
        if (profile.display_name) return profile.display_name;
        if (profile.first_name && profile.last_name) {
          return `${profile.first_name} ${profile.last_name}`;
        }
        return profile.first_name || 'Anonymous User';
      };

      // Create custom marker element with profile image
      const markerEl = document.createElement('div');
      markerEl.className = 'custom-marker';
      markerEl.style.cssText = `
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: 3px solid #3b82f6;
        background-size: cover;
        background-position: center;
        background-image: url('${location.profiles?.profile_picture_urls?.[0] || ''}');
        background-color: #f3f4f6;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        position: relative;
      `;

      // Add pulsing animation for real-time effect
      const pulseEl = document.createElement('div');
      pulseEl.style.cssText = `
        position: absolute;
        top: -5px;
        left: -5px;
        right: -5px;
        bottom: -5px;
        border-radius: 50%;
        border: 2px solid #3b82f6;
        animation: pulse 2s infinite;
      `;
      markerEl.appendChild(pulseEl);

      // If no profile image, add initials
      if (!location.profiles?.profile_picture_urls?.[0]) {
        const name = getDisplayName(location.profiles);
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const initialsEl = document.createElement('div');
        initialsEl.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-weight: bold;
          color: #3b82f6;
          font-size: 14px;
          z-index: 1;
          position: relative;
        `;
        initialsEl.textContent = initials;
        markerEl.appendChild(initialsEl);
      }

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([Number(location.longitude), Number(location.latitude)])
        .setPopup(new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="text-align: center; padding: 5px;">
              <strong>${getDisplayName(location.profiles)}</strong>
              <br/>
              <small>Updated ${new Date(location.created_at).toLocaleTimeString()}</small>
              <br/>
              <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin: 5px auto; animation: pulse 1s infinite;"></div>
              <small style="color: #10b981;">Live</small>
            </div>
          `))
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Only fit bounds on initial load or when user hasn't interacted with the map recently
    if (!initialFitDone || (!hasUserInteracted && realTimeLocations.length > 0)) {
      const bounds = new mapboxgl.LngLatBounds();
      
      realTimeLocations.forEach((location) => {
        bounds.extend([Number(location.longitude), Number(location.latitude)]);
      });

      if (realTimeLocations.length > 1) {
        map.current.fitBounds(bounds, { padding: 50 });
      } else if (realTimeLocations.length === 1) {
        map.current.setCenter([Number(realTimeLocations[0].longitude), Number(realTimeLocations[0].latitude)]);
        if (!initialFitDone) {
          map.current.setZoom(14);
        }
      }
      
      if (!initialFitDone) {
        setInitialFitDone(true);
      }
      
      // Reset user interaction flag after a delay
      if (hasUserInteracted) {
        setTimeout(() => setHasUserInteracted(false), 10000); // Reset after 10 seconds of no interaction
      }
    }
  };

  // Update markers when locations change
  useEffect(() => {
    if (isMapReady) {
      updateMarkers();
    }
  }, [realTimeLocations, isMapReady]);

  useEffect(() => {
    if (isOpen) {
      // Reset interaction state when map opens
      setHasUserInteracted(false);
      setInitialFitDone(false);
      
      // Wait a tick to let the DOM paint the dialog
      setTimeout(() => {
        if (mapContainer.current) {
          initializeMap();
        }
      }, 50);
    }
  }, [isOpen]);

  // Add CSS for pulse animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.7;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Locations Map
              <span className="text-sm text-muted-foreground">
                (Updates every 5 seconds)
              </span>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>

        {showTokenInput && (
          <div className="p-6 border-b">
            <div className="space-y-3">
              <Label htmlFor="mapbox-token">
                Mapbox Access Token
                <span className="text-xs text-muted-foreground ml-2">
                  Get yours from <a href="https://mapbox.com/" target="_blank" className="text-blue-500 hover:underline">mapbox.com</a>
                </span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="mapbox-token"
                  type="password"
                  placeholder="pk.ey..."
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                />
                <Button onClick={saveToken} disabled={!mapboxToken.trim()}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="relative h-[500px]">
          <div ref={mapContainer} className="w-full h-full" />
        </div>

        {realTimeLocations.length === 0 && isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No active location shares</p>
              <p className="text-sm text-gray-500">Share your location to see real-time updates</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LocationMap;
