import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sprout } from 'lucide-react';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    // Navigate to onboarding after 2.5 seconds
    const timer = setTimeout(() => {
      navigate('/onboarding');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white relative overflow-hidden">      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/20 rounded-full blur-[100px]" />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          className="bg-brand-500 p-4 rounded-3xl mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
        >
          <Sprout size={48} className="text-white" />
        </motion.div>
        
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Fasal<span className="text-brand-700">Setu</span>.Ai
        </h1>
        <p className="text-slate-700 text-sm tracking-widest uppercase">
          AI Crop Assessment
        </p>
      </motion.div>
    </div>
  );
}
