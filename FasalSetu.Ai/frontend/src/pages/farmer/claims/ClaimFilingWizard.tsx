import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Camera, UploadCloud, CheckCircle, ShieldAlert, Cpu, Loader2, MapPin, X, Trash2, FileText, CloudRain, Sun, Wind, Bug } from 'lucide-react';
import { claimApi, authApi, farmApi, type Farm } from '../../../utils/apiClient';
import { useAuthStore } from '../../../store/authStore';
import ErrorBanner from '../../../components/ErrorBanner';
import ExifReader from 'exifreader';

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
    files: [] as { id: string, name: string; lat?: number; lng?: number, preview?: string }[],
    policies: [] as { name: string; isCovered: boolean; estimate: number; constraints: string[], scanning: boolean }[],
    otp: ''
  });
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fetchingFarms, setFetchingFarms] = useState(true);

  useEffect(() => {
    async function loadFarms() {
      try {
        const response = await farmApi.getAll(farmerId);
        setFarms(response.data);
      } catch (err) {
        console.error('Failed to load farms:', err);
        setError('Could not load your farms. Please ensure you have registered at least one farm.');
      } finally {
        setFetchingFarms(false);
      }
    }
    loadFarms();
  }, [farmerId]);

  const isAiAssisted = formData.calamityType === 'Flood' || formData.calamityType === 'Drought';

  const handleStep4Submit = async () => {
    if (!user?.email) {
      setError('User email not found. Please re-login.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.sendOtp(user.email, 'CLAIM_SUBMIT');
      setStep(5);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitClaim = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError('');
    try {
      // 1. Verify OTP first
      await authApi.verify(user.email, formData.otp, 'CLAIM_SUBMIT');
      
      // 2. If verified, proceed to file claim
      await claimApi.file({ 
        farmerId, 
        farmId: formData.farmId, 
        calamityType: formData.calamityType,
        dateOfLoss: new Date().toISOString().split('T')[0] // Set today's date if missing
      });
      navigate('/farmer/claims');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Verification failed. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setLoading(true);
    setError('');

    try {
      const tags = await ExifReader.load(file);
      const lat = tags.GPSLatitude?.description;
      const lng = tags.GPSLongitude?.description;

      if (!lat || !lng) {
        setError('Photo rejected: No GPS geotag found. Please enable location in your camera settings.');
        return;
      }

      const preview = URL.createObjectURL(file);

      setFormData({
        ...formData,
        files: [...formData.files, { 
          id: Math.random().toString(36).substr(2, 9),
          name: file.name, 
          lat: parseFloat(lat), 
          lng: parseFloat(lng),
          preview 
        }]
      });
    } catch (err) {
      setError('Failed to extract location data from photo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = (id: string) => {
    const fileToRemove = formData.files.find(f => f.id === id);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    setFormData({
      ...formData,
      files: formData.files.filter(f => f.id !== id)
    });
  };

  useEffect(() => {
    return () => {
      // Cleanup all object URLs when component unmounts
      formData.files.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, []);



  return (
    <div className="max-w-xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-3 hover:bg-white rounded-2xl bg-white shadow-premium border border-surface-border text-text-secondary transition-all active:scale-95">
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-text-main">File Claim</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-brand-500' : s < step ? 'w-4 bg-brand-200' : 'w-2 bg-surface-border'}`} />
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="bg-white border border-surface-border rounded-[2.5rem] p-8 shadow-premium relative overflow-hidden">
        {/* Step Background Decor */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/[0.03] rounded-full blur-3xl pointer-events-none" />


        {/* Step 1: Farm Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-text-main leading-tight">Which field was<br/>affected?</h2>
            {fetchingFarms ? (
              <div className="py-16 flex flex-col items-center gap-4">
                <Loader2 size={40} className="animate-spin text-brand-500" strokeWidth={2.5} />
                <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">Getting your farms...</p>
              </div>
            ) : farms.length > 0 ? (
              <div className="space-y-3">
                {farms.map(farm => (
                  <button key={farm.id} onClick={() => setFormData({ ...formData, farmId: farm.id!, farmLabel: farm.farmName })}
                    className={`w-full p-5 border-2 rounded-[1.5rem] text-left transition-all relative ${formData.farmId === farm.id ? 'border-brand-500 bg-brand-50 shadow-lg shadow-brand-500/10' : 'border-surface-border bg-white hover:border-brand-200'}`}>
                    <div className="flex justify-between items-center pr-8">
                      <div>
                        <div className={`font-black text-lg ${formData.farmId === farm.id ? 'text-brand-700' : 'text-text-main'}`}>{farm.farmName}</div>
                        <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mt-1">
                          {farm.areaHectares} Hectares • {farm.village}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.farmId === farm.id ? 'bg-brand-500 border-brand-500 text-white' : 'border-surface-border'}`}>
                        {formData.farmId === farm.id && <CheckCircle size={14} strokeWidth={3} />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center space-y-6">
                <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto">
                    <MapPin size={32} />
                </div>
                <p className="text-text-secondary font-medium">You haven't registered any farms yet.</p>
                <button onClick={() => navigate('/farmer/farms/new')} className="w-full py-4 bg-brand-500 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20">Register Farm Now</button>
              </div>
            )}
            <button disabled={!formData.farmId} onClick={() => setStep(2)}
              className="w-full bg-brand-500 disabled:opacity-30 disabled:bg-surface-border text-white font-black py-5 rounded-[1.5rem] mt-6 flex items-center justify-center gap-2 shadow-xl shadow-brand-500/20 transition-all active:scale-95">
              Next Step <ArrowRight size={20} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* Step 2: Calamity Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-text-main">What happened<br/>to your crop?</h2>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'Flood', icon: CloudRain, color: 'text-blue-600', bg: 'bg-blue-50' },
                { id: 'Drought', icon: Sun, color: 'text-orange-600', bg: 'bg-orange-50' },
                { id: 'Hailstorm', icon: Wind, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                { id: 'Pest', icon: Bug, color: 'text-red-600', bg: 'bg-red-50' }
              ].map(t => (
                <button key={t.id} onClick={() => setFormData({ ...formData, calamityType: t.id })}
                  className={`p-6 rounded-[1.5rem] flex flex-col items-center gap-3 transition-all border-2 ${formData.calamityType === t.id ? 'border-brand-500 bg-brand-50 shadow-lg' : 'border-surface-border bg-white hover:border-brand-200'}`}>
                  <div className={`w-14 h-14 ${t.bg} ${t.color} rounded-2xl flex items-center justify-center`}>
                    <t.icon size={32} strokeWidth={2.5} />
                  </div>
                  <span className={`font-black uppercase tracking-wider text-xs ${formData.calamityType === t.id ? 'text-brand-700' : 'text-text-secondary'}`}>{t.id}</span>
                </button>
              ))}
            </div>

            {formData.calamityType && (
              <div className={`p-5 rounded-2xl border-2 flex items-start gap-4 animate-in zoom-in-95 duration-300 ${isAiAssisted ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                {isAiAssisted ? <Cpu size={24} strokeWidth={2.5} className="shrink-0" /> : <ShieldAlert size={24} strokeWidth={2.5} className="shrink-0" />}
                <p className="text-sm font-bold leading-snug">
                    {isAiAssisted ? "AI SATELLITE ACTIVE: We will scan your field from space for automatic proof." : "MANUAL REVIEW: Our local officer will verify your photos manually."}
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="px-6 py-5 rounded-[1.5rem] border-2 border-surface-border text-text-secondary font-black active:scale-95 transition-all">Back</button>
                <button disabled={!formData.calamityType} onClick={() => setStep(3)}
                    className="flex-1 bg-brand-500 disabled:opacity-30 disabled:bg-surface-border text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-2 shadow-xl shadow-brand-500/20 transition-all active:scale-95">
                    Continue <ArrowRight size={20} strokeWidth={3} />
                </button>
            </div>
          </div>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-text-main">Show us the<br/>damage</h2>
              <p className="text-sm text-text-secondary font-bold uppercase tracking-widest mt-1 italic">Camera location must stay "ON"</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <label className="border-2 border-dashed border-brand-200 bg-brand-50/30 hover:border-brand-500 hover:bg-brand-50 rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer h-40 transition-all group active:scale-95">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-600 shadow-sm border border-brand-100 group-hover:scale-110 transition-transform">
                    <Camera size={28} strokeWidth={2.5} />
                  </div>
                  <p className="text-xs font-black text-brand-700 mt-3 uppercase tracking-tighter">
                    {loading ? 'Processing...' : 'Take Photo'}
                  </p>
                  <input type="file" accept="image/*" capture="environment" className="hidden"
                    disabled={loading}
                    onChange={handleFileChange} />
               </label>

               {formData.files.map((f) => (
                 <div key={f.id} className="relative group h-40 rounded-[1.5rem] overflow-hidden border-2 border-surface-border bg-surface-bg shadow-sm">
                    <img src={f.preview} alt={f.name} className="w-full h-full object-cover" />
                    
                    {/* Delete Button */}
                    <button 
                      onClick={() => handleRemoveFile(f.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-xl shadow-lg flex items-center justify-center transition-all hover:bg-red-600 active:scale-75"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>

                    {/* GPS Badge */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/90 backdrop-blur-sm border-t border-surface-border">
                       <div className="flex items-center gap-1 text-[10px] text-brand-700 font-black uppercase tracking-tighter">
                          <MapPin size={10} strokeWidth={3} /> {f.lat?.toFixed(3)}, {f.lng?.toFixed(3)}
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            <p className="text-xs text-orange-600 font-bold text-center bg-orange-50 p-3 rounded-xl border border-orange-100">
               ⚠️ Photos without Location (Geotag) will be REJECTED by AI.
            </p>

            <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="px-6 py-5 rounded-[1.5rem] border-2 border-surface-border text-text-secondary font-black active:scale-95 transition-all">Back</button>
                <button disabled={formData.files.length === 0 || loading} onClick={() => setStep(4)} 
                    className="flex-1 bg-brand-500 disabled:opacity-30 disabled:bg-surface-border text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-2 shadow-xl shadow-brand-500/20 transition-all active:scale-95">
                    Next <ArrowRight size={20} strokeWidth={3} />
                </button>
            </div>
          </div>
        )}

        {/* Step 4: Policy Analysis */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-text-main">Insurance Policy</h2>
              <p className="text-sm text-text-secondary font-bold uppercase tracking-widest mt-1 italic">AI will read your document</p>
            </div>

            <label className={`border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center cursor-pointer transition-all ${formData.policies.length >= 3 ? 'opacity-40 pointer-events-none' : 'border-brand-200 bg-brand-50/30 hover:border-brand-500 hover:bg-brand-50 active:scale-95'}`}>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-600 shadow-sm border border-brand-100 mb-3">
                <UploadCloud size={28} strokeWidth={2.5} />
              </div>
              <p className="text-sm font-black text-brand-700 uppercase">Upload PDF</p>
              <input type="file" accept="application/pdf" className="hidden"
                onChange={async (e) => {
                  if (e.target.files?.[0] && formData.policies.length < 3) {
                    const fileName = e.target.files[0].name;
                    const newPolicy = { name: fileName, isCovered: true, estimate: 0, constraints: [] as string[], scanning: true };
                    setFormData(prev => ({ ...prev, policies: [...prev.policies, newPolicy] }));

                    // Simulate AI Analysis
                    setTimeout(() => {
                      setFormData(prev => ({
                        ...prev,
                        policies: prev.policies.map(p => {
                          if (p.name !== fileName) return p;
                          const isRelevant = fileName.toLowerCase().includes('crop') || fileName.toLowerCase().includes('monsoon') || fileName.toLowerCase().includes('agri');
                          return {
                            ...p,
                            scanning: false,
                            isCovered: isRelevant,
                            estimate: isRelevant ? Math.floor(Math.random() * 40000) + 20000 : 0,
                            constraints: isRelevant ? ['Low Rain Cov.', '30% Area Rule'] : ['Invalid Policy Type']
                          };
                        })
                      }));
                    }, 2500);
                  }
                }} />
            </label>

            <div className="space-y-3">
              {formData.policies.map((p, i) => (
                <div key={i} className={`relative p-5 rounded-[1.5rem] border-2 transition-all ${p.scanning ? 'bg-surface-bg border-surface-border animate-pulse' : p.isCovered ? 'bg-brand-50 border-brand-500/20 shadow-md shadow-brand-500/5' : 'bg-red-50 border-red-500/20'}`}>
                  
                  <button onClick={() => setFormData(prev => ({ ...prev, policies: prev.policies.filter((_, idx) => idx !== i) }))}
                    className="absolute top-3 right-3 w-8 h-8 bg-white border border-surface-border text-text-secondary rounded-xl flex items-center justify-center hover:text-red-600 transition-colors active:scale-75">
                    <Trash2 size={16} strokeWidth={2.5} />
                  </button>

                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${p.scanning ? 'bg-white text-gray-300' : p.isCovered ? 'bg-brand-500 text-white' : 'bg-red-500 text-white'}`}>
                      {p.scanning ? <Loader2 size={24} className="animate-spin" /> : <FileText size={24} strokeWidth={2.5} />}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="font-black text-text-main truncate text-sm">{p.name}</p>
                      
                      {p.scanning ? (
                        <p className="text-[11px] text-text-secondary font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" /> Checking for {formData.calamityType} clauses...
                        </p>
                      ) : (
                        <div className="mt-2 space-y-2">
                           <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${p.isCovered ? 'bg-brand-100 text-brand-700' : 'bg-red-100 text-red-700'}`}>
                                 {p.isCovered ? 'Coverage Found' : 'Claim Rejected'}
                              </span>
                              {p.isCovered && <span className="text-brand-700 font-black text-sm">₹{p.estimate.toLocaleString()}</span>}
                           </div>
                           {p.isCovered && (
                            <div className="flex flex-wrap gap-1">
                              {p.constraints.map((c, ci) => (
                                <span key={ci} className="text-[9px] bg-white text-text-secondary font-black px-2 py-0.5 rounded border border-surface-border">
                                  {c}
                                </span>
                              ))}
                            </div>
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="px-6 py-5 rounded-[1.5rem] border-2 border-surface-border text-text-secondary font-black active:scale-95 transition-all">Back</button>
                <button disabled={formData.policies.length === 0 || formData.policies.some(p => p.scanning || !p.isCovered) || loading} onClick={handleStep4Submit}
                    className="flex-1 bg-brand-500 disabled:opacity-30 disabled:bg-surface-border text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-2 shadow-xl shadow-brand-500/20 transition-all active:scale-95">
                    Proceed <ArrowRight size={20} strokeWidth={3} />
                </button>
            </div>
          </div>
        )}

        {/* Step 5: OTP & Verify */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-text-main text-center">Summary</h2>
            <div className="bg-surface-bg/50 rounded-[1.5rem] p-6 text-sm space-y-4 border-2 border-surface-border">
              <div className="flex justify-between items-center"><span className="text-text-secondary font-bold uppercase tracking-tighter text-[10px]">Your Field</span><span className="text-text-main font-black">{formData.farmLabel}</span></div>
              <div className="flex justify-between items-center"><span className="text-text-secondary font-bold uppercase tracking-tighter text-[10px]">Damage</span><span className="text-text-main font-black flex items-center gap-1.5"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> {formData.calamityType}</span></div>
              
              <div className="pt-4 border-t border-surface-border flex justify-between items-center">
                 <div className="space-y-1">
                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Est. Payout</p>
                    <p className="text-3xl font-black text-brand-600">₹{formData.policies.reduce((acc, p) => acc + p.estimate, 0).toLocaleString()}</p>
                 </div>
                 <div className="p-3 bg-white rounded-2xl border border-surface-border shadow-sm text-center min-w-[70px]">
                    <div className="text-xl font-black text-text-main">{formData.files.length}</div>
                    <div className="text-[9px] text-text-secondary font-bold uppercase">Photos</div>
                 </div>
              </div>
            </div>

            <div className="space-y-3">
                <p className="text-sm text-center text-text-secondary font-bold">SENT TO {user?.email?.toUpperCase()}</p>
                <input type="text" maxLength={6} value={formData.otp}
                    onChange={e => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                    className="w-full text-center text-4xl tracking-[0.5em] font-black py-5 bg-white border-2 border-surface-border rounded-2xl focus:border-brand-500 focus:outline-none shadow-inner-soft"
                    placeholder="000000" />
            </div>

            <div className="flex gap-3">
                <button onClick={() => setStep(4)} className="px-6 py-5 rounded-[1.5rem] border-2 border-surface-border text-text-secondary font-black active:scale-95 transition-all">Back</button>
                <button disabled={formData.otp.length !== 6 || loading} onClick={submitClaim}
                    className="flex-1 bg-brand-500 disabled:opacity-30 disabled:bg-surface-border text-white font-black text-lg py-5 rounded-[1.5rem] shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
                    {loading ? <Loader2 size={24} className="animate-spin" /> : 'Confirm Submission'}
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
