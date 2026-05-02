import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Info, Activity, FileText, Loader2, AlertCircle, TrendingUp, Coins, Leaf, ShieldCheck, Download } from 'lucide-react';
import { claimApi, farmApi } from '../../../utils/apiClient';
import type { Claim } from '../../../utils/apiClient';
import { useAuthStore } from '../../../store/authStore';
import { generateClaimReport } from '../../../utils/generateClaimReport';

export default function ClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [claim, setClaim] = useState<Claim | null>(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [error, setError] = useState<string | null>(null);
  const [farmName, setFarmName] = useState('Your Farm');

  const user = useAuthStore(s => s.user);
  const farmerId = Number(user?.id) || 1;
  const [pdfLoading, setPdfLoading] = useState(false);
  const [farmDistrict, setFarmDistrict] = useState('');
  const [farmVillage, setFarmVillage] = useState('');
  const [farmLatitude, setFarmLatitude] = useState<number | undefined>(undefined);
  const [farmLongitude, setFarmLongitude] = useState<number | undefined>(undefined);
  const [cropType, setCropType] = useState('N/A');

  useEffect(() => {
    async function load() {
      if (claim) {
        setLoading(false);
        // Still fetch farm details for PDF
        if (claim.farmId) {
          try {
            const fRes = await farmApi.getById(claim.farmId);
            setFarmName(fRes.data.farmName);
            setFarmDistrict(fRes.data.district || '');
            setFarmVillage(fRes.data.village || '');
            setFarmLatitude(fRes.data.latitude || 23.0225);
            setFarmLongitude(fRes.data.longitude || 72.5714);
            setCropType(fRes.data.primaryCrop || 'N/A');
          } catch { /* ignore */ }
        }
        return;
      }

      if (!id) return;
      try {
        const response = await claimApi.getAll(farmerId);
        const found = response.data.find(c => c.id === Number(id));
        if (found) {
          setClaim(found);
          if (found.farmId) {
            try {
               const fRes = await farmApi.getById(found.farmId);
               setFarmName(fRes.data.farmName);
               setFarmDistrict(fRes.data.district || '');
               setFarmVillage(fRes.data.village || '');
               setFarmLatitude(fRes.data.latitude || 23.0225);
               setFarmLongitude(fRes.data.longitude || 72.5714);
               setCropType(fRes.data.primaryCrop || 'N/A');
            } catch {
               setFarmName(`Field #${found.farmId}`);
            }
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || 'Failed to load analysis. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, farmerId, claim]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
        <Activity size={32} className="absolute inset-0 m-auto text-brand-500 animate-pulse" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Analyzing your crop data...</h2>
        <p className="text-slate-400 font-medium mt-2">Connecting to AI Satellite Engine</p>
      </div>
    </div>
  );

  if (error || !claim) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-6 text-center">
      <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center shadow-xl shadow-red-100">
        <AlertCircle size={48} strokeWidth={2.5} />
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Something went wrong</h2>
        <p className="text-slate-500 font-medium mt-3 max-w-md mx-auto">{error || 'The claim data could not be retrieved at this time.'}</p>
      </div>
      <div className="flex gap-4">
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95">Retry Now</button>
        <button onClick={() => navigate('/farmer/claims')} className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all">Go Back</button>
      </div>
    </div>
  );

  // Simple Logic for Display
  const prediction = claim.prediction || claim.calamityType || 'NORMAL';
  const damagePercent = claim.damage_percent ?? claim.ai_damage_score;
  const estimatedClaim = claim.estimated_claim ?? claim.estimated_payout;
  const explanation = claim.explanation || claim.aiReasoning || "Your analysis is complete.";
  const warning = claim.warning;
  const confidence = claim.confidence ?? claim.ai_confidence;
  const policySummary = claim.policy_summary || { sum_insured: claim.totalSumInsured || 0, coverage_used: claim.coverage_applied || 0 };

  const getStatusColor = (p: string) => {
    if (p === 'DROUGHT') return 'from-orange-500 to-orange-600 shadow-orange-200';
    if (p === 'FLOOD') return 'from-red-500 to-red-600 shadow-red-200';
    return 'from-green-500 to-green-600 shadow-green-200';
  };

  const timelineSteps = [
    "Claim Submitted",
    "AI Analysis Completed",
    "Damage Assessed",
    "Claim Estimated",
    "Sent to Insurance Provider",
    "Approval Pending"
  ];

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      
      {/* Back Link */}
      <div className="flex items-center justify-between mb-10">
        <button 
          onClick={() => navigate('/farmer/claims')} 
          className="flex items-center gap-3 text-slate-500 hover:text-slate-800 font-bold transition-all group"
        >
          <div className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-2xl group-hover:bg-slate-50 group-hover:shadow-md transition-all active:scale-90">
            <ArrowLeft size={20} />
          </div>
          <span className="text-lg">Back to All Claims</span>
        </button>
        <button 
          onClick={async () => {
            if (!claim || pdfLoading) return;
            setPdfLoading(true);
            try {
              generateClaimReport({
                claim,
                farmerName: user?.fullName || user?.email?.split('@')[0] || 'Farmer',
                farmerEmail: user?.email || '',
                farmName,
                farmDistrict,
                farmVillage,
                farmLatitude,
                farmLongitude,
                cropType,
              });
            } finally {
              setPdfLoading(false);
            }
          }}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-700 text-white font-bold text-sm rounded-2xl hover:bg-slate-800 hover:shadow-lg transition-all active:scale-95 shadow-sm"
        >
          {pdfLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          {pdfLoading ? 'Generating...' : 'Download Report'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Result Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. STATUS CARD */}
          <div className={`bg-gradient-to-br ${getStatusColor(prediction)} text-white p-10 rounded-[2.5rem] shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-1 group relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <p className="text-white/80 font-black uppercase tracking-[0.2em] text-xs mb-3 flex items-center gap-2">
                <Leaf size={14} /> 🌿 Detection Result
              </p>
              <h1 className="text-5xl font-black mb-6 tracking-tight">{prediction}</h1>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md w-fit px-5 py-2.5 rounded-2xl border border-white/20">
                  {claim.status === 'MANUAL_REVIEW' ? <Clock size={18} className="text-white" /> : <CheckCircle size={18} className="text-white" />}
                  <span className="text-sm font-black uppercase tracking-widest">
                    {claim.status === 'MANUAL_REVIEW' ? 'Pending Agent Review' : 'AI Analysis Verified'}
                  </span>
                </div>
                <div className={`flex items-center gap-2 backdrop-blur-md w-fit px-5 py-2.5 rounded-2xl border ${!confidence || confidence >= 0.5 ? 'bg-green-500/30 border-green-400/50' : 'bg-red-500/30 border-red-400/50'}`}>
                  <Activity size={18} className="text-white" />
                  <span className="text-sm font-black uppercase tracking-widest">Confidence: {confidence ? `${(confidence * 100).toFixed(0)}%` : "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. DAMAGE + CLAIM SECTION */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-100 group">
            <h3 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-8 flex items-center gap-2">
              <TrendingUp size={14} /> 📊 Analysis Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group-hover:bg-brand-50/30 transition-colors">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Estimated Damage</p>
                <p className="text-4xl font-black text-slate-800 flex items-center gap-3">
                  {damagePercent?.toFixed(2) ?? '0.00'}% <span className="text-2xl">📊</span>
                </p>
              </div>
              <div className="p-6 bg-brand-50/50 rounded-3xl border border-brand-100 group-hover:bg-brand-50 transition-colors">
                <p className="text-brand-500 font-black text-[10px] uppercase tracking-widest mb-2">Estimated Claim</p>
                <p className="text-4xl font-black text-brand-600 flex items-center gap-3">
                  ₹{estimatedClaim?.toLocaleString() ?? 0} <span className="text-2xl">💰</span>
                </p>
              </div>
            </div>
          </div>

          {/* WARNING ALERT */}
          {warning && (
            <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] flex items-center gap-5 text-amber-800 animate-pulse-soft shadow-lg shadow-amber-100/50">
              <div className="w-12 h-12 bg-amber-200/50 rounded-2xl flex items-center justify-center text-amber-600">
                <AlertCircle size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-amber-600">Manual Review Triggered</p>
                <p className="font-black text-base leading-tight">{warning}</p>
              </div>
            </div>
          )}

          {/* 4. EXPLANATION SECTION */}
          <div className="bg-slate-900 text-slate-300 p-10 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl -mb-12 -mr-12" />
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-brand-400 shadow-inner group-hover:scale-110 transition-transform">
                <Info size={24} />
              </div>
              <div>
                <h4 className="text-white font-black uppercase tracking-widest text-xs mb-3">AI Reasoning Report</h4>
                <p className="text-lg text-slate-300 font-medium italic leading-relaxed">
                  "{explanation}"
                </p>
              </div>
            </div>
          </div>

          {/* 3. POLICY SUMMARY CARD */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-100 group">
            <h3 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-8 flex items-center gap-2">
              <ShieldCheck size={14} /> 📄 Policy Summary
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-6 border-b border-slate-50 group-hover:border-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <Coins size={18} />
                  </div>
                  <span className="text-slate-500 font-bold">Sum Insured</span>
                </div>
                <span className="text-xl font-black text-slate-800">₹{policySummary.sum_insured.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center group-hover:translate-x-1 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <Activity size={18} />
                  </div>
                  <span className="text-slate-500 font-bold">Coverage Applied</span>
                </div>
                <span className="text-xl font-black text-brand-600 bg-brand-50 px-4 py-1.5 rounded-xl">{Math.round(policySummary.coverage_used * 100)}%</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-1">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-100 sticky top-10">
            <h3 className="text-slate-800 font-black uppercase tracking-[0.2em] text-[10px] mb-10">Process Timeline</h3>
            <div className="space-y-10">
              {timelineSteps.map((stepName, idx) => {
                const isCompleted = idx < 4;
                const isCurrent = idx === 4;
                
                return (
                  <div key={idx} className="flex gap-5 relative group/item">
                    {/* Line */}
                    {idx !== timelineSteps.length - 1 && (
                      <div className={`absolute left-[15px] top-8 bottom-0 w-[2px] -mb-10 ${isCompleted ? 'bg-brand-500' : 'bg-slate-100'}`} />
                    )}
                    
                    {/* Dot */}
                    <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isCompleted ? 'bg-brand-500 text-white shadow-lg shadow-brand-200' : 
                      isCurrent ? 'bg-white border-4 border-brand-500 text-brand-500 animate-pulse-soft scale-110' : 
                      'bg-white border-2 border-slate-100 text-slate-200 group-hover/item:border-slate-200'
                    }`}>
                      {isCompleted ? <CheckCircle size={16} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                    </div>

                    <div className="pt-0.5">
                      <p className={`text-sm font-black transition-colors ${isCompleted ? 'text-slate-800' : isCurrent ? 'text-brand-600' : 'text-slate-300'}`}>
                        {stepName}
                      </p>
                      <p className={`text-[9px] font-black uppercase tracking-widest mt-1 transition-colors ${isCompleted ? 'text-brand-500' : 'text-slate-300'}`}>
                        {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
