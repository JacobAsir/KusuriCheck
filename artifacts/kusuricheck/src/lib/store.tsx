import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AnalyzeResponse } from '@/lib/analyzeClient';

type AppContextType = {
  result: AnalyzeResponse | null;
  setResult: (result: AnalyzeResponse | null) => void;
  uiLanguage: 'en' | 'ja';
  setUiLanguage: (lang: 'en' | 'ja') => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  
  // Initialize from localStorage or default to 'en'
  const [uiLanguage, setUiLanguageState] = useState<'en' | 'ja'>(() => {
    const saved = localStorage.getItem('kusuri_ui_lang');
    return (saved === 'en' || saved === 'ja') ? saved : 'en';
  });

  const setUiLanguage = (lang: 'en' | 'ja') => {
    setUiLanguageState(lang);
    localStorage.setItem('kusuri_ui_lang', lang);
  };

  return (
    <AppContext.Provider value={{ result, setResult, uiLanguage, setUiLanguage }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
