import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  message: string;
}

export default function ErrorBanner({ message }: Props) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-2xl text-sm mb-4">
      <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
      <p className="flex-1">{message}</p>
      <button onClick={() => setVisible(false)} className="text-red-400 hover:text-red-200 transition-colors">
        <X size={16} />
      </button>
    </div>
  );
}
