import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, ClipboardList, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function FarmerLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { name: 'Dashboard', path: '/farmer/dashboard', icon: LayoutDashboard },
    { name: 'My Farms', path: '/farmer/farms', icon: MapIcon },
    { name: 'Claims', path: '/farmer/claims', icon: ClipboardList },
    { name: 'Profile', path: '/farmer/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-surface-dark flex flex-col md:flex-row text-white font-sans overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-white/5 backdrop-blur shadow-2xl p-6">
        <h2 className="text-xl font-bold tracking-tight mb-12 flex items-center gap-2">
          <span className="text-brand-400">FasalSetu</span> Dashboard
        </h2>
        
        <nav className="flex-1 space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-brand-500 text-white font-medium shadow-[0_4px_15px_rgba(16,185,129,0.3)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <div className="text-xs text-gray-500 px-4 mb-2 truncate">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
          >
            <LogOut size={18} /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto pb-24 md:pb-0 relative scroll-smooth">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full relative z-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-dark/90 backdrop-blur-xl border-t border-white/10 flex justify-around p-4 z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-brand-400' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <item.icon size={24} />
            <span className="text-[10px] uppercase tracking-wide font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
    </div>
  );
}
