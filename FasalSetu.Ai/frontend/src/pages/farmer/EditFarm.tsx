import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { farmApi } from '../../utils/apiClient';
import type { Farm } from '../../utils/apiClient';
import ErrorBanner from '../../components/ErrorBanner';

export default function EditFarm() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState<Partial<Farm>>({
    farmName: '', state: '', district: '', village: '', primaryCrop: '', areaAcres: undefined,
    surveyNumber: '', soilType: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    
    farmApi.getById(Number(id))
      .then(res => {
        setForm(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load farm details.');
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setError('');
    setSaving(true);
    try {
      await farmApi.update(Number(id), form as Farm);
      setSuccess(true);
      setTimeout(() => navigate(`/farmer/farms/${id}`), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update farm.');
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof Farm, type = 'text') => (
    <div className="space-y-1">
      <label className="text-sm text-slate-700 ml-1">{label}</label>
      <input
        type={type}
        value={form[key] === null || form[key] === undefined || (type === 'number' && isNaN(form[key] as any)) ? '' : (form[key] as any)}
        onChange={e => {
          const val = e.target.value;
          setForm({ 
            ...form, 
            [key]: type === 'number' 
              ? (val === '' ? undefined : parseFloat(val)) 
              : val 
          });
        }}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        required={['farmName', 'state', 'district', 'village'].includes(key as string)}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={40} className="animate-spin text-brand-500" />
        <p className="text-gray-400">Loading your farm details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full bg-white/5 border border-white/5">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Edit Farm Details</h1>
          <p className="text-gray-400 text-sm">Update your land parcel information</p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {success ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center">
            <CheckCircle size={32} className="text-brand-400" />
          </div>
          <h3 className="text-xl font-bold">Changes Saved!</h3>
          <p className="text-gray-400 text-sm">Returning to farm overview…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-surface-card border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
          {field('Farm Name', 'farmName')}
          {field('State', 'state')}
          {field('District', 'district')}
          {field('Village', 'village')}
          {field('Survey Number', 'surveyNumber')}
          {field('Primary Crop', 'primaryCrop')}
          {field('Area (Acres)', 'areaAcres', 'number')}

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 transition-all"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : 'Update Farm'}
          </button>
        </form>
      )}
    </div>
  );
}
