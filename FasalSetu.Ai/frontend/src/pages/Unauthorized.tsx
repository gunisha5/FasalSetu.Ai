import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-surface-dark flex flex-col items-center justify-center text-center p-6">
      <ShieldOff size={64} className="text-red-500/50 mb-6" />
      <h1 className="text-4xl font-bold text-white mb-3">Access Denied</h1>
      <p className="text-gray-400 mb-8 max-w-sm">You don't have permission to view this page. Please sign in with the correct account type.</p>
      <Link to="/login" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all">
        Back to Login
      </Link>
    </div>
  );
}
