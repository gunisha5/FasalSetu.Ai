import { Link } from 'react-router-dom';
import { Sprout, Map, AlertTriangle, ArrowRight, Wallet, ClipboardList, PlusCircle, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useEffect, useState } from 'react';
import { farmApi, claimApi } from '../../utils/apiClient';
import type { Claim } from '../../utils/apiClient';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  const fullName = user?.fullName || 'Farmer';
  const firstName = fullName.split(' ')[0]; 
  const farmerId = Number(user?.id) || 1;
  const [totalArea, setTotalArea] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [activeClaimsCount, setActiveClaimsCount] = useState<number>(0);
  const [recentClaims, setRecentClaims] = useState<Claim[]>([]);
  const [farmsMap, setFarmsMap] = useState<Record<number, string>>({});

  useEffect(() => {
    if (isNaN(farmerId)) return;
    
    Promise.all([
      farmApi.getAll(farmerId),
      claimApi.getAll(farmerId)
    ]).then(([farmsRes, claimsRes]) => {
      // Calculate total area
      const sum = farmsRes.data.reduce((acc, farm) => acc + (farm.areaAcres || 0), 0);
      setTotalArea(Math.round(sum * 100) / 100);
      
      // Map farm IDs to names
      const fMap: Record<number, string> = {};
      farmsRes.data.forEach(f => {
        if (f.id) fMap[f.id] = f.farmName;
      });
      setFarmsMap(fMap);

      // Process claims
      const allClaims = claimsRes.data || [];
      
      // Wallet = sum of payouts for APPROVED claims
      const approvedPayout = allClaims
        .filter(c => c.status === 'APPROVED')
        .reduce((acc, c) => acc + (c.estimatedPayout ?? c.estimatedClaim ?? 0), 0);
      setWalletBalance(approvedPayout);
      
      // Active claims = not APPROVED and not REJECTED
      const active = allClaims.filter(c => c.status !== 'APPROVED' && c.status !== 'REJECTED');
      setActiveClaimsCount(active.length);
      
      // Recent claims = top 3
      setRecentClaims(allClaims.slice(0, 3));
    }).catch(err => console.error("Could not fetch dashboard data", err));
  }, [farmerId]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      
      {/* Welcome Header */}
      <motion.div variants={item} className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-400 p-10 rounded-[3rem] text-white shadow-xl shadow-brand-500/20">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
              <Sprout size={20} className="text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{t('dashboard.title')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3">{t('dashboard.greeting', { name: firstName })}</h1>
          <p className="text-brand-50 text-lg font-bold max-w-md">{t('dashboard.outlook')}</p>
        </div>
        <Sprout className="absolute -right-8 -bottom-8 text-white/10 w-64 h-64 -rotate-12 animate-float" strokeWidth={1} />
      </motion.div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* File Claim */}
        <motion.div variants={item} className="md:col-span-2">
          <Link to="/farmer/claims/new" className="h-full bg-white border-2 border-red-100 hover:border-red-500 p-8 rounded-[2.5rem] flex items-center gap-8 transition-all shadow-premium group relative overflow-hidden active:scale-[0.98]">
             <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform duration-500">
               <AlertTriangle size={56} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
             </div>
             <div className="flex-1">
                <p className="font-black text-3xl text-text-main mb-1">{t('dashboard.fileClaim')}</p>
                <p className="text-text-secondary font-bold text-sm">{t('dashboard.reportNow')}</p>
             </div>
             <div className="absolute right-0 top-0 bottom-0 w-2 bg-red-500 transform translate-x-full group-hover:translate-x-0 transition-transform" />
          </Link>
        </motion.div>

        {/* Register Field */}
        <motion.div variants={item}>
          <Link to="/farmer/farms/new" className="h-full bg-white border border-surface-border hover:border-brand-500 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4 transition-all shadow-premium group active:scale-[0.98]">
             <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
               <PlusCircle size={32} strokeWidth={2.5} />
             </div>
             <div>
               <p className="font-black text-xl text-text-main">{t('dashboard.addField')}</p>
               <p className="text-text-secondary text-xs mt-1 font-bold">{t('dashboard.registerNew')}</p>
             </div>
          </Link>
        </motion.div>

      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Total Area Card */}
        <motion.div variants={item} className="bg-white border border-surface-border p-8 rounded-[2.5rem] flex items-center justify-between shadow-premium group">
          <div className="space-y-2">
            <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2">
              <Map size={14} /> {t('dashboard.totalLand')}
            </p>
            <p className="text-4xl font-black text-text-main leading-none">
              {totalArea} <span className="text-lg font-bold text-brand-600 uppercase">{t('dashboard.acres')}</span>
            </p>
          </div>
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
            <TrendingUp size={28} strokeWidth={2.5} />
          </div>
        </motion.div>
        
        {/* Wallet Card */}
        <motion.div variants={item} className="bg-white border border-surface-border p-8 rounded-[2.5rem] flex items-center justify-between shadow-premium group">
          <div className="space-y-2">
            <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2">
              <Wallet size={14} /> {t('dashboard.myWallet')}
            </p>
            <p className="text-4xl font-black text-text-main leading-none">
              ₹{walletBalance.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
            <Wallet size={28} strokeWidth={2.5} />
          </div>
        </motion.div>

        {/* Status Tracker */}
        <motion.div variants={item} className="bg-white border border-surface-border p-8 rounded-[2.5rem] flex items-center justify-between shadow-premium group sm:col-span-2 lg:col-span-1">
          <div className="space-y-2">
            <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2">
              <ClipboardList size={14} /> {t('dashboard.activeClaims')}
            </p>
            <p className="text-4xl font-black text-text-main leading-none">{activeClaimsCount}</p>
          </div>
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
            <ClipboardList size={28} strokeWidth={2.5} />
          </div>
        </motion.div>
      </div>

      {/* Recent History */}
      <motion.div variants={item} className="bg-white border border-surface-border rounded-[3rem] p-10 shadow-premium relative">
         <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-black text-text-main">{t('dashboard.recentActivity')}</h2>
              <p className="text-text-secondary text-sm font-bold mt-1">{t('dashboard.latestUpdates')}</p>
            </div>
            <Link to="/farmer/claims" className="bg-brand-50 text-brand-700 px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-2 hover:bg-brand-500 hover:text-white transition-all active:scale-95">
              {t('common.history')} <ArrowRight size={18} strokeWidth={3} />
            </Link>
         </div>
         
         {recentClaims.length === 0 ? (
           <div className="text-center py-20 flex flex-col items-center">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="w-28 h-28 bg-brand-50 rounded-[2.5rem] flex items-center justify-center mb-8 ring-8 ring-brand-50/50 shadow-inner-soft"
              >
                <ClipboardList className="text-brand-300" size={48} strokeWidth={1} />
              </motion.div>
              <h3 className="text-xl font-black text-text-main mb-3">{t('dashboard.everythingGreat')}</h3>
              <p className="text-text-secondary max-w-[280px] text-sm font-bold leading-relaxed">{t('dashboard.noAlerts')}</p>
           </div>
         ) : (
           <div className="space-y-4">
             {recentClaims.map(claim => {
               let dotColor = 'text-gray-400';
               let bgColor = 'bg-gray-50';
               if (claim.status === 'PROCESSING' || claim.status === 'AI_COMPLETE') { dotColor = 'text-orange-400'; bgColor = 'bg-orange-50'; }
               else if (claim.status === 'APPROVED') { dotColor = 'text-brand-400'; bgColor = 'bg-brand-50'; }
               else if (claim.status === 'MANUAL_REVIEW') { dotColor = 'text-yellow-400'; bgColor = 'bg-yellow-50'; }

               return (
                 <Link key={claim.id} to={`/farmer/claims/${claim.id}`}
                   className="bg-white border border-surface-border rounded-3xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md hover:border-brand-200 transition-all group relative overflow-hidden">
                   <div className={`p-4 rounded-2xl ${bgColor} ${dotColor}`}><ClipboardList size={24} /></div>
                   <div className="flex-1">
                     <h3 className="font-bold text-lg text-text-main">
                       {claim.calamityType} {t('claims.damage')} 
                       <span className="text-text-secondary font-normal ml-2">• {farmsMap[claim.farmId!] || 'Field #' + claim.farmId}</span>
                     </h3>
                     <p className={`text-sm font-bold mt-0.5 ${dotColor}`}>{claim.status?.replace('_', ' ')}</p>
                   </div>
                   <ArrowRight size={20} className="text-text-secondary group-hover:text-brand-500 transition-colors" />
                 </Link>
               );
             })}
           </div>
         )}
      </motion.div>
    </motion.div>
  );
}
