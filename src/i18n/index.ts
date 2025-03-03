import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import en from './locales/en';
import tr from './locales/tr';

const resources = {
    en: {
        translation: en
    },
    tr: {
        translation: tr
    }
};

// Get user's language preference
const userLanguage = navigator.language.split('-')[0];
const defaultLanguage = ['en', 'tr'].includes(userLanguage) ? userLanguage : 'en';

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: defaultLanguage,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // React already safes from XSS
        }
    });

export default i18n;