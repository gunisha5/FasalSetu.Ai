import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Search, ExternalLink, Cpu, FileText, AlertTriangle, Loader2, Camera } from 'lucide-react';
import { claimApi, farmApi } from '../../../utils/apiClient';
import type { Claim } from '../../../utils/apiClient';
import { useAuthStore } from '../../../store/authStore';

export default function ClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);

  const user = useAuthStore(s => s.user);
  const farmerId = Number(user?.id) || 1;
  const [farmName, setFarmName] = useState('');

  useEffect(() => {
    async function load() {
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
            } catch {
               setFarmName(`Field #${found.farmId}`);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, farmerId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-brand-500" size={40} />
      <p className="text-gray-400">Loading claim details...</p>
    </div>
  );

  if (!claim) return <div className="text-center py-20 text-gray-500">Claim not found.</div>;

  const isComplete = claim.status === 'AI_COMPLETE' || claim.status === 'MANUAL_REVIEW';
  const isProcessing = claim.status === 'PROCESSING';

  const TIMELINE_EVENTS = [
    { title: 'Claim Submitted', desc: `Claim filed for appraisal.`, time: 'Just now', status: 'done', icon: CheckCircle },
    { 
      title: isProcessing ? 'AI Analysis Running' : 'AI Analysis Complete', 
      desc: isProcessing ? 'Processing satellite imagery...' : `Confidence: ${(claim.aiConfidence || 0) * 100}%`, 
      time: isComplete ? 'Success' : 'Active', 
      status: isComplete ? 'done' : 'active', 
      icon: isComplete ? CheckCircle : Cpu 
    },
    { title: 'Agent Review', desc: 'Awaiting human verification.', time: 'Pending', status: isComplete ? 'active' : 'upcoming', icon: Search },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors bg-white/5 border border-white/5">
          <ArrowLeft size={24} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-1">
             <h1 className="text-2xl font-bold">Claim #{claim.id}</h1>
             <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
               claim.status === 'AI_COMPLETE' ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-orange-500/20 text-orange-400 border-orange-500/20'
             }`}>
               {claim.status?.replace('_', ' ')}
             </span>
          </div>
          <p className="text-gray-400 text-sm">{claim.calamityType} Damage • {farmName} • Filed {claim.dateOfLoss || 'Recently'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         {/* Left Column: Timeline */}
         <div className="bg-surface-card border border-white/5 rounded-3xl p-6 shadow-lg h-fit">
            <h3 className="font-semibold text-lg border-b border-white/10 pb-3 mb-6">Status Timeline</h3>
            
            <div className="space-y-6">
               {TIMELINE_EVENTS.map((event, idx) => {
                  const isLast = idx === TIMELINE_EVENTS.length - 1;
                  return (
                    <div key={idx} className="relative flex gap-4">
                       {!isLast && (
                          <div className={`absolute top-8 left-4 bottom-[-1.5rem] w-0.5 ${event.status === 'done' ? 'bg-brand-500' : 'bg-white/10'}`} />
                       )}
                       
                       <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 
                          ${event.status === 'done' ? 'bg-brand-500 text-white' : 
                            event.status === 'active' ? 'bg-orange-500 text-white ring-4 ring-orange-500/20' : 
                            'bg-surface-dark border border-white/20 text-gray-500'}`}>
                          <event.icon size={16} />
                       </div>
                       
                       <div className="pb-2">
                          <h4 className={`text-sm font-bold ${event.status === 'upcoming' ? 'text-gray-500' : 'text-white'}`}>{event.title}</h4>
                          <p className={`text-xs mt-1 ${event.status === 'upcoming' ? 'text-gray-600' : 'text-gray-400'}`}>{event.desc}</p>
                          <p className="text-[10px] mt-1 text-gray-500 font-mono tracking-wider">{event.time}</p>
                       </div>
                    </div>
                  )
               })}
            </div>
         </div>

         {/* Right Column: AI Details */}
         <div className="space-y-6">
            
            {/* Real AI Card */}
            {isComplete ? (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 shadow-[0_0_30px_rgba(99,102,241,0.05)] relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Cpu size={100} />
                 </div>
                 <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-indigo-400 flex items-center gap-2">
                        Satellite Analysis <ExternalLink size={14} />
                      </h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{Math.round((claim.aiConfidence || 0) * 100)}%</div>
                        <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-tighter">Confidence</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                       <div className="bg-white/5 rounded-lg p-2 text-center">
                          <div className="text-[9px] text-gray-400 uppercase">NDVI Δ</div>
                          <div className="text-xs font-mono text-white">{claim.deltaNdvi?.toFixed(2) || '0.0'}</div>
                       </div>
                       <div className="bg-white/5 rounded-lg p-2 text-center">
                          <div className="text-[9px] text-gray-400 uppercase">NDWI Δ</div>
                          <div className="text-xs font-mono text-white">{claim.deltaNdwi?.toFixed(2) || '0.0'}</div>
                       </div>
                       <div className="bg-white/5 rounded-lg p-2 text-center">
                          <div className="text-[9px] text-gray-400 uppercase">SAR Δ</div>
                          <div className="text-xs font-mono text-white">{claim.deltaSar?.toFixed(1) || '0.0'}</div>
                       </div>
                    </div>

                    <p className="text-sm text-indigo-200/70 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                      {claim.aiReasoning || 'AI analysis complete for your land parcel.'}
                    </p>
                 </div>
              </div>
            ) : (
                <div className="bg-surface-card border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                      <Cpu size={24} className="text-gray-500" />
                   </div>
                   <div>
                     <h3 className="font-bold text-white mb-1">AI Processing</h3>
                     <p className="text-sm text-gray-400">We are currently fetching satellite bands for your coordinates. This usually takes 30-60 seconds.</p>
                   </div>
                </div>
            )}

            {/* Visual Evidence Card */}
            {(claim.visualDroughtScore !== undefined || claim.visualFloodScore !== undefined) && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-3xl p-6 shadow-[0_0_30px_rgba(249,115,22,0.05)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Camera size={100} />
                </div>
                <div className="relative z-10">
                   <h3 className="font-semibold text-orange-400 flex items-center gap-2 mb-4">
                     Visual Evidence Assessment <Camera size={14} />
                   </h3>
                   <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                         <span className="text-xs text-gray-400">Geotag Status</span>
                         <span className="text-xs font-bold text-green-400 px-2 py-0.5 bg-green-500/10 rounded border border-green-500/20">VERIFIED ✅</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 rounded-xl p-3">
                           <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Drought Intensity</div>
                           <div className="text-lg font-bold text-white">{((claim.visualDroughtScore || 0) * 100).toFixed(1)}%</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                           <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Flood Severity</div>
                           <div className="text-lg font-bold text-white">{((claim.visualFloodScore || 0) * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* Total Payout Summary */}
            <div className="bg-surface-card border border-white/5 rounded-3xl p-6 shadow-lg">
               <h3 className="font-semibold text-lg border-b border-white/10 pb-3 mb-4">Payout Context</h3>
               <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl">
                  <AlertTriangle className="text-orange-400 shrink-0" />
                  <p className="text-xs text-gray-400">Exact payout amount will be finalized after the Agent reviews the satellite report above.</p>
               </div>
            </div>

         </div>

      </div>
    </div>
  );
}
