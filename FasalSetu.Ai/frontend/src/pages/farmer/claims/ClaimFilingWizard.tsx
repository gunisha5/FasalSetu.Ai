import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Camera, UploadCloud, CheckCircle, ShieldAlert, Cpu, Loader2, MapPin, Trash2, FileText, CloudRain, Sun, Shrub, AlertTriangle } from 'lucide-react';
import { claimApi, authApi, farmApi, aiApi, mapClaim, type Farm } from '../../../utils/apiClient';
import { useAuthStore } from '../../../store/authStore';
import { useUIStore } from '../../../store/uiStore';
import ErrorBanner from '../../../components/ErrorBanner';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function ClaimFilingWizard() {
  const { t } = useTranslation();
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
    dateOfLoss: new Date().toISOString().split('T')[0],
    files: [] as { id: string, name: string; lat?: number; lng?: number, preview?: string }[],
    policies: [] as { name: string; isCovered: boolean; estimate: number; constraints: string[], scanning: boolean }[],
    otp: '',
    policyDetails: {
      sumInsuredPerAcre: 0,
      totalSumInsured: 0,
      totalInsuredArea: 0,
      coveredRisks: [] as string[],
      policyUnit: '',
      extractedPoints: [] as string[]
    },
    policyFile: null as File | null
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
    if (!user?.email || loading) return;
    setLoading(true);
    setError('');
    try {
      // 1. Verify OTP
      await authApi.verify(user.email, formData.otp, 'CLAIM_SUBMIT');
      
      // 2. Prepare AI Prediction Request
      const selectedFarm = farms.find(f => f.id === formData.farmId);
      const predictData = new FormData();
      predictData.append('latitude', '23.0225'); // Fallback for demo
      predictData.append('longitude', '72.5714'); // Fallback for demo
      predictData.append('claim_date', formData.dateOfLoss);
      predictData.append('district', selectedFarm?.district || 'ahmedabad');
      predictData.append('crop', selectedFarm?.primaryCrop || 'wheat');
      predictData.append('farmer_id', String(farmerId));
      if (formData.policyFile) {
        predictData.append('policy_pdf', formData.policyFile);
      }

      // 3. Call AI Engine for immediate analysis
      console.log("Calling AI API...");
      const aiRes = await aiApi.predict(predictData);
      
      // Use the robust mapper to clean up the AI response (converts snake_case to camelCase)
      const mappedAiData = mapClaim(aiRes.data);

      // 4. Save Claim to Backend (Java)
      const claimRes = await claimApi.file({ 
        farmerId, 
        farmId: formData.farmId, 
        calamityType: formData.calamityType,
        dateOfLoss: formData.dateOfLoss,
        sumInsuredPerAcre: formData.policyDetails.sumInsuredPerAcre,
        totalSumInsured: mappedAiData.totalSumInsured || mappedAiData.policySummary?.sumInsured || formData.policyDetails.totalSumInsured,
        farmAreaSnapshot: selectedFarm?.areaAcres || 0,
        
        // Use clean camelCase properties from the mapped AI data
        prediction: mappedAiData.prediction,
        aiConfidence: mappedAiData.aiConfidence,
        damagePercent: mappedAiData.damagePercent,
        estimatedClaim: mappedAiData.estimatedClaim,
        explanation: mappedAiData.explanation,
        coverageApplied: mappedAiData.coverageApplied,
        
        rainfallMm: mappedAiData.rainfallMm,
        rainfall7d: mappedAiData.rainfall7d,
        floodRisk: mappedAiData.floodRisk,
        droughtRisk: mappedAiData.droughtRisk
      });

      // 5. Navigate to Result Page with immediate data
      navigate(`/farmer/claims/${claimRes.data.id}`, { 
        state: { result: { ...claimRes.data, ...mappedAiData } } 
      });

    } catch (err: any) {
      setError(err?.response?.data?.message || 'Submission failed. Please check your data and OTP.');
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
      const preview = URL.createObjectURL(file);

      setFormData({
        ...formData,
        files: [...formData.files, { 
          id: Math.random().toString(36).substr(2, 9),
          name: file.name, 
          preview 
        }]
      });
    } catch (err) {
      setError('Failed to process photo.');
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
      formData.files.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, []);

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <div className="max-w-xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-6 mb-10">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} 
          className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl shadow-premium border border-surface-border text-text-secondary hover:text-brand-600 transition-all active:scale-90"
        >
          <ArrowLeft size={24} strokeWidth={3} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-brand-900 tracking-tight leading-none">{t('claimWizard.title')}</h1>
          <div className="flex items-center gap-2 mt-3">
             {[1, 2, 3, 4, 5].map(s => (
               <div key={s} className={`h-2 rounded-full transition-all duration-500 ${s === step ? 'w-10 bg-brand-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : s < step ? 'w-4 bg-brand-200' : 'w-2 bg-surface-border'}`} />
             ))}
          </div>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <ErrorBanner message={error} />
        </motion.div>
      )}

      <div className="bg-white border border-surface-border rounded-[3rem] shadow-premium overflow-hidden relative">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="p-8 md:p-12 relative z-10 min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex-1"
            >
              {/* Step 1: Farm Selection */}
              {step === 1 && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
                      <Shrub size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-text-main leading-tight">{t('claimWizard.step1Title')}</h2>
                  </div>
                  
                  {fetchingFarms ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                      <Loader2 size={48} className="animate-spin text-brand-500" strokeWidth={2.5} />
                      <p className="text-xs font-black text-brand-400 uppercase tracking-[0.2em]">{t('claimWizard.locatingFields')}</p>
                    </div>
                  ) : farms.length > 0 ? (
                    <div className="space-y-4">
                      {farms.map(farm => (
                        <button 
                          key={farm.id} 
                          onClick={() => setFormData({ ...formData, farmId: farm.id!, farmLabel: farm.farmName })}
                          className={`w-full p-6 border-2 rounded-[2rem] text-left transition-all relative overflow-hidden group ${formData.farmId === farm.id ? 'border-brand-500 bg-brand-50 shadow-lg shadow-brand-500/10' : 'border-surface-border hover:border-brand-200'}`}
                        >
                          <div className="flex justify-between items-center relative z-10">
                            <div>
                               <p className={`text-xl font-black ${formData.farmId === farm.id ? 'text-brand-900' : 'text-text-main'}`}>{farm.farmName}</p>
                               <p className="text-[10px] font-black uppercase tracking-widest text-text-main mt-1 opacity-80">{farm.areaAcres} Acres • {farm.village}</p>
                            </div>
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${formData.farmId === farm.id ? 'bg-brand-500 border-brand-500 text-white animate-pulse-soft' : 'border-surface-border'}`}>
                               {formData.farmId === farm.id && <CheckCircle size={16} strokeWidth={3} />}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center space-y-6">
                      <MapPin size={64} className="mx-auto text-brand-100" strokeWidth={1} />
                      <p className="text-text-secondary font-bold text-lg">{t('farmer.noFields')}</p>
                      <button onClick={() => navigate('/farmer/farms/new')} className="w-full py-5 bg-brand-500 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-brand-500/20 active:scale-95 transition-all">{t('claimWizard.registerFieldNow')}</button>
                    </div>
                  )}
                  
                  <button 
                    disabled={!formData.farmId} 
                    onClick={() => setStep(2)}
                    className="w-full bg-brand-500 disabled:opacity-30 disabled:bg-surface-border text-white font-black text-xl py-6 rounded-[2rem] shadow-xl shadow-brand-500/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {t('claimWizard.nextStep')} <ArrowRight size={24} strokeWidth={3} />
                  </button>
                </div>
              )}

              {/* Step 2: Calamity Selection */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
                      <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-text-main">{t('claimWizard.step2Title')}</h2>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'Flood', icon: CloudRain, color: 'text-blue-600', bg: 'bg-blue-50', border: 'hover:border-blue-500' },
                      { id: 'Drought', icon: Sun, color: 'text-orange-600', bg: 'bg-orange-50', border: 'hover:border-orange-500' }
                    ].map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => setFormData({ ...formData, calamityType: t.id })}
                        className={`p-8 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all border-2 ${formData.calamityType === t.id ? 'border-brand-500 bg-brand-50 scale-[1.02] shadow-lg' : 'border-surface-border bg-white shadow-sm ' + t.border}`}
                      >
                        <div className={`w-20 h-20 ${t.bg} ${t.color} rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <t.icon size={48} strokeWidth={2} />
                        </div>
                        <span className={`font-black uppercase tracking-[0.2em] text-[10px] ${formData.calamityType === t.id ? 'text-brand-950 underline underline-offset-4' : 'text-text-main opacity-60'}`}>{t.id}</span>
                      </button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {formData.calamityType && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3"
                      >
                        <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Date of Loss</label>
                        <input 
                          type="date"
                          value={formData.dateOfLoss}
                          onChange={(e) => setFormData({...formData, dateOfLoss: e.target.value})}
                          className="w-full p-5 border-2 border-surface-border rounded-2xl focus:border-brand-500 outline-none text-text-main font-bold bg-white transition-all shadow-sm focus:shadow-brand-500/10"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {formData.calamityType && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`p-6 rounded-[1.5rem] border-2 flex items-start gap-4 ${isAiAssisted ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-lg shadow-indigo-500/10' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                      >
                        {isAiAssisted ? <Cpu size={28} strokeWidth={2.5} className="shrink-0 animate-pulse text-indigo-500" /> : <ShieldAlert size={28} strokeWidth={2.5} className="shrink-0" />}
                        <p className="text-sm font-black leading-snug">
                            {isAiAssisted ? t('claimWizard.aiEnabled') : t('claimWizard.manualReview')}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-4 mt-6">
                    <button onClick={() => setStep(1)} className="px-8 py-5 rounded-[1.5rem] border-2 border-surface-border text-text-secondary font-black text-lg active:scale-95 transition-all">{t('common.back')}</button>
                    <button 
                      disabled={!formData.calamityType} 
                      onClick={() => setStep(3)}
                      className="flex-1 bg-brand-500 disabled:opacity-30 disabled:bg-surface-border text-white font-black text-xl py-6 rounded-[2rem] shadow-xl shadow-brand-500/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                    >
                      {t('claimWizard.nextStep')} <ArrowRight size={24} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Photos */}
              {step === 3 && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
                      <Camera size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-text-main leading-none">{t('claimWizard.step4Title')}</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 mt-2">{t('claimWizard.photoHelp')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="border-4 border-dashed border-brand-100 bg-brand-50/50 hover:border-brand-500 hover:bg-brand-50 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer h-48 transition-all group active:scale-95 relative overflow-hidden">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-brand-600 shadow-premium border border-brand-100 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                        <Camera size={36} strokeWidth={2.5} />
                      </div>
                      <p className="text-[11px] font-black text-brand-700 mt-4 uppercase tracking-[0.2em]">
                        {loading ? t('claimWizard.processing') : t('claimWizard.takePhoto')}
                      </p>
                      <input type="file" accept="image/*" capture="environment" className="hidden"
                        disabled={loading}
                        onChange={handleFileChange} />
                      {loading && <div className="absolute inset-0 bg-white/40 flex items-center justify-center"><Loader2 className="animate-spin text-brand-500" size={32} /></div>}
                    </label>

                    {formData.files.map((f) => (
                      <motion.div 
                        layoutId={f.id}
                        key={f.id} 
                        className="relative group h-48 rounded-[2.5rem] overflow-hidden border-2 border-surface-border bg-surface-bg shadow-premium"
                      >
                        <img src={f.preview} alt={f.name} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => handleRemoveFile(f.id)}
                          className="absolute top-3 right-3 w-10 h-10 bg-red-500 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all hover:bg-red-600 active:scale-75 backdrop-blur-md bg-opacity-90"
                        >
                          <Trash2 size={20} strokeWidth={2.5} />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-md border-t border-surface-border">
                           <div className="flex items-center gap-1.5 text-[10px] text-brand-800 font-black uppercase tracking-tighter">
                              Evidence #{formData.files.indexOf(f) + 1}
                           </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="bg-brand-50 border-2 border-brand-100 p-5 rounded-[1.5rem] flex gap-4 items-start">
                    <CheckCircle className="text-brand-600 shrink-0" size={24} strokeWidth={2.5} />
                    <p className="text-xs font-bold text-brand-800 leading-snug">{t('claimWizard.photoUploaded')}</p>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(2)} className="px-8 py-5 rounded-[1.5rem] border-2 border-surface-border text-text-secondary font-black text-lg active:scale-95 transition-all">{t('common.back')}</button>
                    <button 
                      disabled={formData.files.length === 0 || loading} 
                      onClick={() => setStep(4)}
                      className="flex-1 bg-brand-500 disabled:opacity-30 disabled:bg-surface-border text-white font-black text-xl py-6 rounded-[2rem] shadow-xl shadow-brand-500/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                    >
                      {t('claimWizard.continue')} <ArrowRight size={24} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Policy Analysis */}
              {step === 4 && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
                      <FileText size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-text-main leading-none">{t('claimWizard.step5Title')}</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 mt-2">{t('claimWizard.uploadPolicy')}</p>
                    </div>
                  </div>

                  <label className={`border-4 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center cursor-pointer transition-all ${formData.policies.length >= 3 ? 'opacity-40 pointer-events-none' : 'border-brand-100 bg-brand-50/50 hover:border-brand-500 hover:bg-brand-50 active:scale-95'}`}>
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-brand-600 shadow-premium border border-brand-100 mb-4">
                      <UploadCloud size={36} strokeWidth={2.5} />
                    </div>
                    <p className="text-sm font-black text-brand-700 uppercase tracking-widest">{t('claimWizard.uploadPolicy')}</p>
                    <input type="file" accept="application/pdf" className="hidden"
                      onChange={(e) => {
                          const scanSimulation = async () => {
                             const { startLoading, stopLoading } = useUIStore.getState();
                             startLoading();
                             const file = e.target.files![0];
                             const fileName = file.name;
                             const newPolicy = { 
                                name: fileName, 
                                isCovered: true, 
                                estimate: 0, 
                                constraints: [] as string[], 
                                scanning: true 
                             };
                             
                             setFormData(p => ({ ...p, policyFile: file, policies: [...p.policies, newPolicy] }));
                             
                             await new Promise(r => setTimeout(r, 2000));

                             const policyData = {
                                insuredArea: 5.0,
                                unit: 'Acre',
                                sumInsured: 250000,
                                coveredRisks: ['Flood', 'Drought']
                             };

                             const isCovered = policyData.coveredRisks.includes(formData.calamityType);
                             let alert = '';
                             let ratePerAcre = 0;

                             if (!isCovered) {
                                alert = `Your policy does not cover ${formData.calamityType}. Please upload another policy document.`;
                             } else {
                                // Unit Conversion
                                const areaInAcres = policyData.unit === 'Hectare' ? policyData.insuredArea * 2.471 : policyData.insuredArea;
                                ratePerAcre = policyData.sumInsured / areaInAcres;
                             }

                             setFormData(prev => ({
                                ...prev,
                                policyDetails: {
                                  sumInsuredPerAcre: ratePerAcre,
                                  totalSumInsured: policyData.sumInsured,
                                  totalInsuredArea: policyData.insuredArea,
                                  coveredRisks: policyData.coveredRisks,
                                  policyUnit: policyData.unit,
                                  extractedPoints: [
                                     `• Total **₹${policyData.sumInsured.toLocaleString()}** Sum Insured detected`
                                  ]
                                },
                                policies: prev.policies.map(p => p.name === fileName ? {
                                   ...p,
                                   scanning: false,
                                   isCovered: isCovered,
                                   constraints: isCovered ? ['Policy Matched', 'Coverage Verified'] : [alert]
                                } : p)
                             }));

                             if (!isCovered) {
                                setError(alert);
                             }
                             stopLoading();
                          };

                          scanSimulation();
                      }} />
                  </label>

                  <div className="space-y-4">
                    {formData.policies.map((p, i) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={i} 
                        className="relative p-6 rounded-[2rem] border-2 bg-brand-50 border-brand-500 shadow-lg shadow-brand-500/10 transition-all"
                      >
                        <button onClick={() => setFormData(prev => ({ ...prev, policies: prev.policies.filter((_, idx) => idx !== i) }))}
                          className="absolute top-4 right-4 w-10 h-10 bg-white border border-surface-border text-text-secondary rounded-2xl flex items-center justify-center hover:text-red-600 transition-all active:scale-75 shadow-sm"
                        >
                          <Trash2 size={18} strokeWidth={2.5} />
                        </button>

                        <div className="flex items-start gap-5">                           <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-brand-500 text-white">
                            <FileText size={28} strokeWidth={2.5} />
                          </div>
                          
                         <div className="flex-1 min-w-0 pr-10">
                            <p className="font-black text-text-main truncate text-lg leading-none mt-1">{p.name}</p>
                            
                            <div className="mt-3 space-y-3">
                               {p.scanning ? (
                                  <div className="flex items-center gap-2 text-brand-600 animate-pulse">
                                     <Loader2 size={14} className="animate-spin" />
                                     <span className="text-[10px] font-black uppercase tracking-widest">AI Scanner Working...</span>
                                  </div>
                               ) : (
                                  <>
                                     <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${p.isCovered ? 'bg-brand-700 text-white' : 'bg-red-600 text-white animate-bounce'}`}>
                                           {p.isCovered ? t('claimWizard.coverageVerified') : t('claimWizard.noCoverage')}
                                        </span>
                                     </div>
                                     <div className="flex flex-wrap gap-2">
                                        {p.constraints.map((c, idx) => (
                                           <span key={idx} className={`text-[10px] font-black px-3 py-1 rounded-lg border ${p.isCovered ? 'bg-white text-brand-700 border-brand-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                              {c}
                                           </span>
                                        ))}
                                     </div>
                                  </>
                               )}
                            </div>
                         </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(3)} className="px-8 py-5 rounded-[1.5rem] border-2 border-surface-border text-text-secondary font-black text-lg active:scale-95 transition-all">{t('common.back')}</button>
                    <button 
                      disabled={loading || formData.policies.some(p => p.scanning) || formData.policies.length === 0 || formData.policies.some(p => !p.isCovered)} 
                      onClick={handleStep4Submit}
                      className="flex-1 bg-brand-500 disabled:opacity-30 disabled:bg-surface-border text-white font-black text-xl py-6 rounded-[2rem] shadow-xl shadow-brand-500/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                    >
                      {t('claimWizard.authorize')} <ArrowRight size={24} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: OTP & Final Summary */}
              {step === 5 && (
                <div className="space-y-8">
                   <div className="text-center">
                      <div className="w-20 h-20 bg-brand-50 text-brand-700 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-600/10">
                        <CheckCircle size={40} strokeWidth={3} />
                      </div>
                      <h2 className="text-3xl font-black text-text-main">{t('claimWizard.step6Title')}</h2>
                      <p className="text-text-main font-bold mt-2 italic text-sm">{t('claimWizard.reviewCarefully')}</p>
                   </div>

                   <div className="bg-brand-50/50 rounded-[2.5rem] p-8 border-2 border-brand-100 space-y-6">
                      <div className="flex justify-between items-center group">
                        <span className="text-[11px] text-text-secondary font-black uppercase tracking-widest">{t('claimWizard.field')}</span>
                        <span className="text-lg font-black text-text-main">{formData.farmLabel}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-text-secondary font-black uppercase tracking-widest">{t('claimWizard.damageType')}</span>
                        <span className="text-lg font-black text-red-600 bg-red-50 px-4 py-1 rounded-full border border-red-200">{formData.calamityType}</span>
                      </div>
                      
                      <div className="pt-6 border-t border-brand-100">
                         <div className="flex justify-between items-center mb-6">
                            <div className="bg-brand-100/50 p-4 rounded-2xl border border-brand-200 shadow-sm flex-1 mr-4">
                               <p className="text-[14px] font-black text-brand-800 uppercase tracking-widest flex items-center gap-2 mb-1">
                                  <Cpu size={18} className="text-brand-600" /> Pending AI Analysis
                               </p>
                               <p className="text-[11px] text-brand-700 font-bold leading-relaxed">
                                  Final claim payout will be calculated automatically based on satellite data and AI damage assessment after your claim is submitted.
                               </p>
                            </div>
                            <div className="bg-white/80 p-4 rounded-2xl border border-brand-200 shadow-sm text-center min-w-[90px]">
                               <p className="text-2xl font-black text-text-main">{formData.files.length}</p>
                               <p className="text-[10px] text-text-secondary font-black uppercase">{t('claimWizard.photos')}</p>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 gap-3 text-[12px] text-text-secondary font-medium leading-relaxed">
                            {formData.policyDetails.extractedPoints.map((point, idx) => (
                               <p key={idx} dangerouslySetInnerHTML={{ __html: point }} className="text-brand-900" />
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex justify-center gap-1.5 opacity-60">
                        <ShieldAlert size={14} className="text-brand-600" />
                        <p className="text-[10px] font-black text-center text-text-secondary uppercase tracking-[0.2em]">{t('claimWizard.verifyingAs')} {user?.email?.split('@')[0]}***</p>
                      </div>
                      <input type="text" maxLength={6} value={formData.otp}
                          onChange={e => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                          className="w-full text-center text-5xl tracking-[0.4em] font-black py-8 bg-white border-4 border-surface-border rounded-[2.5rem] focus:border-brand-500 focus:outline-none shadow-inner-soft text-brand-900"
                          placeholder="000000" />
                   </div>

                   <div className="flex gap-4">
                      <button onClick={() => setStep(4)} className="px-8 py-5 rounded-[1.5rem] border-2 border-surface-border text-text-secondary font-black text-lg active:scale-95 transition-all">{t('common.back')}</button>
                      <button disabled={formData.otp.length !== 6 || loading} onClick={submitClaim}
                          className="flex-1 bg-brand-500 disabled:opacity-30 disabled:bg-surface-border text-white font-black text-2xl py-6 rounded-[2.5rem] shadow-xl shadow-brand-500/40 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                      >
                          {loading ? <Loader2 size={32} className="animate-spin" /> : t('claimWizard.confirmNow')}
                      </button>
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* AI Monitoring Badge at Footer */}
        {isAiAssisted && step < 4 && (
          <div className="bg-brand-900 p-4 text-center">
             <p className="text-[10px] text-brand-100 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                <Cpu size={14} className="animate-pulse" /> {t('claimWizard.aiMonitoring')}
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
