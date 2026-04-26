import React from 'react';
import { useUIStore } from '../store/uiStore';

const LoadingOverlay: React.FC = () => {
  const isLoading = useUIStore((state) => state.isLoading);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-[2px] transition-all duration-300">
      <div className="flex flex-col items-center">
        {/* Premium Spinner */}
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
        </div>
        
        {/* Optional subtle light effect around spinner */}
        <div className="absolute h-32 w-32 bg-emerald-500/10 blur-3xl rounded-full -z-10 animate-pulse"></div>
      </div>
      
      {/* Disable user interaction overlay */}
      <div className="absolute inset-0 cursor-wait"></div>
    </div>
  );
};

export default LoadingOverlay;
