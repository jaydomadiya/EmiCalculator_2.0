import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ru from './locales/ru.json';
import { DEFAULT_LANGUAGE_CODE } from './languages';

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    es: { translation: es },
    fr: { translation: fr },
    ar: { translation: ar },
    de: { translation: de },
    pt: { translation: pt },
    zh: { translation: zh },
    ja: { translation: ja },
    ru: { translation: ru },
  },
  lng: DEFAULT_LANGUAGE_CODE,
  fallbackLng: DEFAULT_LANGUAGE_CODE,
  compatibilityJSON: 'v4',
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
