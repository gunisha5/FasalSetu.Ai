import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, ListTodo, Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function AgentLayout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { name: 'Farmers', path: '/agent/farmers', icon: Users },
    { name: 'Claims', path: '/agent/claims', icon: ListTodo },
  ];

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col md:flex-row text-[#222] font-sans overflow-hidden">
      
      {/* Dense Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        <div className="p-6 border-b border-slate-100">
           <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-slate-800">
             <span className="text-brand-600">Agent</span> Portal
           </h2>
           <p className="text-xs text-slate-500 mt-1">Region: Maharashtra Dist 4</p>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${
                  isActive 
                    ? 'bg-brand-50 text-brand-600 border border-brand-200 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-100">
           <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-black uppercase">P</div>
              <div>
                <p className="text-xs font-bold text-slate-800">Priya Sharma</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID: INS-4921</p>
              </div>
           </div>
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all font-bold text-sm">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto pb-24 md:pb-0 relative bg-[#ffffff]">
        
        {/* Top bar */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex justify-between items-center px-6 sticky top-0 z-40">
           <div className="md:hidden font-black text-brand-600">Agent Portal</div>
           <div className="hidden md:block text-xs font-bold uppercase tracking-widest text-slate-400">Review claims carefully. AI is assistive only for covered policies.</div>
           <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
           </button>
        </header>

        <div className="p-6 md:p-8 w-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 flex justify-around p-4 z-50 pb-safe">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] uppercase tracking-widest font-bold">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
    </div>
  );
}
