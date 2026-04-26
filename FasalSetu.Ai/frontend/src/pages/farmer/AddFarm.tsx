import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, Map as MapIcon, Shrub, Info, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, useMap, useMapEvents, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { farmApi } from '../../utils/apiClient';
import type { Farm } from '../../utils/apiClient';
import { useAuthStore } from '../../store/authStore';
import ErrorBanner from '../../components/ErrorBanner';
import MapPolygonDrawer from '../../components/MapPolygonDrawer';
import { INDIA_LOCATIONS } from '../../utils/indiaData';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Fix for default marker icon in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// ─── Map Components ──────────────────────────────────────────────────────────

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

function MapEvents({ onLocationSelected }: { onLocationSelected: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────

export default function AddFarm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const farmerId = Number(user?.id) || 1;

  const [form, setForm] = useState<Partial<Farm>>({
    farmName: '', state: '', district: '', village: '', primaryCrop: '', areaAcres: undefined,
    surveyNumber: '', soilType: '', boundaryGeoJson: '',
    latitude: 20.5937, longitude: 78.9629
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mapView, setMapView] = useState<{ center: [number, number], zoom: number }>({
    center: [20.5937, 78.9629],
    zoom: 5
  });

  const handlePolygonDrawn = useCallback((geoJson: any, area: number) => {
    // When polygon is drawn, we can also extract a centroid or just keep existing coords
    setForm(prev => ({
      ...prev,
      boundaryGeoJson: JSON.stringify(geoJson),
      areaAcres: prev.areaAcres || (area * 2.471)
    }));
  }, []);

  const handleLocationSelected = (lat: number, lng: number) => {
    setForm(prev => ({ ...prev, latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) }));
    setMapView({ center: [lat, lng], zoom: 16 });
  };

  // Sync Form -> Map (Manual entry)
  useEffect(() => {
    if (form.latitude && form.longitude) {
       // Only update map view if the coordinates changed significantly (to avoid loops)
       const isDifferent = Math.abs(mapView.center[0] - form.latitude) > 0.0001 || 
                          Math.abs(mapView.center[1] - form.longitude) > 0.0001;
       if (isDifferent) {
         setMapView({ center: [form.latitude, form.longitude], zoom: 16 });
       }
    }
  }, [form.latitude, form.longitude]);

  // Geocoding for State/District
  useEffect(() => {
    const geocode = async () => {
      if (!form.state && !form.district) return;
      
      const query = `${form.district || ''} ${form.state || ''} India`.trim();
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await res.json();
        if (data && data[0]) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          handleLocationSelected(lat, lon);
        }
      } catch (err) {
        console.warn("Geocoding failed", err);
      }
    };

    const timer = setTimeout(geocode, 1000); // Debounce
    return () => clearTimeout(timer);
  }, [form.state, form.district]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.boundaryGeoJson) {
      setError('Please mark your farm location on the map before saving.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await farmApi.create({ ...form, farmerId } as Farm);
      setSuccess(true);
      setTimeout(() => navigate('/farmer/farms'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save farm. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: (name === 'latitude' || name === 'longitude') ? parseFloat(value) : value };
      if (name === 'state') updated.district = '';
      return updated;
    });
  };

  const field = (label: string, key: keyof Farm, type = 'text', placeholder = '') => (
    <div className="space-y-1.5">
      <label className="text-xs font-black text-brand-900 uppercase tracking-widest ml-1">{label}</label>
      <input
        type={type}
        step="any"
        name={key}
        placeholder={placeholder}
        value={form[key] === null || form[key] === undefined || (type === 'number' && isNaN(form[key] as any)) ? '' : (form[key] as any)}
        onChange={handleInputChange as any}
        className="w-full bg-white border border-surface-border rounded-2xl py-4 px-5 text-text-main font-black focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm transition-all placeholder:text-text-secondary/40"
        required={['farmName', 'state', 'district', 'village'].includes(key as string)}
      />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center gap-6 mb-10">
        <button 
          onClick={() => navigate(-1)} 
          className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-premium border border-surface-border text-text-secondary hover:text-brand-600 transition-all active:scale-95"
        >
          <ArrowLeft size={22} strokeWidth={3} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-brand-900 tracking-tight leading-none">{t('addFarm.title')}</h1>
          <p className="text-text-secondary text-sm font-bold mt-2">{t('addFarm.subtitle')}</p>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <ErrorBanner message={error} />
        </motion.div>
      )}

      {success ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center py-32 gap-6 text-center bg-white rounded-[3rem] border border-surface-border shadow-premium"
        >
          <div className="w-24 h-24 rounded-[2rem] bg-brand-50 flex items-center justify-center text-brand-500 animate-pulse-soft">
            <CheckCircle size={48} strokeWidth={2.5} />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-text-main">{t('addFarm.success')}</h3>
            <p className="text-text-secondary font-bold">{t('addFarm.fieldRegistered')}</p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Map Side */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7 space-y-4 lg:sticky lg:top-10"
          >
             <div className="bg-white p-2 rounded-[2.5rem] border border-surface-border shadow-premium overflow-hidden">
                <div className="h-[600px] rounded-[2.1rem] overflow-hidden relative z-0">
                   <div className="absolute top-4 left-4 z-20 glass border border-brand-100/50 px-4 py-2.5 rounded-xl text-xs font-black text-brand-700 flex items-center gap-2 shadow-lg">
                      <MapIcon size={14} /> {t('addFarm.markBoundary')}
                   </div>
                   <MapContainer 
                     center={mapView.center} 
                     zoom={mapView.zoom} 
                     className="h-full w-full"
                   >
                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                     <MapController center={mapView.center} zoom={mapView.zoom} />
                     <MapEvents onLocationSelected={handleLocationSelected} />
                     <MapPolygonDrawer onPolygonDrawn={handlePolygonDrawn} />
                     {form.latitude && form.longitude && (
                        <Marker position={[form.latitude, form.longitude]}>
                           <Popup className="font-black">Your Farm Center</Popup>
                        </Marker>
                     )}
                   </MapContainer>
                </div>
             </div>
             <div className="bg-brand-50 border-2 border-brand-100 p-5 rounded-3xl flex items-start gap-4">
               <Info size={24} className="text-brand-600 shrink-0 mt-0.5" strokeWidth={2.5} />
               <p className="text-[12px] text-brand-800 font-bold leading-relaxed">
                 <span className="text-brand-600 block mb-1">PRO TIP:</span>
                 Type your District/State to move the map, or **click anywhere on the map** to auto-fill the coordinates. Use the drawing tool on the top-left to mark your boundaries.
               </p>
             </div>
          </motion.div>

          {/* Form Side */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 h-full"
          >
            <form onSubmit={handleSubmit} className="bg-white border border-surface-border rounded-[2.5rem] p-10 shadow-premium space-y-6">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
                    <Shrub size={24} strokeWidth={2.5} />
                 </div>
                 <p className="font-black text-xl text-text-main">{t('addFarm.fieldDetails')}</p>
              </div>

              {field('Farm Name', 'farmName', 'text', 'e.g. Village North Field')}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black text-brand-900 uppercase tracking-widest ml-1">{t('addFarm.state')}</label>
                  <select name="state" value={form.state} onChange={handleInputChange} className="w-full bg-white border border-surface-border rounded-2xl py-4 px-4 text-text-main font-black outline-none focus:ring-2 focus:ring-brand-500 shadow-sm transition-all" required>
                     <option value="">{t('addFarm.selectState')}</option>
                     {Object.keys(INDIA_LOCATIONS).sort().map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black text-brand-900 uppercase tracking-widest ml-1">{t('addFarm.district')}</label>
                  <select name="district" value={form.district} onChange={handleInputChange} disabled={!form.state} className="w-full bg-white border border-surface-border rounded-2xl py-4 px-4 text-text-main font-black outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-40 shadow-sm transition-all" required>
                     <option value="">{form.state ? t('addFarm.selectDistrict') : t('addFarm.firstPickState')}</option>
                     {(INDIA_LOCATIONS[form.state!] || []).sort().map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {field('Village', 'village', 'text', 'Enter village name')}
              
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <Crosshair size={12} /> Geographic Coordinates
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {field('Latitude', 'latitude', 'number', '20.5937')}
                  {field('Longitude', 'longitude', 'number', '78.9629')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {field('Survey Number', 'surveyNumber', 'text', 'Khasra No.')}
                {field('Area (Acres)', 'areaAcres', 'number', '0.00')}
              </div>

              {field('Primary Crop', 'primaryCrop', 'text', 'e.g. Rice, Wheat, Cotton')}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-black text-xl py-6 rounded-[2rem] shadow-xl shadow-brand-500/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <>{t('addFarm.saveAndConnect')} <CheckCircle size={20} strokeWidth={3} /></>}
              </button>
            </form>
          </motion.div>

        </div>
      )}
    </div>
  );
}
