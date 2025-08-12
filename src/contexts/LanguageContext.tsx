import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getTranslation, translations } from '@/utils/languages';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof translations.en) => string;
  availableLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('bubbleShooterLanguage') as Language;
    if (savedLanguage && ['en', 'zh', 'km'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) {
        setLanguageState('zh');
      } else if (browserLang.startsWith('km')) {
        setLanguageState('km');
      } else {
        setLanguageState('en');
      }
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('bubbleShooterLanguage', newLanguage);
    
    // Update document language attribute
    document.documentElement.lang = newLanguage;
  };

  const t = (key: keyof typeof translations.en): string => {
    return getTranslation(language, key);
  };

  const availableLanguages: Language[] = ['en', 'zh', 'km'];

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 