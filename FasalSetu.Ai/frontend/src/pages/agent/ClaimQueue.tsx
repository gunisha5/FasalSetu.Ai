import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Loader2, ChevronDown, AlertCircle, X, Download } from 'lucide-react';
import { generateClaimReport } from '../../utils/generateClaimReport';
import { api } from '../../utils/api';

interface ClaimRow {
  // Table display fields
  claimId: number;
  farmerName: string;
  farmerEmail: string;
  farmName: string;
  district: string;
  village: string;
  prediction: string;
  aiDamageScore: number | null;
  estimatedPayout: number | null;
  status: string;
  reportUrl: string;
  // PDF report fields
  calamityType: string;
  dateOfLoss: string;
  farmerId: number | null;
  farmId: number | null;
  damagePercent: number | null;
  aiConfidence: number | null;
  aiReasoning: string | null;
  estimatedClaim: number | null;
  rainfallMm: number | null;
  rainfall7d: number | null;
  floodRisk: number | null;
  droughtRisk: number | null;
  totalSumInsured: number | null;
  sumInsuredPerAcre: number | null;
  farmAreaSnapshot: number | null;
  cropType: string;
  areaAcres: number | null;
  latitude: number | null;
  longitude: number | null;
  policySummary: { sumInsured: number; coverageUsed: number } | null;
  agentRemark: string | null;
}

const STATUS_OPTIONS = ['ALL', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'MANUAL_REVIEW', 'PROCESSING'];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    APPROVED:      'bg-green-500 text-white border-green-600 hover:bg-green-600',
    REJECTED:      'bg-red-500 text-white border-red-600 hover:bg-red-600',
    IN_REVIEW:     'bg-blue-500 text-white border-blue-600 hover:bg-blue-600',
    MANUAL_REVIEW: 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600',
    PENDING:       'bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600',
    PROCESSING:    'bg-indigo-500 text-white border-indigo-600 hover:bg-indigo-600',
  };
  return map[status] || 'bg-slate-500 text-white border-slate-600 hover:bg-slate-600';
};

export default function ClaimQueue() {
  const [claims, setClaims]     = useState<ClaimRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<ClaimRow | null>(null);
  const [modalStatus, setModalStatus] = useState('PENDING');
  const [modalRemark, setModalRemark] = useState('');

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = () => {
    setLoading(true);
    api.get('/agent/claims')
      .then(res => setClaims(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleOpenModal = (claim: ClaimRow) => {
    setSelectedClaim(claim);
    setModalStatus(claim.status);
    setModalRemark(''); // clear old remark or fetch it if it was returned
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClaim(null);
  };

  const updateStatus = async () => {
    if (!selectedClaim) return;
    setUpdatingId(selectedClaim.claimId);
    try {
      await api.put(`/agent/claims/${selectedClaim.claimId}/status`, { status: modalStatus, remark: modalRemark });
      setClaims(claims.map(c => c.claimId === selectedClaim.claimId ? { ...c, status: modalStatus } : c));
      handleCloseModal();
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

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
        String(c.claimId).includes(q) ||
        (c.farmerName || '').toLowerCase().includes(q) ||
        (c.farmName || '').toLowerCase().includes(q) ||
        (c.village || '').toLowerCase().includes(q) ||
        (c.district   || '').toLowerCase().includes(q) ||
        (c.prediction || '').toLowerCase().includes(q);
      return matchStatus && matchDistrict && matchSearch;
    });
  }, [claims, statusFilter, districtFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222] tracking-tight">Claims Review</h1>
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
            className="w-full bg-[#f5f5f5] border border-slate-200 shadow-sm rounded-xl py-2.5 pl-9 pr-4 text-sm text-[#222] placeholder-slate-400 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
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
            className="appearance-none bg-[#f5f5f5] border border-slate-200 shadow-sm rounded-xl pl-4 pr-8 py-2 text-sm text-[#222] focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
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
            className="appearance-none bg-[#f5f5f5] border border-slate-200 shadow-sm rounded-xl pl-4 pr-8 py-2 text-sm text-[#222] focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
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
      <div className="bg-[#f5f5f5] border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f5f5] text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-4 font-black">Farmer Name</th>
                <th className="p-4 font-black">Farm</th>
                <th className="p-4 font-black">District</th>
                <th className="p-4 font-black">Prediction</th>
                <th className="p-4 font-black">Damage %</th>
                <th className="p-4 font-black">Claim ₹</th>
                <th className="p-4 font-black text-center">Status</th>
                <th className="p-4 font-black text-center">View Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center">
                    <Loader2 className="animate-spin text-brand-500 mx-auto mb-3" size={32} />
                    <p className="text-slate-500 text-sm font-medium">Loading claims...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center">
                    <AlertCircle className="text-slate-400 mx-auto mb-3" size={32} />
                    <p className="text-slate-500 text-sm font-medium">No claims match the current filters.</p>
                  </td>
                </tr>
              ) : filtered.map(c => {
                const dmg = c.aiDamageScore;
                const predictionType = c.prediction;
                
                return (
                  <tr key={c.claimId} className="hover:bg-slate-100/80 transition-colors group">
                    <td className="p-4">
                      <p className="font-bold text-[#222]">{c.farmerName || 'Unknown'}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[#222]">{c.farmName || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{c.village || 'Unknown'}</p>
                    </td>
                    <td className="p-4 text-slate-600 capitalize">{c.district || '—'}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                        predictionType === 'DROUGHT' || predictionType === 'Drought' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                        predictionType === 'FLOOD' || predictionType === 'Flood' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        'bg-[#f5f5f5] text-slate-600 border-slate-200'
                      }`}>
                        {predictionType || '—'}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-[#222]">
                      {dmg != null ? `${dmg.toFixed(2)}%` : <span className="text-slate-400">N/A</span>}
                    </td>
                    <td className="p-4 font-mono font-bold text-brand-600">
                      {c.estimatedPayout != null ? `₹${c.estimatedPayout.toLocaleString('en-IN')}` : '₹0'}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleOpenModal(c)}
                        disabled={updatingId === c.claimId}
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-colors ${statusBadge(c.status)} ${updatingId === c.claimId ? 'opacity-50' : ''}`}
                      >
                        {updatingId === c.claimId ? 'Updating...' : c.status.replace('_', ' ')}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        disabled={pdfLoadingId === c.claimId}
                        onClick={async () => {
                          setPdfLoadingId(c.claimId);
                          try {
                            generateClaimReport({
                              claim: {
                                id:                c.claimId,
                                farmerId:          c.farmerId ?? undefined,
                                farmId:            c.farmId ?? undefined,
                                calamityType:      c.calamityType,
                                dateOfLoss:        c.dateOfLoss,
                                status:            c.status,
                                prediction:        c.prediction,
                                aiConfidence:      c.aiConfidence ?? undefined,
                                damagePercent:     c.damagePercent ?? c.aiDamageScore ?? undefined,
                                aiDamageScore:     c.aiDamageScore ?? undefined,
                                estimatedClaim:    c.estimatedClaim ?? c.estimatedPayout ?? undefined,
                                estimatedPayout:   c.estimatedPayout ?? undefined,
                                aiReasoning:       c.aiReasoning ?? undefined,
                                rainfallMm:        c.rainfallMm ?? undefined,
                                rainfall7d:        c.rainfall7d ?? undefined,
                                floodRisk:         c.floodRisk ?? undefined,
                                droughtRisk:       c.droughtRisk ?? undefined,
                                totalSumInsured:   c.totalSumInsured ?? undefined,
                                sumInsuredPerAcre: c.sumInsuredPerAcre ?? undefined,
                                farmAreaSnapshot:  c.farmAreaSnapshot ?? undefined,
                                policySummary:     c.policySummary ?? undefined,
                              },
                              farmerName:    c.farmerName || 'Unknown Farmer',
                              farmerEmail:   c.farmerEmail || '',
                              farmName:      c.farmName || 'Unknown Farm',
                              farmDistrict:  c.district || '',
                              farmVillage:   c.village || '',
                              farmLatitude:  c.latitude ?? undefined,
                              farmLongitude: c.longitude ?? undefined,
                              cropType:      c.cropType || 'N/A',
                            });
                          } finally {
                            setPdfLoadingId(null);
                          }
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-xl font-bold text-xs border border-brand-200 transition-all active:scale-95 shadow-sm whitespace-nowrap disabled:opacity-50"
                      >
                        {pdfLoadingId === c.claimId
                          ? <><Loader2 size={12} className="animate-spin" /> Generating...</>
                          : <><Download size={12} /> Download Report</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {isModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-[#f5f5f5] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-black text-[#222]">Update Status</h3>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 p-2 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#222] uppercase tracking-wider mb-2">Claim ID</label>
                <div className="text-sm font-mono font-bold text-slate-500">CLM-{String(selectedClaim.claimId).padStart(6, '0')}</div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[#222] uppercase tracking-wider mb-2">Status</label>
                <div className="relative">
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 shadow-sm rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-[#222] focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[#222] uppercase tracking-wider mb-2">Agent Remark</label>
                <textarea
                  value={modalRemark}
                  onChange={(e) => setModalRemark(e.target.value)}
                  placeholder="Add notes about this decision..."
                  rows={4}
                  className="w-full bg-white border border-slate-200 shadow-sm rounded-xl p-4 text-sm text-[#222] focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              <button
                onClick={updateStatus}
                disabled={updatingId === selectedClaim.claimId}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2"
              >
                {updatingId === selectedClaim.claimId ? (
                  <><Loader2 size={18} className="animate-spin" /> Updating...</>
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
