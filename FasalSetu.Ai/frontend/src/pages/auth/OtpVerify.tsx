import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../utils/apiClient';
import ErrorBanner from '../../components/ErrorBanner';

export default function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; isAgent?: boolean } | null;

  const registrationEmail = useAuthStore(s => s.registrationEmail) || state?.email || '';
  const setAuth = useAuthStore(s => s.setAuth);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      const res = await authApi.verify(registrationEmail, code);
      const { jwtToken, role } = res.data;

      // Persist JWT + user in Zustand store (localStorage via persist middleware)
      setAuth(
        { id: '', fullName: '', email: registrationEmail, role: role.replace('ROLE_', '') as 'FARMER' | 'AGENT', isEmailVerified: true },
        jwtToken
      );

      if (state?.isAgent || role === 'ROLE_AGENT') {
        navigate('/agent/dashboard');
      } else {
        navigate('/farmer/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authApi.login(registrationEmail);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setError('Failed to resend. Please go back and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm relative z-10 p-8 glass rounded-[2.5rem] flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="text-brand-400" size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Verify Email</h2>
        <p className="text-gray-400 text-sm mb-6">
          We've sent a 6-digit code to <br/>
          <span className="text-white font-medium">{registrationEmail}</span>
        </p>

        {error && <ErrorBanner message={error} />}

        <div className="flex justify-between w-full gap-2 mb-8">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          ))}
        </div>

        <button 
          onClick={handleSubmit}
          disabled={loading || otp.join('').length !== 6}
          className="w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60 transition-all text-white font-semibold py-4 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] mb-6 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <>Verify Account <ArrowRight size={18} /></>}
        </button>

        <p className="text-gray-400 text-sm">
          Didn't receive code? <button onClick={handleResend} className="text-brand-400 font-medium ml-1 hover:text-brand-300">Resend</button>
        </p>
      </motion.div>
    </div>
  );
}
