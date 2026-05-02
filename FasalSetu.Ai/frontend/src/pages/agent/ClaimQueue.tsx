import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Loader2, ChevronDown, Eye, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api';

interface ClaimRow {
  id: number;
  farmerName?: string;
  district?: string;
  crop?: string;
  prediction?: string;
  calamityType?: string;
  status: string;
  ai_confidence?: number;
  ai_damage_score?: number;
  estimated_payout?: number;
  createdAt?: string;
}

const STATUS_OPTIONS = ['ALL', 'MANUAL_REVIEW', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PENDING'];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    APPROVED:      'bg-green-100 text-green-700 border-green-200',
    REJECTED:      'bg-red-100 text-red-700 border-red-200',
    IN_REVIEW:     'bg-blue-100 text-blue-700 border-blue-200',
    MANUAL_REVIEW: 'bg-amber-100 text-amber-700 border-amber-200',
    PENDING:       'bg-slate-100 text-slate-700 border-slate-200',
    PROCESSING:    'bg-indigo-100 text-indigo-700 border-indigo-200',
  };
  return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
};

const damageValue = (c: ClaimRow) => {
  if (c.ai_damage_score != null) return c.ai_damage_score;
  return null;
};

export default function ClaimQueue() {
  const [claims, setClaims]     = useState<ClaimRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');

  useEffect(() => {
    api.get('/agent/claims')
      .then(res => setClaims(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const districts = useMemo(() => {
    const set = new Set<string>();
    claims.forEach(c => c.district && set.add(c.district));
    return ['ALL', ...Array.from(set).sort()];
  }, [claims]);

  const filtered = useMemo(() => {
    return claims.filter(c => {
      const matchStatus   = statusFilter === 'ALL' || c.status === statusFilter;
      const matchDistrict = districtFilter === 'ALL' || c.district === districtFilter;
      const q = search.toLowerCase();
      const matchSearch   = !q ||
        String(c.id).includes(q) ||
        (c.farmerName || '').toLowerCase().includes(q) ||
        (c.district   || '').toLowerCase().includes(q) ||
        (c.prediction || '').toLowerCase().includes(q) ||
        (c.calamityType || '').toLowerCase().includes(q);
      return matchStatus && matchDistrict && matchSearch;
    });
  }, [claims, statusFilter, districtFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Claim Queue</h1>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? '...' : `${filtered.length} of ${claims.length} claims`}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search ID, farmer, district..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 shadow-sm rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-slate-400" />

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 shadow-sm rounded-xl pl-4 pr-8 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace('_', ' ')}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* District filter */}
        <div className="relative">
          <select
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 shadow-sm rounded-xl pl-4 pr-8 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
          >
            {districts.map(d => (
              <option key={d} value={d}>{d === 'ALL' ? 'All Districts' : d}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {(statusFilter !== 'ALL' || districtFilter !== 'ALL' || search) && (
          <button
            onClick={() => { setStatusFilter('ALL'); setDistrictFilter('ALL'); setSearch(''); }}
            className="text-xs text-red-600 hover:text-red-700 font-bold px-3 py-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-4 font-black">Claim ID</th>
                <th className="p-4 font-black">Farmer</th>
                <th className="p-4 font-black">District</th>
                <th className="p-4 font-black">Prediction</th>
                <th className="p-4 font-black">Damage %</th>
                <th className="p-4 font-black">Claim ₹</th>
                <th className="p-4 font-black">Confidence</th>
                <th className="p-4 font-black">Status</th>
                <th className="p-4 font-black text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center">
                    <Loader2 className="animate-spin text-brand-500 mx-auto mb-3" size={32} />
                    <p className="text-slate-500 text-sm font-medium">Loading claims...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center">
                    <AlertCircle className="text-slate-400 mx-auto mb-3" size={32} />
                    <p className="text-slate-500 text-sm font-medium">No claims match the current filters.</p>
                  </td>
                </tr>
              ) : filtered.map(c => {
                const dmg = damageValue(c);
                const conf = c.ai_confidence != null ? Math.round(c.ai_confidence * 100) : null;
                const predictionType = c.prediction || c.calamityType;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 font-mono font-black text-slate-800 text-xs">
                      CLM-{String(c.id).padStart(6, '0')}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{c.farmerName || `Farmer #${c.id}`}</p>
                      <p className="text-xs text-slate-500">{c.crop || '—'}</p>
                    </td>
                    <td className="p-4 text-slate-600 capitalize">{c.district || '—'}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                        predictionType === 'DROUGHT' || predictionType === 'Drought' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                        predictionType === 'FLOOD' || predictionType === 'Flood' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {predictionType}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800">
                      {dmg != null ? `${dmg.toFixed(2)}%` : <span className="text-slate-400">N/A</span>}
                    </td>
                    <td className="p-4 font-mono font-bold text-brand-600">
                      {c.estimated_payout != null ? `₹${c.estimated_payout.toLocaleString('en-IN')}` : '₹0'}
                    </td>
                    <td className="p-4">
                      {conf != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${conf >= 50 ? 'bg-brand-500' : 'bg-amber-500'}`}
                              style={{ width: `${conf}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${conf >= 50 ? 'text-brand-600' : 'text-amber-600'}`}>
                            {conf}%
                          </span>
                        </div>
                      ) : <span className="text-slate-400 text-xs font-medium">N/A</span>}
                    </td>
                    <td className="p-4">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${statusBadge(c.status)}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        to={`/agent/claims/${c.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-xl font-bold text-xs border border-brand-200 transition-all active:scale-95 shadow-sm"
                      >
                        <Eye size={12} /> Review
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
