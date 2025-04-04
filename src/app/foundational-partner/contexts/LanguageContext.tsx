'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { en } from '../translations/en';
import { ar } from '../translations/ar';

type Language = 'en' | 'ar';
type TranslationType = typeof en;

interface LanguageContextType {
  language: Language;
  translations: TranslationType;
  toggleLanguage: () => void;
  isRtl: boolean;
}

const defaultContext: LanguageContextType = {
  language: 'en',
  translations: en,
  toggleLanguage: () => {},
  isRtl: false,
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const translations = language === 'en' ? en : ar;
  const isRtl = language === 'ar';

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, translations, toggleLanguage, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}; 