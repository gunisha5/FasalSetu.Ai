import { User, Mail, ShieldCheck, CreditCard, LogOut, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold mb-1">{t('profile.title')}</h1>
          <p className="text-gray-400 text-sm">{t('profile.subtitle')}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg transition-all"
        >
          <LogOut size={18} /> <span className="hidden sm:inline">{t('common.logout')}</span>
        </button>
      </div>

      <div className="bg-surface-card border border-white/5 rounded-3xl p-6 shadow-lg overflow-hidden relative">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex items-center gap-6 mb-8 relative z-10">
          <div className="w-24 h-24 rounded-full bg-brand-500/20 flex items-center justify-center border-2 border-brand-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <User size={40} className="text-brand-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">{user?.fullName || t('profile.registeredFarmer')}</h2>
            <div className="flex items-center gap-2 mt-2 text-brand-400 bg-brand-500/10 w-fit px-3 py-1 rounded-full text-sm font-medium border border-brand-500/20">
               <ShieldCheck size={16} />
               {user?.role === 'FARMER' ? t('profile.verifiedFarmerAccount') : t('profile.fieldAgent')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
           <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
             <div className="flex items-center gap-3 text-gray-400 mb-2 border-b border-white/10 pb-3">
               <Mail size={18} />
               <span className="text-sm font-medium">{t('profile.emailAddress')}</span>
             </div>
             <p className="text-lg font-semibold mt-3">{user?.email || 'N/A'}</p>
             {user?.isEmailVerified && (
               <p className="text-brand-400 text-xs font-medium mt-1 flex items-center gap-1">
                 <Check size={12} /> {t('profile.verifiedViaOtp')}
               </p>
             )}
           </div>

           <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
             <div className="flex items-center gap-3 text-gray-400 mb-2 border-b border-white/10 pb-3">
               <CreditCard size={18} />
               <span className="text-sm font-medium">{t('profile.aadhaarLinked')}</span>
             </div>
             <p className="text-lg font-semibold mt-3">XXXX-XXXX-XXXX</p>
             <p className="text-gray-500 text-xs font-medium mt-1">{t('profile.hiddenForSecurity')}</p>
           </div>
        </div>
      </div>
    </div>
  );
}
