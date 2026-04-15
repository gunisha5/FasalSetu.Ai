import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Map as MapIcon, Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function AgentLayout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { name: 'Dashboard', path: '/agent/dashboard', icon: LayoutDashboard },
    { name: 'Claim Queue', path: '/agent/claims', icon: ListTodo },
    { name: 'Regional Map', path: '/agent/map', icon: MapIcon },
  ];

  return (
    <div className="min-h-screen bg-[#070e17] flex flex-col md:flex-row text-white font-sans overflow-hidden">
      
      {/* Dense Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-surface-dark shadow-2xl">
        <div className="p-6 border-b border-white/5">
           <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
             <span className="text-indigo-400">Agent</span> Portal
           </h2>
           <p className="text-xs text-gray-500 mt-1">Region: Maharashtra Dist 4</p>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                  isActive 
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/5">
           <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold uppercase">P</div>
              <div>
                <p className="text-xs font-semibold text-white">Priya Sharma</p>
                <p className="text-[10px] text-gray-500">ID: INS-4921</p>
              </div>
           </div>
        </div>
        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto pb-24 md:pb-0 relative bg-gradient-to-br from-[#070e17] to-[#0a1628]">
        
        {/* Top bar */}
        <header className="h-16 border-b border-white/5 bg-surface-dark/50 backdrop-blur-md flex justify-between items-center px-6 sticky top-0 z-40">
           <div className="md:hidden font-bold text-indigo-400">Agent Portal</div>
           <div className="hidden md:block text-sm font-medium text-gray-400">Review claims carefully. AI is assistive only for covered policies.</div>
           <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
           </button>
        </header>

        <div className="p-6 md:p-8 w-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-dark/95 backdrop-blur-xl border-t border-white/10 flex justify-around p-4 z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <item.icon size={22} />
            <span className="text-[10px] uppercase tracking-wide font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
    </div>
  );
}
