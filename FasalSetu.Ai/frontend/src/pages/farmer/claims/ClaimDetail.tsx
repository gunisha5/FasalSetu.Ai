import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Search, ExternalLink, Cpu, FileText } from 'lucide-react';

export default function ClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // We deeply mock the scenario requested inside the Implementation Plan (Severe Flood)
  const isFlood = true; 

  const TIMELINE_EVENTS = [
    { title: 'Claim Submitted', desc: `OTP verified. Claim ${id} created for North Field.`, time: 'Aug 16, 2025 at 9:32 AM', status: 'done', icon: CheckCircle },
    { title: 'AI Analysis Running', desc: 'Fetching Sentinel-2 satellite imagery for your farm boundary.', time: 'Aug 16, 2025 at 9:33 AM', status: 'done', icon: Cpu },
    { title: 'AI Analysis Complete', desc: 'Damage Score: 74/100 (Severe).', time: 'Aug 16, 2025 at 9:41 AM', status: 'done', icon: CheckCircle },
    { title: 'Under Agent Review', desc: 'Assigned to processing queue for manual verification.', time: 'Aug 17, 2025 at 10:00 AM', status: 'active', icon: Search },
    { title: 'Payment Initiated', desc: 'Awaiting agent approval.', time: 'Pending', status: 'upcoming', icon: Clock },
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
             <h1 className="text-2xl font-bold">Claim {id}</h1>
             <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider rounded border border-orange-500/20">
               Processing
             </span>
          </div>
          <p className="text-gray-400 text-sm">North Field • Flood Damage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         {/* Left Column: Timeline */}
         <div className="bg-surface-card border border-white/5 rounded-3xl p-6 shadow-lg">
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

         {/* Right Column: AI & Payout Details */}
         <div className="space-y-6">
            
            {/* Conditional AI Card */}
            {isFlood && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 shadow-[0_0_30px_rgba(99,102,241,0.05)] relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Cpu size={100} />
                 </div>
                 <div className="relative z-10">
                    <h3 className="font-semibold text-indigo-400 flex items-center gap-2 mb-4">
                      Satellite AI Report <ExternalLink size={14} />
                    </h3>
                    <div className="flex items-end gap-3 mb-2">
                       <span className="text-4xl font-bold text-white">74<span className="text-xl text-gray-400">/100</span></span>
                       <span className="text-sm font-semibold text-red-400 bg-red-400/20 px-2 py-0.5 rounded border border-red-400/20 mb-1">SEVERE LOSS</span>
                    </div>
                    <p className="text-sm text-indigo-200/70">Sentinel-2 multi-spectral scan indicates catastrophic drop in NDVI value over 92% of the registered polygon.</p>
                 </div>
              </div>
            )}

            {/* Total Payout Summary */}
            <div className="bg-surface-card border border-white/5 rounded-3xl p-6 shadow-lg">
               <h3 className="font-semibold text-lg border-b border-white/10 pb-3 mb-4">Estimated Payout</h3>
               <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex justify-between items-center mb-4">
                  <div>
                    <p className="text-xs text-green-400 uppercase tracking-widest font-bold mb-1">Total Assigned</p>
                    <p className="text-3xl font-bold text-white">₹ 1,48,000</p>
                  </div>
                  <CheckCircle size={32} className="text-green-500 opacity-50" />
               </div>

               <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-lg border border-white/5">
                     <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        <span>Policy 1 (PMFBY)</span>
                     </div>
                     <span className="font-mono font-bold">₹ 1,18,400</span>
                  </div>
                  <div className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-lg border border-white/5">
                     <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        <span>Policy 2 (Add-on)</span>
                     </div>
                     <span className="font-mono font-bold">₹ 29,600</span>
                  </div>
               </div>
            </div>

         </div>

      </div>
    </div>
  );
}
