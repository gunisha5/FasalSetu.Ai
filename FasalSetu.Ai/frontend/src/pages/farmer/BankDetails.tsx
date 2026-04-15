import { useState } from 'react';
import { ArrowLeft, Save, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BankDetails() {
  const navigate = useNavigate();
  const [ifsc, setIfsc] = useState('');
  const [branchName, setBranchName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleIfscChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setIfsc(val);
    
    if (val.length === 11) {
      setIsVerifying(true);
      try {
        // Simple public unauthenticated API for IFSC lookup prototype
        const res = await fetch(`https://ifsc.razorpay.com/${val}`);
        if(res.ok) {
           const data = await res.json();
           setBranchName(`${data.BANK}, ${data.BRANCH}`);
        } else {
           setBranchName('Invalid IFSC / Not Found');
        }
      } catch (e) {
        setBranchName('Lookup Failed');
      }
      setIsVerifying(false);
    } else {
      setBranchName('');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Bank Details</h1>
          <p className="text-gray-400 text-sm">Update where your claim payouts are sent</p>
        </div>
      </div>

      <div className="bg-brand-500/10 border border-brand-500/20 p-4 rounded-2xl flex items-start gap-4">
        <div className="bg-brand-500/20 p-2 rounded-xl mt-1">
          <Building className="text-brand-400" size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-white">Current Linked Account</h3>
          <p className="text-sm text-gray-300 mt-1">State Bank of India</p>
          <p className="text-sm font-mono text-gray-400">XXXX XXXX 4821</p>
        </div>
      </div>

      <form className="bg-surface-card border border-white/5 rounded-3xl p-6 shadow-lg space-y-5">
         <h3 className="text-lg font-semibold border-b border-white/5 pb-3">Update Account Information</h3>
         
         <div>
            <label className="text-sm text-gray-300 ml-1">Account Holder Name</label>
            <input type="text" className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-brand-500 outline-none" required placeholder="Must match Aadhaar name" />
         </div>
         
         <div>
            <label className="text-sm text-gray-300 ml-1">Account Number</label>
            <input type="password" placeholder="••••••••••••" className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-brand-500 outline-none" required />
         </div>

         <div>
            <label className="text-sm text-gray-300 ml-1">Confirm Account Number</label>
            <input type="text" placeholder="Re-enter account number" className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-brand-500 outline-none" required />
         </div>

         <div>
            <label className="text-sm text-gray-300 ml-1">IFSC Code</label>
            <div className="flex flex-col gap-2 relative">
               <input 
                  type="text" 
                  value={ifsc}
                  onChange={handleIfscChange}
                  maxLength={11}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-brand-500 outline-none uppercase font-mono tracking-widest" 
                  required 
                  placeholder="SBIN0001234" 
               />
               
               {isVerifying ? (
                 <span className="text-xs text-brand-400 ml-2 animate-pulse">Verifying routing...</span>
               ) : branchName ? (
                 <span className={`text-xs ml-2 font-medium ${branchName.includes('Invalid') ? 'text-red-400' : 'text-brand-400'}`}>
                   {branchName}
                 </span>
               ) : null}
            </div>
         </div>

         <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-medium py-3.5 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 mt-4">
           <Save size={18} /> Update Bank Details
        </button>

      </form>
    </div>
  );
}
