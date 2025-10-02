import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar arquivos de tradução
import pt from '../locales/pt.json';
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import it from '../locales/it.json';
import de from '../locales/de.json';
import es from '../locales/es.json';

const resources = {
  pt: { translation: pt },
  en: { translation: en },
  fr: { translation: fr },
  it: { translation: it },
  de: { translation: de },
  es: { translation: es },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    lng: 'pt',
    debug: false,
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    
    keySeparator: '.',
    nsSeparator: false,
  });

export default i18n;
