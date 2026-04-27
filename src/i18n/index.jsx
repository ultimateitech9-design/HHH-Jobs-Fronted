import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import translations from './translations';

const I18nContext = createContext(null);

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' }
];

const getNestedValue = (obj, path) => {
  if (!obj || !path) return '';
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current?.[key] === undefined) return path;
    current = current[key];
  }
  return typeof current === 'string' ? current : path;
};

const getSavedLanguage = () => {
  try { return localStorage.getItem('hhh-lang') || 'en'; } catch { return 'en'; }
};

const setSavedLanguage = (code) => {
  try { localStorage.setItem('hhh-lang', code); } catch { /* noop */ }
};

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getSavedLanguage);

  const setLanguage = useCallback((code) => {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code) ? code : 'en';
    setLanguageState(lang);
    setSavedLanguage(lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback((path, fallback) => {
    const result = getNestedValue(translations[language], path);
    if (result !== path) return result;
    if (fallback) return fallback;
    const enResult = getNestedValue(translations.en, path);
    return enResult !== path ? enResult : path;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    languages: SUPPORTED_LANGUAGES,
    isHindi: language === 'hi'
  }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (path) => getNestedValue(translations.en, path),
      languages: SUPPORTED_LANGUAGES,
      isHindi: false
    };
  }
  return context;
};

export const LanguageSwitcher = ({ className = '' }) => {
  const { language, setLanguage, languages } = useI18n();

  return (
    <div className={`language-switcher ${className}`} style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          title={lang.name}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            border: language === lang.code ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.15)',
            background: language === lang.code ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
            color: language === lang.code ? '#3b82f6' : '#94a3b8',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: language === lang.code ? 700 : 500,
            transition: 'all 0.2s ease'
          }}
        >
          {lang.flag} {lang.nativeName}
        </button>
      ))}
    </div>
  );
};

export default I18nProvider;
