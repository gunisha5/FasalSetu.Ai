import { Loader2 } from 'lucide-react';

interface Props {
  rows?: number;
  message?: string;
}

export default function LoadingSkeleton({ rows = 3, message }: Props) {
  return (
    <div className="space-y-4 animate-pulse">
      {message && (
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
          <Loader2 size={16} className="animate-spin" />
          <span>{message}</span>
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-surface-card border border-white/5 rounded-3xl p-5 flex gap-4 items-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded-lg w-3/4" />
            <div className="h-3 bg-white/5 rounded-lg w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
