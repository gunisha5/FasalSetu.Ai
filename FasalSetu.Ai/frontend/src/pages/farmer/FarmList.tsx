import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Sprout, ArrowRight } from 'lucide-react';
import { farmApi } from '../../utils/apiClient';
import type { Farm } from '../../utils/apiClient';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorBanner from '../../components/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';

export default function FarmList() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const farmerId = Number(user?.id) || 1; 

  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    farmApi.getAll(farmerId)
      .then(res => setFarms(res.data))
      .catch(() => setError(t('farmer.loadError')))
      .finally(() => setLoading(false));
  }, [farmerId, t]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold mb-1">{t('farmer.myFarms')}</h1>
          <p className="text-gray-400 text-sm">{t('farmer.allParcels')}</p>
        </div>
        <Link to="/farmer/farms/new" className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg transition-all">
          <Plus size={18} /> <span className="hidden sm:inline">{t('farmer.addFarm')}</span>
        </Link>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <LoadingSkeleton rows={3} message={t('farmer.loadingFarms')} />
      ) : farms.length > 0 ? (
        <div className="space-y-4">
          {farms.map(farm => (
            <Link key={farm.id} to={`/farmer/farms/${farm.id}`} className="bg-surface-card border border-white/5 rounded-3xl p-5 shadow-lg flex items-center gap-4 hover:bg-white/10 transition-colors group">
              <div className="p-4 rounded-2xl bg-brand-500/20 text-brand-400">
                <Sprout size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{farm.farmName}</h3>
                <p className="text-gray-400 text-sm">{farm.village}, {farm.district} • {farm.areaAcres ?? '–'} {t('dashboard.acres')}</p>
              </div>
              <ArrowRight size={20} className="text-gray-600 group-hover:text-white transition-colors" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface-card rounded-3xl border border-white/5">
          <Sprout className="text-gray-600 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-bold mb-2">{t('farmer.noFarmsRegistered')}</h3>
          <p className="text-gray-400 mb-6">{t('farmer.addFirstFarm')}</p>
          <Link to="/farmer/farms/new" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl inline-flex items-center gap-2 transition-colors">
            <Plus size={18} /> {t('farmer.addFarm')}
          </Link>
        </div>
      )}
    </div>
  );
}
