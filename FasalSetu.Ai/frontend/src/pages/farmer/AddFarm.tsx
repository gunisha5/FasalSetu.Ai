import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { farmApi } from '../../utils/apiClient';
import type { Farm } from '../../utils/apiClient';
import { useAuthStore } from '../../store/authStore';
import ErrorBanner from '../../components/ErrorBanner';
import MapPolygonDrawer from '../../components/MapPolygonDrawer';
import { INDIA_LOCATIONS } from '../../utils/indiaData';

export default function AddFarm() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const farmerId = Number(user?.id) || 1;

  const [form, setForm] = useState<Partial<Farm>>({
    farmName: '', state: '', district: '', village: '', primaryCrop: '', areaHectares: undefined,
    surveyNumber: '', soilType: '', boundaryGeoJson: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handlePolygonDrawn = (geoJson: any, area: number) => {
    setForm(prev => ({
      ...prev,
      boundaryGeoJson: JSON.stringify(geoJson),
      areaHectares: prev.areaHectares || area
    }));
  };

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
      const updated = { ...prev, [name]: value };
      if (name === 'state') updated.district = ''; // Reset district on state change
      return updated;
    });
  };

  const field = (label: string, key: keyof Farm, type = 'text') => (
    <div className="space-y-1">
      <label className="text-sm text-gray-300 ml-1">{label}</label>
      <input
        type={type}
        name={key}
        value={form[key] === undefined || (type === 'number' && isNaN(form[key] as any)) ? '' : (form[key] as any)}
        onChange={handleInputChange as any}
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        required={['farmName', 'state', 'district', 'village'].includes(key as string)}
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full bg-white/5 border border-white/5">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Register New Farm</h1>
          <p className="text-gray-400 text-sm">Draw your land parcel on the map for AI satellite validation</p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {success ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center">
            <CheckCircle size={32} className="text-brand-400" />
          </div>
          <h3 className="text-xl font-bold">Farm Registered!</h3>
          <p className="text-gray-400 text-sm">Redirecting back to your farms list…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map Side */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-brand-400 font-medium ml-1">
                <MapIcon size={18} />
                <span>Mark Farm Boundary</span>
             </div>
             <div className="h-[500px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl z-0">
                <MapContainer 
                  center={[20.5937, 78.9629]} 
                  zoom={5} 
                  className="h-full w-full"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapPolygonDrawer onPolygonDrawn={handlePolygonDrawn} />
                </MapContainer>
             </div>
             <p className="text-xs text-gray-500 italic ml-2">
               * Use the polygon tool in the top-left to draw your field boundary.
             </p>
          </div>

          {/* Form Side */}
          <form onSubmit={handleSubmit} className="bg-surface-card border border-white/5 rounded-3xl p-6 shadow-2xl h-fit space-y-4">
            {field('Farm Name', 'farmName')}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-300 ml-1">State</label>
                <select name="state" value={form.state} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-brand-500 [&>option]:bg-surface-dark" required>
                   <option value="">Select...</option>
                   {Object.keys(INDIA_LOCATIONS).sort().map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-300 ml-1">District</label>
                <select name="district" value={form.district} onChange={handleInputChange} disabled={!form.state} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-brand-500 [&>option]:bg-surface-dark disabled:opacity-40" required>
                   <option value="">{form.state ? 'Select...' : 'Choose State First'}</option>
                   {(INDIA_LOCATIONS[form.state!] || []).sort().map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            {field('Village', 'village')}
            <div className="grid grid-cols-2 gap-4">
              {field('Survey Number', 'surveyNumber')}
              {field('Area (Hectares)', 'areaHectares', 'number')}
            </div>
            {field('Primary Crop (e.g. Rice, Wheat)', 'primaryCrop')}
            {field('Soil Type (Optional)', 'soilType')}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Register Farm & Boundary'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
