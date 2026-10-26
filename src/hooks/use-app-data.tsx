import * as SplashScreen from 'expo-splash-screen';
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import * as repo from '@/data/repository';
import type { AppData, AppSettings, Shift, ShiftTemplate } from '@/domain/types';

interface AppDataContextValue {
  data: AppData;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  completeOnboarding: (settings: AppSettings, templates: ShiftTemplate[]) => Promise<void>;
  saveShift: (shift: Shift) => Promise<void>;
  removeShift: (id: string) => Promise<void>;
  restore: (data: AppData) => Promise<void>;
  resetAll: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

/** Carga los datos del teléfono (SQLite) y los expone a toda la app. Muestra el splash hasta tenerlos. */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    repo.loadAppData(db).then((loaded) => {
      setData(loaded);
      SplashScreen.hideAsync();
    });
  }, [db]);

  if (!data) return null;

  const reload = async () => setData(await repo.loadAppData(db));
  const value: AppDataContextValue = {
    data,
    updateSettings: async (patch) => {
      await repo.saveSettings(db, { ...data.settings, ...patch });
      await reload();
    },
    completeOnboarding: async (settings, templates) => {
      await repo.completeOnboarding(db, settings, templates);
      await reload();
    },
    saveShift: async (shift) => {
      await repo.upsertShift(db, shift);
      await reload();
    },
    removeShift: async (id) => {
      await repo.deleteShift(db, id);
      await reload();
    },
    restore: async (backup) => {
      await repo.replaceAppData(db, backup);
      await reload();
    },
    resetAll: async () => {
      await repo.deleteAllData(db);
      await reload();
    },
  };

  return <AppDataContext value={value}>{children}</AppDataContext>;
}

export function useAppData(): AppDataContextValue {
  const ctx = use(AppDataContext);
  if (!ctx) throw new Error('useAppData debe usarse dentro de <AppDataProvider>');
  return ctx;
}
