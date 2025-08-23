
import React, { useEffect, useRef, useState } from 'react';
import { EventInfo } from '../types';

// Dynamic import types
type LeafletModule = typeof import('leaflet');
type LeafletMap = import('leaflet').Map;
type LeafletMarker = import('leaflet').Marker;

interface MapPanelProps {
  events: EventInfo[];
  onSelectEvent: (event: EventInfo) => void;
  selectedEvent: EventInfo | null;
}

export const MapPanel: React.FC<MapPanelProps> = ({ events, onSelectEvent, selectedEvent }) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<{ [key: string]: LeafletMarker }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoadingLeaflet, setIsLoadingLeaflet] = useState(false);

  // Initialize map on first render with proper cleanup
  useEffect(() => {
    let map: L.Map | null = null;
    let timeoutId: NodeJS.Timeout;
    
    const initializeMap = async () => {
      try {
        // Wait for container to be ready
        if (!containerRef.current) {
          console.warn('Map container not ready, retrying...');
          timeoutId = setTimeout(initializeMap, 100);
          return;
        }
        
        // Check if map is already initialized (React StrictMode protection)
        if (mapRef.current) {
          console.log('Map already initialized, skipping...');
          setIsMapReady(true);
          return;
        }
        
        // Load Leaflet dynamically if not already loaded
        if (!leafletRef.current) {
          console.log('Loading Leaflet library...');
          setIsLoadingLeaflet(true);
          
          const [L, markerIcon, markerIconRetina, markerShadow] = await Promise.all([
            import('leaflet'),
            import('leaflet/dist/images/marker-icon.png'),
            import('leaflet/dist/images/marker-icon-2x.png'),
            import('leaflet/dist/images/marker-shadow.png')
          ]);
          
          // Configure Leaflet icons
          if (L.Icon.Default.prototype) {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
          }
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: markerIconRetina.default,
            iconUrl: markerIcon.default,
            shadowUrl: markerShadow.default,
          });
          
          leafletRef.current = L;
          console.log('Leaflet library loaded successfully');
        }
        
        const L = leafletRef.current;
        setIsLoadingLeaflet(false);
        
        console.log('Initializing Leaflet map...');
        
        // Create map instance centered on Iwate Prefecture
        map = L.map(containerRef.current).setView([39.702, 141.152], 8);
        
        // Add a tile layer from OpenStreetMap with error handling
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          minZoom: 6
        });
        
        tileLayer.on('tileerror', (e) => {
          console.warn('Tile loading error:', e);
        });
        
        tileLayer.addTo(map);
        
        mapRef.current = map;
        setIsMapReady(true);
        setMapError(null);
        
        console.log('Leaflet map initialized successfully');
        
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError(error instanceof Error ? error.message : 'Map initialization failed');
      }
    };
    
    // Start initialization
    initializeMap();
    
    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      if (map && mapRef.current === map) {
        console.log('Cleaning up map...');
        try {
          // Clear markers
          Object.values(markersRef.current).forEach(marker => {
            map?.removeLayer(marker);
          });
          markersRef.current = {};
          
          // Remove and destroy map
          map.remove();
        } catch (error) {
          console.warn('Error during map cleanup:', error);
        }
        mapRef.current = null;
        setIsMapReady(false);
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  // Update markers when the list of events changes
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !isMapReady) return;

    // Clear existing markers from the map and the reference object
    Object.values(markersRef.current).forEach(marker => map.removeLayer(marker));
    markersRef.current = {};

    // Add new markers for each event
    events.forEach(event => {
      const marker = L.marker([event.latitude, event.longitude])
        .addTo(map)
        .on('click', () => {
          onSelectEvent(event);
        });
      
      // Add a tooltip that shows the event title on hover
      marker.bindTooltip(event.title);
      
      markersRef.current[event.id] = marker;
    });
  }, [events, onSelectEvent, isMapReady]);

  // Handle event selection changes
  useEffect(() => {
    const map = mapRef.current;
    // Do nothing if map or selected event is not available
    if (!map || !isMapReady || !selectedEvent) return;

    const marker = markersRef.current[selectedEvent.id];
    if (marker) {
      // Animate the map view to the selected marker's position with a closer zoom
      map.flyTo(marker.getLatLng(), 13, {
        animate: true,
        duration: 0.8
      });
      // Programmatically open the marker's tooltip
      marker.openTooltip();
    }
  }, [selectedEvent]);

  if (mapError) {
    return (
      <section className="flex-grow bg-slate-200 relative flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
          <h3 className="font-semibold mb-2">地図の読み込みに失敗しました</h3>
          <p className="text-sm mb-3">{mapError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            ページを再読み込み
          </button>
        </div>
      </section>
    );
  }
  
  return (
    <section className="flex-grow bg-slate-200 relative">
      {(!isMapReady || isLoadingLeaflet) && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-slate-600">
              {isLoadingLeaflet ? '地図ライブラリを読み込み中...' : '地図を読み込み中...'}
            </p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full z-10" />
    </section>
  );
};
