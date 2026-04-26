import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🌾' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇧🇩' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🚩' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🏛️' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '💎' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🦁' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🛕' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളம்', flag: '🌴' },
  { code: 'or', name: 'Odia', native: 'ଓڈیا', flag: '☸️' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', flag: '🍵' },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🕌' },
];

const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Desktop Toggle / Current Language Pill */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider pl-1 md:block hidden">
          {t('common.selectLanguage', 'Select Language')}
        </label>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-surface-border rounded-2xl hover:border-brand-500 hover:bg-brand-50 transition-all active:scale-95 group shadow-sm"
        >
          <Languages size={18} className="text-brand-600 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-black text-brand-900 uppercase tracking-wider hidden md:block">
            {currentLanguage.name} / {currentLanguage.native}
          </span>
          <span className="text-sm md:hidden">{currentLanguage.flag}</span>
        </button>
      </div>

      {/* Language Selection Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-brand-900/40 backdrop-blur-sm z-[100]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-20 bottom-20 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden flex flex-col border border-brand-100"
            >
              <div className="p-6 border-b border-surface-border flex justify-between items-center bg-brand-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center text-white">
                    <Languages size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-brand-900 tracking-tight">{t('common.chooseLanguage', 'Choose Language')}</h3>
                    <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">{t('common.selectPreferredScript', 'Select your preferred script')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 bg-white border border-surface-border rounded-full flex items-center justify-center text-text-secondary hover:text-red-500 hover:border-red-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all relative group ${
                      i18n.language === lang.code
                        ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20'
                        : 'bg-white text-text-secondary border-surface-border hover:border-brand-200 hover:bg-brand-50'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="flex flex-col items-start leading-tight">
                      <span className={`text-sm font-black ${i18n.language === lang.code ? 'text-white' : 'text-brand-900'}`}>
                        {lang.name}
                      </span>
                      <span className={`text-[11px] font-bold ${i18n.language === lang.code ? 'text-brand-100' : 'text-brand-500'}`}>
                        {lang.native}
                      </span>
                    </div>
                    {i18n.language === lang.code && (
                      <div className="ml-auto bg-white/20 p-1 rounded-full">
                        <Check size={16} strokeWidth={4} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6 bg-brand-50/50 border-t border-surface-border text-center">
                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em]">{t('common.platformName', 'FasalSetu Multilingual AI Platform')}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
