import { useEffect, useRef, useState } from 'react';
import { Tables } from '@/integrations/supabase/types';
import { Loader2 } from 'lucide-react';

type Issue = Tables<'issues'>;

interface IssueMapProps {
  issues: Issue[];
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyC0KWOxYhICkZFaSFCo3A5ogd6Ha7qqljU';

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
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=visualization`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setMapLoaded(true);
        setLoading(false);
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps');
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

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

    mapInstanceRef.current = map;

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [mapLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasValidCoords = false;

    // Add markers for issues with coordinates
    issues.forEach((issue) => {
      if (issue.latitude && issue.longitude) {
        const lat = parseFloat(issue.latitude.toString());
        const lng = parseFloat(issue.longitude.toString());
        
        if (!isNaN(lat) && !isNaN(lng)) {
          hasValidCoords = true;
          const position = { lat, lng };
          bounds.extend(position);

          const color = statusColors[issue.status] || statusColors.pending;

          const marker = new google.maps.Marker({
            position,
            map: mapInstanceRef.current,
            title: issue.title,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: color,
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          // Info window on click
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 200px;">
                <h3 style="font-weight: 600; margin-bottom: 4px;">${issue.title}</h3>
                <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${issue.location}</p>
                <span style="
                  display: inline-block;
                  padding: 2px 8px;
                  border-radius: 12px;
                  font-size: 11px;
                  font-weight: 500;
                  color: white;
                  background-color: ${color};
                ">${issue.status.replace('_', ' ')}</span>
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current, marker);
          });

          markersRef.current.push(marker);
        }
      }
    });

    // Fit bounds if we have markers
    if (hasValidCoords && markersRef.current.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);
      // Don't zoom in too much for single marker
      if (markersRef.current.length === 1) {
        mapInstanceRef.current.setZoom(14);
      }
    }
  }, [issues, mapLoaded]);

  if (loading) {
    return (
      <div className="w-full h-[400px] rounded-xl bg-muted/50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
