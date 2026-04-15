import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus, FileX, ArrowRight } from 'lucide-react';
import { claimApi } from '../../../utils/apiClient';
import type { Claim } from '../../../utils/apiClient';
import { useAuthStore } from '../../../store/authStore';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import ErrorBanner from '../../../components/ErrorBanner';

export default function ClaimList() {
  const user = useAuthStore(s => s.user);
  const farmerId = Number(user?.id) || 1;

  const [filter, setFilter] = useState('All');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    claimApi.getAll(farmerId)
      .then(res => setClaims(res.data))
      .catch(() => setError('Could not load claims. Is the backend running?'))
      .finally(() => setLoading(false));
  }, [farmerId]);

  const statusColor = (s?: string) => {
    if (s === 'PROCESSING' || s === 'AI_COMPLETE') return { dot: 'text-orange-400', bg: 'bg-orange-500/20' };
    if (s === 'APPROVED') return { dot: 'text-brand-400', bg: 'bg-brand-500/20' };
    if (s === 'MANUAL_REVIEW') return { dot: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { dot: 'text-gray-400', bg: 'bg-gray-500/20' };
  };

  const filtered = filter === 'All' ? claims
    : claims.filter(c => {
        if (filter === 'Processing') return c.status === 'PROCESSING' || c.status === 'AI_COMPLETE';
        if (filter === 'Approved') return c.status === 'APPROVED';
        return true;
      });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Claims</h1>
          <p className="text-gray-400 text-sm">Track your crop damage filings</p>
        </div>
        <Link to="/farmer/claims/new" className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg transition-all">
          <Plus size={18} /> <span className="hidden sm:inline">File Claim</span>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {['All', 'Processing', 'Approved'].map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${filter === tab ? 'bg-brand-500 text-white' : 'bg-surface-card border border-white/10 text-gray-400 hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <LoadingSkeleton rows={3} message="Loading your claims…" />
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(claim => {
            const c = statusColor(claim.status);
            return (
              <Link key={claim.id} to={`/farmer/claims/${claim.id}`}
                className="bg-surface-card border border-white/5 rounded-3xl p-5 shadow-lg flex items-center gap-4 hover:bg-white/10 transition-colors group">
                <div className={`p-4 rounded-2xl ${c.bg} ${c.dot}`}><ClipboardList size={24} /></div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{claim.calamityType} Damage</h3>
                  <p className={`text-sm font-semibold ${c.dot}`}>{claim.status?.replace('_', ' ')}</p>
                </div>
                <ArrowRight size={20} className="text-gray-600 group-hover:text-white transition-colors" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface-card rounded-3xl border border-white/5">
          <FileX className="text-gray-600 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-bold mb-2">No Claims Found</h3>
          <p className="text-gray-400 mb-6">File a new claim when a calamity strikes.</p>
          <Link to="/farmer/claims/new" className="px-6 py-3 bg-white/10 hover:bg-white/20 inline-flex items-center gap-2 rounded-xl">
            <Plus size={18} /> File New Claim
          </Link>
        </div>
      )}
    </div>
  );
}
