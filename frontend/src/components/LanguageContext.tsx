'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TRANSLATIONS, TranslationDictionary } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('hi');

  useEffect(() => {
    // Read stored language from localStorage
    const savedLang = localStorage.getItem('karigar_artisan_language') as Language;
    if (savedLang && (savedLang === 'mr' || savedLang === 'hi' || savedLang === 'en')) {
      setLanguageState(savedLang);
    } else {
      // Default to Marathi or Hindi if in India locale, or 'hi'
      localStorage.setItem('karigar_artisan_language', 'hi');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('karigar_artisan_language', lang);
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.hi;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
