import { Clock, CheckCircle, Cpu, Calendar, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AgentDashboard() {
  const STATS = [
    { label: 'Pending Reviews', value: '42', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'AI Processed Today', value: '18', icon: Cpu, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Claims Approved', value: '156', icon: CheckCircle, color: 'text-brand-400', bg: 'bg-brand-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">Good morning, Priya.</h1>
        <p className="text-gray-400 text-sm mt-1">Here is the status of District 4 for {new Date().toLocaleDateString()}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATS.map((stat, i) => (
          <div key={i} className="bg-surface-card border border-white/5 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
               <stat.icon size={80} />
             </div>
             <div className={`p-3 rounded-xl inline-block mb-4 ${stat.bg}`}>
                <stat.icon size={24} className={stat.color} />
             </div>
             <p className="text-sm font-medium text-gray-400 mb-1">{stat.label}</p>
             <p className="text-4xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Monthly Disbursal Box */}
         <div className="bg-gradient-to-br from-indigo-900/40 to-surface-dark border border-indigo-500/20 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-400" /> Disbursal Overview
            </h3>
            <p className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-2">Total Amount Approved (MTD)</p>
            <p className="text-5xl font-bold text-white mb-6">₹ 42.5<span className="text-2xl text-gray-400"> Lakhs</span></p>
            
            <div className="space-y-3">
               <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg text-sm">
                  <span className="text-gray-300">Flood Claims (AI-Verified)</span>
                  <span className="font-mono font-bold">₹ 31.0 L</span>
               </div>
               <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg text-sm">
                  <span className="text-gray-300">Pest/Other (Manual)</span>
                  <span className="font-mono font-bold">₹ 11.5 L</span>
               </div>
            </div>
         </div>

         {/* Quick Actions */}
         <div className="bg-surface-card border border-white/5 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div>
               <h3 className="text-lg font-semibold mb-4">Urgent Queue Items</h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between border-l-4 border-orange-500 pl-4 py-2 opacity-80 hover:opacity-100 cursor-pointer">
                     <div>
                       <p className="font-bold text-white">CLM-00482</p>
                       <p className="text-xs text-gray-400">AI Flagged: Severe Flood. High Confidence.</p>
                     </div>
                     <span className="text-xs font-mono text-gray-500">2h ago</span>
                  </div>
                  <div className="flex items-center justify-between border-l-4 border-indigo-500 pl-4 py-2 opacity-80 hover:opacity-100 cursor-pointer">
                     <div>
                       <p className="font-bold text-white">CLM-00490</p>
                       <p className="text-xs text-gray-400">AI Cannot verify. Cloudy satellite image.</p>
                     </div>
                     <span className="text-xs font-mono text-gray-500">4h ago</span>
                  </div>
               </div>
            </div>
            
            <Link to="/agent/claims" className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-all shadow text-center">
              View Full Queue
            </Link>
         </div>
      </div>
    </div>
  );
}
