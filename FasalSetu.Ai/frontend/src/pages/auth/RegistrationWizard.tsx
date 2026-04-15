import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { User, Map, CreditCard, Check, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { authApi } from '../../utils/apiClient';
import { useAuthStore } from '../../store/authStore';
import ErrorBanner from '../../components/ErrorBanner';

export default function RegistrationWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    aadhaar: '',
    farmName: '',
    state: '',
    district: '',
    village: '',
    crop: '',
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    ifsc: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setError('Please enter an email address first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Backend automatically logs the OTP in the console
      await authApi.sendOtp(formData.email, 'REGISTRATION');
      setOtpSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Please enter the OTP.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.verify(formData.email, otp, 'REGISTRATION');
      setOtpVerified(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && !otpVerified) {
       setError("Please verify your email with OTP before continuing.");
       return;
    }
    
    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      setError('');
      setLoading(true);
      try {
        console.log('Registration Payload:', formData);
        const response = await authApi.register(formData.fullName, formData.email, formData.password);
        
        useAuthStore.getState().setAuth(
          {
            id: '1',
            fullName: formData.fullName,
            email: formData.email,
            role: 'FARMER',
            isEmailVerified: true
          },
          response.data?.token || 'mock-token'
        );
        
        navigate('/farmer/dashboard');
      } catch (err: any) {
         setError(err?.response?.data?.message || 'Registration failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  const steps = [
    { id: 1, title: 'Personal', icon: <User size={20} /> },
    { id: 2, title: 'Farm', icon: <Map size={20} /> },
    { id: 3, title: 'Bank', icon: <CreditCard size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-surface-dark flex flex-col items-center p-4 py-8 relative overflow-x-hidden">
      <div className="absolute top-1/4 left-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
      
      <div className="w-full max-w-md relative z-10 glass p-6 rounded-3xl pb-8 mt-10">
        
        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-8 relative px-2">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -z-10 -translate-y-1/2 rounded-full hidden sm:block" />
          <div className="absolute top-1/2 left-0 h-1 bg-brand-500 -z-10 -translate-y-1/2 rounded-full hidden sm:block transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }} />
          
          {steps.map(s => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 border-2 ${
                step >= s.id ? 'bg-brand-500 border-brand-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-surface-dark border-white/20 text-gray-500'
              }`}>
                {step > s.id ? <Check size={20} /> : s.icon}
              </div>
              <span className={`text-xs ${step >= s.id ? 'text-white' : 'text-gray-500'}`}>{s.title}</span>
            </div>
          ))}
        </div>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleSubmit} className="min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 space-y-4"
            >
              {step === 1 && (
                <>
                  <div>
                    <label className="text-sm text-gray-300 ml-1">Full Name</label>
                    <input name="fullName" value={formData.fullName} onChange={handleChange} type="text" className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-brand-500 outline-none" required placeholder="Ramesh Kumar" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 ml-1">Aadhaar Number</label>
                    <input name="aadhaar" value={formData.aadhaar} onChange={handleChange} type="text" className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-brand-500 outline-none" required placeholder="XXXX XXXX XXXX" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 ml-1">Password</label>
                    <input name="password" value={formData.password} onChange={handleChange} type="password" className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-brand-500 outline-none" required placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 ml-1">Email Address</label>
                    <div className="flex gap-2 mt-1">
                      <input name="email" value={formData.email} onChange={handleChange} disabled={otpVerified} type="email" className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-brand-500 outline-none disabled:opacity-50" required placeholder="farmer@example.com" />
                      {!otpVerified && (
                        <button type="button" onClick={handleSendOtp} disabled={loading} className="px-4 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white transition-colors flex items-center justify-center min-w-[90px]">
                          {loading && !otpSent ? <Loader2 size={16} className="animate-spin" /> : (otpSent ? 'Resend' : 'Send OTP')}
                        </button>
                      )}
                      {otpVerified && (
                         <div className="flex items-center px-4 bg-brand-500/20 text-brand-400 rounded-xl border border-brand-500/30 text-sm font-medium">Verified</div>
                      )}
                    </div>
                  </div>
                  
                  {otpSent && !otpVerified && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-brand-500/10 border border-brand-500/30 rounded-xl">
                      <label className="text-sm text-brand-300 font-medium">Enter OTP from console (Backend only for now)</label>
                      <div className="flex gap-2 mt-2">
                        <input value={otp} onChange={e => setOtp(e.target.value)} type="text" maxLength={6} className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white text-center tracking-widest font-mono focus:ring-2 focus:ring-brand-500 outline-none" placeholder="000000" />
                        <button type="button" onClick={handleVerifyOtp} disabled={loading || otp.length < 6} className="px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 min-w-[90px] flex justify-center items-center">
                          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-sm text-gray-300 ml-1">Farm Nickname</label>
                      <input name="farmName" value={formData.farmName} onChange={handleChange} type="text" className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" required placeholder="e.g. North Field" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 ml-1">State</label>
                      <select name="state" value={formData.state} onChange={handleChange} className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-brand-500 [&>option]:bg-surface-dark" required>
                        <option value="">Select...</option>
                        <option value="MH">Maharashtra</option>
                        <option value="UP">Uttar Pradesh</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 ml-1">District</label>
                      <input name="district" value={formData.district} onChange={handleChange} type="text" className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" required placeholder="District" />
                    </div>
                    <div className="col-span-2">
                       <label className="text-sm text-gray-300 ml-1 pb-1 block">Draw Farm Boundary</label>
                       <div className="h-48 rounded-xl overflow-hidden border border-white/10 relative">
                          <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                            <Polygon positions={[[20.5, 78.9], [20.6, 78.9], [20.6, 79.0], [20.5, 79.0]]} color="#10b981" fillColor="#10b981" fillOpacity={0.4} />
                          </MapContainer>
                          <div className="absolute top-2 right-2 bg-surface-dark/80 backdrop-blur px-2 py-1 rounded text-xs text-white z-[400] border border-white/10 pointer-events-none">
                            1.2 Hectares
                          </div>
                       </div>
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div>
                    <label className="text-sm text-gray-300 ml-1">Account Holder Name</label>
                    <input name="accountHolder" value={formData.accountHolder} onChange={handleChange} type="text" className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-brand-500 outline-none" required placeholder="Ramesh Kumar" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 ml-1">Bank Name</label>
                    <input name="bankName" value={formData.bankName} onChange={handleChange} type="text" className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-brand-500 outline-none" required placeholder="State Bank of India" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 ml-1">Account Number</label>
                    <input name="accountNumber" value={formData.accountNumber} onChange={handleChange} type="text" className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-brand-500 outline-none" required placeholder="00000000000" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 ml-1">IFSC Code</label>
                    <div className="flex gap-2">
                       <input name="ifsc" value={formData.ifsc} onChange={handleChange} type="text" className="flex-1 mt-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-brand-500 outline-none uppercase" required placeholder="SBIN0001234" />
                       <div className="mt-1 flex items-center justify-center px-4 bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-xl text-sm font-medium">Verified</div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8 pt-4 border-t border-white/10">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(s => s - 1)} className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium flex items-center gap-2 transition-all">
                <ArrowLeft size={18} /> Back
              </button>
            ) : <div />}
            
            <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-medium shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>{step === 3 ? 'Complete Setup' : 'Continue'} {step < 3 && <ArrowRight size={18} />}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
