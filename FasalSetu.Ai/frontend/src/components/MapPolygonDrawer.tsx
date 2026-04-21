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

    const calculateArea = (geoJson: any): number => {
      try {
        const coords = geoJson.geometry?.coordinates?.[0] || geoJson.coordinates?.[0];
        if (!coords || coords.length < 3) return 0;

        // Use a simple planar approximation for small areas (farms)
        // Convert degrees to meters relative to the first point
        const lat0 = coords[0][1];
        const radLat0 = (lat0 * Math.PI) / 180;
        
        // Meters per degree
        const mPerDegLat = 111132.92 - 559.82 * Math.cos(2 * radLat0) + 1.175 * Math.cos(4 * radLat0);
        const mPerDegLng = 111412.84 * Math.cos(radLat0) - 93.5 * Math.cos(3 * radLat0);

        let area = 0;
        for (let i = 0; i < coords.length - 1; i++) {
          const p1 = coords[i];
          const p2 = coords[i + 1];
          
          const x1 = (p1[0] - coords[0][0]) * mPerDegLng;
          const y1 = (p1[1] - coords[0][1]) * mPerDegLat;
          const x2 = (p2[0] - coords[0][0]) * mPerDegLng;
          const y2 = (p2[1] - coords[0][1]) * mPerDegLat;
          
          area += (x1 * y2 - x2 * y1);
        }
        
        const areaSqMeters = Math.abs(area) / 2;
        const hectares = areaSqMeters / 10000;
        return Math.round(hectares * 100) / 100; // Round to 2 decimal places
      } catch (e) {
        console.error('Area calculation error:', e);
        return 0;
      }
    };

    // Listen to draw create event
    map.on('pm:create', (e) => {
      const layer = e.layer as any;
      const geoJson = layer.toGeoJSON();
      const areaHectares = calculateArea(geoJson);
      
      onPolygonDrawn(geoJson, areaHectares);
      
      // Listen to edits on this specific layer
      layer.on('pm:edit', () => {
         const updatedGeoJson = layer.toGeoJSON();
         const updatedArea = calculateArea(updatedGeoJson);
         onPolygonDrawn(updatedGeoJson, updatedArea);
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
