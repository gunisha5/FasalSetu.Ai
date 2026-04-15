import { Link } from 'react-router-dom';
import { Home, Frown } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-dark flex flex-col items-center justify-center text-center p-6">
      <Frown size={64} className="text-gray-600 mb-6" />
      <h1 className="text-6xl font-bold text-white mb-4">404</h1>
      <p className="text-gray-400 text-lg mb-8">This page doesn't exist or has been moved.</p>
      <Link
        to="/"
        className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
      >
        <Home size={18} /> Go to Home
      </Link>
    </div>
  );
}
