import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Camera, UploadCloud, CheckCircle, ShieldAlert, Cpu, Loader2 } from 'lucide-react';
import { claimApi } from '../../../utils/apiClient';
import { useAuthStore } from '../../../store/authStore';
import ErrorBanner from '../../../components/ErrorBanner';

export default function ClaimFilingWizard() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const farmerId = Number(user?.id) || 1;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    farmId: 0 as number,
    farmLabel: '',
    calamityType: '',
    files: [] as string[],
    policies: [] as string[],
    otp: ''
  });

  const isAiAssisted = formData.calamityType === 'Flood' || formData.calamityType === 'Drought';

  const submitClaim = async () => {
    setLoading(true);
    setError('');
    try {
      await claimApi.file({ farmerId, farmId: formData.farmId, calamityType: formData.calamityType });
      navigate('/farmer/claims');
    } catch {
      setError('Failed to submit claim. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mock farms — in M7 production we'd pull this from farmApi.getAll()
  const FARMS = [
    { id: 1, label: 'North Field (1.2 Ha)' },
    { id: 2, label: 'South Parcel (0.9 Ha)' },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full bg-white/5 border border-white/5">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">File New Claim</h1>
          <p className="text-gray-400 text-sm">Step {step} of 5</p>
        </div>
      </div>

      <div className="w-full bg-white/10 h-2 rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-brand-500 transition-all duration-300 ease-out" style={{ width: `${(step / 5) * 100}%` }} />
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="bg-surface-card border border-white/5 rounded-3xl p-6 shadow-2xl">

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Which farm is affected?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FARMS.map(farm => (
                <button key={farm.id} onClick={() => setFormData({ ...formData, farmId: farm.id, farmLabel: farm.label })}
                  className={`p-4 border rounded-2xl text-left transition-colors ${formData.farmId === farm.id ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                  <div className="font-semibold">{farm.label.split('(')[0]}</div>
                  <div className="text-xs text-gray-400">{farm.label.split('(')[1]?.replace(')', '')} Ha</div>
                </button>
              ))}
            </div>
            <button disabled={!formData.farmId} onClick={() => setStep(2)}
              className="w-full bg-brand-500 disabled:opacity-50 text-white font-medium py-3.5 rounded-xl mt-4 flex items-center justify-center gap-2">
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">What happened?</h2>
            <select value={formData.calamityType} onChange={e => setFormData({ ...formData, calamityType: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 [&>option]:bg-surface-dark">
              <option value="" disabled>Select calamity type</option>
              {['Flood', 'Drought', 'Hailstorm', 'Pest'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {formData.calamityType && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${isAiAssisted ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-gray-500/10 border-gray-500/20'}`}>
                {isAiAssisted ? <Cpu size={20} className="text-indigo-400 shrink-0" /> : <ShieldAlert size={20} className="text-gray-400 shrink-0" />}
                <p className="text-sm">{isAiAssisted ? <><strong>AI Fast-Track:</strong> Satellite imagery will auto-assess damage.</> : <><strong>Manual Review:</strong> An agent will inspect your evidence.</>}</p>
              </div>
            )}
            <button disabled={!formData.calamityType} onClick={() => setStep(3)}
              className="w-full bg-brand-500 disabled:opacity-50 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2">
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Capture Evidence</h2>
            <label className="border-2 border-dashed border-white/20 hover:border-brand-500/50 rounded-2xl p-10 flex flex-col items-center cursor-pointer">
              <Camera size={40} className="text-gray-500 mb-3" />
              <p className="font-semibold">Tap to Open Camera</p>
              <input type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => { if (e.target.files) setFormData({ ...formData, files: [...formData.files, e.target.files[0].name] }); }} />
            </label>
            {formData.files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl text-sm">
                <CheckCircle size={16} className="text-brand-400" /> {f}
              </div>
            ))}
            <button onClick={() => setStep(4)} className="w-full bg-brand-500 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2">
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Attach Policies</h2>
            <p className="text-sm text-gray-400">Upload up to 3 insurance policy PDFs.</p>
            <label className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center cursor-pointer ${formData.policies.length >= 3 ? 'opacity-40 pointer-events-none' : 'border-white/20 hover:border-brand-500/50'}`}>
              <UploadCloud size={40} className="text-gray-500 mb-3" />
              <p className="font-semibold">Select PDF Document</p>
              <input type="file" accept="application/pdf" className="hidden"
                onChange={e => { if (e.target.files && formData.policies.length < 3) setFormData({ ...formData, policies: [...formData.policies, e.target.files[0].name] }); }} />
            </label>
            {formData.policies.map((p, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl text-sm">
                <CheckCircle size={16} className="text-brand-400" /> {p}
              </div>
            ))}
            <button disabled={formData.policies.length === 0} onClick={() => setStep(5)}
              className="w-full bg-brand-500 disabled:opacity-50 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2">
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-center">Verify & Submit</h2>
            <div className="bg-white/5 rounded-2xl p-4 text-sm space-y-3 font-mono">
              <div className="flex justify-between"><span className="text-gray-500">Farm:</span><span>{formData.farmLabel.split('(')[0]}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Calamity:</span><span>{formData.calamityType}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Photos:</span><span>{formData.files.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Policies:</span><span>{formData.policies.length}</span></div>
            </div>
            <p className="text-sm text-center text-gray-400">Enter the 6-digit OTP sent to your email</p>
            <input type="text" maxLength={6} value={formData.otp}
              onChange={e => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
              className="w-full text-center text-3xl tracking-[1em] py-4 bg-surface-dark border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="------" />
            <button disabled={formData.otp.length !== 6 || loading} onClick={submitClaim}
              className="w-full bg-brand-500 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-xl shadow-[0_4px_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2">
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Submit Claim'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
