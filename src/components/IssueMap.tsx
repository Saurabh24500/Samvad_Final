import { useEffect, useRef, useState } from 'react';
import { Tables } from '@/integrations/supabase/types';
import { Loader2 } from 'lucide-react';

type Issue = Tables<'issues'>;

interface IssueMapProps {
  issues: Issue[];
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC0KWOxYhICkZFaSFCo3A5ogd6Ha7qqljU';

const statusColors: Record<string, string> = {
  pending: '#f59e0b',      // Warning yellow
  in_progress: '#3b82f6',  // Info blue
  resolved: '#22c55e',     // Success green
  rejected: '#ef4444',     // Error red
};

// Extend Window interface for google maps
declare global {
  interface Window {
    google: typeof google;
  }
}

export default function IssueMap({ issues }: IssueMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    console.log('IssueMap: Component mounted, issues:', issues);
    console.log('GOOGLE_MAPS_API_KEY:', GOOGLE_MAPS_API_KEY);
    
    // Load Google Maps script
    if (!window.google) {
      console.log('IssueMap: Loading Google Maps script...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=visualization`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('IssueMap: Google Maps script loaded successfully');
        setMapLoaded(true);
        setLoading(false);
        setError(null);
      };
      script.onerror = (e) => {
        console.error('IssueMap: Failed to load Google Maps', e);
        setLoading(false);
        setError('Failed to load Google Maps. Please check your API key and ensure Maps JavaScript API is enabled.');
      };
      document.head.appendChild(script);
    } else {
      console.log('IssueMap: Google Maps already loaded');
      setMapLoaded(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    console.log('IssueMap: Initializing map, mapRef.current:', mapRef.current);
    // Initialize map centered on India
    const map = new google.maps.Map(mapRef.current, {
      zoom: 5,
      center: { lat: 20.5937, lng: 78.9629 }, // Center of India
      mapTypeControl: false,
      streetViewControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    console.log('IssueMap: Map initialized:', map);
    mapInstanceRef.current = map;

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [mapLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) {
      console.log('IssueMap: Skipping marker update - mapInstanceRef.current:', !!mapInstanceRef.current, 'mapLoaded:', mapLoaded);
      return;
    }

    console.log('IssueMap: Processing issues for markers, count:', issues.length);

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasValidCoords = false;
    let activeInfoWindow: google.maps.InfoWindow | null = null;

    // Add markers for issues with coordinates
    issues.forEach((issue) => {
      if (issue.latitude && issue.longitude) {
        const lat = parseFloat(issue.latitude.toString());
        const lng = parseFloat(issue.longitude.toString());
        
        if (!isNaN(lat) && !isNaN(lng)) {
          console.log(`IssueMap: Adding marker for issue "${issue.title}" at [${lat}, ${lng}]`);
          hasValidCoords = true;
          const position = { lat, lng };
          bounds.extend(position);

          const color = statusColors[issue.status] || statusColors.pending;
          const statusLabel = issue.status.replace('_', ' ').charAt(0).toUpperCase() + issue.status.replace('_', ' ').slice(1);

          const marker = new google.maps.Marker({
            position,
            map: mapInstanceRef.current,
            title: issue.title,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: color,
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          // Info window content
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; max-width: 220px; font-family: system-ui, sans-serif;">
                <h3 style="font-weight: 600; margin: 0 0 6px 0; font-size: 14px; color: #1a1a1a;">${issue.title}</h3>
                <p style="font-size: 12px; color: #666; margin: 0 0 6px 0;">📍 ${issue.location}</p>
                <p style="font-size: 11px; color: #888; margin: 0 0 8px 0;">🕐 ${new Date(issue.created_at).toLocaleDateString()}</p>
                <span style="
                  display: inline-block;
                  padding: 3px 10px;
                  border-radius: 12px;
                  font-size: 11px;
                  font-weight: 600;
                  color: white;
                  background-color: ${color};
                  text-transform: capitalize;
                ">${statusLabel}</span>
              </div>
            `,
          });

          // Show on hover (mouseover)
          marker.addListener('mouseover', () => {
            if (activeInfoWindow) {
              activeInfoWindow.close();
            }
            infoWindow.open(mapInstanceRef.current, marker);
            activeInfoWindow = infoWindow;
          });

          // Keep open on click
          marker.addListener('click', () => {
            if (activeInfoWindow && activeInfoWindow !== infoWindow) {
              activeInfoWindow.close();
            }
            infoWindow.open(mapInstanceRef.current, marker);
            activeInfoWindow = infoWindow;
          });

          markersRef.current.push(marker);
        }
      }
    });

    // Fit bounds if we have markers
    if (hasValidCoords && markersRef.current.length > 0) {
      console.log(`IssueMap: Created ${markersRef.current.length} markers, fitting bounds`);
      mapInstanceRef.current.fitBounds(bounds);
      // Don't zoom in too much for single marker
      if (markersRef.current.length === 1) {
        mapInstanceRef.current.setZoom(14);
      }
    } else {
      console.log(`IssueMap: No valid markers found. hasValidCoords=${hasValidCoords}, markersCount=${markersRef.current.length}`);
      console.log('Issues data:', issues);
    }
  }, [issues, mapLoaded]);

  if (loading) {
    return (
      <div className="w-full h-[400px] rounded-xl bg-muted/50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[400px] rounded-xl bg-red-50 border border-red-200 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-700 font-semibold mb-2">Map Loading Error</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div 
        ref={mapRef} 
        className="w-full h-[400px] rounded-xl overflow-hidden border border-border"
      />
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors.pending }} />
          <span className="text-muted-foreground">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors.in_progress }} />
          <span className="text-muted-foreground">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors.resolved }} />
          <span className="text-muted-foreground">Resolved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors.rejected }} />
          <span className="text-muted-foreground">Rejected</span>
        </div>
      </div>
    </div>
  );
}
