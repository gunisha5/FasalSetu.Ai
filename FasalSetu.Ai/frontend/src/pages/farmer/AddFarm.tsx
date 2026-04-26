import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, Map as MapIcon, Shrub, Info } from 'lucide-react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { farmApi } from '../../utils/apiClient';
import type { Farm } from '../../utils/apiClient';
import { useAuthStore } from '../../store/authStore';
import ErrorBanner from '../../components/ErrorBanner';
import MapPolygonDrawer from '../../components/MapPolygonDrawer';
import { INDIA_LOCATIONS } from '../../utils/indiaData';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function AddFarm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const farmerId = Number(user?.id) || 1;

  const [form, setForm] = useState<Partial<Farm>>({
    farmName: '', state: '', district: '', village: '', primaryCrop: '', areaAcres: undefined,
    surveyNumber: '', soilType: '', boundaryGeoJson: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handlePolygonDrawn = (geoJson: any, area: number) => {
    setForm(prev => ({
      ...prev,
      boundaryGeoJson: JSON.stringify(geoJson),
      areaAcres: prev.areaAcres || (area * 2.471) // Convert Hectares to Acres
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
      if (name === 'state') updated.district = '';
      return updated;
    });
  };

  const field = (label: string, key: keyof Farm, type = 'text', placeholder = '') => (
    <div className="space-y-1.5">
      <label className="text-xs font-black text-brand-900 uppercase tracking-widest ml-1">{label}</label>
      <input
        type={type}
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
    <div className="max-w-5xl mx-auto pb-20">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Map Side */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7 space-y-4 lg:sticky lg:top-10"
          >
             <div className="bg-white p-2 rounded-[2.5rem] border border-surface-border shadow-premium overflow-hidden">
                <div className="h-[550px] rounded-[2.1rem] overflow-hidden relative z-0">
                   <div className="absolute top-4 left-4 z-10 glass border border-brand-100/50 px-4 py-2.5 rounded-xl text-xs font-black text-brand-700 flex items-center gap-2 shadow-lg">
                      <MapIcon size={14} /> {t('addFarm.markBoundary')}
                   </div>
                   <MapContainer 
                     center={[20.5937, 78.9629]} 
                     zoom={5} 
                     className="h-full w-full"
                   >
                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                     <MapPolygonDrawer onPolygonDrawn={handlePolygonDrawn} />
                   </MapContainer>
                </div>
             </div>
             <div className="bg-brand-50 border-2 border-brand-100 p-4 rounded-2xl flex items-start gap-4">
               <Info size={20} className="text-brand-600 shrink-0 mt-0.5" strokeWidth={2.5} />
               <p className="text-[11px] text-brand-800 font-bold leading-relaxed">
                 {t('addFarm.mapInstruction')}
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
            <form onSubmit={handleSubmit} className="bg-white border border-surface-border rounded-[2.5rem] p-8 shadow-premium space-y-6">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
                    <Shrub size={20} strokeWidth={2.5} />
                 </div>
                 <p className="font-black text-lg text-text-main">{t('addFarm.fieldDetails')}</p>
              </div>

              {field('Farm Name', 'farmName', 'text', 'e.g. Village North Field')}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black text-brand-900 uppercase tracking-widest ml-1">{t('addFarm.state')}</label>
                  <select name="state" value={form.state} onChange={handleInputChange} className="w-full bg-white border border-surface-border rounded-xl py-4 px-4 text-text-main font-black outline-none focus:ring-2 focus:ring-brand-500" required>
                     <option value="">{t('addFarm.selectState')}</option>
                     {Object.keys(INDIA_LOCATIONS).sort().map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black text-brand-900 uppercase tracking-widest ml-1">{t('addFarm.district')}</label>
                  <select name="district" value={form.district} onChange={handleInputChange} disabled={!form.state} className="w-full bg-white border border-surface-border rounded-xl py-4 px-4 text-text-main font-black outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-40" required>
                     <option value="">{form.state ? t('addFarm.selectDistrict') : t('addFarm.firstPickState')}</option>
                     {(INDIA_LOCATIONS[form.state!] || []).sort().map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {field('Village', 'village', 'text', 'Enter village name')}
              
              <div className="grid grid-cols-2 gap-4">
                {field('Survey Number', 'surveyNumber', 'text', 'Khasra No.')}
                {field('Area (Acres)', 'areaAcres', 'number', '0.00')}
              </div>

              {field('Primary Crop', 'primaryCrop', 'text', 'e.g. Rice, Wheat, Cotton')}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-black text-lg py-5 rounded-2xl shadow-xl shadow-brand-500/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
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
