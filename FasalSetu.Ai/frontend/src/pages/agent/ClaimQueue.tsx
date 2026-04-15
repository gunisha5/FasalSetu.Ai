import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, AlertTriangle, Cpu } from 'lucide-react';

export default function ClaimQueue() {
  const [tab, setTab] = useState('AI-Assisted');

  const QUEUE = [
    { id: 'CLM-00482', farmer: 'Ramesh K.', type: 'Flood', aiScore: 74, payout: '1,48,000', hrs: 2, needsManual: false },
    { id: 'CLM-00483', farmer: 'Suresh M.', type: 'Flood', aiScore: 89, payout: '2,10,000', hrs: 4, needsManual: false },
    { id: 'CLM-00490', farmer: 'Anil D.', type: 'Pest', aiScore: null, payout: 'Pending', hrs: 12, needsManual: true },
    { id: 'CLM-00491', farmer: 'Vikram S.', type: 'Drought', aiScore: -1, payout: 'Pending', hrs: 24, needsManual: true, warning: 'Cloud Cover' },
  ];

  const filtered = QUEUE.filter(c => {
    if(tab === 'All') return true;
    if(tab === 'AI-Assisted') return !c.needsManual;
    if(tab === 'Manual Review') return c.needsManual;
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
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                     <td className="p-4 font-mono font-bold text-white">{c.id}</td>
                     <td className="p-4 text-gray-300">{c.farmer}</td>
                     <td className="p-4">
                        <span className="px-2 py-1 bg-white/10 rounded text-xs">{c.type}</span>
                     </td>
                     <td className="p-4">
                        {c.aiScore > 0 ? (
                           <div className="flex items-center gap-2 text-indigo-400">
                             <Cpu size={14} /> <span>{c.aiScore} / 100</span>
                           </div>
                        ) : c.warning ? (
                           <div className="flex items-center gap-2 text-yellow-500">
                             <AlertTriangle size={14} /> <span className="text-xs">{c.warning}</span>
                           </div>
                        ) : (
                           <span className="text-gray-600 text-xs">N/A (Manual)</span>
                        )}
                     </td>
                     <td className="p-4 font-mono text-right font-medium">{c.payout}</td>
                     <td className="p-4 text-center">
                        <Link to={`/agent/claims/${c.id}`} className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded font-medium text-xs shadow transition-colors inline-block">
                           Review
                        </Link>
                     </td>
                  </tr>
                ))}
             </tbody>
           </table>
           {filtered.length === 0 && (
              <div className="p-10 text-center text-gray-500">No claims matching this filter.</div>
           )}
        </div>
      </div>
    </div>
  );
}
