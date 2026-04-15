import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setOffline(true);
    const handleOnline  = () => setOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online',  handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online',  handleOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 bg-yellow-500/95 backdrop-blur text-black font-semibold text-sm py-3 px-4 shadow-2xl">
      <WifiOff size={16} />
      <span>You're offline — some features may be unavailable until reconnected.</span>
    </div>
  );
}
