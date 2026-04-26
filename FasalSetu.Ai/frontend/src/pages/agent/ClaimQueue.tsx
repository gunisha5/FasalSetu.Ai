import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, AlertTriangle, Cpu, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function ClaimQueue() {
  const [tab, setTab] = useState('All');
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8080/api/agent/claims')
      .then(res => setClaims(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = claims.filter(c => {
    if(tab === 'All') return true;
    if(tab === 'AI-Assisted') return c.aiDamageScore != null;
    if(tab === 'Manual Review') return c.aiDamageScore == null;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Claim Queue</h1>
          <p className="text-gray-400 text-sm">Review incoming claims and verify AI computations.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
             <input type="text" placeholder="Search ID or Farmer" className="w-full md:w-64 bg-surface-dark border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
          </div>
          <button className="bg-surface-dark border border-white/10 p-2 rounded-lg text-gray-400 hover:text-white">
             <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/10 pb-4">
         {['All', 'AI-Assisted', 'Manual Review'].map(t => (
            <button 
               key={t}
               onClick={() => setTab(t)}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white bg-white/5'}`}
            >
               {t}
            </button>
         ))}
      </div>

      <div className="bg-surface-card border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
           <table className="w-full text-left text-sm whitespace-nowrap">
             <thead className="bg-black/20 text-gray-400 uppercase tracking-widest text-[10px]">
               <tr>
                 <th className="p-4 font-semibold">Claim ID</th>
                 <th className="p-4 font-semibold">Farmer</th>
                 <th className="p-4 font-semibold">Type</th>
                 <th className="p-4 font-semibold">AI Confidence</th>
                 <th className="p-4 font-semibold text-right">Est. Payout (₹)</th>
                 <th className="p-4 font-semibold text-center">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {loading ? (
                   <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="animate-spin inline mr-2" /> Loading claims...</td></tr>
                ) : filtered.map(c => (
                   <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-white">#{c.id}</td>
                      <td className="p-4 text-gray-300">Farmer #{c.farmerId}</td>
                      <td className="p-4">
                         <span className="px-2 py-1 bg-white/10 rounded text-xs">{c.calamityType}</span>
                      </td>
                      <td className="p-4">
                         {c.aiDamageScore != null ? (
                            <div className="flex items-center gap-2 text-indigo-400">
                              <Cpu size={14} /> <span>{Math.round(c.aiDamageScore)}% Match</span>
                            </div>
                         ) : (
                            <span className="text-gray-600 text-xs">N/A (Manual)</span>
                         )}
                      </td>
                      <td className="p-4 font-mono text-right font-medium">
                         {c.estimatedPayout ? `₹${c.estimatedPayout.toLocaleString()}` : '--'}
                      </td>
                      <td className="p-4 text-center">
                         <Link to={`/agent/claims/${c.id}`} className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded font-medium text-xs shadow transition-colors inline-block">
                            Review
                         </Link>
                      </td>
                   </tr>
                ))}
             </tbody>
           </table>
           {filtered.length === 0 && !loading && (
              <div className="p-10 text-center text-gray-500">No claims matching this filter.</div>
           )}
        </div>
      </div>
    </div>
  );
}
