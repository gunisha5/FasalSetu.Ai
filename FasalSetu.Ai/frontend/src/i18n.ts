// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Fallback resources for English so the app loads instantly
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    partialBundledLanguages: true,
  });

// Setup dynamic loading of languages
i18n.on('languageChanged', async (lng) => {
  if (lng !== 'en' && !i18n.hasResourceBundle(lng, 'translation')) {
    try {
      const module = await import(`./locales/${lng}.json`);
      i18n.addResourceBundle(lng, 'translation', module.default || module, true, true);
    } catch (error) {
      console.error(`Failed to load translations for ${lng}`, error);
    }
  }
  console.log("Selected language:", lng);
});

i18n.on('languageChanged', (lng) => {
  console.log("Selected language:", lng);
});

export default i18n;
