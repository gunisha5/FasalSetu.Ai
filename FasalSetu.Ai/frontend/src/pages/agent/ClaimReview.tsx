import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Download, Cpu, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { agentApi, claimApi, farmApi } from '../../utils/apiClient';
import type { Claim, Farm } from '../../utils/apiClient';
import ErrorBanner from '../../components/ErrorBanner';

export default function ClaimReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [agentNotes, setAgentNotes] = useState('');
  const [loading, setLoading] = useState<'approve' | 'reject' | 'fetch' | null>('fetch');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading('fetch');
        const claimRes = await agentApi.getById(id!);
        setClaim(claimRes.data);
        const farmRes = await farmApi.getById(claimRes.data.farmId!);
        setFarm(farmRes.data);
      } catch (err) {
        setError('Failed to load claim details.');
      } finally {
        setLoading(null);
      }
    }
    load();
  }, [id]);

  const handleUpdateStatus = async (status: string) => {
    if (status === 'REJECTED' && !agentNotes.trim()) { 
      setError('Please add agent notes explaining the rejection reason.'); 
      return; 
    }
    setError('');
    setLoading(status === 'APPROVED' ? 'approve' : 'reject');
    try {
      await agentApi.updateStatus(id!, status, agentNotes);
      navigate('/agent/claims');
    } catch {
      setError('Failed to update status. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  if (loading === 'fetch') return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-brand-500" size={40} />
      <p className="text-gray-400">Fetching evidence for claim #{id}...</p>
    </div>
  );

  if (!claim || !farm) return <div className="text-center py-20 text-gray-500">Claim data incomplete.</div>;

  // Extract polygon from GeoJSON
  let polyCoords: [number, number][] = [[20.5937, 78.9629]];
  try {
    const geo = JSON.parse(farm.boundaryGeoJson || '{}');
    if (geo.geometry && geo.geometry.coordinates) {
       polyCoords = geo.geometry.coordinates[0].map((c: any) => [c[1], c[0]]);
    }
  } catch(e) {}

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full text-gray-400">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Claim #{claim.id}
              <span className="text-xs px-2 py-1 bg-white/10 rounded text-gray-300 font-normal uppercase tracking-wider">{claim.calamityType}</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Farm: {farm.farmName} • {farm.village}</p>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Card */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
               <div className="absolute top-4 right-4 opacity-10"><Cpu size={64} /></div>
               <h3 className="font-semibold text-indigo-400 flex items-center gap-2 mb-4">Satellite AI Report</h3>
               <div className="flex items-end gap-3 mb-2">
                 <span className="text-4xl font-bold">{Math.round((claim.aiConfidence || 0) * 100)}<span className="text-xl text-gray-400">/100</span></span>
                 <span className={`text-xs font-semibold px-2 py-1 rounded border ${
                    (claim.aiConfidence || 0) > 0.7 ? 'bg-green-400/20 text-green-400 border-green-400/20' : 'bg-orange-400/20 text-orange-400 border-orange-400/20'
                 }`}>
                    {claim.aiConfidence && claim.aiConfidence > 0.7 ? 'HIGH CONFIDENCE' : 'LOW CONFIDENCE'}
                 </span>
               </div>
               <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-[10px] text-gray-500">NDVI: <span className="text-indigo-300">{claim.deltaNdvi?.toFixed(2)}</span></div>
                  <div className="text-[10px] text-gray-500">NDWI: <span className="text-indigo-300">{claim.deltaNdwi?.toFixed(2)}</span></div>
                  <div className="text-[10px] text-gray-500">SAR: <span className="text-indigo-300">{claim.deltaSar?.toFixed(1)}</span></div>
               </div>
               <p className="text-xs text-indigo-100/70 mt-4 leading-relaxed bg-black/20 p-3 rounded-lg">
                 {claim.aiReasoning || 'Evidence analysis in progress.'}
               </p>
            </div>

            {/* Map */}
            <div className="bg-surface-card border border-white/5 rounded-2xl overflow-hidden h-48 relative">
              <div className="absolute top-2 left-2 z-[400] bg-black/60 backdrop-blur rounded px-2 py-1 flex items-center gap-1 text-[10px] font-bold">
                <MapPin size={12} className="text-indigo-400" /> {farm.areaHectares} Ha
              </div>
              <MapContainer 
                center={polyCoords[0]} 
                zoom={14} 
                style={{ height: '100%', width: '100%', zIndex: 10 }} 
                zoomControl={false} 
                scrollWheelZoom={false}
              >
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                <Polygon positions={polyCoords} color="#6366f1" fillColor="#6366f1" fillOpacity={0.4} weight={2} />
              </MapContainer>
            </div>
          </div>

          {/* Evidence */}
          <div className="bg-surface-card border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 text-gray-300">Ground Evidence & Context</h3>
            <div className="p-10 border-2 border-dashed border-white/5 rounded-xl text-center text-gray-600">
               <AlertCircle className="mx-auto mb-2 opacity-20" size={32} />
               <p className="text-sm">No on-field photos uploaded by farmer yet.</p>
            </div>
          </div>
        </div>

        {/* Adjudication Panel */}
        <div className="lg:col-span-1">
          <div className="bg-surface-card border border-white/5 rounded-2xl p-6 sticky top-24 shadow-2xl">
            <h3 className="font-semibold text-lg border-b border-white/10 pb-3 mb-4">Adjudication</h3>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
              <p className="text-xs text-green-400 uppercase tracking-widest font-bold mb-1">AI Recommendation</p>
              <p className="text-3xl font-bold font-mono text-white">₹ {Math.round((claim.aiDamageScore || 0) * 2000).toLocaleString()}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Agent Notes</label>
                <textarea rows={3} value={agentNotes} onChange={e => setAgentNotes(e.target.value)}
                  className="w-full bg-surface-dark border border-white/10 rounded-lg py-3 px-4 text-white focus:ring-1 focus:ring-indigo-500 outline-none text-sm resize-none"
                  placeholder="Reason for decision (e.g. verified satellite band drop)" />
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                <button onClick={() => handleUpdateStatus('APPROVED')} disabled={!!loading}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-colors">
                  {loading === 'approve' ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} /> Approve Payout</>}
                </button>
                <button onClick={() => handleUpdateStatus('REJECTED')} disabled={!!loading}
                  className="w-full text-gray-500 hover:text-white disabled:opacity-40 text-sm font-medium py-2 transition-colors flex items-center justify-center gap-2">
                  {loading === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <><XCircle size={16} /> Mark as Fraudulent</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
