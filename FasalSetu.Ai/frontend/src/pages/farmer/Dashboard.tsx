import { Link } from 'react-router-dom';
import { Sprout, Map, AlertTriangle, ArrowRight, Wallet } from 'lucide-react';
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
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-brand-500/10 p-6 rounded-3xl border border-brand-500/20 glass">
        <div>
          <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.fullName?.split(' ')[0] || 'Farmer'}</h1>
          <p className="text-gray-400 text-sm">Your farms are looking healthy today.</p>
        </div>
        <div className="hidden sm:flex bg-brand-500/20 p-4 rounded-2xl">
          <Sprout className="text-brand-400" size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-surface-card border border-white/5 p-6 rounded-3xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Area</p>
            <p className="text-3xl font-bold">{totalArea} <span className="text-base text-gray-500">Ha</span></p>
          </div>
          <Map className="text-gray-600" size={32} />
        </div>
        
        <div className="bg-surface-card border border-white/5 p-6 rounded-3xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-gray-400 text-sm mb-1">Active Payouts</p>
            <p className="text-3xl font-bold">₹0</p>
          </div>
          <Wallet className="text-gray-600" size={32} />
        </div>

        {/* Primary Action Button */}
        <div className="md:col-span-2 lg:col-span-1">
          <Link to="/farmer/claims/new" className="h-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 p-6 rounded-3xl flex items-center justify-between transition-colors shadow-lg group">
             <div>
               <p className="text-red-400 font-bold text-lg mb-1">File New Claim</p>
               <p className="text-red-400/70 text-sm">Calamity occurred?</p>
             </div>
             <AlertTriangle className="text-red-400 group-hover:scale-110 transition-transform" size={32} />
          </Link>
        </div>
      </div>

      {/* Recent Claims Section */}
      <div className="bg-surface-card border border-white/5 rounded-3xl p-6 shadow-lg">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Claims</h2>
            <Link to="/farmer/claims" className="text-brand-400 text-sm flex items-center gap-1 hover:text-brand-300">
              View All <ArrowRight size={16} />
            </Link>
         </div>
         
         <div className="text-center py-10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="text-gray-600" size={24} />
            </div>
            <p className="text-gray-400">No active or recent claims filed.</p>
         </div>
      </div>
    </div>
  );
}

// Temporary import for the icon used inside
import { ClipboardList } from 'lucide-react';
