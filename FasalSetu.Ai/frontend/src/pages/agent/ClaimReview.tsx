import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle,
  Loader2, User, MapPin, Cpu, ShieldCheck, TrendingUp,
  Coins, ChevronDown, Download, Info
} from 'lucide-react';
import { api } from '../../utils/api';
import { generateClaimReport } from '../../utils/generateClaimReport';
import type { Claim } from '../../utils/apiClient';

interface DetailData {
  id: number;
  farmerId?: number;
  farmId?: number;
  farmerName?: string;
  farmerEmail?: string;
  farmerPhone?: string;
  farmName?: string;
  district?: string;
  village?: string;
  state?: string;
  crop?: string;
  areaAcres?: number;
  calamityType: string;
  dateOfLoss?: string;
  status: string;
  agentRemark?: string;
  aiConfidence?: number;
  aiDamageScore?: number;
  aiReasoning?: string;
  droughtRisk?: number;
  floodRisk?: number;
  rainfallMm?: number;
  rainfall7d?: number;
  estimatedPayout?: number;
  coverageApplied?: number;
  totalSumInsured?: number;
  sumInsuredPerAcre?: number;
  farmAreaSnapshot?: number;
  createdAt?: string;
  updatedAt?: string;
}

const STATUS_OPTIONS = [
  { value: 'MANUAL_REVIEW', label: 'Manual Review',   color: 'text-amber-400'  },
  { value: 'IN_REVIEW',     label: 'In Review',        color: 'text-blue-400'   },
  { value: 'APPROVED',      label: 'Approve Claim',    color: 'text-green-400'  },
  { value: 'REJECTED',      label: 'Reject Claim',     color: 'text-red-400'    },
  { value: 'PENDING',       label: 'Set as Pending',   color: 'text-slate-400'  },
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    APPROVED:      'bg-green-500/20 text-green-400 border-green-500/30',
    REJECTED:      'bg-red-500/20 text-red-400 border-red-500/30',
    IN_REVIEW:     'bg-blue-500/20 text-blue-400 border-blue-500/30',
    MANUAL_REVIEW: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    PENDING:       'bg-slate-500/20 text-slate-400 border-slate-500/30',
    PROCESSING:    'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  };
  return map[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-bold text-white text-right max-w-[60%]">{value ?? '—'}</span>
    </div>
  );
}

export default function ClaimReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData]             = useState<DetailData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [agentNotes, setAgentNotes] = useState('');
  const [updating, setUpdating]     = useState(false);
  const [toast, setToast]           = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    api.get(`/agent/claims/${id}`)
      .then(res => {
        setData(res.data);
        setSelectedStatus(res.data.status);
        setAgentNotes(res.data.agentRemark || '');
        // DEBUG: log raw claim data to check field names
        console.log('CLAIM DATA:', res.data);
      })
      .catch(() => setToast({ type: 'error', msg: 'Failed to load claim.' }))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleUpdateStatus = async () => {
    if (!selectedStatus || !data) return;
    setUpdating(true);
    try {
      await api.put(`/agent/claims/${id}/status`, {
        status: selectedStatus,
        agentNotes,
      });
      setData(prev => prev ? { ...prev, status: selectedStatus, agentRemark: agentNotes } : prev);
      setToast({ type: 'success', msg: `Status updated to "${selectedStatus.replace('_', ' ')}" and farmer notified via email.` });
    } catch {
      setToast({ type: 'error', msg: 'Failed to update status. Please try again.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!data || pdfLoading) return;
    setPdfLoading(true);
    try {
      const fakeClaim: Claim = {
        id: data.id,
        farmerId: data.farmerId,
        farmId: data.farmId,
        calamityType: data.calamityType,
        status: data.status,
        aiConfidence: data.aiConfidence,
        aiDamageScore: data.aiDamageScore,
        aiReasoning: data.aiReasoning,
        droughtRisk: data.droughtRisk,
        floodRisk: data.floodRisk,
        rainfallMm: data.rainfallMm,
        rainfall7d: data.rainfall7d,
        estimatedPayout: data.estimatedPayout,
        totalSumInsured: data.totalSumInsured,
        farmAreaSnapshot: data.farmAreaSnapshot,
        dateOfLoss: data.dateOfLoss,
        // Use stored coverageApplied directly — do NOT back-calculate
        coverageApplied: (data as any).coverageApplied ?? undefined,
        policySummary: {
          sumInsured: data.totalSumInsured ?? 0,
          coverageUsed: (data as any).coverageApplied ?? 0.1,
        },
      } as Claim;

      generateClaimReport({
        claim: fakeClaim,
        farmerName:   data.farmerName  || 'Farmer',
        farmerEmail:  data.farmerEmail || '',
        farmName:     data.farmName    || `Farm #${data.farmId}`,
        farmDistrict: data.district    || '',
        farmVillage:  data.village     || '',
        cropType:     data.crop        || data.calamityType,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-brand-400" size={40} />
      <p className="text-slate-500 text-sm">Loading claim #{id}...</p>
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 text-slate-500">Claim data not found.</div>
  );

  const confidence    = data.aiConfidence ?? 0;
  const confidencePct = Math.round(confidence * 100);
  const isLowConf     = confidence < 0.5;
  // aiDamageScore is stored as a fraction (0.0–1.0), convert to percentage for display
  const damage        = data.aiDamageScore != null ? data.aiDamageScore * 100 : 0;

  return (
    <div className="space-y-6 pb-10">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-bold animate-in slide-in-from-right ${
          toast.type === 'success'
            ? 'bg-brand-900 border-brand-500/50 text-brand-300'
            : 'bg-red-900/80 border-red-500/50 text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-3">
              CLM-{String(data.id).padStart(6, '0')}
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${statusBadge(data.status)}`}>
                {data.status.replace('_', ' ')}
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {data.calamityType} · {data.farmName || `Farm #${data.farmId}`} · {data.village}, {data.district}
            </p>
          </div>
        </div>
        <button onClick={handleDownloadReport} disabled={pdfLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all text-sm font-bold">
          {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {pdfLoading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: details */}
        <div className="lg:col-span-2 space-y-5">

          {/* AI Analysis */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
            <h3 className="font-black text-indigo-300 text-xs uppercase tracking-widest mb-5 flex items-center gap-2">
              <Cpu size={14} /> AI Analysis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              <div className="bg-black/20 p-4 rounded-xl text-center">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Prediction</p>
                <p className={`text-lg font-black ${data.calamityType === 'Drought' ? 'text-orange-400' : 'text-blue-400'}`}>
                  {data.calamityType.toUpperCase()}
                </p>
              </div>
              <div className="bg-black/20 p-4 rounded-xl text-center">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Confidence</p>
                <p className={`text-lg font-black ${isLowConf ? 'text-amber-400' : 'text-brand-400'}`}>
                  {confidencePct}%
                </p>
              </div>
              <div className="bg-black/20 p-4 rounded-xl text-center">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Damage</p>
                <p className="text-lg font-black text-white">{damage.toFixed(2)}%</p>
              </div>
              <div className="bg-black/20 p-4 rounded-xl text-center">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Est. Claim</p>
                <p className="text-lg font-black text-brand-400">
                  ₹{(data.estimatedPayout || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>AI Confidence</span>
                <span className={isLowConf ? 'text-amber-400 font-bold' : 'text-brand-400 font-bold'}>
                  {isLowConf ? '⚠ Low Confidence' : '✓ High Confidence'}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isLowConf ? 'bg-amber-500' : 'bg-brand-500'}`}
                  style={{ width: `${confidencePct}%` }}
                />
              </div>
            </div>

            {/* Feature values */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-500">
              <div className="bg-black/20 p-2.5 rounded-lg">
                <p className="uppercase tracking-widest mb-0.5">Drought Risk</p>
                <p className="font-black text-white">{(data.droughtRisk ?? 0).toFixed(4)}</p>
              </div>
              <div className="bg-black/20 p-2.5 rounded-lg">
                <p className="uppercase tracking-widest mb-0.5">Flood Risk</p>
                <p className="font-black text-white">{(data.floodRisk ?? 0).toFixed(4)}</p>
              </div>
              <div className="bg-black/20 p-2.5 rounded-lg">
                <p className="uppercase tracking-widest mb-0.5">Rainfall Now</p>
                <p className="font-black text-white">{(data.rainfallMm ?? 0).toFixed(1)} mm</p>
              </div>
              <div className="bg-black/20 p-2.5 rounded-lg">
                <p className="uppercase tracking-widest mb-0.5">Rainfall 7d</p>
                <p className="font-black text-white">{(data.rainfall7d ?? 0).toFixed(1)} mm</p>
              </div>
            </div>

            {data.aiReasoning && (
              <div className="mt-4 p-4 bg-black/20 rounded-xl flex items-start gap-3">
                <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-200/70 leading-relaxed italic">"{data.aiReasoning}"</p>
              </div>
            )}
          </div>

          {/* Farmer & Farm Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-surface-card border border-white/5 rounded-2xl p-5">
              <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <User size={13} /> Farmer Information
              </h3>
              <InfoRow label="Name"       value={data.farmerName} />
              <InfoRow label="Email"      value={data.farmerEmail} />
              <InfoRow label="Phone"      value={data.farmerPhone} />
              <InfoRow label="Farmer ID"  value={data.farmerId ? `#${data.farmerId}` : undefined} />
            </div>

            <div className="bg-surface-card border border-white/5 rounded-2xl p-5">
              <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <MapPin size={13} /> Farm Information
              </h3>
              <InfoRow label="Farm Name"  value={data.farmName} />
              <InfoRow label="Village"    value={data.village} />
              <InfoRow label="District"   value={data.district} />
              <InfoRow label="State"      value={data.state} />
              <InfoRow label="Area"       value={data.areaAcres ? `${data.areaAcres} Acres` : undefined} />
              <InfoRow label="Crop"       value={data.crop} />
            </div>
          </div>

          {/* Policy Summary */}
          <div className="bg-surface-card border border-white/5 rounded-2xl p-5">
            <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck size={13} /> Policy Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 p-4 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Coins size={11} /> Sum Insured</p>
                <p className="text-xl font-black text-white">₹{(data.totalSumInsured || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={11} /> Damage %</p>
                <p className="text-xl font-black text-white">{damage.toFixed(2)}%</p>
              </div>
              <div className="bg-brand-500/10 p-4 rounded-xl border border-brand-500/20">
                <p className="text-xs text-brand-400 uppercase tracking-widest mb-1 flex items-center gap-1"><CheckCircle size={11} /> Est. Payout</p>
                <p className="text-xl font-black text-brand-300">₹{(data.estimatedPayout || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Adjudication Panel */}
        <div>
          <div className="bg-surface-card border border-white/10 rounded-2xl p-6 sticky top-6 space-y-5 shadow-2xl">
            <h3 className="font-black text-white uppercase tracking-widest text-xs pb-3 border-b border-white/10">
              Adjudication Panel
            </h3>

            {/* Current status */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold">Current Status</p>
              <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${statusBadge(data.status)}`}>
                {data.status.replace('_', ' ')}
              </span>
            </div>

            {/* AI Recommendation */}
            <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4">
              <p className="text-xs text-brand-400 uppercase tracking-widest font-black mb-1">AI Recommended Payout</p>
              <p className="text-2xl font-black text-white font-mono">
                ₹{(data.estimatedPayout || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500 mt-1">Confidence: {confidencePct}%</p>
            </div>

            {/* Status Update Dropdown */}
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold block">
                Update Status
              </label>
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full appearance-none bg-surface-dark border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white font-bold focus:ring-1 focus:ring-brand-500 outline-none cursor-pointer"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Agent Notes */}
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold block">
                Agent Remarks
              </label>
              <textarea
                rows={3}
                value={agentNotes}
                onChange={e => setAgentNotes(e.target.value)}
                placeholder="Add your review notes (sent to farmer via email)..."
                className="w-full bg-surface-dark border border-white/10 rounded-xl py-3 px-4 text-white text-sm placeholder-slate-600 focus:ring-1 focus:ring-brand-500 outline-none resize-none transition-all"
              />
            </div>

            {/* Update Button */}
            <button
              onClick={handleUpdateStatus}
              disabled={updating || selectedStatus === data.status}
              className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
                selectedStatus === 'APPROVED'
                  ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20'
                  : selectedStatus === 'REJECTED'
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {updating
                ? <><Loader2 size={16} className="animate-spin" /> Updating...</>
                : selectedStatus === 'APPROVED'
                  ? <><CheckCircle size={16} /> Approve & Notify Farmer</>
                  : selectedStatus === 'REJECTED'
                  ? <><XCircle size={16} /> Reject & Notify Farmer</>
                  : <><Clock size={16} /> Update Status</>
              }
            </button>

            {selectedStatus === data.status && (
              <p className="text-xs text-slate-600 text-center">Select a different status to update</p>
            )}

            {/* Timestamps */}
            <div className="pt-4 border-t border-white/5 space-y-1.5">
              <InfoRow label="Filed On"   value={data.dateOfLoss} />
              <InfoRow label="Created At" value={data.createdAt?.split('T')[0]} />
              {data.updatedAt && <InfoRow label="Last Updated" value={data.updatedAt.split('T')[0]} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
