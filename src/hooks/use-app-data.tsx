import * as SplashScreen from 'expo-splash-screen';
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Button, Screen } from '@/components/ui';
import * as repo from '@/data/repository';
import { isPeriodClosed } from '@/domain/payroll';
import type { AppData, AppSettings, Novelty, Shift, ShiftTemplate } from '@/domain/types';

interface AppDataContextValue {
  data: AppData;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  completeOnboarding: (settings: AppSettings, templates: ShiftTemplate[]) => Promise<void>;
  saveShift: (shift: Shift) => Promise<void>;
  removeShift: (id: string) => Promise<void>;
  saveNovelty: (novelty: Novelty) => Promise<void>;
  removeNovelty: (id: string) => Promise<void>;
  updateTemplates: (templates: ShiftTemplate[]) => Promise<void>;
  restore: (data: AppData) => Promise<void>;
  resetAll: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

/** Carga los datos del teléfono (SQLite) y los expone a toda la app. Muestra el splash hasta tenerlos. */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [data, setData] = useState<AppData | null>(null);

  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    repo.loadAppData(db).then((loaded) => {
      if (active) { setData(loaded); SplashScreen.hideAsync(); }
    }).catch(() => {
      if (active) { setLoadError(true); SplashScreen.hideAsync(); }
    });
    return () => { active = false; };
  }, [db, attempt]);

  if (!data) return <Screen title={loadError ? 'No pudimos cargar tus datos' : 'Cargando tus datos…'}>
    {loadError ? <>
      <ThemedText accessibilityRole="alert">No se han borrado tus datos. Intenta cargarlos de nuevo.</ThemedText>
      <Button label="Reintentar" onPress={() => { setLoadError(false); setAttempt(attempt + 1); }} />
    </> : null}
  </Screen>;

  const reload = async () => setData(await repo.loadAppData(db));
  const guardClosed = (date: string) => {
    if (isPeriodClosed(data.settings, date)) throw new Error('Este periodo está cerrado. Reábrelo desde Resumen para hacer cambios.');
  };
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
      guardClosed(shift.start.slice(0, 10));
      await repo.saveRecord(db, { shift });
      await reload();
    },
    removeShift: async (id) => {
      const shift = data.shifts.find((s) => s.id === id);
      if (shift) guardClosed(shift.start.slice(0, 10));
      await repo.deleteShift(db, id);
      await reload();
    },
    saveNovelty: async (novelty) => {
      guardClosed(novelty.date);
      await repo.saveRecord(db, { novelty });
      await reload();
    },
    removeNovelty: async (id) => {
      const novelty = data.novelties.find((n) => n.id === id);
      if (novelty) guardClosed(novelty.date);
      await repo.deleteNovelty(db, id);
      await reload();
    },
    updateTemplates: async (templates) => {
      await repo.saveTemplates(db, templates);
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
