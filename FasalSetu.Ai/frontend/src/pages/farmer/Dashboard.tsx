import { Link } from 'react-router-dom';
import { Sprout, Map, AlertTriangle, ArrowRight, Wallet, ClipboardList } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useEffect, useState } from 'react';
import { farmApi } from '../../utils/apiClient';

export default function Dashboard() {
  const user = useAuthStore(state => state.user);
  const farmerId = Number(user?.id) || 1;
  const [totalArea, setTotalArea] = useState<number>(0);

  useEffect(() => {
    if (isNaN(farmerId)) return;

    farmApi.getAll(farmerId)
      .then(res => {
        const sum = res.data.reduce((acc, farm) => acc + (farm.areaHectares || 0), 0);
        setTotalArea(Math.round(sum * 100) / 100);
      })
      .catch(() => console.error("Could not fetch farms for total area"));
  }, [farmerId]);
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-400 p-8 rounded-[2rem] text-white shadow-xl shadow-brand-500/20">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">Namaste, {user?.fullName?.split(' ')[0] || 'Farmer'}!</h1>
          <p className="text-brand-50 opacity-90 font-medium">Your farm profile is verified and active.</p>
        </div>
        <Sprout className="absolute -right-4 -bottom-4 text-white/10 w-48 h-48 -rotate-12" strokeWidth={1} />
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Total Area Card */}
        <div className="bg-white border border-surface-border p-6 rounded-[2rem] flex items-center justify-between shadow-premium transition-transform hover:scale-[1.02] cursor-default">
          <div className="space-y-1">
            <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Total Land</p>
            <p className="text-4xl font-black text-text-main leading-none">{totalArea} <span className="text-lg font-bold text-brand-600">Ha</span></p>
          </div>
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
            <Map size={32} strokeWidth={2.5} />
          </div>
        </div>
        
        {/* Pending Payout Card */}
        <div className="bg-white border border-surface-border p-6 rounded-[2rem] flex items-center justify-between shadow-premium transition-transform hover:scale-[1.02] cursor-default">
          <div className="space-y-1">
            <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Wallet</p>
            <p className="text-4xl font-black text-text-main leading-none">₹0</p>
          </div>
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <Wallet size={32} strokeWidth={2.5} />
          </div>
        </div>

        {/* Action Button - File Claim */}
        <div className="md:col-span-2 lg:col-span-1">
          <Link to="/farmer/claims/new" className="h-full bg-red-500 hover:bg-red-600 p-6 rounded-[2rem] flex items-center justify-between transition-all shadow-xl shadow-red-500/20 group active:scale-[0.98]">
             <div className="text-white">
               <p className="font-black text-2xl mb-1">File Claim</p>
               <p className="text-red-50/80 text-sm font-medium">Crop damaged?</p>
             </div>
             <AlertTriangle className="text-white group-hover:rotate-12 transition-transform" size={40} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white border border-surface-border rounded-[2.5rem] p-8 shadow-premium relative">
         <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-text-main">Recent Status</h2>
            <Link to="/farmer/claims" className="bg-brand-50 text-brand-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 hover:bg-brand-100 transition-colors">
              History <ArrowRight size={16} strokeWidth={3} />
            </Link>
         </div>
         
         <div className="text-center py-16 flex flex-col items-center">
            <div className="w-24 h-24 bg-surface-bg rounded-[2rem] flex items-center justify-center mb-6 ring-4 ring-white shadow-inner-soft">
              <ClipboardList className="text-text-secondary" size={40} strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-text-main mb-2">All Safe!</h3>
            <p className="text-text-secondary max-w-[200px] text-sm leading-relaxed">No active claims or damage alerts in your area.</p>
         </div>

         {/* PWA Friendly - Add Link to Quick Task */}
         <Link to="/farmer/farms/new" className="mt-8 w-full py-4 bg-surface-bg border border-dashed border-surface-border rounded-2xl flex items-center justify-center gap-2 text-text-secondary font-bold hover:bg-white hover:border-brand-300 hover:text-brand-600 transition-all">
            <Sprout size={18} /> Register Another Field
         </Link>
      </div>
    </div>
  );
}

