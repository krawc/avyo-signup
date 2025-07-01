
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Settings } from 'lucide-react';

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
  isOpen: boolean,
  onClose: () => void;
  locations: LocationShare[];
  children: React.ReactNode;
}

const LocationMap = ({ isOpen, onClose, locations, children }: LocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('pk.eyJ1Ijoia3Jhd2MiLCJhIjoiY2xtdWp3ZzViMGpjeTJrb2NtaHVuZWl1biJ9.xCUOYkJHjQ2oEWBzBqc66w');
  const [isMapReady, setIsMapReady] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  //const [dialogOpen, setDialogOpen] = useState(true);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    // Check if token exists in localStorage
    // const savedToken = localStorage.getItem('mapbox_token');
    if (mapboxToken) {
      // setMapboxToken(savedToken);
      setIsMapReady(true);
    } else {
      setShowTokenInput(true);
    }
  }, []);

  const initializeMap = () => {

    console.log(mapContainer.current, mapboxToken)

    if (!mapContainer.current || !mapboxToken) return;

    console.log('initializeMap running')

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-74.5, 40],
        zoom: 9
      });

      console.log('got the map')

      console.log(map)

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      map.current.on('load', () => {
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

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    if (locations.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach((location) => {
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
      `;

      // If no profile image, add initials
      if (!location.profiles?.profile_picture_urls?.[0]) {
        const name = getDisplayName(location.profiles);
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        markerEl.innerHTML = `<div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-weight: bold;
          color: #3b82f6;
          font-size: 14px;
        ">${initials}</div>`;
      }

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([Number(location.longitude), Number(location.latitude)])
        .setPopup(new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="text-align: center; padding: 5px;">
              <strong>${getDisplayName(location.profiles)}</strong>
              <br/>
              <small>Shared ${new Date(location.created_at).toLocaleTimeString()}</small>
            </div>
          `))
        .addTo(map.current!);

      markers.current.push(marker);
      bounds.extend([Number(location.longitude), Number(location.latitude)]);
    });

    // Fit map to show all markers
    if (locations.length > 1) {
      map.current.fitBounds(bounds, { padding: 50 });
    } else if (locations.length === 1) {
      map.current.setCenter([Number(locations[0].longitude), Number(locations[0].latitude)]);
      map.current.setZoom(14);
    }
  };

  useEffect(() => {
    if (isMapReady) {
      updateMarkers();
    }
  }, [locations, isMapReady]);

  useEffect(() => {
    if (isOpen) {
      // Wait a tick to let the DOM paint the dialog
      setTimeout(() => {
        if (mapContainer.current) {
          initializeMap();
        }
      }, 50); // 50ms is usually enough
    }
  }, [isOpen]);

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
            </DialogTitle>
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTokenInput(true)}
            >
              <Settings className="h-4 w-4" />
            </Button> */}
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


        {locations.length === 0 && isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No active location shares</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LocationMap;
