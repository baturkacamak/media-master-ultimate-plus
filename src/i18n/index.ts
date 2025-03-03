import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import en from './locales/en';
import tr from './locales/tr';

declare module 'i18next' {
    interface CustomTypeOptions {
        returnNull: false;
        resources: {
            translation: typeof en;
        };
    }
}

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
        },
        returnNull: false // This ensures t() always returns string instead of null
    });

export default i18n;