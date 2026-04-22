import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../utils/apiClient';
import ErrorBanner from '../../components/ErrorBanner';

export default function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; isAgent?: boolean; purpose?: string } | null;

  const registrationEmail = useAuthStore(s => s.registrationEmail) || state?.email || '';
  const setAuth = useAuthStore(s => s.setAuth);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const purpose = state?.purpose || 'LOGIN';
      const res = await authApi.verify(registrationEmail, code, purpose);
      const { user, jwtToken, role } = res.data;

      setSuccess(true);
      
      setAuth(
        { 
          id: String(user?.id || '1'), 
          fullName: user?.fullName || user?.name || '', 
          email: registrationEmail, 
          role: (user?.role?.replace('ROLE_', '') || (state?.isAgent ? 'AGENT' : 'FARMER')) as 'FARMER' | 'AGENT', 
          isEmailVerified: true 
        },
        jwtToken || 'mock-token'
      );

      setTimeout(() => {
        if (state?.isAgent || role === 'ROLE_AGENT') {
          navigate('/agent/dashboard');
        } else {
          navigate('/farmer/dashboard');
        }
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authApi.sendOtp(registrationEmail, 'LOGIN');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setError('');
    } catch {
      setError('Failed to resend code. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-['Outfit']">
      <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-brand-50 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10 p-10 bg-white border border-surface-border rounded-[3rem] shadow-premium flex flex-col items-center text-center"
      >
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-8 left-8 text-text-secondary hover:text-brand-600 transition-colors"
        >
          <ArrowLeft size={24} strokeWidth={3} />
        </button>

        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 shadow-sm border transition-all duration-700 ${success ? 'bg-brand-500 border-brand-500 text-white shadow-brand-500/30' : 'bg-brand-50 border-brand-100/50 text-brand-600'}`}>
          {success ? (
            <CheckCircle2 size={40} strokeWidth={2.5} />
          ) : (
            <KeyRound size={40} strokeWidth={2.5} />
          )}
        </div>
        
        <div className="space-y-2 mb-10">
          <h2 className="text-3xl font-black text-brand-950 tracking-tight leading-none">Verify Account</h2>
          <p className="text-text-secondary font-bold px-4 leading-relaxed">
            We've sent a 6-digit code to <br/>
            <span className="text-brand-900 font-black">{registrationEmail}</span>
          </p>
        </div>

        {error && <div className="w-full mb-6 text-left"><ErrorBanner message={error} /></div>}

        <div className="flex justify-between w-full gap-3 mb-10">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-full h-16 bg-white border-2 border-surface-border rounded-2xl text-center text-2xl text-text-main font-black focus:outline-none focus:border-brand-500 shadow-sm transition-all"
            />
          ))}
        </div>

        <button 
          onClick={handleSubmit}
          disabled={loading || otp.join('').length !== 6 || success}
          className="w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] disabled:opacity-40 transition-all text-white font-black text-xl py-5 rounded-[2rem] shadow-xl shadow-brand-500/30 mb-8 flex items-center justify-center gap-3"
        >
          {loading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : success ? (
            'Verified!'
          ) : (
            <>Link Account <ArrowRight size={24} strokeWidth={3} /></>
          )}
        </button>

        <p className="text-text-secondary font-bold">
          Didn't receive code? <button onClick={handleResend} className="text-brand-600 font-black ml-1 hover:underline underline-offset-4">Resend Code</button>
        </p>

        <div className="mt-12 flex items-center gap-4 opacity-40">
           <div className="w-px h-12 bg-surface-border" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main text-left">
              Secure AES-256 <br/> encryption active
           </p>
        </div>
      </motion.div>
    </div>
  );
}
