import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../utils/apiClient';
import ErrorBanner from '../../components/ErrorBanner';

export default function Login() {
  const navigate = useNavigate();
  const setRegistrationEmail = useAuthStore(s => s.setRegistrationEmail);

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
      
      // Save backend user data to global state
      useAuthStore.getState().setAuth(
        {
          id: '1',
          fullName: response.data?.user?.email?.split('@')[0] || (isAgent ? 'Agent Priya' : 'Farmer Ramesh'),
          email: response.data?.user?.email || email,
          role: isAgent ? 'AGENT' : 'FARMER',
          isEmailVerified: true
        },
        response.data?.token || 'mock-token'
      );
      
      // Direct login successful, immediately route to correct dashboard
      if (isAgent) {
        navigate('/agent/dashboard');
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
    <div className="min-h-screen bg-surface-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 glass p-8 rounded-3xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Enter your email — we'll send an OTP to sign you in.</p>
        </div>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4 mb-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
              <div className="relative">
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Agent Toggle */}
          <div
            className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 cursor-pointer select-none"
            onClick={() => setIsAgent(!isAgent)}
          >
            <div className={`w-10 h-5 rounded-full relative transition-colors ${isAgent ? 'bg-brand-500' : 'bg-gray-600'}`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isAgent ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-medium text-gray-300">
              Sign in as <span className={`font-bold ${isAgent ? 'text-brand-400' : 'text-gray-300'}`}>Insurance Agent</span>
            </span>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60 transition-all text-white font-semibold flex items-center justify-center gap-2 py-3.5 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] mt-6"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Sign In</span><ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 font-medium hover:text-brand-300 transition-colors">
            Register your farm
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
