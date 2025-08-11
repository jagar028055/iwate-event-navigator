
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { EventInfo } from '../types';

interface MapPanelProps {
  events: EventInfo[];
  onSelectEvent: (event: EventInfo) => void;
  selectedEvent: EventInfo | null;
}

// Fix for default icon path issue when using with module bundlers
// By default, Leaflet tries to guess the icon path, which can fail.
// We are explicitly setting the paths to a known CDN location.
if (L.Icon.Default.prototype) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const MapPanel: React.FC<MapPanelProps> = ({ events, onSelectEvent, selectedEvent }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // Initialize map on first render
  useEffect(() => {
    if (!mapRef.current) {
      // Create map instance centered on Iwate Prefecture
      const map = L.map('map-container').setView([39.702, 141.152], 8); // Centered on Morioka city
      
      // Add a tile layer from OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapRef.current = map;
    }
  }, []); // Empty dependency array ensures this runs only once

  // Update markers when the list of events changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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
  }, [events, onSelectEvent]);

  // Handle event selection changes
  useEffect(() => {
    const map = mapRef.current;
    // Do nothing if map or selected event is not available
    if (!map || !selectedEvent) return;

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

  return (
    <section className="flex-grow bg-slate-200 relative">
      <div id="map-container" className="h-full w-full z-10" />
    </section>
  );
};
