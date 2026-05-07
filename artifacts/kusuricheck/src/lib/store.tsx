import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AnalyzeResponse } from '@/lib/analyzeClient';

export type HistoryItem = {
  id: string;
  timestamp: number;
  result: AnalyzeResponse;
  fileName: string;
  previewUrl?: string;
  thumbnail?: string;
};

type AppState = {
  result: AnalyzeResponse | null;
  history: HistoryItem[];
  uiLanguage: 'en' | 'ja';
  
  // Actions
  setResult: (result: AnalyzeResponse | null) => void;
  setUiLanguage: (lang: 'en' | 'ja') => void;
  addToHistory: (result: AnalyzeResponse, fileName: string, previewUrl?: string, thumbnail?: string) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      result: null,
      history: [],
      uiLanguage: 'en',

      setResult: (result) => set({ result }),
      
      setUiLanguage: (uiLanguage) => set({ uiLanguage }),
      
      addToHistory: (result, fileName, previewUrl, thumbnail) => set((state) => {
        const newItem: HistoryItem = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          result,
          fileName,
          previewUrl,
          thumbnail,
        };
        return { 
          history: [newItem, ...state.history].slice(0, 50), // Keep last 50
          result: result // Also set current result
        };
      }),

      removeFromHistory: (id) => set((state) => ({
        history: state.history.filter(item => item.id !== id)
      })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'kusuricheck-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Backward compatibility wrapper for useAppContext
export function useAppContext() {
  const store = useAppStore();
  return {
    result: store.result,
    setResult: store.setResult,
    uiLanguage: store.uiLanguage,
    setUiLanguage: store.setUiLanguage,
    history: store.history,
    addToHistory: store.addToHistory,
    removeFromHistory: store.removeFromHistory,
  };
}

// Still export AppProvider as a no-op to avoid breaking App.tsx immediately
export function AppProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
