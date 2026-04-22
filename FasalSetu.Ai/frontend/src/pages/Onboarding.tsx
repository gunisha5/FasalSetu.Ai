import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Satellite, ShieldCheck, Zap } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    title: 'AI Satellite Analysis',
    description: 'AI-powered satellite analysis for real-time crop damage and flood impact detection.',
    icon: <Satellite size={80} className="text-brand-teal" />
  },
  {
    id: 2,
    title: 'Smart Policy Parsing',
    description: 'Upload your insurance documents. Our AI extracts coverage and calculated entitled payouts instantly.',
    icon: <ShieldCheck size={80} className="text-brand-teal" />
  },
  {
    id: 3,
    title: 'Rapid Settlement',
    description: 'Reduce manual wait times from weeks to hours with real-time tracking.',
    icon: <Zap size={80} className="text-brand-teal" />
  }
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(curr => curr + 1);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white px-6 py-12 relative overflow-hidden">
      {/* Dynamic Background Glow mapped to slide changes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-500/5 rounded-full blur-[80px]" />
      
      {/* Skip button connecting to login */}
      <div className="flex justify-end relative z-10">
        <button 
          onClick={() => navigate('/login')}
          className="text-text-secondary text-sm font-bold hover:text-brand-teal transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center relative z-10 w-full mb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center w-full max-w-sm"
          >
            <div className="bg-white border border-surface-border p-8 rounded-[2rem] shadow-premium mb-8">
              {SLIDES[currentIndex].icon}
            </div>
            <h2 className="text-3xl font-black text-brand-teal mb-4 tracking-tight">
              {SLIDES[currentIndex].title}
            </h2>
            <p className="text-text-secondary leading-relaxed text-sm font-bold px-4">
              {SLIDES[currentIndex].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm mx-auto">
        {/* Pagination Dots */}
        <div className="flex gap-2">
          {SLIDES.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-brand-400' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] transition-all text-white font-semibold py-4 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
        >
          {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
