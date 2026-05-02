import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, Shrub, ShieldCheck, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../utils/apiClient';
import ErrorBanner from '../../components/ErrorBanner';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAgent, setIsAgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      const responseUser = response.data?.user;
      const role = responseUser?.role || (isAgent ? 'AGENT' : 'FARMER');
      
      useAuthStore.getState().setAuth(
        {
          id: String(responseUser?.id || '1'),
          fullName: responseUser?.fullName || '',
          email: responseUser?.email || email,
          role: role as 'AGENT' | 'FARMER',
          isEmailVerified: responseUser?.isEmailVerified ?? true
        },
        response.data?.token || 'mock-token'
      );
      
      if (role === 'AGENT') {
        navigate('/agent/farmers');
      } else {
        navigate('/farmer/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-['Outfit']">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-brand-50 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-brand-50/50 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 bg-white border border-surface-border p-10 rounded-[3rem] shadow-premium"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-brand-50 rounded-[2rem] flex items-center justify-center text-brand-600 mx-auto mb-6 shadow-sm border border-brand-100/50">
            <Shrub size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-brand-950 tracking-tight mb-2 leading-none">Welcome Back</h1>
          <p className="text-text-secondary font-bold">Access your farm data & AI insights</p>
        </div>

        {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-brand-900 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300 group-focus-within:text-brand-500 transition-colors" size={20} />
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="w-full bg-white border-2 border-surface-border rounded-2xl py-4 pl-12 pr-4 text-text-main font-black placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-500 transition-all shadow-sm group-hover:border-brand-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-brand-900 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300 group-focus-within:text-brand-500 transition-colors" size={20} />
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 border-surface-border rounded-2xl py-4 pl-12 pr-4 text-text-main font-black placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-500 transition-all shadow-sm group-hover:border-brand-200"
                  required
                />
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-3 bg-brand-50/50 p-4 rounded-2xl border border-brand-100 cursor-pointer select-none group active:scale-95 transition-all"
            onClick={() => setIsAgent(!isAgent)}
          >
            <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isAgent ? 'bg-brand-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-gray-200'}`}>
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-spring ${isAgent ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
            <span className="text-xs font-black text-brand-900 group-hover:text-brand-700 transition-colors uppercase tracking-[0.05em]">
              {isAgent ? 'Signing in as Agent' : 'Are you an Agent?'}
            </span>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] disabled:opacity-40 transition-all text-white font-black text-xl flex items-center justify-center gap-3 py-5 rounded-[2rem] shadow-xl shadow-brand-500/30 mt-8"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : (
              <>Sign In <ArrowRight size={24} strokeWidth={3} /></>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-surface-border text-center">
          <p className="text-text-secondary font-bold">
            New to FasalSetu?{' '}
            <Link to="/register" className="text-brand-600 font-bold hover:underline underline-offset-4">Register your farm</Link>
          </p>
        </div>
      </motion.div>

      <div className="mt-10 flex items-center gap-6 opacity-60">
         <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand-600" />
            <span className="text-xs font-black uppercase tracking-widest text-brand-900">100% Secure</span>
         </div>
         <div className="w-px h-4 bg-surface-border" />
         <div className="flex items-center gap-2 text-brand-900/50">
            <span className="text-[10px] font-black uppercase tracking-widest">v2.0 Premium</span>
         </div>
      </div>
    </div>
  );
}
