
import React, { useEffect, useRef, useState } from 'react';
import { EventInfo } from '../types';

interface MapPanelProps {
  events: EventInfo[];
  onSelectEvent: (event: EventInfo) => void;
  selectedEvent: EventInfo | null;
}

export const MapPanel: React.FC<MapPanelProps> = ({ events, onSelectEvent, selectedEvent }) => {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize map
  useEffect(() => {
    let mounted = true;
    
    const initMap = async () => {
      try {
        if (!containerRef.current || mapRef.current) return;
        
        console.log('🗺️ Starting map initialization...');
        
        // Dynamic import of Leaflet
        const L = await import('leaflet');
        
        // Fix default icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        
        // Create map
        const map = L.map(containerRef.current, {
          center: [39.702, 141.152], // Iwate Prefecture center
          zoom: 8,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          touchZoom: true
        });
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
          minZoom: 6
        }).addTo(map);
        
        if (mounted) {
          mapRef.current = map;
          leafletRef.current = L;
          setIsMapReady(true);
          setIsLoading(false);
          console.log('✅ Map initialized successfully');
        }
        
      } catch (error) {
        console.error('❌ Map initialization failed:', error);
        if (mounted) {
          setMapError('地図の初期化に失敗しました');
          setIsLoading(false);
        }
      }
    };

    // Wait a bit for DOM to be ready
    const timeoutId = setTimeout(initMap, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          mapRef.current = null;
        } catch (error) {
          console.warn('Map cleanup error:', error);
        }
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current || !isMapReady) return;
    
    const map = mapRef.current;
    const L = leafletRef.current;
    
    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: any) => {
      map.removeLayer(marker);
    });
    markersRef.current = {};

    // Add new markers
    events.forEach(event => {
      const marker = L.marker([event.latitude, event.longitude])
        .addTo(map)
        .bindTooltip(event.title)
        .on('click', () => onSelectEvent(event));
      
      markersRef.current[event.id] = marker;
    });
  }, [events, isMapReady, onSelectEvent]);

  // Handle selected event
  useEffect(() => {
    if (!mapRef.current || !selectedEvent || !isMapReady) return;
    
    const marker = markersRef.current[selectedEvent.id];
    if (marker) {
      mapRef.current.flyTo(marker.getLatLng(), 13);
      marker.openTooltip();
    }
  }, [selectedEvent, isMapReady]);

  if (mapError) {
    return (
      <section className="flex-grow bg-slate-200 relative flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <h3 className="font-semibold mb-2">地図エラー</h3>
          <p className="text-sm mb-3">{mapError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            再読み込み
          </button>
        </div>
      </section>
    );
  }
  
  return (
    <section className="flex-grow bg-slate-200 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-slate-600">地図を読み込み中...</p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="h-full w-full"
        style={{ minHeight: '400px' }}
      />
    </section>
  );
};
