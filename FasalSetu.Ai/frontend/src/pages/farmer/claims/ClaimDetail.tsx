import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Info, CloudRain, Droplets, Activity, FileText, Loader2, AlertCircle } from 'lucide-react';
import { claimApi, farmApi } from '../../../utils/apiClient';
import type { Claim } from '../../../utils/apiClient';
import { useAuthStore } from '../../../store/authStore';

export default function ClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [farmName, setFarmName] = useState('Your Farm');

  const user = useAuthStore(s => s.user);
  const farmerId = Number(user?.id) || 1;

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
      <p className="text-gray-400 font-medium">Fetching your claim details...</p>
    </div>
  );

  if (!claim) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertCircle className="text-gray-300" size={48} />
      <p className="text-gray-500 font-medium">Claim not found.</p>
      <button onClick={() => navigate('/farmer/claims')} className="text-brand-600 font-bold hover:underline">Back to My Claims</button>
    </div>
  );

  // Simple Logic for Display
  const damageScore = claim.aiDamageScore || 0;
  const isHighDamage = damageScore > 50;
  const isMediumDamage = damageScore > 20 && damageScore <= 50;
  
  const getPredictionLabel = () => {
    if (isHighDamage) return "High Crop Damage Detected";
    if (isMediumDamage) return "Partial Crop Damage Detected";
    return "Minimal Damage Detected";
  };

  const getExplanation = () => {
    if (claim.aiReasoning) return claim.aiReasoning;
    if (isHighDamage) return "Our AI detected significant changes in your field's health compared to before the event. Heavy rainfall and flooding signals were also found.";
    return "Our AI analyzed your field and found some changes, but they appear to be within normal ranges for this season.";
  };

  const confidence = Math.round(claim.confidenceScore || 75);

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      
      {/* Back Link */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/farmer/claims')} 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors group"
        >
          <div className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full group-hover:bg-slate-50 transition-colors">
            <ArrowLeft size={16} />
          </div>
          Back to All Claims
        </button>
        <button 
          onClick={() => window.open(`http://localhost:8001/download-report/${claim.id}?farmer_email=${user?.email}`, '_blank')}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-800 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <FileText size={18} />
          Download Report
        </button>
      </div>

      {/* Main Analysis Card */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden mb-8">
        
        {/* Result Header */}
        <div className={`p-10 text-white ${isHighDamage ? 'bg-gradient-to-br from-red-500 to-red-600' : (isMediumDamage ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-brand-500 to-brand-600')}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 font-black uppercase tracking-widest text-xs mb-2">AI Analysis Result</p>
              <h1 className="text-4xl font-black mb-4 leading-tight">{getPredictionLabel()}</h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full w-fit">
                  <CheckCircle size={18} />
                  <span className="font-bold text-sm">{confidence}% Confidence</span>
                </div>
                <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-md ${
                  confidence > 75 ? 'bg-white/30 border border-white/20' : 
                  confidence > 40 ? 'bg-white/20' : 
                  'bg-red-500/30'
                }`}>
                  {confidence > 75 ? 'High Certainty' : confidence > 40 ? 'Medium Certainty' : 'Low Certainty'}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center">
                <Activity size={48} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Simple Explanation */}
        <div className="p-10 border-b border-slate-50">
          <div className="flex gap-4 items-start">
            <div className="shrink-0 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
              <Info size={20} />
            </div>
            <p className="text-lg text-slate-600 font-medium leading-relaxed italic">
              "{getExplanation()}"
            </p>
          </div>
        </div>

        {/* Key Factors Section */}
        <div className="p-10 bg-slate-50/50">
          <h3 className="text-slate-800 font-black uppercase tracking-widest text-xs mb-8">Key Analysis Factors</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Factor 1: NDVI */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
                <Activity size={20} />
              </div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Crop Health Change</p>
              <p className="text-2xl font-black text-slate-800">
                {claim.deltaNdvi != null ? `${Math.abs(Math.round(claim.deltaNdvi * 100))}% Drop` : 'No Change'}
              </p>
              <p className="text-xs text-slate-500 mt-2 font-medium">Compared to last month</p>
            </div>

            {/* Factor 2: Flood */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Droplets size={20} />
              </div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Flood Indicator</p>
              <p className="text-2xl font-black text-slate-800">
                {claim.deltaSar != null && claim.deltaSar < -2 ? 'Water Detected' : 'No Flood'}
              </p>
              <p className="text-xs text-slate-500 mt-2 font-medium">Satellite radar signal</p>
            </div>

            {/* Factor 3: Environmental Insights */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow md:col-span-1">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <CloudRain size={20} />
              </div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Local Weather</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Current Rain</span>
                  <span className="text-sm font-black text-slate-800">{claim.rainfallMm ? `${claim.rainfallMm.toFixed(1)}mm` : '0mm'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">7-Day History</span>
                  <span className="text-sm font-black text-slate-800">{claim.rainfall7d ? `${Math.round(claim.rainfall7d)}mm` : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Avg Temp</span>
                  <span className="text-sm font-black text-slate-800">{claim.tempAvg ? `${claim.tempAvg.toFixed(1)}°C` : 'N/A'}</span>
                </div>
                <div className="pt-2 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">District Risk</span>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md">
                    {claim.floodRisk && claim.floodRisk > 0.5 ? 'High' : 'Normal'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Why this result? (New Section) */}
        <div className="p-10 border-t border-slate-50 bg-white">
          <h3 className="text-slate-800 font-black uppercase tracking-widest text-xs mb-6">Why this result?</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <CloudRain size={24} />
              </div>
              <div>
                <p className="text-slate-800 font-bold">Rainfall Analysis</p>
                <p className="text-sm text-slate-500 font-medium">
                  {claim.rainfall7d ? (
                    `Detected ${Math.round(claim.rainfall7d)}mm of cumulative rainfall over the 7 days preceding the event. This confirms a significant weather trigger.`
                  ) : (
                    "Weather patterns were monitored for the week of the event."
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-slate-800 font-bold">Regional Risk Profile</p>
                <p className="text-sm text-slate-500 font-medium">
                  Your district has a historical {claim.floodRisk ? (claim.floodRisk * 100).toFixed(0) : '0'}% flood risk and {claim.droughtRisk ? (claim.droughtRisk * 100).toFixed(0) : '0'}% drought risk baseline. This context helps validate the authenticity of the reported damage.
                </p>
              </div>
            </div>

            <div className="p-6 bg-brand-50 border border-brand-100 rounded-2xl">
              <p className="text-brand-800 font-bold text-sm flex items-center gap-2">
                <Info size={16} />
                Summary Explanation
              </p>
              <p className="text-sm text-brand-700 mt-2 font-medium">
                {claim.aiDamageScore && claim.aiDamageScore > 40 ? (
                  "High rainfall levels combined with high regional flood risk and satellite-detected crop stress indicate a high probability of legitimate flood damage."
                ) : (
                  "While some environmental factors were present, the satellite detection indicates that your crop health remains within manageable bounds for this stage."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Claim Status Section */}
        <div className="p-10 bg-white">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-brand-50/50 border border-brand-100 p-8 rounded-3xl">
            <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center shrink-0">
              <FileText size={32} />
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-xl font-black text-brand-900 mb-2">Claim Sent for Agent Review</h3>
              <p className="text-slate-600 font-medium">
                Your claim analysis has been forwarded to our insurance officer. While our AI has detected damage, a human expert will perform the final verification before payout.
              </p>
            </div>
            <div className="px-6 py-2 bg-brand-100 text-brand-700 font-black text-xs uppercase tracking-widest rounded-full">
              Status: Under Review
            </div>
          </div>
        </div>

      </div>

      {/* Progress Timeline */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
        <h3 className="text-slate-800 font-black uppercase tracking-widest text-xs mb-10">Application Timeline</h3>
        <div className="relative flex justify-between items-start max-w-2xl mx-auto">
          
          {/* Connector Line */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-slate-100 z-0">
            <div 
              className="h-full bg-brand-500 transition-all duration-1000 rounded-full" 
              style={{ 
                width: claim.status === 'APPROVED' || claim.status === 'REJECTED' ? '100%' : 
                       (claim.status === 'UNDER_REVIEW' ? '50%' : '0%') 
              }} 
            />
          </div>

          {/* Step 1: Submitted */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-10 h-10 bg-brand-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-200">
              <CheckCircle size={20} />
            </div>
            <div className="text-center">
              <p className="font-black text-slate-800 text-sm">Submitted</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{claim.dateOfLoss || 'Today'}</p>
            </div>
          </div>

          {/* Step 2: Under Review */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
              claim.status !== 'SUBMITTED' ? 'bg-brand-500 text-white shadow-lg shadow-brand-200' : 'bg-white border-2 border-slate-200 text-slate-400'
            }`}>
              {claim.status !== 'SUBMITTED' ? <CheckCircle size={20} /> : <Clock size={20} />}
            </div>
            <div className="text-center">
              <p className={`font-black text-sm ${claim.status !== 'SUBMITTED' ? 'text-slate-800' : 'text-slate-400'}`}>Under Review</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {claim.status === 'SUBMITTED' ? 'Pending' : 'In Progress'}
              </p>
            </div>
          </div>

          {/* Step 3: Final Status */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
              (claim.status === 'APPROVED' || claim.status === 'REJECTED') 
                ? (claim.status === 'APPROVED' ? 'bg-brand-500 text-white' : 'bg-red-500 text-white')
                : 'bg-white border-2 border-slate-200 text-slate-400'
            }`}>
              {(claim.status === 'APPROVED' || claim.status === 'REJECTED') ? <CheckCircle size={20} /> : <div className="w-2 h-2 bg-slate-300 rounded-full" />}
            </div>
            <div className="text-center">
              <p className={`font-black text-sm ${
                (claim.status === 'APPROVED' || claim.status === 'REJECTED') ? 'text-slate-800' : 'text-slate-400'
              }`}>
                {claim.status === 'REJECTED' ? 'Rejected' : (claim.status === 'APPROVED' ? 'Approved' : 'Final Status')}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {(claim.status === 'APPROVED' || claim.status === 'REJECTED') ? 'Finalized' : 'Pending'}
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
