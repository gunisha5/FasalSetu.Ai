import { useState, useEffect, useMemo } from 'react';
import { api } from '../../utils/api';
import { Users, Mail, MapPin, Map as MapIcon, Home } from 'lucide-react';

export default function AgentDashboard() {
  const [farmersData, setFarmersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/agent/farmers')
      .then(res => setFarmersData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    const arr: any[] = [];
    farmersData.forEach((farmer, fIdx) => {
      if (!farmer.farms || farmer.farms.length === 0) {
        arr.push({
          id: `${fIdx}-0`,
          name: farmer.name || 'Unknown',
          email: farmer.email || '—',
          farmName: 'No registered farms',
          district: '—',
          village: '—'
        });
      } else {
        farmer.farms.forEach((farm: any, i: number) => {
          arr.push({
            id: `${fIdx}-${i}`,
            name: farmer.name || 'Unknown',
            email: farmer.email || '—',
            farmName: farm.farmName || '—',
            district: farm.district || '—',
            village: farm.village || '—'
          });
        });
      }
    });
    return arr;
  }, [farmersData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Registered Farmers</h1>
        <p className="text-slate-500 text-sm mt-1">
          {loading ? 'Loading directory...' : `${farmersData.length} farmers in your jurisdiction`}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-4 font-black w-1/4">Farmer Name</th>
                <th className="p-4 font-black w-1/4">Email</th>
                <th className="p-4 font-black">Farm Name</th>
                <th className="p-4 font-black">District</th>
                <th className="p-4 font-black">Village</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                        <Users size={14} strokeWidth={2.5} />
                      </div>
                      <span className="font-bold text-slate-800">{row.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={14} className="text-slate-400" />
                      <span>{row.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <MapIcon size={14} className="text-brand-500" />
                      <span>{row.farmName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 capitalize">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-400" />
                      {row.district}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 capitalize">
                    <div className="flex items-center gap-1.5">
                      <Home size={14} className="text-slate-400" />
                      {row.village}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-slate-500">
                    No farmers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
