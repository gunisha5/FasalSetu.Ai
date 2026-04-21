import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, ClipboardList, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function FarmerLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { name: 'Home', path: '/farmer/dashboard', icon: LayoutDashboard },
    { name: 'My Farm', path: '/farmer/farms', icon: MapIcon },
    { name: 'Claims', path: '/farmer/claims', icon: ClipboardList },
    { name: 'Profile', path: '/farmer/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col md:flex-row text-text-main font-sans overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-surface-border bg-white shadow-xl p-6 z-20">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <LayoutDashboard size={20} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-brand-700">FasalSetu</h2>
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-500 text-white font-semibold shadow-lg shadow-brand-500/30' 
                    : 'text-text-secondary hover:text-brand-600 hover:bg-brand-50'
                }`
              }
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="mt-6 pt-6 border-t border-surface-border">
          <div className="text-xs text-text-secondary px-4 mb-2 truncate font-medium">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-text-secondary hover:text-red-600 hover:bg-red-50 transition-all text-sm font-semibold"
          >
            <LogOut size={18} strokeWidth={2.5} /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto pb-24 md:pb-0 relative scroll-smooth bg-surface-bg">
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-500/[0.02] rounded-full blur-[80px] pointer-events-none" />
        
        <div className="p-6 md:p-10 max-w-5xl mx-auto w-full relative z-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation (PWA Friendly) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-surface-border flex justify-around items-center p-2 pb-6 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 px-6 py-2 rounded-2xl transition-all duration-300 ${
                isActive ? 'text-brand-600 font-bold' : 'text-text-secondary'
              }`
            }
          >
            <item.icon size={24} strokeWidth={2.5} className={({ isActive }: any) => isActive ? 'scale-110 drop-shadow-sm' : ''} />
            <span className="text-[11px] font-bold tracking-wide uppercase">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
    </div>
  );
}

