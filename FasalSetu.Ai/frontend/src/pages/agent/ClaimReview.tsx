import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Download, Cpu, MapPin, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { agentApi } from '../../utils/apiClient';
import ErrorBanner from '../../components/ErrorBanner';

export default function ClaimReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [agentNotes, setAgentNotes] = useState('');
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState('');

  // Static display data (linked to real claim via id — full fetch wired in M8)
  const claim = {
    id: id || 'CLM-00482',
    farmer: 'Ramesh Kumar (Aadhaar: **** 4821)',
    type: 'Flood',
    aiScore: 74,
    aiRecommendation: '1,48,000',
    policies: [{ name: 'PMFBY Basic' }, { name: 'HDFC Ergo Add-on' }],
    photos: ['https://images.unsplash.com/photo-1595187760775-51def9c274da?auto=format&fit=crop&w=400&q=80'],
    polygon: [[20.593, 78.962], [20.594, 78.962], [20.594, 78.963], [20.593, 78.963]] as [number, number][],
    area: 1.25,
  };

  const handleApprove = async () => {
    setError('');
    setLoading('approve');
    try {
      await agentApi.approve(id!, agentNotes);
      navigate('/agent/claims');
    } catch {
      setError('Failed to approve. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!agentNotes.trim()) { setError('Please add agent notes explaining the rejection reason.'); return; }
    setError('');
    setLoading('reject');
    try {
      await agentApi.reject(id!, agentNotes);
      navigate('/agent/claims');
    } catch {
      setError('Failed to reject. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full text-gray-400">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {claim.id}
              <span className="text-xs px-2 py-1 bg-white/10 rounded text-gray-300 font-normal uppercase tracking-wider">{claim.type}</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">{claim.farmer}</p>
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
                <span className="text-4xl font-bold">{claim.aiScore}<span className="text-xl text-gray-400">/100</span></span>
                <span className="text-xs font-semibold text-red-400 bg-red-400/20 px-2 py-1 rounded border border-red-400/20">SEVERE</span>
              </div>
              <p className="text-xs text-indigo-200/60 mt-4 leading-relaxed">NDVI reduction exceeds 80% threshold. Cloud cover: 5%.</p>
            </div>

            {/* Map */}
            <div className="bg-surface-card border border-white/5 rounded-2xl overflow-hidden h-48 relative">
              <div className="absolute top-2 left-2 z-[400] bg-black/60 backdrop-blur rounded px-2 py-1 flex items-center gap-1 text-[10px] font-bold">
                <MapPin size={12} className="text-indigo-400" /> {claim.area} Ha
              </div>
              <MapContainer bounds={claim.polygon} style={{ height: '100%', width: '100%', zIndex: 10 }} zoomControl={false} scrollWheelZoom={false}>
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                <Polygon positions={claim.polygon} color="#6366f1" fillColor="#6366f1" fillOpacity={0.4} weight={2} />
              </MapContainer>
            </div>
          </div>

          {/* Evidence */}
          <div className="bg-surface-card border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 text-gray-300">Evidence & Policies</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 mb-6">
              {claim.photos.map((src, i) => (
                <img key={i} src={src} alt="Evidence" className="h-32 w-48 object-cover rounded-xl border border-white/10" />
              ))}
            </div>
            <div className="space-y-2">
              {claim.policies.map((pol, i) => (
                <div key={i} className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-lg text-sm">
                  <span className="text-gray-300">{pol.name}</span>
                  <button className="text-indigo-400 flex items-center gap-1"><Download size={14} /> PDF</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Adjudication Panel */}
        <div className="lg:col-span-1">
          <div className="bg-surface-card border border-white/5 rounded-2xl p-6 sticky top-24 shadow-2xl">
            <h3 className="font-semibold text-lg border-b border-white/10 pb-3 mb-4">Adjudication</h3>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
              <p className="text-xs text-green-400 uppercase tracking-widest font-bold mb-1">AI Recommendation</p>
              <p className="text-3xl font-bold font-mono">₹ {claim.aiRecommendation}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Agent Notes</label>
                <textarea rows={3} value={agentNotes} onChange={e => setAgentNotes(e.target.value)}
                  className="w-full bg-surface-dark border border-white/10 rounded-lg py-3 px-4 text-white focus:ring-1 focus:ring-indigo-500 outline-none text-sm resize-none"
                  placeholder="Reason for decision (required for rejection)" />
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                <button onClick={handleApprove} disabled={!!loading}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-colors">
                  {loading === 'approve' ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} /> Approve Claim</>}
                </button>
                <button onClick={handleReject} disabled={!!loading}
                  className="w-full text-gray-500 hover:text-white disabled:opacity-40 text-sm font-medium py-2 transition-colors flex items-center justify-center gap-2">
                  {loading === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <><XCircle size={16} /> Reject Disbursal</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
