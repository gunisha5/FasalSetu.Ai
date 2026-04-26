import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, ClipboardList, User, LogOut, Bell, Shrub } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';


export default function FarmerLayout() {
  const { user, logout } = useAuthStore();
  const displayName = user?.fullName || 'Farmer';
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const { t } = useTranslation();
  const navItems = [
    { name: t('common.home'), path: '/farmer/dashboard', icon: LayoutDashboard },
    { name: t('common.fields'), path: '/farmer/farms', icon: MapIcon },
    { name: t('common.claims'), path: '/farmer/claims', icon: ClipboardList },
    { name: t('common.profile'), path: '/farmer/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col md:flex-row text-text-main font-sans overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 border-r border-surface-border bg-white p-8 z-20 shadow-premium">
        <div className="flex items-center gap-3 mb-12 group cursor-default">
          <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30 group-hover:rotate-12 transition-transform duration-300">
            <Shrub size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-brand-900 leading-none">FasalSetu</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 mt-1">{t('common.smartFarming')}</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all duration-300 group ${
                  isActive 
                    ? 'bg-brand-500 text-white font-bold shadow-lg shadow-brand-500/30' 
                    : 'text-text-secondary hover:text-brand-600 hover:bg-brand-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
                  <span className="text-sm tracking-wide">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mb-6">
          <LanguageSwitcher />
        </div>

        {/* Profile Card */}
        <div className="mt-8 pt-8 border-t border-surface-border">
          <div className="bg-brand-50 rounded-3xl p-5 border border-brand-100/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-600 font-black shadow-sm">
                {displayName?.[0] || 'F'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-brand-900 truncate">{displayName}</p>
                <p className="text-[10px] font-bold text-brand-600 truncate uppercase mt-0.5">{user?.role || t('common.verifiedUser')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-brand-100 rounded-xl text-xs font-black text-brand-700 hover:bg-brand-100 hover:text-red-600 transition-all active:scale-95"
            >
              <LogOut size={14} strokeWidth={3} /> {t('common.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto pb-28 md:pb-0 relative scroll-smooth bg-surface-bg custom-scrollbar">
        {/* Top Header for Mobile */}
        <header className="md:hidden glass sticky top-0 z-40 px-6 py-4 flex justify-between items-center border-b border-surface-border/50">
          <div className="flex items-center gap-2">
             <Shrub size={20} className="text-brand-600" />
             <span className="text-xl font-black text-brand-900 tracking-tight">FasalSetu</span>
          </div>
          <div className="flex items-center gap-3">
             <LanguageSwitcher />
             <button className="w-10 h-10 bg-white rounded-full border border-surface-border flex items-center justify-center text-text-secondary shadow-sm active:scale-90 transition-transform">
                <Bell size={18} />
             </button>
          </div>
        </header>

        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-brand-200/[0.04] rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 md:p-10 max-w-5xl mx-auto w-full relative z-10"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Mobile Bottom Navigation (PWA Friendly / Large Touch Targets) */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 glass border border-white/40 flex justify-around items-center p-3 z-50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive ? 'text-brand-600 scale-110' : 'text-text-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 3 : 2} className={isActive ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' : ''} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-0 scale-75'} transition-all`}>{item.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -bottom-1 w-1 h-1 bg-brand-500 rounded-full"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
    </div>
  );
}
