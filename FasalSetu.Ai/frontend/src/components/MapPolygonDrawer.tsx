import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

interface MapPolygonDrawerProps {
  onPolygonDrawn: (geoJson: any, areaHectares: number) => void;
}

export default function MapPolygonDrawer({ onPolygonDrawn }: MapPolygonDrawerProps) {
  const map = useMap();

  useEffect(() => {
    // Add Geoman controls
    map.pm.addControls({
      position: 'topleft',
      drawPolygon: true,
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
    });

    // Set path styling for the drawn polygons
    map.pm.setPathOptions({
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.4,
    });

    // Listen to draw create event
    map.on('pm:create', (e) => {
      const layer = e.layer as any;
      const geoJson = layer.toGeoJSON();
      
      // Calculate simplistic area (Placeholder logic for prototype)
      // In production, use Turf.js or similar for accurate geodetic calculations
      const areaHectares = 1.25; // mock value
      
      onPolygonDrawn(geoJson, areaHectares);
      
      // Listen to edits on this specific layer
      layer.on('pm:edit', () => {
         onPolygonDrawn(layer.toGeoJSON(), areaHectares);
      });
    });

    // Cleanup
    return () => {
      map.pm.removeControls();
      map.off('pm:create');
    };
  }, [map, onPolygonDrawn]);

  return null;
}
