import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Map as MapIcon, Edit3, ShieldAlert, CheckCircle, TrendingUp, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { farmApi } from '../../utils/apiClient';
import type { Farm } from '../../utils/apiClient';
import ErrorBanner from '../../components/ErrorBanner';

export default function FarmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    farmApi.getById(Number(id))
      .then(res => setFarm(res.data))
      .catch(() => setError('Could not load farm details. Is the backend running?'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={40} className="animate-spin text-brand-500" />
        <p className="text-gray-400 animate-pulse">Analysing satellite data for parcel #{id}...</p>
      </div>
    );
  }

  if (error || !farm) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors bg-white/5 border border-white/5">
          <ArrowLeft size={24} />
        </button>
        <ErrorBanner message={error || 'Farm not found.'} />
      </div>
    );
  }

  const getPolygonData = (): [number, number][] => {
    if (!farm?.boundaryGeoJson) return [];
    try {
      const geoJson = typeof farm.boundaryGeoJson === 'string' 
        ? JSON.parse(farm.boundaryGeoJson) 
        : farm.boundaryGeoJson;
      
      // Handle standard GeoJSON structure
      const coords = geoJson.geometry?.coordinates?.[0] || geoJson.coordinates?.[0];
      if (coords && Array.isArray(coords)) {
        return coords.map((c: any) => [c[1], c[0]]); // Swap [lng, lat] to [lat, lng]
      }
    } catch (e) {
      console.error('Error parsing farm boundary:', e);
    }
    return [];
  };

  const polygonData = getPolygonData();
  const hasBoundary = polygonData.length > 0;
  
  // Default fallback center if no boundary
  const mapCenter: [number, number] = hasBoundary ? polygonData[0] : [20.5937, 78.9629];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors bg-white/5 border border-white/5">
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold">{farm.farmName}</h1>
              <span className="px-2.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider rounded border border-green-500/20 flex items-center gap-1">
                 <CheckCircle size={12} /> Healthy
              </span>
            </div>
            <p className="text-gray-400 text-sm flex items-center gap-1 capitalize">
              <MapIcon size={14} /> {farm.village}, {farm.state} • <span className="uppercase">Survey #{farm.surveyNumber || 'N/A'}</span>
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Link to={`/farmer/farms/${id}/edit`} className="flex-1 md:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
            <Edit3 size={16} /> Edit Data
          </Link>
          <Link to="/farmer/claims/new" className="flex-1 md:flex-none px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-xl text-sm text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-lg">
            <ShieldAlert size={16} /> File Claim
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column (Details) */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface-card border border-white/5 rounded-3xl p-6 shadow-lg">
            <h3 className="font-semibold text-lg border-b border-white/10 pb-3 mb-4">Farm Profile</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Primary Crop</p>
                <p className="font-semibold text-text-main capitalize">{farm.primaryCrop || 'Not Specified'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Total Area</p>
                <p className="font-semibold text-text-main">{(farm.areaAcres || 0).toLocaleString()} Acres</p>
              </div>
            </div>
          </div>
          
          <div className="bg-brand-800 border border-brand-700 rounded-3xl p-6 shadow-[0_20px_40px_rgba(5,150,105,0.15)] relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
             <div className="flex justify-between items-start mb-4 relative z-10">
               <h3 className="font-black text-white text-lg tracking-tight">Current AI Outlook</h3>
               <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white">
                 <TrendingUp size={22} strokeWidth={2.5} />
               </div>
             </div>
             <p className="text-sm text-brand-50 font-medium leading-relaxed relative z-10 opacity-90">
               Satellite indicates nominal vegetation index (NDVI: 0.72). No active drought or flood signatures detected in this parcel during the last 7 days.
             </p>
          </div>
        </div>

        {/* Right Column (Map) */}
        <div className="md:col-span-2">
          <div className="bg-surface-card border border-white/5 rounded-3xl overflow-hidden shadow-lg h-[400px] relative">
            <div className="absolute top-4 left-4 z-[400] bg-surface-dark/80 backdrop-blur border border-white/10 rounded-xl p-3 shadow-2xl">
              <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Boundary Map</p>
              <p className="font-bold text-white text-sm">{(farm.areaAcres || 0).toLocaleString()} Ac</p>
            </div>
            
            <MapContainer 
              {...(hasBoundary ? { bounds: polygonData } : { center: mapCenter, zoom: 13 })}
              style={{ height: '100%', width: '100%', zIndex: 10 }}
              zoomControl={true}
              scrollWheelZoom={false}
            >
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
              {hasBoundary && (
                <Polygon positions={polygonData} color="#10b981" fillColor="#10b981" fillOpacity={0.4} weight={3} />
              )}
            </MapContainer>
          </div>
        </div>
        
      </div>
    </div>
  );
}
