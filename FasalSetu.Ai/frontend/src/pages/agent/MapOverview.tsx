import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapOverview() {

  // Mock regional data
  const FARMS = [
    { id: 1, pos: [20.5937, 78.9629] as [number, number], status: 'severe', name: 'North Field' },
    { id: 2, pos: [20.6100, 78.9500] as [number, number], status: 'severe', name: 'East Parcel' },
    { id: 3, pos: [20.5800, 78.9800] as [number, number], status: 'nominal', name: 'South Parcel' },
    { id: 4, pos: [20.6200, 78.9100] as [number, number], status: 'moderate', name: 'River Array' },
  ];

  const getColor = (status: string) => {
    if(status === 'severe') return '#ef4444'; // Red
    if(status === 'moderate') return '#f97316'; // Orange
    return '#10b981'; // Green
  };

  return (
    <div className="h-[calc(100vh-120px)] w-full flex flex-col space-y-4">
      <div>
         <h1 className="text-2xl font-bold">Regional AI Overview</h1>
         <p className="text-sm text-gray-400">Map visualizing AI damage classifications across District 4</p>
      </div>

      <div className="flex-1 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative bg-surface-dark">
         
         <div className="absolute top-4 right-4 z-[400] bg-surface-dark/90 backdrop-blur border border-white/10 p-4 rounded-xl shadow-2xl flex flex-col gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 border-b border-white/10 pb-2">Index</h4>
            <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" /> Severe Loss</div>
            <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-orange-500" /> Moderate Loss</div>
            <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-brand-500" /> Nominal/Healthy</div>
         </div>

         <MapContainer center={[20.6000, 78.9500]} zoom={11} style={{ height: '100%', width: '100%', zIndex: 10 }}>
            {/* Darker base tile layer for analytical UI */}
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            
            {FARMS.map(farm => (
              <CircleMarker 
                 key={farm.id} 
                 center={farm.pos} 
                 radius={8} 
                 color={getColor(farm.status)}
                 fillColor={getColor(farm.status)}
                 fillOpacity={0.6}
                 weight={2}
              >
                <Popup className="bg-surface-dark text-white border-none rounded pointer-events-none">
                   <strong className="text-black">{farm.name}</strong><br/>
                   Status: {farm.status.toUpperCase()}
                </Popup>
              </CircleMarker>
            ))}
         </MapContainer>
      </div>
    </div>
  );
}
